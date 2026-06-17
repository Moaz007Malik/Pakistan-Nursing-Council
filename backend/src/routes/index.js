const lazyHandler = (modulePath, exportName) => (req, res, next) => {
  const handler = require(modulePath)[exportName];
  return handler(req, res, next);
};

const lazyRouter = (modulePath) => {
  let router;
  return (req, res, next) => {
    if (!router) router = require(modulePath);
    return router(req, res, next);
  };
};

const lazyMulter = () => {
  let upload;
  return (req, res, next) => {
    if (!upload) {
      const multer = require('multer');
      upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
    }
    return upload.single('file')(req, res, next);
  };
};

const express = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');

const router = express.Router();

router.use('/auth', lazyRouter('./auth.routes'));

// Dashboards
router.get('/dashboard/admin', authenticate, authorize(PERMISSIONS.DASHBOARD_ADMIN), lazyHandler('../controllers/dashboard.controller', 'getAdminDashboard'));
router.get('/dashboard/field-officer', authenticate, authorize(PERMISSIONS.DASHBOARD_FIELD), lazyHandler('../controllers/dashboard.controller', 'getFieldOfficerDashboard'));
router.get('/dashboard/institution', authenticate, authorize(PERMISSIONS.DASHBOARD_INSTITUTION), lazyHandler('../controllers/dashboard.controller', 'getInstitutionDashboard'));
router.get('/dashboard/council', authenticate, authorize(PERMISSIONS.DASHBOARD_COUNCIL), lazyHandler('../controllers/dashboard.controller', 'getCouncilDashboard'));
router.get('/dashboard/monitoring', authenticate, authorize(PERMISSIONS.DASHBOARD_MONITORING), lazyHandler('../controllers/dashboard.controller', 'getMonitoringDashboard'));
router.get('/dashboard/finance', authenticate, authorize(PERMISSIONS.DASHBOARD_FINANCE), lazyHandler('../controllers/dashboard.controller', 'getFinanceDashboard'));

// Notifications & Audit
router.get('/notifications', authenticate, lazyHandler('../controllers/dashboard.controller', 'getNotifications'));
router.patch('/notifications/:id/read', authenticate, lazyHandler('../controllers/dashboard.controller', 'markNotificationRead'));
router.delete('/notifications/:id', authenticate, authorize(PERMISSIONS.NOTIFICATIONS_DELETE), lazyHandler('../controllers/dashboard.controller', 'deleteNotification'));
router.get('/audit-logs', authenticate, authorize(PERMISSIONS.AUDIT_READ), lazyHandler('../controllers/dashboard.controller', 'getAuditLogs'));

