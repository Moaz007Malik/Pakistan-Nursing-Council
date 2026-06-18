const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Notification',
  collection: 'notifications',
  refs: { recipient: 'User' },
});
