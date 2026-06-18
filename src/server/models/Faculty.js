const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Faculty',
  collection: 'faculty',
  refs: {
    user: 'User',
    institution: 'Institution',
    approvedBy: 'User',
    'documents.cnic': 'Document',
    'documents.picture': 'Document',
    'documents.degrees': 'Document',
    'documents.licenses': 'Document',
    'documents.salarySlip': 'Document',
    'documents.registrationCard': 'Document',
  },
  unique: ['registrationNumber'],
});
