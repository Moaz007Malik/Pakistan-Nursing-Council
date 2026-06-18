const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'FacultyAttendance',
  collection: 'faculty_attendance',
  refs: { faculty: 'Faculty', institution: 'Institution', biometricDevice: 'BiometricDevice' },
});
