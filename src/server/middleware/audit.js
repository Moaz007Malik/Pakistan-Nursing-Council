const { AuditLog } = require('../models');
const logger = require('../utils/logger');

const auditLog = (module, action) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      if (res.statusCode < 400 && req.user) {
        AuditLog.create({
          user: req.user._id,
          action,
          module,
          entityType: req.auditEntity?.type,
          entityId: req.auditEntity?.id,
          oldValue: req.auditEntity?.oldValue,
          newValue: req.auditEntity?.newValue || data?.data,
          ipAddress: req.userIp,
          userAgent: req.headers['user-agent'],
        }).catch((err) => logger.error('Audit log failed:', err));
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = auditLog;
