const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'InstitutionApplication',
  collection: 'institution_applications',
  refs: {
    institution: 'Institution',
    submittedBy: 'User',
    fieldInspection: 'FieldInspection',
    affidavit: 'Affidavit',
  },
});
