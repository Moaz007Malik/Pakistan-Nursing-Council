const paymentService = require('../services/payment.service');
const { Renewal } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { paginate, paginatedResponse } = require('../utils/pagination');

exports.createPayment = asyncHandler(async (req, res) => {
  const result = await paymentService.createPayment({
    ...req.body,
    payer: req.user._id,
  });
  res.status(201).json({ success: true, data: result });
});

exports.verifyPayment = asyncHandler(async (req, res) => {
  const payment = await paymentService.verifyPayment(req.params.invoiceNumber, req.body);
  res.json({ success: true, data: payment });
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

  renewal.status = 'approved';
  renewal.approvedBy = req.user._id;
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

  res.json({ success: true, data: renewal });
});
