const mongoose = require('mongoose');

const approvalHistorySchema = new mongoose.Schema(
  {
    action: String,
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comments: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const affidavitSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    status: {
      type: String,
      enum: ['uploaded', 'verification', 'committee_review', 'council_approval', 'approved', 'rejected'],
      default: 'uploaded',
    },
    digitalSignature: {
      signedBy: String,
      signedAt: Date,
      signatureHash: String,
    },
    qrCode: String,
    verificationNotes: String,
    committeeDecision: String,
    councilDecision: String,
    approvalHistory: [approvalHistorySchema],
    expiresAt: Date,
  },
  { timestamps: true }
);

affidavitSchema.index({ institution: 1 });
affidavitSchema.index({ status: 1 });

module.exports = mongoose.model('Affidavit', affidavitSchema);
