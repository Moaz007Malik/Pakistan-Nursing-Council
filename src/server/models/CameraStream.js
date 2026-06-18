const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'CameraStream',
  collection: 'camera_streams',
  refs: { institution: 'Institution' },
});
