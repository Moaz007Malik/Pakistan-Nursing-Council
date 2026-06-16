const mongoose = require('mongoose');
const { INSTITUTION_STATUSES } = require('../config/constants');

const documentRefSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    type: String,
    label: String,
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const facultyDetailSchema = new mongoose.Schema(
  {
    name: String,
    qualification: String,
    designation: String,
    experience: Number,
    cnic: String,
  },
  { _id: true }
);

const workflowStepSchema = new mongoose.Schema(
  {
    step: String,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'rejected'] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    comments: String,
    action: String,
  },
  { _id: true, timestamps: true }
);

const institutionApplicationSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: INSTITUTION_STATUSES,
      default: 'draft',
    },
    documents: [documentRefSchema],
    ownershipDocuments: [documentRefSchema],
    affidavit: { type: mongoose.Schema.Types.ObjectId, ref: 'Affidavit' },
    accreditationDocuments: [documentRefSchema],
    infrastructureDocuments: [documentRefSchema],
    facultyDetails: [facultyDetailSchema],
    hospitalAffiliation: {
      name: String,
      beds: Number,
      mouDocument: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    },
    mouDocuments: [documentRefSchema],
    buildingDocuments: [documentRefSchema],
    workflow: [workflowStepSchema],
    fieldInspection: { type: mongoose.Schema.Types.ObjectId, ref: 'FieldInspection' },
    committeeReview: {
      committee: { type: mongoose.Schema.Types.ObjectId, ref: 'Committee' },
      decision: String,
      votedAt: Date,
      votes: [{ member: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, vote: String }],
    },
    councilReview: {
      meeting: { type: mongoose.Schema.Types.ObjectId, ref: 'CouncilMeeting' },
      decision: String,
      resolutionNumber: String,
      reviewedAt: Date,
    },
    rejectionReason: String,
    notes: String,
  },
  { timestamps: true }
);

institutionApplicationSchema.index({ status: 1 });
institutionApplicationSchema.index({ institution: 1 });

module.exports = mongoose.model('InstitutionApplication', institutionApplicationSchema);
