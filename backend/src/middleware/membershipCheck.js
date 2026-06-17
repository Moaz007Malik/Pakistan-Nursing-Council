const membershipService = require('../services/membership.service');
const ApiError = require('../utils/ApiError');

const MEMBERSHIP_EXEMPT = [
  '/auth',
  '/dashboard',
  '/payments/config',
  '/renewals',
  '/notifications',
];

const membershipCheck = async (req, res, next) => {
  if (!req.user) return next();

  const path = req.originalUrl.replace('/api/v1', '');
  if (MEMBERSHIP_EXEMPT.some((p) => path.startsWith(p))) return next();
  if (req.method === 'GET') return next();

  const result = await membershipService.checkMembership(req.user);
  if (!result.active && ['student', 'faculty'].includes(req.user.role)) {
    return next(new ApiError(403, 'Membership expired. Please renew to continue.'));
  }
  req.membership = result;
  next();
};

module.exports = { membershipCheck };
