const { Faculty } = require('../models');
const { generateRegistrationNumber } = require('../utils/generators');
const portalUserService = require('../services/portalUser.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');

const resolvePortalCredentials = (body) => ({
  email: body.loginEmail || body.email || body.personalInfo?.email,
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
    role: ROLES.FACULTY,
    institution,
    phone,
  });
  return user._id;
};

exports.createFaculty = asyncHandler(async (req, res) => {
  const institutionId = req.body.institution || req.user.institution;
  if (!institutionId) throw new ApiError(400, 'Institution is required');

  const { loginEmail, loginPassword, email, password, ...rest } = req.body;
  const credentials = resolvePortalCredentials({ loginEmail, loginPassword, email, password, personalInfo: rest.personalInfo });
  const fullName = rest.personalInfo?.fullName;

  const userId = await attachPortalUser({
    ...credentials,
    fullName,
    institution: institutionId,
    phone: rest.personalInfo?.contact,
  });

  if (credentials.email) {
    rest.personalInfo = { ...rest.personalInfo, email: credentials.email };
  }

  const faculty = await Faculty.create({
    ...rest,
    user: userId || rest.user,
    institution: institutionId,
    status: 'draft',
    workflow: [
      { step: 'institution_approval', status: 'pending' },
      { step: 'council_approval', status: 'pending' },
    ],
  });

  res.status(201).json({
    success: true,
    data: faculty,
    portalAccess: credentials.email ? { email: credentials.email } : null,
  });
});

exports.getFacultyList = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, ['status', 'institution']);
  if (['institution_admin', 'principal'].includes(req.user.role)) {
    filter.institution = req.user.institution;
  }
  const total = await Faculty.countDocuments(filter);
  const { query, pagination } = paginate(
    Faculty.find(filter)
      .populate('institution', 'name')
      .populate('user', 'email'),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.getFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id)
    .populate('institution', 'name')
    .populate('user', 'email firstName lastName');
  if (!faculty) throw new ApiError(404, 'Faculty not found');
  res.json({ success: true, data: faculty });
});

exports.updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, 'Faculty not found');

  const { loginEmail, loginPassword, email, password, ...updates } = req.body;
  const credentials = resolvePortalCredentials({ loginEmail, loginPassword, email, password, personalInfo: updates.personalInfo });
  const fullName = updates.personalInfo?.fullName || faculty.personalInfo?.fullName;

  if (credentials.email || credentials.password) {
    const userId = await attachPortalUser({
      email: credentials.email,
      password: credentials.password,
      fullName,
      institution: faculty.institution,
      phone: updates.personalInfo?.contact || faculty.personalInfo?.contact,
      existingUserId: faculty.user,
    });
    if (userId) faculty.user = userId;
    if (credentials.email) {
      updates.personalInfo = {
        ...(faculty.personalInfo?.toObject?.() || faculty.personalInfo),
        ...updates.personalInfo,
        email: credentials.email,
      };
    }
  }

  Object.assign(faculty, updates);
  await faculty.save();
  res.json({ success: true, data: faculty });
});

exports.deleteFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, 'Faculty not found');
  await portalUserService.deletePortalUser(faculty.user);
  await faculty.deleteOne();
  res.json({ success: true, message: 'Faculty deleted' });
});

exports.advanceWorkflow = asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const faculty = await Faculty.findById(req.params.id);
  if (!faculty) throw new ApiError(404, 'Faculty not found');

  const flow = {
    draft: 'institution_approval',
    institution_approval: 'council_approval',
    council_approval: action === 'approve' ? 'approved' : 'rejected',
  };

  if (action === 'reject') {
    faculty.status = 'rejected';
  } else {
    faculty.status = flow[faculty.status] || faculty.status;
  }

  if (faculty.status === 'approved') {
    const count = await Faculty.countDocuments({ status: { $in: ['approved', 'active'] } });
    faculty.registrationNumber = generateRegistrationNumber('FAC', count + 1);
    faculty.approvedAt = new Date();
    faculty.approvedBy = req.user._id;
    faculty.status = 'active';
    faculty.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    faculty.renewalDueDate = faculty.expiresAt;
  }

  await faculty.save();
  res.json({ success: true, data: faculty });
});
