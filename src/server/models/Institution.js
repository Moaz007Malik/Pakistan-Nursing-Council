const mongoose = require('mongoose');
const { INSTITUTION_TYPES, INSTITUTION_STATUSES } = require('../config/constants');

const addressSchema = new mongoose.Schema(
  {
    street: String,
    city: String,
    district: String,
    province: String,
    postalCode: String,
    country: { type: String, default: 'Pakistan' },
  },
  { _id: false }
);

const institutionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, unique: true, sparse: true },
    institutionType: {
      type: String,
      enum: INSTITUTION_TYPES,
      required: true,
    },
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    website: String,
    address: addressSchema,
    principalName: String,
    principalContact: String,
    establishedYear: Number,
    affiliationHospital: String,
    status: {
      type: String,
      enum: INSTITUTION_STATUSES,
      default: 'draft',
    },
    qrCode: String,
    certificateUrl: String,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: Date,
    renewalDueDate: Date,
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

institutionSchema.index({ name: 'text', registrationNumber: 'text' });
institutionSchema.index({ status: 1 });
institutionSchema.index({ institutionType: 1 });

module.exports = mongoose.model('Institution', institutionSchema);