// Institutions
router.post('/institutions', authenticate, authorize(PERMISSIONS.INSTITUTIONS_CREATE), lazyHandler('../controllers/institution.controller', 'createInstitution'));
router.get('/institutions', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), lazyHandler('../controllers/institution.controller', 'getInstitutions'));
router.get('/institutions/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), lazyHandler('../controllers/institution.controller', 'getInstitution'));
router.patch('/institutions/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_UPDATE), lazyHandler('../controllers/institution.controller', 'updateInstitution'));
router.delete('/institutions/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_DELETE), lazyHandler('../controllers/institution.controller', 'deleteInstitution'));
router.get('/verify/institution/:registrationNumber', lazyHandler('../controllers/institution.controller', 'verifyQR'));

router.post('/institution-applications', authenticate, authorize(PERMISSIONS.INSTITUTIONS_CREATE), lazyHandler('../controllers/institution.controller', 'createApplication'));
router.get('/institution-applications', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), lazyHandler('../controllers/institution.controller', 'getApplications'));
router.get('/institution-applications/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), lazyHandler('../controllers/institution.controller', 'getApplication'));
router.patch('/institution-applications/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_UPDATE), lazyHandler('../controllers/institution.controller', 'updateApplication'));
router.delete('/institution-applications/:id', authenticate, authorize(PERMISSIONS.APPLICATIONS_DELETE), lazyHandler('../controllers/institution.controller', 'deleteApplication'));
router.post('/institution-applications/:id/submit', authenticate, authorize(PERMISSIONS.INSTITUTIONS_UPDATE), lazyHandler('../controllers/institution.controller', 'submitApplication'));
router.post('/institution-applications/:id/workflow', authenticate, authorize(PERMISSIONS.INSTITUTIONS_APPROVE), lazyHandler('../controllers/institution.controller', 'advanceWorkflow'));

// Students
router.post('/students', authenticate, authorize(PERMISSIONS.STUDENTS_CREATE), lazyHandler('../controllers/student.controller', 'createStudent'));
router.get('/students', authenticate, authorize(PERMISSIONS.STUDENTS_READ), lazyHandler('../controllers/student.controller', 'getStudents'));
router.get('/students/:id', authenticate, authorize(PERMISSIONS.STUDENTS_READ), lazyHandler('../controllers/student.controller', 'getStudent'));
router.patch('/students/:id', authenticate, authorize(PERMISSIONS.STUDENTS_UPDATE), lazyHandler('../controllers/student.controller', 'updateStudent'));
router.delete('/students/:id', authenticate, authorize(PERMISSIONS.STUDENTS_DELETE), lazyHandler('../controllers/student.controller', 'deleteStudent'));
router.post('/students/:id/workflow', authenticate, authorize(PERMISSIONS.STUDENTS_APPROVE), lazyHandler('../controllers/student.controller', 'advanceWorkflow'));
router.get('/verify/student/:registrationNumber', lazyHandler('../controllers/student.controller', 'verifyQR'));

// Faculty
router.post('/faculty', authenticate, authorize(PERMISSIONS.FACULTY_CREATE), lazyHandler('../controllers/faculty.controller', 'createFaculty'));
router.get('/faculty', authenticate, authorize(PERMISSIONS.FACULTY_READ), lazyHandler('../controllers/faculty.controller', 'getFacultyList'));
router.get('/faculty/:id', authenticate, authorize(PERMISSIONS.FACULTY_READ), lazyHandler('../controllers/faculty.controller', 'getFaculty'));
router.patch('/faculty/:id', authenticate, authorize(PERMISSIONS.FACULTY_UPDATE), lazyHandler('../controllers/faculty.controller', 'updateFaculty'));
router.delete('/faculty/:id', authenticate, authorize(PERMISSIONS.FACULTY_DELETE), lazyHandler('../controllers/faculty.controller', 'deleteFaculty'));
router.post('/faculty/:id/workflow', authenticate, authorize(PERMISSIONS.FACULTY_APPROVE), lazyHandler('../controllers/faculty.controller', 'advanceWorkflow'));

// Attendance
router.post('/attendance/students', authenticate, authorize(PERMISSIONS.ATTENDANCE_MANAGE), lazyHandler('../controllers/attendance.controller', 'markStudentAttendance'));
router.get('/attendance/students/:studentId', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), lazyHandler('../controllers/attendance.controller', 'getStudentAttendance'));
router.get('/attendance/students/:studentId/records', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), lazyHandler('../controllers/attendance.controller', 'getStudentAttendanceRecords'));
router.post('/attendance/faculty', authenticate, authorize(PERMISSIONS.ATTENDANCE_MANAGE), lazyHandler('../controllers/attendance.controller', 'markFacultyAttendance'));
router.get('/attendance/faculty/:facultyId', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), lazyHandler('../controllers/attendance.controller', 'getFacultyAttendance'));
router.get('/attendance/institution/:institutionId?', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), lazyHandler('../controllers/attendance.controller', 'getInstitutionDashboard'));

