const mongoose = require('mongoose');

const facultySchema = new mongoose.Schema(
  {
    registrationNumber: { type: String, unique: true, sparse: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },

    personalInfo: {
      fullName: { type: String, required: true },
      cnic: { type: String, required: true, unique: true },
      contact: String,
      email: String,
      address: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female', 'other'] },
    },

    professionalInfo: {
      qualification: String,
      specialization: String,
      teachingExperience: Number,
      designation: String,
      department: String,
      joiningDate: Date,
      licenseNumber: String,
    },

    documents: {
      degrees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
      licenses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
      salarySlip: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      registrationCard: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
      picture: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    },

    status: {
      type: String,
      enum: ['draft', 'institution_approval', 'council_approval', 'approved', 'rejected', 'active', 'expired', 'suspended', 'pending_renewal'],
      default: 'draft',
    },

    workflow: [
      {
        step: String,
        status: String,
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        completedAt: Date,
        comments: String,
      },
    ],

    approvedAt: Date,
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    expiresAt: Date,
    renewalDueDate: Date,
    attendancePercentage: { type: Number, default: 100 },
    biometricId: String,
  },
  { timestamps: true }
);

facultySchema.index({ 'personalInfo.fullName': 'text', registrationNumber: 'text' });
facultySchema.index({ institution: 1, status: 1 });

module.exports = mongoose.model('Faculty', facultySchema);
