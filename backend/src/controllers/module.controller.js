const {
  Affidavit, FieldInspection, Committee, CouncilMeeting,
  BiometricDevice, CameraStream, Document,
} = require('../models');
const storageService = require('../services/storage.service');
const biometricService = require('../services/biometric.service');
const { generateResolutionNumber } = require('../utils/generators');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse } = require('../utils/pagination');

// Affidavits
exports.createAffidavit = asyncHandler(async (req, res) => {
  const affidavit = await Affidavit.create({ ...req.body, submittedBy: req.user._id });
  res.status(201).json({ success: true, data: affidavit });
});

exports.getAffidavits = asyncHandler(async (req, res) => {
  const filter = req.query.institution ? { institution: req.query.institution } : {};
  const total = await Affidavit.countDocuments(filter);
  const { query, pagination } = paginate(
    Affidavit.find(filter).populate('institution', 'name'),
    req.query
  );
  res.json(paginatedResponse(await query, total, pagination));
});

exports.updateAffidavitStatus = asyncHandler(async (req, res) => {
  const affidavit = await Affidavit.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
      $push: {
        approvalHistory: {
          action: req.body.status,
          performedBy: req.user._id,
          comments: req.body.comments,
        },
      },
    },
    { new: true }
  );
  res.json({ success: true, data: affidavit });
});

// Field Inspections
exports.createInspection = asyncHandler(async (req, res) => {
  const inspection = await FieldInspection.create({
    ...req.body,
    fieldOfficer: req.body.fieldOfficer || req.user._id,
  });
  res.status(201).json({ success: true, data: inspection });
});

exports.getInspections = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role === 'field_officer') filter.fieldOfficer = req.user._id;
  if (req.query.status) filter.status = req.query.status;
  const total = await FieldInspection.countDocuments(filter);
  const { query, pagination } = paginate(
    FieldInspection.find(filter).populate('institution', 'name').populate('fieldOfficer', 'firstName lastName'),
    req.query
  );
  res.json(paginatedResponse(await query, total, pagination));
});

