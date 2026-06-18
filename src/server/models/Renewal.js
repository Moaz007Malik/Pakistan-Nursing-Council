const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'Renewal',
  collection: 'renewals',
  refs: {
    institution: 'Institution',
    requestedBy: 'User',
    payment: 'Payment',
    verifiedBy: 'User',
    approvedBy: 'User',
  },
});
