const { createModel } = require('../lib/jsonStore');

module.exports = createModel({
  name: 'CouncilMeeting',
  collection: 'council_meetings',
  refs: { chairedBy: 'User' },
});
