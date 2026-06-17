const { StudentAttendance, Student, FacultyAttendance, Faculty } = require('../models');
const notificationService = require('./notification.service');

const ATTENDANCE_WARNING_THRESHOLD = 75;
const EXAM_BLOCK_THRESHOLD = 60;

class AttendanceService {
  async getStudentAttendanceSummary(studentId, { from, to, semester }) {
    const filter = { student: studentId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }
    if (semester) filter.semester = semester;

    const records = await StudentAttendance.find(filter).sort({ date: -1 });
    return this.calculateSummary(records);
  }

  async getFacultyAttendanceSummary(facultyId, { from, to }) {
    const filter = { faculty: facultyId };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const records = await FacultyAttendance.find(filter).sort({ date: -1 });
    return this.calculateSummary(records);
  }

  calculateSummary(records) {
    const total = records.length;
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const leave = records.filter((r) => r.status === 'leave').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 100;

    return { total, present, absent, late, leave, percentage, records };
  }

  async updateStudentAttendanceRules(studentId) {
    const summary = await this.getStudentAttendanceSummary(studentId, {});
    const student = await Student.findById(studentId).populate('user');

    student.attendancePercentage = summary.percentage;
    student.examEligible = summary.percentage >= EXAM_BLOCK_THRESHOLD;

    if (summary.percentage < ATTENDANCE_WARNING_THRESHOLD && student.user) {
      await notificationService.notifyAttendanceWarning(
        student.user._id,
        summary.percentage
      );
    }

    await student.save();
    return student;
  }

  async markStudentAttendance(data, adjustedBy) {
    const date = new Date(data.date);
    date.setHours(0, 0, 0, 0);

    const record = await StudentAttendance.findOneAndUpdate(
      { student: data.student, date },
      {
        institution: data.institution,
        status: data.status,
        source: adjustedBy ? 'manual' : data.source || 'manual',
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        lateMinutes: data.lateMinutes || 0,
        adjustedBy,
        adjustmentReason: data.adjustmentReason,
        semester: data.semester,
        session: data.session,
      },
      { upsert: true, new: true }
    );

    await this.updateStudentAttendanceRules(data.student);
    return record;
  }

  async getInstitutionAttendanceDashboard(institutionId, date) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [studentRecords, facultyRecords] = await Promise.all([
      StudentAttendance.find({ institution: institutionId, date: targetDate }),
      FacultyAttendance.find({ institution: institutionId, date: targetDate }),
    ]);

    const summarize = (records) => ({
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      leave: records.filter((r) => r.status === 'leave').length,
      total: records.length,
    });

    return {
      students: summarize(studentRecords),
      faculty: summarize(facultyRecords),
      date: targetDate,
    };
  }
}

module.exports = new AttendanceService();
