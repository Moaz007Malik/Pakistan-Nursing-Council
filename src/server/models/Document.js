const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Document',
  collection: 'documents',
  refs: { uploadedBy: 'User', institution: 'Institution' },
});
