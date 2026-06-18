const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Committee',
  collection: 'committees',
  refs: { chairperson: 'User', members: 'User' },
});
