const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { applyCorsHeaders, sendJson } = require('./cors');

module.exports = async (req, res) => {
  applyCorsHeaders(req, res);
  sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
};
