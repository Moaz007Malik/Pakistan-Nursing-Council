const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'StudentAttendance',
  collection: 'student_attendance',
  refs: { student: 'Student', institution: 'Institution', biometricDevice: 'BiometricDevice' },
});
