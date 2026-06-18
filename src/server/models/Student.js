const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Student',
  collection: 'students',
  refs: {
    user: 'User',
    institution: 'Institution',
    approvedBy: 'User',
    'documents.cnic': 'Document',
    'documents.picture': 'Document',
    'documents.certificates': 'Document',
    'academicInfo.matric.certificate': 'Document',
    'academicInfo.fsc.certificate': 'Document',
  },
  unique: ['registrationNumber'],
});
