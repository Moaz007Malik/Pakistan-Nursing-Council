const mongoose = require('mongoose');
const { ATTENDANCE_SOURCES } = require('../config/constants');

const facultyAttendanceSchema = new mongoose.Schema(
  {
    faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
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
    overtimeMinutes: { type: Number, default: 0 },
    biometricDevice: { type: mongoose.Schema.Types.ObjectId, ref: 'BiometricDevice' },
    deviceUserId: String,
    adjustedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    adjustmentReason: String,
  },
  { timestamps: true }
);

facultyAttendanceSchema.index({ faculty: 1, date: 1 }, { unique: true });
facultyAttendanceSchema.index({ institution: 1, date: -1 });

module.exports = mongoose.model('FacultyAttendance', facultyAttendanceSchema);
