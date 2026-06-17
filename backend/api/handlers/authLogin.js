const connectDB = require('../../src/config/database');
const authService = require('../../src/services/auth.service');
const ApiError = require('../../src/utils/ApiError');
const { parseJsonBody } = require('./parseBody');

module.exports = async (req, res, sendJson) => {
  await connectDB();

  const body = await parseJsonBody(req);
  const email = body.email?.trim?.() || body.email;
  const password = body.password;

  if (!email || !password) {
    sendJson(res, 400, { success: false, message: 'Email and password required' });
    return;
  }

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];

  try {
    const result = await authService.login(email, password, ip);
    sendJson(res, 200, { success: true, data: result });
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500;
    sendJson(res, status, { success: false, message: error.message || 'Login failed' });
  }
};
