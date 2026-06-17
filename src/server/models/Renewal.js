const mongoose = require('mongoose');

const renewalSchema = new mongoose.Schema(
  {
    entityType: { type: String, enum: ['student', 'faculty', 'institution'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution' },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    renewalYear: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'payment_pending', 'payment_completed', 'under_verification', 'approved', 'rejected', 'expired'],
      default: 'pending',
    },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    certificateUrl: String,
    previousExpiryDate: Date,
    newExpiryDate: Date,
    rejectionReason: String,
    documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  },
  { timestamps: true }
);

renewalSchema.index({ entityType: 1, entityId: 1, renewalYear: 1 });
renewalSchema.index({ status: 1 });

module.exports = mongoose.model('Renewal', renewalSchema);
