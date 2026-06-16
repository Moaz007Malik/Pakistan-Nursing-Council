const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

exports.register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json({ success: true, data: result });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const ip = req.ip || req.headers['x-forwarded-for'];
  const result = await authService.login(email, password, ip);
  res.json({ success: true, data: result });
});

exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new ApiError(400, 'Refresh token required');
  const tokens = await authService.refreshToken(refreshToken);
  res.json({ success: true, data: tokens });
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user._id, req.body.refreshToken);
  res.json({ success: true, message: 'Logged out successfully' });
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await require('../models').User.findById(req.user._id)
    .populate('institution', 'name registrationNumber')
    .populate('committee', 'name type');
  res.json({ success: true, data: user });
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phone } = req.body;
  const user = await require('../models').User.findByIdAndUpdate(
    req.user._id,
    { firstName, lastName, phone },
    { new: true }
  );
  res.json({ success: true, data: user });
});
