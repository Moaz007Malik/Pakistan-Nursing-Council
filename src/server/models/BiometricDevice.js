const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'BiometricDevice',
  collection: 'biometric_devices',
  refs: { institution: 'Institution' },
  unique: ['deviceId'],
});
