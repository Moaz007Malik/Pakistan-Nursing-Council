const { Student, Faculty, Institution, Renewal } = require('../models');
const ApiError = require('../utils/ApiError');

const RENEWAL_AMOUNTS = {
  student_renewal: 5000,
  faculty_renewal: 8000,
  institution_renewal: 25000,
};

const getEntityModel = (entityType) => {
  const map = { student: Student, faculty: Faculty, institution: Institution };
  return map[entityType];
};

const checkMembership = async (user) => {
  if (!user || ['super_admin', 'council_member', 'committee_member', 'field_officer', 'finance_officer', 'monitoring_officer'].includes(user.role)) {
    return { active: true };
  }

  let entity = null;
  if (user.role === 'student') {
    entity = await Student.findOne({ user: user._id });
  } else if (user.role === 'faculty') {
    entity = await Faculty.findOne({ user: user._id });
  }

  if (!entity) return { active: true };

  const now = new Date();
  const expired = entity.expiresAt && entity.expiresAt < now;
  const blocked = entity.status === 'blocked' || entity.status === 'expired';

  if (blocked || expired) {
    if (!['blocked', 'expired'].includes(entity.status)) {
      entity.status = 'expired';
      await entity.save();
    }
    return { active: false, reason: 'membership_expired', entity, entityType: user.role };
  }

  const daysToExpiry = entity.expiresAt
    ? Math.ceil((entity.expiresAt - now) / (24 * 60 * 60 * 1000))
    : null;

  if (daysToExpiry !== null && daysToExpiry <= 30 && entity.status === 'active') {
    entity.status = 'pending_renewal';
    await entity.save();
  }

  return { active: true, entity, daysToExpiry, pendingRenewal: entity.status === 'pending_renewal' };
};

const requestRenewal = async ({ user, entityType, entityId, institutionId }) => {
  const Model = getEntityModel(entityType);
  const entity = await Model.findById(entityId);
  if (!entity) throw new ApiError(404, 'Record not found');

  const existing = await Renewal.findOne({
    entityType,
    entityId,
    status: { $in: ['payment_pending', 'payment_completed', 'under_verification'] },
  });
  if (existing) return existing;

  return Renewal.create({
    entityType,
    entityId,
    institution: institutionId || entity.institution,
    requestedBy: user._id,
    renewalYear: new Date().getFullYear(),
    status: 'payment_pending',
    previousExpiryDate: entity.expiresAt,
  });
};

const linkPaymentToRenewal = async (payment) => {
  let renewal = null;
  if (payment.relatedEntity?.renewalId) {
    renewal = await Renewal.findById(payment.relatedEntity.renewalId);
  } else if (payment.relatedEntity?.entityType && payment.relatedEntity?.entityId) {
    renewal = await Renewal.findOne({
      entityType: payment.relatedEntity.entityType,
      entityId: payment.relatedEntity.entityId,
      status: 'payment_pending',
    }).sort({ createdAt: -1 });
  }

  if (renewal) {
    renewal.payment = payment._id;
    renewal.status = 'payment_completed';
    await renewal.save();
  }
  return renewal;
};

const getRenewalAmount = (entityType) => {
  if (entityType === 'student') return RENEWAL_AMOUNTS.student_renewal;
  if (entityType === 'faculty') return RENEWAL_AMOUNTS.faculty_renewal;
  return RENEWAL_AMOUNTS.institution_renewal;
};

module.exports = {
  checkMembership,
  requestRenewal,
  linkPaymentToRenewal,
  getRenewalAmount,
  RENEWAL_AMOUNTS,
};
