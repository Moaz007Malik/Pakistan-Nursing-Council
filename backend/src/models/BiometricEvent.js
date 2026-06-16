const mongoose = require('mongoose');
const { ATTENDANCE_SOURCES } = require('../config/constants');

const biometricEventSchema = new mongoose.Schema(
  {
    device: { type: mongoose.Schema.Types.ObjectId, ref: 'BiometricDevice', required: true },
    deviceId: { type: String, required: true },
    deviceUserId: { type: String, required: true },
    entityType: { type: String, enum: ['student', 'faculty', 'unknown'] },
    entityId: mongoose.Schema.Types.ObjectId,
    timestamp: { type: Date, required: true },
    eventType: { type: String, enum: ['check_in', 'check_out'], default: 'check_in' },
    source: { type: String, enum: ATTENDANCE_SOURCES, default: 'biometric' },
    processed: { type: Boolean, default: false },
    processedAt: Date,
    rawData: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

biometricEventSchema.index({ deviceId: 1, timestamp: -1 });
biometricEventSchema.index({ deviceUserId: 1, timestamp: -1 });
biometricEventSchema.index({ processed: 1, timestamp: 1 });

module.exports = mongoose.model('BiometricEvent', biometricEventSchema);
