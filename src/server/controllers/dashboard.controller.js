const {
  Institution, InstitutionApplication, Student, Faculty, Payment, Renewal,
  FieldInspection, Notification, AuditLog, StudentAttendance,
} = require('../models');
const { ROLES } = require('../config/constants');
const asyncHandler = require('../utils/asyncHandler');

exports.getAdminDashboard = asyncHandler(async (req, res) => {
  const [
    institutions, students, faculty, revenue, renewals,
    pendingApprovals, expiringLicenses, recentInspections,
  ] = await Promise.all([
    Institution.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Faculty.countDocuments({ status: 'active' }),
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Renewal.countDocuments({ status: 'pending' }),
    InstitutionApplication.countDocuments({
      status: { $in: ['submitted', 'under_review', 'committee_review', 'council_review'] },
    }),
    Student.countDocuments({
      renewalDueDate: { $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      status: 'active',
    }),
    FieldInspection.find({ status: 'submitted' }).limit(5).populate('institution', 'name'),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        institutions,
        students,
        faculty,
        revenue: revenue[0]?.total || 0,
        pendingRenewals: renewals,
        pendingApprovals,
        expiringLicenses,
      },
      recentInspections,
    },
  });
});

exports.getFieldOfficerDashboard = asyncHandler(async (req, res) => {
  const filter = req.user.role === ROLES.SUPER_ADMIN ? {} : { fieldOfficer: req.user._id };
  const inspections = await FieldInspection.find(filter)
    .populate('institution', 'name institutionType')
    .sort({ createdAt: -1 });

  const stats = {
    assigned: inspections.filter((i) => i.status === 'assigned').length,
    inProgress: inspections.filter((i) => i.status === 'in_progress').length,
    submitted: inspections.filter((i) => i.status === 'submitted').length,
    total: inspections.length,
  };

  res.json({ success: true, data: { stats, inspections } });
});

exports.getInstitutionDashboard = asyncHandler(async (req, res) => {
  const institutionId = req.user.institution;

  if (!institutionId && req.user.role === ROLES.SUPER_ADMIN) {
    const [students, faculty, renewals] = await Promise.all([
      Student.countDocuments({ status: 'active' }),
      Faculty.countDocuments({ status: 'active' }),
      Renewal.countDocuments({ status: 'pending' }),
    ]);
    return res.json({
      success: true,
      data: { stats: { students, faculty, pendingRenewals: renewals } },
    });
  }

  if (!institutionId) {
    return res.json({
      success: true,
      data: { stats: { students: 0, faculty: 0, pendingRenewals: 0 } },
    });
  }

  const [students, faculty, renewals, attendance] = await Promise.all([
    Student.countDocuments({ institution: institutionId }),
    Faculty.countDocuments({ institution: institutionId }),
    Renewal.countDocuments({ institution: institutionId, status: 'pending' }),
    StudentAttendance.aggregate([
      { $match: { institution: institutionId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      stats: { students, faculty, pendingRenewals: renewals },
      attendanceBreakdown: attendance,
    },
  });
});

exports.getCouncilDashboard = asyncHandler(async (req, res) => {
  const [pending, approved, rejected] = await Promise.all([
    InstitutionApplication.countDocuments({ status: 'council_review' }),
    Institution.countDocuments({ status: 'approved' }),
    InstitutionApplication.countDocuments({ status: 'rejected' }),
  ]);

  const pendingDecisions = await InstitutionApplication.find({ status: 'council_review' })
    .populate('institution', 'name institutionType')
    .limit(10);

  res.json({
    success: true,
    data: { stats: { pending, approved, rejected }, pendingDecisions },
  });
});

exports.getMonitoringDashboard = asyncHandler(async (req, res) => {
  const { CameraStream, BiometricDevice } = require('../models');
  const [streams, devices, institutions] = await Promise.all([
    CameraStream.find({ isActive: true }).populate('institution', 'name'),
    BiometricDevice.find({ isActive: true }).populate('institution', 'name'),
    Institution.countDocuments({ status: 'approved' }),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        activeStreams: streams.filter((s) => s.isLive).length,
        totalStreams: streams.length,
        biometricDevices: devices.length,
        institutions,
      },
      streams,
      devices,
    },
  });
});

exports.getFinanceDashboard = asyncHandler(async (req, res) => {
  const [totalRevenue, pendingPayments, recentPayments] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$paymentType', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.countDocuments({ status: 'pending' }),
    Payment.find().sort({ createdAt: -1 }).limit(10).populate('payer', 'firstName lastName'),
  ]);

  res.json({
    success: true,
    data: { revenueByType: totalRevenue, pendingPayments, recentPayments },
  });
});

exports.getNotifications = asyncHandler(async (req, res) => {
  const { paginate, paginatedResponse } = require('../utils/pagination');
  const filter = { recipient: req.user._id };
  if (req.query.unread === 'true') filter.isRead = false;

  const total = await Notification.countDocuments(filter);
  const { query, pagination } = paginate(
    Notification.find(filter).sort({ createdAt: -1 }),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  res.json({ success: true, data: notification });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  res.json({ success: true, message: 'Notification deleted' });
});

exports.getAuditLogs = asyncHandler(async (req, res) => {
  const { paginate, paginatedResponse, buildFilter } = require('../utils/pagination');
  const filter = buildFilter(req.query, ['module', 'action']);
  const total = await AuditLog.countDocuments(filter);
  const { query, pagination } = paginate(
    AuditLog.find(filter).populate('user', 'firstName lastName email').sort({ createdAt: -1 }),
    req.query
  );
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});
