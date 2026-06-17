const { Institution, InstitutionApplication, FieldInspection, Affidavit } = require('../models');
const { generateRegistrationNumber, generateQRCode } = require('../utils/generators');
const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../config/constants');
const { markStep, advanceStep } = require('../utils/workflowHelpers');
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

exports.deleteInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findByIdAndDelete(req.params.id);
  if (!institution) throw new ApiError(404, 'Institution not found');
  res.json({ success: true, message: 'Institution deleted' });
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
    .populate('affidavit')
    .populate('submittedBy', 'firstName lastName email');
  if (!application) throw new ApiError(404, 'Application not found');
  res.json({ success: true, data: application });
});

exports.updateApplication = asyncHandler(async (req, res) => {
  const application = await InstitutionApplication.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!application) throw new ApiError(404, 'Application not found');
  res.json({ success: true, data: application });
});

exports.deleteApplication = asyncHandler(async (req, res) => {
  const application = await InstitutionApplication.findByIdAndDelete(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');
  res.json({ success: true, message: 'Application deleted' });
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

  const reject = async (reason) => {
    const currentStatus = application.status;
    application.status = 'rejected';
    application.rejectionReason = reason;
    const stepMap = {
      submitted: 'institution_submission',
      under_review: 'field_inspection',
      field_inspection_pending: 'field_inspection',
      committee_review: 'committee_review',
      council_review: 'council_review',
    };
    markStep(application.workflow, stepMap[currentStatus] || 'council_review', 'rejected', req.user._id, reason);
    await Institution.findByIdAndUpdate(application.institution._id, { status: 'rejected' });
    await notificationService.notifyRejection(application.submittedBy, 'institution', reason);
  };

  if (action === 'reject') {
    await reject(comments || 'Rejected');
    await application.save();
    return res.json({ success: true, data: application });
  }

  const role = req.user.role;
  const status = application.status;

  if (status === 'submitted' && [ROLES.SUPER_ADMIN, ROLES.COUNCIL_MEMBER].includes(role)) {
    application.status = 'under_review';
    advanceStep(application.workflow, 'institution_submission', 'field_inspection');
  } else if (status === 'under_review' && [ROLES.SUPER_ADMIN, ROLES.COUNCIL_MEMBER].includes(role)) {
    application.status = 'field_inspection_pending';
    advanceStep(application.workflow, 'field_inspection', 'committee_review');

    const inspection = await FieldInspection.create({
      institution: application.institution._id,
      application: application._id,
      fieldOfficer: req.user.role === ROLES.FIELD_OFFICER ? req.user._id : req.body.fieldOfficer || req.user._id,
      status: 'assigned',
      scheduledDate: req.body.scheduledDate || new Date(),
    });
    application.fieldInspection = inspection._id;
  } else if (status === 'field_inspection_pending' && [ROLES.SUPER_ADMIN, ROLES.FIELD_OFFICER].includes(role)) {
    const inspection = await FieldInspection.findById(application.fieldInspection);
    if (!inspection || inspection.status !== 'submitted') {
      throw new ApiError(400, 'Field inspection must be submitted before committee review');
    }
    application.status = 'committee_review';
    advanceStep(application.workflow, 'field_inspection', 'committee_review');
  } else if (status === 'committee_review' && [ROLES.SUPER_ADMIN, ROLES.COMMITTEE_MEMBER].includes(role)) {
    application.committeeReview = application.committeeReview || { votes: [] };
    application.committeeReview.decision = 'approve';
    application.committeeReview.votedAt = new Date();
    application.status = 'council_review';
    advanceStep(application.workflow, 'committee_review', 'council_review');
  } else if (status === 'council_review' && [ROLES.SUPER_ADMIN, ROLES.COUNCIL_MEMBER].includes(role)) {
    application.status = 'approved';
    markStep(application.workflow, 'council_review', 'completed', req.user._id, comments);
    application.councilReview = {
      decision: 'approved',
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
      comments,
    };

    const count = await Institution.countDocuments({ status: 'approved' });
    const regNumber = generateRegistrationNumber('INST', count + 1);
    const qrCode = await generateQRCode({
      type: 'institution',
      registrationNumber: regNumber,
      name: application.institution.name,
    });

    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await Institution.findByIdAndUpdate(application.institution._id, {
      status: 'approved',
      registrationNumber: regNumber,
      qrCode,
      approvedAt: new Date(),
      approvedBy: req.user._id,
      expiresAt,
    });

    const affidavit = await Affidavit.create({
      institution: application.institution._id,
      submittedBy: req.user._id,
      status: 'approved',
      councilDecision: 'approved',
      committeeDecision: application.committeeReview?.decision,
      expiresAt,
      verificationNotes: 'Auto-generated on council approval — institution affidavit issued.',
    });
    application.affidavit = affidavit._id;

    await notificationService.notifyApproval(
      application.submittedBy,
      'institution',
      application.institution.name
    );
  } else {
    throw new ApiError(403, `Cannot advance application from status "${status}" with your role`);
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
