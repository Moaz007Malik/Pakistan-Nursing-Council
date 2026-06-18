const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'FieldInspection',
  collection: 'field_inspections',
  refs: {
    institution: 'Institution',
    application: 'InstitutionApplication',
    fieldOfficer: 'User',
  },
});
