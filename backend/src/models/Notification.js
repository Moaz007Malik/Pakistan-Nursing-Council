const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['approval', 'rejection', 'renewal_due', 'payment_success', 'payment_failed', 'attendance_warning', 'inspection_assigned', 'general'],
      default: 'general',
    },
    channels: {
      email: { sent: Boolean, sentAt: Date, error: String },
      sms: { sent: Boolean, sentAt: Date, error: String },
      whatsapp: { sent: Boolean, sentAt: Date, error: String },
      inApp: { sent: Boolean, sentAt: Date },
    },
    isRead: { type: Boolean, default: false },
    readAt: Date,
    relatedEntity: {
      entityType: String,
      entityId: mongoose.Schema.Types.ObjectId,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
