const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Affidavit',
  collection: 'affidavits',
  refs: { institution: 'Institution', submittedBy: 'User', document: 'Document' },
});