exports.updateInspection = asyncHandler(async (req, res) => {
  const inspection = await FieldInspection.findById(req.params.id);
  if (!inspection) throw new ApiError(404, 'Inspection not found');

  Object.assign(inspection, req.body);
  if (req.body.sections) {
    const scores = Object.values(req.body.sections)
      .filter((s) => s?.score !== undefined)
      .map((s) => s.score);
    if (scores.length) {
      inspection.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
  }
  if (req.body.status === 'submitted') inspection.submittedAt = new Date();
  await inspection.save();
  res.json({ success: true, data: inspection });
});

// Committees
exports.getCommittees = asyncHandler(async (req, res) => {
  const committees = await Committee.find({ isActive: true })
    .populate('chairperson', 'firstName lastName')
    .populate('members', 'firstName lastName');
  res.json({ success: true, data: committees });
});

exports.createCommittee = asyncHandler(async (req, res) => {
  const committee = await Committee.create(req.body);
  res.status(201).json({ success: true, data: committee });
});

exports.scheduleMeeting = asyncHandler(async (req, res) => {
  const committee = await Committee.findByIdAndUpdate(
    req.params.id,
    { $push: { meetings: req.body } },
    { new: true }
  );
  res.json({ success: true, data: committee });
});

exports.committeeVote = asyncHandler(async (req, res) => {
  const { applicationId, vote, comments } = req.body;
  const application = await require('../models').InstitutionApplication.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');

  application.committeeReview = application.committeeReview || { votes: [] };
  application.committeeReview.votes.push({ member: req.user._id, vote, comments });
  application.committeeReview.decision = vote;
  application.committeeReview.votedAt = new Date();
  await application.save();
  res.json({ success: true, data: application });
});

// Council
exports.getCouncilMeetings = asyncHandler(async (req, res) => {
  const total = await CouncilMeeting.countDocuments();
  const { query, pagination } = paginate(
    CouncilMeeting.find().populate('chairedBy', 'firstName lastName').sort({ meetingDate: -1 }),
    req.query
  );
  res.json(paginatedResponse(await query, total, pagination));
});

exports.createCouncilMeeting = asyncHandler(async (req, res) => {
  const meeting = await CouncilMeeting.create(req.body);
  res.status(201).json({ success: true, data: meeting });
});

exports.addResolution = asyncHandler(async (req, res) => {
  const count = await CouncilMeeting.aggregate([
    { $unwind: '$resolutions' },
    { $count: 'total' },
  ]);
  const resolutionNumber = generateResolutionNumber((count[0]?.total || 0) + 1);

  const meeting = await CouncilMeeting.findByIdAndUpdate(
    req.params.id,
    { $push: { resolutions: { ...req.body, resolutionNumber } } },
    { new: true }
  );
  res.json({ success: true, data: meeting });
});

// Biometric
exports.getDevices = asyncHandler(async (req, res) => {
  const filter = req.query.institution ? { institution: req.query.institution } : {};
  const devices = await BiometricDevice.find(filter).populate('institution', 'name');
  res.json({ success: true, data: devices });
});

exports.registerDevice = asyncHandler(async (req, res) => {
  const device = await BiometricDevice.create(req.body);
  res.status(201).json({ success: true, data: device });
});

exports.syncDevice = asyncHandler(async (req, res) => {
  const events = await biometricService.syncDevice(
    req.params.deviceId,
    req.query.from,
    req.query.to
  );
  res.json({ success: true, data: events });
});

exports.mapBiometricUser = asyncHandler(async (req, res) => {
  const device = await biometricService.mapUser(
    req.params.deviceId,
    req.body.deviceUserId,
    req.body.entityType,
    req.body.entityId
  );
  res.json({ success: true, data: device });
});

exports.receiveBiometricEvent = asyncHandler(async (req, res) => {
  const event = await biometricService.receiveRealtimeEvent(req.params.deviceId, req.body);
  res.json({ success: true, data: event });
});

// Camera Monitoring
exports.getCameraStreams = asyncHandler(async (req, res) => {
  const filter = req.query.institution ? { institution: req.query.institution } : {};
  const streams = await CameraStream.find(filter).populate('institution', 'name');
  res.json({ success: true, data: streams });
});

exports.createCameraStream = asyncHandler(async (req, res) => {
  const stream = await CameraStream.create(req.body);
  res.status(201).json({ success: true, data: stream });
});

exports.captureSnapshot = asyncHandler(async (req, res) => {
  const stream = await CameraStream.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        recordingLogs: {
          type: 'snapshot',
          capturedBy: req.user._id,
          fileUrl: req.body.fileUrl,
          timestamp: new Date(),
        },
      },
    },
    { new: true }
  );
  res.json({ success: true, data: stream });
});

// Documents
exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const storage = await storageService.upload(req.file, req.body.category || 'other');
  const doc = await Document.create({
    filename: storage.storageKey,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey: storage.storageKey,
    storageProvider: storage.storageProvider,
    bucket: storage.bucket,
    uploadedBy: req.user._id,
    institution: req.body.institution,
    category: req.body.category || 'other',
  });

  res.status(201).json({ success: true, data: doc });
});

exports.getDocumentUrl = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');

  const url = doc.storageProvider === 'local'
    ? `/api/v1/documents/${doc._id}/download`
    : await storageService.getSignedUrl(doc.storageKey);

  res.json({ success: true, data: { url, document: doc } });
});

exports.downloadDocument = asyncHandler(async (req, res) => {
  const fs = require('fs');
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');
  if (doc.storageProvider !== 'local') {
    throw new ApiError(400, 'Direct download only available for local storage');
  }

  const filePath = storageService.getLocalFilePath(doc.storageKey);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'File not found on disk');

  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
  fs.createReadStream(filePath).pipe(res);
});
