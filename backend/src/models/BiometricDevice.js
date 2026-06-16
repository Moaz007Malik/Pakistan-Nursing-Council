const mongoose = require('mongoose');
const { BIOMETRIC_VENDORS } = require('../config/constants');

const userMappingSchema = new mongoose.Schema(
  {
    deviceUserId: { type: String, required: true },
    entityType: { type: String, enum: ['student', 'faculty'], required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    enrolledAt: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { _id: true }
);

const biometricDeviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    deviceId: { type: String, required: true, unique: true },
    vendor: { type: String, enum: BIOMETRIC_VENDORS, required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    ipAddress: String,
    port: Number,
    serialNumber: String,
    location: String,
    isActive: { type: Boolean, default: true },
    lastSyncAt: Date,
    userMappings: [userMappingSchema],
    config: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

biometricDeviceSchema.index({ institution: 1 });
biometricDeviceSchema.index({ deviceId: 1 });

module.exports = mongoose.model('BiometricDevice', biometricDeviceSchema);
