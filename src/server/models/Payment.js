const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Payment',
  collection: 'payments',
  refs: { payer: 'User', institution: 'Institution' },
  unique: ['invoiceNumber'],
});
