const mongoose = require('mongoose');

const inspectionSectionSchema = new mongoose.Schema(
  {
    name: String,
    score: { type: Number, min: 0, max: 100 },
    maxScore: { type: Number, default: 100 },
    remarks: String,
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    findings: [String],
    compliant: Boolean,
  },
  { _id: true }
);

const fieldInspectionSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    application: { type: mongoose.Schema.Types.ObjectId, ref: 'InstitutionApplication' },
    fieldOfficer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'submitted', 'reviewed'],
      default: 'assigned',
    },
    scheduledDate: Date,
    visitDate: Date,
    geolocation: {
      latitude: Number,
      longitude: Number,
      accuracy: Number,
      capturedAt: Date,
    },
    sections: {
      infrastructure: inspectionSectionSchema,
      faculty: inspectionSectionSchema,
      labs: inspectionSectionSchema,
      library: inspectionSectionSchema,
      hostel: inspectionSectionSchema,
      hospitalAffiliation: inspectionSectionSchema,
      studentRecords: inspectionSectionSchema,
    },
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    overallScore: { type: Number, min: 0, max: 100 },
    recommendation: {
      type: String,
      enum: ['recommended', 'not_recommended', 'conditional'],
    },
    summary: String,
    submittedAt: Date,
  },
  { timestamps: true }
);

fieldInspectionSchema.index({ fieldOfficer: 1, status: 1 });
fieldInspectionSchema.index({ institution: 1 });

module.exports = mongoose.model('FieldInspection', fieldInspectionSchema);
