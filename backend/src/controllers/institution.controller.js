const { Institution, InstitutionApplication } = require('../models');
const { generateRegistrationNumber, generateQRCode } = require('../utils/generators');
const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');
const { INSTITUTION_STATUSES } = require('../config/constants');

exports.createInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.create({
    ...req.body,
    admin: req.user._id,
    status: 'draft',
  });
  res.status(201).json({ success: true, data: institution });
});

exports.getInstitutions = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, ['status', 'institutionType']);
  if (req.user.role === 'institution_admin' || req.user.role === 'principal') {
    filter._id = req.user.institution;
  }
  const total = await Institution.countDocuments(filter);
  const { query, pagination } = paginate(
    Institution.find(filter).populate('admin', 'firstName lastName email'),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.getInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id)
    .populate('admin', 'firstName lastName email');
  if (!institution) throw new ApiError(404, 'Institution not found');
  res.json({ success: true, data: institution });
});

exports.updateInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!institution) throw new ApiError(404, 'Institution not found');
  res.json({ success: true, data: institution });
});

exports.createApplication = asyncHandler(async (req, res) => {
  const application = await InstitutionApplication.create({
    ...req.body,
    submittedBy: req.user._id,
    status: 'draft',
    workflow: [
      { step: 'institution_submission', status: 'pending' },
      { step: 'field_inspection', status: 'pending' },
      { step: 'committee_review', status: 'pending' },
      { step: 'council_review', status: 'pending' },
    ],
  });
  res.status(201).json({ success: true, data: application });
});

exports.getApplications = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, ['status']);
  const total = await InstitutionApplication.countDocuments(filter);
  const { query, pagination } = paginate(
    InstitutionApplication.find(filter)
      .populate('institution', 'name institutionType')
      .populate('submittedBy', 'firstName lastName'),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.getApplication = asyncHandler(async (req, res) => {
  const application = await InstitutionApplication.findById(req.params.id)
    .populate('institution')
    .populate('fieldInspection')
    .populate('submittedBy', 'firstName lastName email');
  if (!application) throw new ApiError(404, 'Application not found');
  res.json({ success: true, data: application });
});

exports.submitApplication = asyncHandler(async (req, res) => {
  const application = await InstitutionApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');

  application.status = 'submitted';
  application.workflow[0].status = 'completed';
  application.workflow[0].completedAt = new Date();
  application.workflow[1].status = 'in_progress';
  await application.save();

  await Institution.findByIdAndUpdate(application.institution, { status: 'submitted' });
  res.json({ success: true, data: application });
});

exports.advanceWorkflow = asyncHandler(async (req, res) => {
  const { action, comments } = req.body;
  const application = await InstitutionApplication.findById(req.params.id).populate('institution');
  if (!application) throw new ApiError(404, 'Application not found');

  const statusFlow = {
    submitted: 'under_review',
    under_review: 'field_inspection_pending',
    field_inspection_pending: 'committee_review',
    committee_review: 'council_review',
    council_review: action === 'approve' ? 'approved' : 'rejected',
  };

  if (action === 'reject') {
    application.status = 'rejected';
    application.rejectionReason = comments;
    await Institution.findByIdAndUpdate(application.institution._id, { status: 'rejected' });
    await notificationService.notifyRejection(
      application.submittedBy,
      'institution',
      comments
    );
  } else {
    application.status = statusFlow[application.status] || application.status;
  }

  if (application.status === 'approved') {
    const count = await Institution.countDocuments({ status: 'approved' });
    const regNumber = generateRegistrationNumber('INST', count + 1);
    const qrCode = await generateQRCode({
      type: 'institution',
      registrationNumber: regNumber,
      name: application.institution.name,
    });

    await Institution.findByIdAndUpdate(application.institution._id, {
      status: 'approved',
      registrationNumber: regNumber,
      qrCode,
      approvedAt: new Date(),
      approvedBy: req.user._id,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    await notificationService.notifyApproval(
      application.submittedBy,
      'institution',
      application.institution.name
    );
  }

  await application.save();
  res.json({ success: true, data: application });
});

exports.verifyQR = asyncHandler(async (req, res) => {
  const { registrationNumber } = req.params;
  const institution = await Institution.findOne({ registrationNumber });
  if (!institution) throw new ApiError(404, 'Invalid registration number');
  res.json({
    success: true,
    data: {
      valid: institution.status === 'approved',
      institution: {
        name: institution.name,
        registrationNumber: institution.registrationNumber,
        status: institution.status,
        institutionType: institution.institutionType,
        approvedAt: institution.approvedAt,
        expiresAt: institution.expiresAt,
      },
    },
  });
});
