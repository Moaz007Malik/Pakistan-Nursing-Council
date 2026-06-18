const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'BiometricEvent',
  collection: 'biometric_events',
  refs: { device: 'BiometricDevice' },
});