// Payments & Renewals
router.get('/payments/config', authenticate, authorize(PERMISSIONS.PAYMENTS_READ), lazyHandler('../controllers/payment.controller', 'getPaymentConfig'));
router.post('/payments', authenticate, authorize(PERMISSIONS.PAYMENTS_CREATE), lazyHandler('../controllers/payment.controller', 'createPayment'));
router.post('/payments/:invoiceNumber/verify', lazyHandler('../controllers/payment.controller', 'verifyPayment'));
router.get('/payments', authenticate, authorize(PERMISSIONS.PAYMENTS_READ), lazyHandler('../controllers/payment.controller', 'getPayments'));
router.post('/renewals', authenticate, authorize(PERMISSIONS.STUDENTS_RENEW), lazyHandler('../controllers/payment.controller', 'createRenewal'));
router.post('/renewals/request', authenticate, authorize(PERMISSIONS.STUDENTS_RENEW, PERMISSIONS.FACULTY_RENEW), lazyHandler('../controllers/payment.controller', 'requestRenewal'));
router.get('/renewals', authenticate, authorize(PERMISSIONS.PAYMENTS_READ), lazyHandler('../controllers/payment.controller', 'getRenewals'));
router.get('/membership/status', authenticate, lazyHandler('../controllers/payment.controller', 'getMembershipStatus'));
router.delete('/renewals/:id', authenticate, authorize(PERMISSIONS.RENEWALS_DELETE), lazyHandler('../controllers/payment.controller', 'deleteRenewal'));
router.post('/renewals/:id/approve', authenticate, authorize(PERMISSIONS.PAYMENTS_VERIFY), lazyHandler('../controllers/payment.controller', 'approveRenewal'));

// Affidavits
router.post('/affidavits', authenticate, authorize(PERMISSIONS.AFFIDAVITS_CREATE), lazyHandler('../controllers/module.controller', 'createAffidavit'));
router.get('/affidavits', authenticate, authorize(PERMISSIONS.AFFIDAVITS_READ), lazyHandler('../controllers/module.controller', 'getAffidavits'));
router.patch('/affidavits/:id', authenticate, authorize(PERMISSIONS.AFFIDAVITS_UPDATE), lazyHandler('../controllers/module.controller', 'updateAffidavit'));
router.patch('/affidavits/:id/status', authenticate, authorize(PERMISSIONS.AFFIDAVITS_APPROVE), lazyHandler('../controllers/module.controller', 'updateAffidavitStatus'));
router.delete('/affidavits/:id', authenticate, authorize(PERMISSIONS.AFFIDAVITS_DELETE), lazyHandler('../controllers/module.controller', 'deleteAffidavit'));

// Field Inspections
router.post('/inspections', authenticate, authorize(PERMISSIONS.INSPECTIONS_CREATE), lazyHandler('../controllers/module.controller', 'createInspection'));
router.get('/inspections', authenticate, authorize(PERMISSIONS.INSPECTIONS_READ), lazyHandler('../controllers/module.controller', 'getInspections'));
router.get('/inspections/:id', authenticate, authorize(PERMISSIONS.INSPECTIONS_READ), lazyHandler('../controllers/module.controller', 'getInspection'));
router.patch('/inspections/:id', authenticate, authorize(PERMISSIONS.INSPECTIONS_UPDATE, PERMISSIONS.INSPECTIONS_SUBMIT), lazyHandler('../controllers/module.controller', 'updateInspection'));
router.delete('/inspections/:id', authenticate, authorize(PERMISSIONS.INSPECTIONS_DELETE), lazyHandler('../controllers/module.controller', 'deleteInspection'));

// Committees
router.get('/committees', authenticate, authorize(PERMISSIONS.COMMITTEES_READ), lazyHandler('../controllers/module.controller', 'getCommittees'));
router.post('/committees', authenticate, authorize(PERMISSIONS.COMMITTEES_MANAGE), lazyHandler('../controllers/module.controller', 'createCommittee'));
router.patch('/committees/:id', authenticate, authorize(PERMISSIONS.COMMITTEES_MANAGE), lazyHandler('../controllers/module.controller', 'updateCommittee'));
router.delete('/committees/:id', authenticate, authorize(PERMISSIONS.COMMITTEES_DELETE), lazyHandler('../controllers/module.controller', 'deleteCommittee'));
router.post('/committees/:id/meetings', authenticate, authorize(PERMISSIONS.COMMITTEES_MANAGE), lazyHandler('../controllers/module.controller', 'scheduleMeeting'));
router.post('/committees/vote', authenticate, authorize(PERMISSIONS.COMMITTEES_VOTE), lazyHandler('../controllers/module.controller', 'committeeVote'));

