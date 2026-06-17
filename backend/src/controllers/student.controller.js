const { Student } = require('../models');
const { generateRegistrationNumber, generateQRCode } = require('../utils/generators');
const portalUserService = require('../services/portalUser.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');

const resolvePortalCredentials = (body) => ({
  email: body.loginEmail || body.email,
  password: body.loginPassword || body.password,
});

const attachPortalUser = async ({ email, password, fullName, institution, phone, existingUserId }) => {
  if (existingUserId) {
    if (email || password || fullName || phone) {
      await portalUserService.updatePortalUser(existingUserId, { email, password, fullName, phone });
    }
    return existingUserId;
  }

  if (!email && !password) return null;
  if (!email || !password) {
    throw new ApiError(400, 'Both login email and password are required for portal access');
  }

  const user = await portalUserService.createPortalUser({
    email,
    password,
    fullName,
    role: ROLES.STUDENT,
    institution,
    phone,
  });
  return user._id;
};

exports.createStudent = asyncHandler(async (req, res) => {
  const institutionId = req.body.institution || req.user.institution;
  if (!institutionId) throw new ApiError(400, 'Institution is required');

  const { loginEmail, loginPassword, email, password, ...rest } = req.body;
  const credentials = resolvePortalCredentials({ loginEmail, loginPassword, email, password });
  const fullName = rest.personalInfo?.fullName;

  const userId = await attachPortalUser({
    ...credentials,
    fullName,
    institution: institutionId,
    phone: rest.personalInfo?.contact,
  });

  if (credentials.email && rest.personalInfo) {
    rest.personalInfo.email = credentials.email;
  }

  const student = await Student.create({
    ...rest,
    user: userId || rest.user,
    institution: institutionId,
    status: 'draft',
    workflow: [
      { step: 'institution_verification', status: 'pending' },
      { step: 'committee_verification', status: 'pending' },
      { step: 'approval', status: 'pending' },
    ],
  });

  res.status(201).json({
    success: true,
    data: student,
    portalAccess: credentials.email ? { email: credentials.email } : null,
  });
});

exports.getStudents = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, ['status', 'institution']);
  if (['institution_admin', 'principal', 'faculty'].includes(req.user.role)) {
    filter.institution = req.user.institution;
  }
  const total = await Student.countDocuments(filter);
  const { query, pagination } = paginate(
    Student.find(filter)
      .populate('institution', 'name')
      .populate('user', 'email'),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('institution', 'name')
    .populate('user', 'email firstName lastName');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const { loginEmail, loginPassword, email, password, ...updates } = req.body;
  const credentials = resolvePortalCredentials({ loginEmail, loginPassword, email, password });
  const fullName = updates.personalInfo?.fullName || student.personalInfo?.fullName;

  if (credentials.email || credentials.password) {
    const userId = await attachPortalUser({
      email: credentials.email,
      password: credentials.password,
      fullName,
      institution: student.institution,
      phone: updates.personalInfo?.contact || student.personalInfo?.contact,
      existingUserId: student.user,
    });
    if (userId) student.user = userId;
    if (credentials.email) {
      updates.personalInfo = {
        ...(student.personalInfo?.toObject?.() || student.personalInfo),
        ...updates.personalInfo,
        email: credentials.email,
      };
    }
  }

  Object.assign(student, updates);
  await student.save();
  res.json({ success: true, data: student });
});

exports.deleteStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');
  await portalUserService.deletePortalUser(student.user);
  await student.deleteOne();
  res.json({ success: true, message: 'Student deleted' });
});

exports.advanceWorkflow = asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const student = await Student.findById(req.params.id);
  if (!student) throw new ApiError(404, 'Student not found');

  const flow = {
    draft: 'institution_verification',
    institution_verification: 'committee_verification',
    committee_verification: action === 'approve' ? 'approved' : 'rejected',
  };

  if (action === 'reject') {
    student.status = 'rejected';
    student.workflow.push({ step: 'rejected', status: 'completed', comments, completedAt: new Date() });
  } else {
    student.status = flow[student.status] || student.status;
  }

  if (student.status === 'approved') {
    const count = await Student.countDocuments({ status: { $in: ['approved', 'active'] } });
    student.registrationNumber = generateRegistrationNumber('STD', count + 1);
    student.qrCode = await generateQRCode({
      type: 'student',
      registrationNumber: student.registrationNumber,
      name: student.personalInfo.fullName,
      cnic: student.personalInfo.cnic,
    });
    student.approvedAt = new Date();
    student.approvedBy = req.user._id;
    student.status = 'active';
    student.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    student.renewalDueDate = student.expiresAt;
  }

  await student.save();
  res.json({ success: true, data: student });
});

exports.verifyQR = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ registrationNumber: req.params.registrationNumber })
    .populate('institution', 'name');
  if (!student) throw new ApiError(404, 'Invalid registration number');
  res.json({
    success: true,
    data: {
      valid: ['approved', 'active'].includes(student.status),
      student: {
        name: student.personalInfo.fullName,
        registrationNumber: student.registrationNumber,
        institution: student.institution?.name,
        status: student.status,
        program: student.programInfo,
      },
    },
  });
});
