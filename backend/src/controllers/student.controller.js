const { Student } = require('../models');
const { generateRegistrationNumber, generateQRCode } = require('../utils/generators');
const notificationService = require('../services/notification.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');

exports.createStudent = asyncHandler(async (req, res) => {
  const student = await Student.create({
    ...req.body,
    institution: req.body.institution || req.user.institution,
    status: 'draft',
    workflow: [
      { step: 'institution_verification', status: 'pending' },
      { step: 'committee_verification', status: 'pending' },
      { step: 'approval', status: 'pending' },
    ],
  });
  res.status(201).json({ success: true, data: student });
});

exports.getStudents = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, ['status', 'institution']);
  if (['institution_admin', 'principal', 'faculty'].includes(req.user.role)) {
    filter.institution = req.user.institution;
  }
  const total = await Student.countDocuments(filter);
  const { query, pagination } = paginate(
    Student.find(filter).populate('institution', 'name'),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.getStudent = asyncHandler(async (req, res) => {
  const student = await Student.findById(req.params.id).populate('institution', 'name');
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
});

exports.updateStudent = asyncHandler(async (req, res) => {
  const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!student) throw new ApiError(404, 'Student not found');
  res.json({ success: true, data: student });
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