// Council
router.get('/council/meetings', authenticate, authorize(PERMISSIONS.COUNCIL_READ), lazyHandler('../controllers/module.controller', 'getCouncilMeetings'));
router.post('/council/meetings', authenticate, authorize(PERMISSIONS.COUNCIL_RESOLUTION), lazyHandler('../controllers/module.controller', 'createCouncilMeeting'));
router.patch('/council/meetings/:id', authenticate, authorize(PERMISSIONS.COUNCIL_RESOLUTION), lazyHandler('../controllers/module.controller', 'updateCouncilMeeting'));
router.delete('/council/meetings/:id', authenticate, authorize(PERMISSIONS.COUNCIL_DELETE), lazyHandler('../controllers/module.controller', 'deleteCouncilMeeting'));
router.post('/council/meetings/:id/resolutions', authenticate, authorize(PERMISSIONS.COUNCIL_RESOLUTION), lazyHandler('../controllers/module.controller', 'addResolution'));

// Biometric
router.get('/biometric/devices', authenticate, authorize(PERMISSIONS.BIOMETRIC_READ), lazyHandler('../controllers/module.controller', 'getDevices'));
router.post('/biometric/devices', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), lazyHandler('../controllers/module.controller', 'registerDevice'));
router.patch('/biometric/devices/:id', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), lazyHandler('../controllers/module.controller', 'updateDevice'));
router.delete('/biometric/devices/:id', authenticate, authorize(PERMISSIONS.BIOMETRIC_DELETE), lazyHandler('../controllers/module.controller', 'deleteDevice'));
router.post('/biometric/devices/:deviceId/sync', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), lazyHandler('../controllers/module.controller', 'syncDevice'));
router.post('/biometric/devices/:deviceId/map', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), lazyHandler('../controllers/module.controller', 'mapBiometricUser'));
router.post('/biometric/devices/:deviceId/events', lazyHandler('../controllers/module.controller', 'receiveBiometricEvent'));

// Camera Monitoring
router.get('/monitoring/streams', authenticate, authorize(PERMISSIONS.MONITORING_READ), lazyHandler('../controllers/module.controller', 'getCameraStreams'));
router.post('/monitoring/streams', authenticate, authorize(PERMISSIONS.MONITORING_STREAM), lazyHandler('../controllers/module.controller', 'createCameraStream'));
router.patch('/monitoring/streams/:id', authenticate, authorize(PERMISSIONS.MONITORING_STREAM), lazyHandler('../controllers/module.controller', 'updateCameraStream'));
router.delete('/monitoring/streams/:id', authenticate, authorize(PERMISSIONS.MONITORING_DELETE), lazyHandler('../controllers/module.controller', 'deleteCameraStream'));
router.post('/monitoring/streams/:id/snapshot', authenticate, authorize(PERMISSIONS.MONITORING_CAPTURE), lazyHandler('../controllers/module.controller', 'captureSnapshot'));

// Documents
router.post('/documents/upload', authenticate, authorize(PERMISSIONS.DOCUMENTS_UPLOAD), lazyMulter(), lazyHandler('../controllers/module.controller', 'uploadDocument'));
router.get('/documents/:id/url', authenticate, authorize(PERMISSIONS.DOCUMENTS_READ), lazyHandler('../controllers/module.controller', 'getDocumentUrl'));
router.get('/documents/:id/download', authenticate, authorize(PERMISSIONS.DOCUMENTS_READ), lazyHandler('../controllers/module.controller', 'downloadDocument'));

module.exports = router;
