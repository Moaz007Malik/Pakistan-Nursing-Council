const Student = require('../models/Student');
const portalUserService = require('../services/portalUser.service');
const {
  assignStudentRegistration,
  activateStudentMembership,
} = require('../services/registration.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');
const { attachStudentDocumentUrls } = require('../utils/documentUrls');

const countStudentDocuments = (student) => {
  const d = student.documents || {};
  const a = student.academicInfo || {};
  return [
    d.cnic, d.picture, ...(d.certificates || []),
    a.matric?.certificate, a.fsc?.certificate,
  ].filter(Boolean).length;
};

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

const populateDocuments = [
  { path: 'documents.cnic', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.picture', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.certificates', select: 'originalName mimeType metadata storageProvider' },
  { path: 'academicInfo.matric.certificate', select: 'originalName mimeType metadata storageProvider' },
  { path: 'academicInfo.fsc.certificate', select: 'originalName mimeType metadata storageProvider' },
];

const applyDocumentPopulate = (query) => {
  populateDocuments.forEach(({ path, select }) => query.populate(path, select));
  return query;
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

  await assignStudentRegistration(student);
  await student.save();

  const populated = await applyDocumentPopulate(Student.findById(student._id)).exec();

  res.status(201).json({
    success: true,
    data: populated,
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

  const enriched = data.map((s) => ({
    ...s.toObject(),
    documentCount: countStudentDocuments(s),
  }));
  res.json(paginatedResponse(enriched, total, pagination));
});

exports.getStudent = asyncHandler(async (req, res) => {
  const student = await applyDocumentPopulate(
    Student.findById(req.params.id)
      .populate('institution', 'name')
      .populate('user', 'email firstName lastName')
  );
  if (!student) throw new ApiError(404, 'Student not found');

  if (!student.registrationNumber) {
    await assignStudentRegistration(student);
    await student.save();
  }

  res.json({ success: true, data: attachStudentDocumentUrls(student) });
});
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

  if (updates.academicInfo) {
    student.academicInfo = {
      ...(student.academicInfo?.toObject?.() || student.academicInfo || {}),
      matric: {
        ...(student.academicInfo?.matric?.toObject?.() || student.academicInfo?.matric || {}),
        ...updates.academicInfo.matric,
      },
      fsc: {
        ...(student.academicInfo?.fsc?.toObject?.() || student.academicInfo?.fsc || {}),
        ...updates.academicInfo.fsc,
      },
    };
    delete updates.academicInfo;
  }

  if (updates.documents) {
    student.documents = {
      ...(student.documents?.toObject?.() || student.documents || {}),
      ...updates.documents,
    };
    delete updates.documents;
  }

  Object.assign(student, updates);

  if (['active', 'approved'].includes(student.status) && !student.registrationNumber) {
    await assignStudentRegistration(student);
  }
  if (student.status === 'approved') {
    activateStudentMembership(student, req.user._id);
  }

  await student.save();

  const populated = await applyDocumentPopulate(Student.findById(student._id)).exec();
  res.json({ success: true, data: populated });
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

  if (student.status === 'approved' || student.status === 'active') {
    await assignStudentRegistration(student);
    activateStudentMembership(student, req.user._id);
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
