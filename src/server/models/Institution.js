const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Institution',
  collection: 'institutions',
  refs: { admin: 'User', approvedBy: 'User' },
  unique: ['registrationNumber'],
});
