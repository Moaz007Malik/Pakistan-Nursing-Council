const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { applyCorsHeaders, handleOptions, sendJson } = require('../cors');
const handleAuthLogin = require('../handlers/authLogin');

module.exports = async (req, res) => {
  applyCorsHeaders(req, res);

  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  if (req.method !== 'POST') {
    sendJson(res, 405, { success: false, message: 'Method not allowed' });
    return;
  }

  try {
    await handleAuthLogin(req, res, sendJson);
  } catch (error) {
    console.error('Login handler error:', error.message);
    sendJson(res, 503, { success: false, message: error.message || 'Login unavailable' });
  }
};
