const { generateRegistrationNumber, generateQRCode } = require('../utils/generators');

const assignStudentRegistration = async (student) => {
  if (student.registrationNumber) return student;

  const count = await student.constructor.countDocuments({
    registrationNumber: { $exists: true, $ne: null },
  });

  student.registrationNumber = generateRegistrationNumber('STD', count + 1);
  student.qrCode = await generateQRCode({
    type: 'student',
    registrationNumber: student.registrationNumber,
    name: student.personalInfo?.fullName,
    cnic: student.personalInfo?.cnic,
  });

  return student;
};

const assignFacultyRegistration = async (faculty) => {
  if (faculty.registrationNumber) return faculty;

  const count = await faculty.constructor.countDocuments({
    registrationNumber: { $exists: true, $ne: null },
  });

  faculty.registrationNumber = generateRegistrationNumber('FAC', count + 1);
  return faculty;
};

const activateStudentMembership = (student, approvedBy) => {
  student.status = 'active';
  student.approvedAt = student.approvedAt || new Date();
  if (approvedBy) student.approvedBy = approvedBy;
  if (!student.expiresAt) {
    student.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    student.renewalDueDate = student.expiresAt;
  }
  return student;
};

const activateFacultyMembership = (faculty, approvedBy) => {
  faculty.status = 'active';
  faculty.approvedAt = faculty.approvedAt || new Date();
  if (approvedBy) faculty.approvedBy = approvedBy;
  if (!faculty.expiresAt) {
    faculty.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    faculty.renewalDueDate = faculty.expiresAt;
  }
  return faculty;
};

module.exports = {
  assignStudentRegistration,
  assignFacultyRegistration,
  activateStudentMembership,
  activateFacultyMembership,
};
