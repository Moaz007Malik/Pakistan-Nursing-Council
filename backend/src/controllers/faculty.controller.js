const { Faculty } = require('../models');
const { generateRegistrationNumber } = require('../utils/generators');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');

exports.createFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.create({
    ...req.body,
    institution: req.body.institution || req.user.institution,
    status: 'draft',
    workflow: [
      { step: 'institution_approval', status: 'pending' },
      { step: 'council_approval', status: 'pending' },
    ],
  });
  res.status(201).json({ success: true, data: faculty });
});

exports.getFacultyList = asyncHandler(async (req, res) => {
  const filter = buildFilter(req.query, ['status', 'institution']);
  if (['institution_admin', 'principal'].includes(req.user.role)) {
    filter.institution = req.user.institution;
  }
  const total = await Faculty.countDocuments(filter);
  const { query, pagination } = paginate(
    Faculty.find(filter).populate('institution', 'name'),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.getFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findById(req.params.id).populate('institution', 'name');
  if (!faculty) throw new ApiError(404, 'Faculty not found');
  res.json({ success: true, data: faculty });
});

exports.updateFaculty = asyncHandler(async (req, res) => {
  const faculty = await Faculty.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!faculty) throw new ApiError(404, 'Faculty not found');
  res.json({ success: true, data: faculty });
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
