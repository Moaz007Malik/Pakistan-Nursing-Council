const { ROLE_PERMISSIONS } = require('../config/constants');
const ApiError = require('../utils/ApiError');

const authorize = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];

    const hasPermission = permissions.length === 0
      ? true
      : permissions.some((p) => userPermissions.includes(p));

    if (!hasPermission) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }

    next();
  };
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Role not authorized'));
    }
    next();
  };
};

module.exports = { authorize, authorizeRoles };
