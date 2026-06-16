const mongoose = require('mongoose');
const { PAYMENT_TYPES, PAYMENT_GATEWAYS } = require('../config/constants');

const paymentSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, unique: true, required: true },
    paymentType: { type: String, enum: PAYMENT_TYPES, required: true },
    gateway: { type: String, enum: PAYMENT_GATEWAYS, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'PKR' },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    payer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
    relatedEntity: {
      entityType: { type: String, enum: ['student', 'faculty', 'institution', 'renewal'] },
      entityId: mongoose.Schema.Types.ObjectId,
    },
    gatewayTransactionId: String,
    gatewayResponse: mongoose.Schema.Types.Mixed,
    receiptUrl: String,
    receiptNumber: String,
    paidAt: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

paymentSchema.index({ payer: 1, status: 1 });
paymentSchema.index({ paymentType: 1, createdAt: -1 });
paymentSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
