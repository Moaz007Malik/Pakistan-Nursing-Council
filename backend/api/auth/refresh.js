const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const { applyCorsHeaders, handleOptions, sendJson } = require('../cors');
const { parseJsonBody } = require('../handlers/parseBody');
const connectDB = require('../../src/config/database');
const authService = require('../../src/services/auth.service');
const ApiError = require('../../src/utils/ApiError');

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
    await connectDB();
    const body = await parseJsonBody(req);
    const { refreshToken } = body;

    if (!refreshToken) {
      sendJson(res, 400, { success: false, message: 'Refresh token required' });
      return;
    }

    const tokens = await authService.refreshToken(refreshToken);
    sendJson(res, 200, { success: true, data: tokens });
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 503;
    sendJson(res, status, { success: false, message: error.message || 'Token refresh failed' });
  }
};
