const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'AuditLog',
  collection: 'audit_logs',
  refs: { user: 'User' },
});
