const { ROLES } = require('../config/constants');
const attendanceService = require('../services/attendance.service');
const { StudentAttendance, FacultyAttendance } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.markStudentAttendance = asyncHandler(async (req, res) => {
  const record = await attendanceService.markStudentAttendance(req.body, req.user._id);
  res.json({ success: true, data: record });
});

exports.getStudentAttendance = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getStudentAttendanceSummary(
    req.params.studentId,
    req.query
  );
  res.json({ success: true, data: summary });
});

exports.getFacultyAttendance = asyncHandler(async (req, res) => {
  const summary = await attendanceService.getFacultyAttendanceSummary(
    req.params.facultyId,
    req.query
  );
  res.json({ success: true, data: summary });
});

exports.getInstitutionDashboard = asyncHandler(async (req, res) => {
  let institutionId = req.params.institutionId || req.user.institution;

  // Super admin without institution — use first institution or return empty stats
  if (!institutionId && req.user.role === ROLES.SUPER_ADMIN) {
    const { Institution } = require('../models');
    const first = await Institution.findOne().select('_id');
    institutionId = first?._id;
  }

  if (!institutionId) {
    return res.json({
      success: true,
      data: {
        students: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
        faculty: { present: 0, absent: 0, late: 0, leave: 0, total: 0 },
        date: new Date(),
      },
    });
  }

  const dashboard = await attendanceService.getInstitutionAttendanceDashboard(
    institutionId,
    req.query.date
  );
  res.json({ success: true, data: dashboard });
});

exports.getStudentAttendanceRecords = asyncHandler(async (req, res) => {
  const filter = { student: req.params.studentId };
  const total = await StudentAttendance.countDocuments(filter);
  const { query, pagination } = paginate(StudentAttendance.find(filter).sort({ date: -1 }), req.query);
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.markFacultyAttendance = asyncHandler(async (req, res) => {
  const date = new Date(req.body.date);
  date.setHours(0, 0, 0, 0);

  const record = await FacultyAttendance.findOneAndUpdate(
    { faculty: req.body.faculty, date },
    { ...req.body, source: 'manual', adjustedBy: req.user._id },
    { upsert: true, new: true }
  );
  res.json({ success: true, data: record });
});
