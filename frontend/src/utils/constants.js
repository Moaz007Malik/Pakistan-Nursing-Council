export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  COUNCIL_MEMBER: 'council_member',
  COMMITTEE_MEMBER: 'committee_member',
  FIELD_OFFICER: 'field_officer',
  INSTITUTION_ADMIN: 'institution_admin',
  PRINCIPAL: 'principal',
  FACULTY: 'faculty',
  STUDENT: 'student',
  FINANCE_OFFICER: 'finance_officer',
  MONITORING_OFFICER: 'monitoring_officer',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.COUNCIL_MEMBER]: 'Council Member',
  [ROLES.COMMITTEE_MEMBER]: 'Committee Member',
  [ROLES.FIELD_OFFICER]: 'Field Officer',
  [ROLES.INSTITUTION_ADMIN]: 'Institution Admin',
  [ROLES.PRINCIPAL]: 'Principal',
  [ROLES.FACULTY]: 'Faculty',
  [ROLES.STUDENT]: 'Student',
  [ROLES.FINANCE_OFFICER]: 'Finance Officer',
  [ROLES.MONITORING_OFFICER]: 'Monitoring Officer',
};

export const INSTITUTION_TYPES = {
  school_of_nursing: 'School of Nursing',
  college_of_nursing: 'College of Nursing',
  midwifery_school: 'Midwifery School',
  public_health_school: 'Public Health School',
};

export const STATUS_COLORS = {
  draft: 'default',
  submitted: 'info',
  under_review: 'warning',
  approved: 'success',
  active: 'success',
  rejected: 'error',
  suspended: 'error',
  expired: 'error',
  pending: 'warning',
  pending_renewal: 'warning',
  blocked: 'error',
};

export const getDashboardRoute = (role) => {
  const routes = {
    [ROLES.SUPER_ADMIN]: '/dashboard/admin',
    [ROLES.COUNCIL_MEMBER]: '/dashboard/council',
    [ROLES.COMMITTEE_MEMBER]: '/dashboard/committee',
    [ROLES.FIELD_OFFICER]: '/dashboard/field-officer',
    [ROLES.INSTITUTION_ADMIN]: '/dashboard/institution',
    [ROLES.PRINCIPAL]: '/dashboard/institution',
    [ROLES.FACULTY]: '/dashboard/institution',
    [ROLES.STUDENT]: '/dashboard/student',
    [ROLES.FINANCE_OFFICER]: '/dashboard/finance',
    [ROLES.MONITORING_OFFICER]: '/dashboard/monitoring',
  };
  return routes[role] || '/dashboard';
};
