const paymentService = require('../services/payment.service');
const membershipService = require('../services/membership.service');
const { Renewal } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse } = require('../utils/pagination');

const approveRenewalRecord = async (renewal, approvedBy) => {
  renewal.status = 'approved';
  renewal.approvedBy = approvedBy;
  renewal.newExpiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  await renewal.save();

  const modelMap = { student: 'Student', faculty: 'Faculty', institution: 'Institution' };
  const Model = require('../models')[modelMap[renewal.entityType]];
  if (Model) {
    await Model.findByIdAndUpdate(renewal.entityId, {
      status: 'active',
      expiresAt: renewal.newExpiryDate,
      renewalDueDate: renewal.newExpiryDate,
    });
  }
  return renewal;
};

exports.getPaymentConfig = asyncHandler(async (req, res) => {
  res.json({ success: true, data: paymentService.getConfig() });
});

exports.createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment({
    ...req.body,
    payer: req.user._id,
  });
  res.status(201).json({ success: true, data: result });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.verifyPayment(req.params.invoiceNumber, req.body);
  const renewal = await membershipService.linkPaymentToRenewal(payment);

  if (renewal && (!paymentService.isEnabled() || payment.gateway === 'bypass')) {
    await approveRenewalRecord(renewal, req.user?._id);
  }

  res.json({ success: true, data: { payment, renewal } });
});

exports.getPayments = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user.role !== 'super_admin' && req.user.role !== 'finance_officer') {
    filter.payer = req.user._id;
  }
  const result = await paymentService.getPaymentHistory(filter, req.query);
  res.json(result);
});

exports.createRenewal = asyncHandler(async (req, res) => {
  const renewal = await Renewal.create({
    ...req.body,
    requestedBy: req.user._id,
    renewalYear: new Date().getFullYear(),
    status: 'payment_pending',
  });
  res.status(201).json({ success: true, data: renewal });
});

exports.requestRenewal = asyncHandler(async (req, res) => {
  const { entityType, entityId, gateway } = req.body;
  if (!entityType || !entityId) throw new ApiError(400, 'entityType and entityId are required');

  const renewal = await membershipService.requestRenewal({
    user: req.user,
    entityType,
    entityId,
    institutionId: req.body.institutionId,
  });

  const paymentType = entityType === 'student'
    ? 'student_renewal'
    : entityType === 'faculty'
      ? 'faculty_renewal'
      : 'institution_renewal';

  const amount = membershipService.getRenewalAmount(entityType);
  const result = await paymentService.createPayment({
    paymentType,
    gateway: gateway || 'bypass',
    amount,
    payer: req.user._id,
    institution: renewal.institution,
    relatedEntity: {
      entityType,
      entityId,
      renewalId: renewal._id,
    },
  });

  renewal.payment = result.payment._id;
  await renewal.save();

  res.status(201).json({
    success: true,
    data: {
      renewal,
      payment: result.payment,
      checkoutUrl: result.checkoutUrl,
      bypassed: result.bypassed,
    },
  });
});

exports.getMembershipStatus = asyncHandler(async (req, res) => {
  const status = await membershipService.checkMembership(req.user);
  res.json({ success: true, data: status });
});

exports.getRenewals = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const total = await Renewal.countDocuments(filter);
  const { query, pagination } = paginate(Renewal.find(filter).sort({ createdAt: -1 }), req.query);
  const data = await query;
  res.json(paginatedResponse(data, total, pagination));
});

exports.approveRenewal = asyncHandler(async (req, res) => {
  const renewal = await Renewal.findById(req.params.id);
  if (!renewal) throw new ApiError(404, 'Renewal not found');
  await approveRenewalRecord(renewal, req.user._id);
  res.json({ success: true, data: renewal });
});

exports.deleteRenewal = asyncHandler(async (req, res) => {
  const renewal = await Renewal.findByIdAndDelete(req.params.id);
  if (!renewal) throw new ApiError(404, 'Renewal not found');
  res.json({ success: true, message: 'Renewal deleted' });
});
