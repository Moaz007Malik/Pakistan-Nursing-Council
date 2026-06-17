const Faculty = require('../models/Faculty');
const portalUserService = require('../services/portalUser.service');
const {
  assignFacultyRegistration,
  activateFacultyMembership,
} = require('../services/registration.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');
const { attachFacultyDocumentUrls } = require('../utils/documentUrls');

const countFacultyDocuments = (faculty) => {
  const d = faculty.documents || {};
  return [
    d.cnic, d.picture, d.registrationCard, d.salarySlip,
    ...(d.degrees || []), ...(d.licenses || []),
  ].filter(Boolean).length;
};

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

const populateDocuments = [
  { path: 'documents.cnic', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.picture', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.registrationCard', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.salarySlip', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.degrees', select: 'originalName mimeType metadata storageProvider' },
  { path: 'documents.licenses', select: 'originalName mimeType metadata storageProvider' },
];

const applyDocumentPopulate = (query) => {
  populateDocuments.forEach(({ path, select }) => query.populate(path, select));
  return query;
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

  await assignFacultyRegistration(faculty);
  await faculty.save();

  const populated = await applyDocumentPopulate(Faculty.findById(faculty._id)).exec();

  res.status(201).json({
    success: true,
    data: populated,
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

  const enriched = data.map((f) => ({
    ...f.toObject(),
    documentCount: countFacultyDocuments(f),
  }));
  res.json(paginatedResponse(enriched, total, pagination));
});

exports.getFaculty = asyncHandler(async (req, res) => {
  const faculty = await applyDocumentPopulate(
    Faculty.findById(req.params.id)
      .populate('institution', 'name')
      .populate('user', 'email firstName lastName')
  );
  if (!faculty) throw new ApiError(404, 'Faculty not found');

  if (!faculty.registrationNumber) {
    await assignFacultyRegistration(faculty);
    await faculty.save();
  }

  res.json({ success: true, data: attachFacultyDocumentUrls(faculty) });
});
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

  if (updates.documents) {
    faculty.documents = {
      ...(faculty.documents?.toObject?.() || faculty.documents || {}),
      ...updates.documents,
    };
    delete updates.documents;
  }

  Object.assign(faculty, updates);

  if (['active', 'approved'].includes(faculty.status) && !faculty.registrationNumber) {
    await assignFacultyRegistration(faculty);
  }
  if (faculty.status === 'approved') {
    activateFacultyMembership(faculty, req.user._id);
  }

  await faculty.save();

  const populated = await applyDocumentPopulate(Faculty.findById(faculty._id)).exec();
  res.json({ success: true, data: populated });
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

  if (faculty.status === 'approved' || faculty.status === 'active') {
    await assignFacultyRegistration(faculty);
    activateFacultyMembership(faculty, req.user._id);
  }

  await faculty.save();
  res.json({ success: true, data: faculty });
});
