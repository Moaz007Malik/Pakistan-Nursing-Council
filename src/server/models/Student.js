const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema(
  {
    board: String,
    year: Number,
    marks: Number,
    totalMarks: Number,
    percentage: Number,
    biologyMarks: Number,
    certificate: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  },
  { _id: false }
);

const workflowStepSchema = new mongoose.Schema(
  {
    step: String,
    status: { type: String, enum: ['pending', 'in_progress', 'completed', 'rejected'] },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    completedAt: Date,
    comments: String,
  },
  { _id: true }
);

const studentSchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },

    personalInfo: {
      fullName: { type: String, required: true },
      fatherHusbandName: String,
      cnic: { type: String, required: true, unique: true },
      dateOfBirth: Date,
      contact: String,
      email: String,
      address: String,
      nationality: { type: String, default: 'Pakistani' },
      gender: { type: String, enum: ['male', 'female', 'other'] },
    },

    academicInfo: {
      matric: academicRecordSchema,
      fsc: academicRecordSchema,
    },

    programInfo: {
      course: String,
      degree: String,
      session: String,
      semester: Number,
      batch: String,
    },

    documents: {
      cnic: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      picture: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      certificates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
    },

    status: {
      type: String,
      enum: ['draft', 'institution_verification', 'committee_verification', 'approved', 'rejected', 'active', 'pending_renewal', 'expired', 'blocked'],
      default: 'draft',
    },

    workflow: [workflowStepSchema],
    qrCode: String,
    idCardUrl: String,
    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: Date,
    renewalDueDate: Date,
    attendancePercentage: { type: Number, default: 100 },
    examEligible: { type: Boolean, default: true },
    biometricId: String,
  },
  { timestamps: true }
);

studentSchema.index({ 'personalInfo.fullName': 'text', registrationNumber: 'text', 'personalInfo.cnic': 1 });
studentSchema.index({ institution: 1, status: 1 });

module.exports = mongoose.model('Student', studentSchema);
