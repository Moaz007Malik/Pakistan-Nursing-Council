const mongoose = require('mongoose');
const { ATTENDANCE_SOURCES } = require('../config/constants');

const studentAttendanceSchema = new mongoose.Schema(
  {
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    institution: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'leave', 'half_day'],
      required: true,
    },
    source: {
      type: String,
      enum: ATTENDANCE_SOURCES,
      default: 'manual',
    },
    checkIn: Date,
    checkOut: Date,
    lateMinutes: { type: Number, default: 0 },
    biometricDevice: { type: mongoose.Schema.Types.ObjectId, ref: 'BiometricDevice' },
    deviceUserId: String,
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adjustmentReason: String,
    semester: String,
    session: String,
  },
  { timestamps: true }
);

studentAttendanceSchema.index({ student: 1, date: 1 }, { unique: true });
studentAttendanceSchema.index({ institution: 1, date: -1 });
studentAttendanceSchema.index({ date: -1 });

module.exports = mongoose.model('StudentAttendance', studentAttendanceSchema);
