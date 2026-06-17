const {
  Affidavit, FieldInspection, Committee, CouncilMeeting,
  BiometricDevice, CameraStream, Document, InstitutionApplication,
} = require('../models');
const storageService = require('../services/storage.service');
const biometricService = require('../services/biometric.service');
const { generateResolutionNumber } = require('../utils/generators');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { advanceStep } = require('../utils/workflowHelpers');

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

exports.updateAffidavit = asyncHandler(async (req, res) => {
  const affidavit = await Affidavit.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!affidavit) throw new ApiError(404, 'Affidavit not found');
  res.json({ success: true, data: affidavit });
});

exports.deleteAffidavit = asyncHandler(async (req, res) => {
  const affidavit = await Affidavit.findByIdAndDelete(req.params.id);
  if (!affidavit) throw new ApiError(404, 'Affidavit not found');
  res.json({ success: true, message: 'Affidavit deleted' });
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

exports.getInspection = asyncHandler(async (req, res) => {
  const inspection = await FieldInspection.findById(req.params.id)
    .populate('institution', 'name institutionType')
    .populate('fieldOfficer', 'firstName lastName email')
    .populate('application');
  if (!inspection) throw new ApiError(404, 'Inspection not found');
  res.json({ success: true, data: inspection });
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
  if (req.body.status === 'submitted') {
    inspection.submittedAt = new Date();
    inspection.visitDate = inspection.visitDate || new Date();

    if (inspection.application) {
      const application = await InstitutionApplication.findById(inspection.application);
      if (application && application.status === 'field_inspection_pending') {
        application.status = 'committee_review';
        advanceStep(application.workflow, 'field_inspection', 'committee_review');
        await application.save();
      }
    }
  }
  await inspection.save();
  res.json({ success: true, data: inspection });
});

exports.deleteInspection = asyncHandler(async (req, res) => {
  const inspection = await FieldInspection.findByIdAndDelete(req.params.id);
  if (!inspection) throw new ApiError(404, 'Inspection not found');
  res.json({ success: true, message: 'Inspection deleted' });
});

// Committees
exports.getCommittees = asyncHandler(async (req, res) => {
  const filter = req.query.all === 'true' ? {} : { isActive: true };
  const committees = await Committee.find(filter)
    .populate('chairperson', 'firstName lastName')
    .populate('members', 'firstName lastName');
  res.json({ success: true, data: committees });
});

exports.createCommittee = asyncHandler(async (req, res) => {
  const committee = await Committee.create(req.body);
  res.status(201).json({ success: true, data: committee });
});

exports.updateCommittee = asyncHandler(async (req, res) => {
  const committee = await Committee.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!committee) throw new ApiError(404, 'Committee not found');
  res.json({ success: true, data: committee });
});

exports.deleteCommittee = asyncHandler(async (req, res) => {
  const committee = await Committee.findByIdAndDelete(req.params.id);
  if (!committee) throw new ApiError(404, 'Committee not found');
  res.json({ success: true, message: 'Committee deleted' });
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
  const application = await InstitutionApplication.findById(applicationId);
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.status !== 'committee_review') {
    throw new ApiError(400, 'Application is not in committee review');
  }

  application.committeeReview = application.committeeReview || { votes: [] };
  const existing = application.committeeReview.votes.find(
    (v) => v.member?.toString() === req.user._id.toString()
  );
  if (existing) {
    existing.vote = vote;
    existing.comments = comments;
  } else {
    application.committeeReview.votes.push({ member: req.user._id, vote, comments });
  }

  const votes = application.committeeReview.votes;
  const approves = votes.filter((v) => v.vote === 'approve').length;
  const rejects = votes.filter((v) => v.vote === 'reject').length;

  if (approves > rejects && approves >= Math.ceil(votes.length / 2)) {
    application.committeeReview.decision = 'approve';
    application.committeeReview.votedAt = new Date();
    application.status = 'council_review';
    advanceStep(application.workflow, 'committee_review', 'council_review');
  } else if (rejects > approves) {
    application.committeeReview.decision = 'reject';
    application.committeeReview.votedAt = new Date();
    application.status = 'rejected';
    application.rejectionReason = comments || 'Rejected by committee majority';
  }

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

exports.updateCouncilMeeting = asyncHandler(async (req, res) => {
  const meeting = await CouncilMeeting.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!meeting) throw new ApiError(404, 'Council meeting not found');
  res.json({ success: true, data: meeting });
});

exports.deleteCouncilMeeting = asyncHandler(async (req, res) => {
  const meeting = await CouncilMeeting.findByIdAndDelete(req.params.id);
  if (!meeting) throw new ApiError(404, 'Council meeting not found');
  res.json({ success: true, message: 'Council meeting deleted' });
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

exports.updateDevice = asyncHandler(async (req, res) => {
  const device = await BiometricDevice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!device) throw new ApiError(404, 'Device not found');
  res.json({ success: true, data: device });
});

exports.deleteDevice = asyncHandler(async (req, res) => {
  const device = await BiometricDevice.findByIdAndDelete(req.params.id);
  if (!device) throw new ApiError(404, 'Device not found');
  res.json({ success: true, message: 'Device deleted' });
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

  const io = req.app.get('io');
  if (io && event) {
    const device = await BiometricDevice.findOne({ deviceId: req.params.deviceId });
    let name = null;
    if (event.entityType === 'student' && event.entityId) {
      const s = await require('../models').Student.findById(event.entityId);
      name = s?.personalInfo?.fullName;
    } else if (event.entityType === 'faculty' && event.entityId) {
      const f = await require('../models').Faculty.findById(event.entityId);
      name = f?.personalInfo?.fullName;
    }
    io.to(`institution:${device?.institution}`).emit('attendance:update', {
      entityType: event.entityType,
      entityId: event.entityId,
      studentName: event.entityType === 'student' ? name : undefined,
      facultyName: event.entityType === 'faculty' ? name : undefined,
      eventType: event.eventType,
      timestamp: event.timestamp,
      deviceId: req.params.deviceId,
    });
  }

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

exports.updateCameraStream = asyncHandler(async (req, res) => {
  const stream = await CameraStream.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!stream) throw new ApiError(404, 'Camera stream not found');
  res.json({ success: true, data: stream });
});

exports.deleteCameraStream = asyncHandler(async (req, res) => {
  const stream = await CameraStream.findByIdAndDelete(req.params.id);
  if (!stream) throw new ApiError(404, 'Camera stream not found');
  res.json({ success: true, message: 'Camera stream deleted' });
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
const resolveInstitutionId = (value, fallback) => {
  const pick = (v) => {
    if (!v) return null;
    if (typeof v === 'object' && v._id) return v._id;
    if (typeof v === 'string' && v !== '[object Object]') return v;
    return null;
  };
  return pick(value) || pick(fallback) || null;
};

exports.uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded');

  const storage = await storageService.upload(req.file, req.body.category || 'other');
  const institutionId = resolveInstitutionId(req.body.institution, req.user.institution);

  const doc = await Document.create({
    filename: storage.storageKey,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storageKey: storage.storageKey,
    storageProvider: storage.storageProvider,
    bucket: storage.bucket,
    metadata: storage.metadata,
    uploadedBy: req.user._id,
    institution: institutionId || undefined,
    category: req.body.category || 'other',
  });

  res.status(201).json({ success: true, data: doc });
});

exports.getDocumentUrl = asyncHandler(async (req, res) => {
  const Document = require('../models/Document');
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');

  let url;
  if (doc.metadata?.secureUrl) {
    url = doc.metadata.secureUrl;
  } else if (doc.storageProvider === 'local') {
    url = `/api/documents/${doc._id}/download`;
  } else {
    url = await storageService.getSignedUrl(doc.storageKey, 3600, doc.metadata);
  }

  res.json({ success: true, data: { url, document: doc } });
});

exports.downloadDocument = asyncHandler(async (req, res) => {
  const fs = require('fs');
  const doc = await Document.findById(req.params.id);
  if (!doc) throw new ApiError(404, 'Document not found');

  if (doc.storageProvider === 'cloudinary' || doc.storageProvider === 's3') {
    const url = await storageService.getSignedUrl(doc.storageKey, 3600, doc.metadata);
    return res.redirect(url);
  }

  if (doc.storageProvider !== 'local') {
    throw new ApiError(400, 'Direct download not available for this storage provider');
  }

  const filePath = storageService.getLocalFilePath(doc.storageKey);
  if (!fs.existsSync(filePath)) throw new ApiError(404, 'File not found on disk');

  res.setHeader('Content-Type', doc.mimeType || 'application/octet-stream');
  res.setHeader('Content-Disposition', `inline; filename="${doc.originalName}"`);
  fs.createReadStream(filePath).pipe(res);
});
