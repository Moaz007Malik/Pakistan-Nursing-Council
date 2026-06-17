const express = require('express');
const authRoutes = require('./auth.routes');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/constants');
const institutionController = require('../controllers/institution.controller');
const studentController = require('../controllers/student.controller');
const facultyController = require('../controllers/faculty.controller');
const attendanceController = require('../controllers/attendance.controller');
const paymentController = require('../controllers/payment.controller');
const moduleController = require('../controllers/module.controller');
const dashboardController = require('../controllers/dashboard.controller');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });
const router = express.Router();

router.use('/auth', authRoutes);

// Dashboards
router.get('/dashboard/admin', authenticate, authorize(PERMISSIONS.DASHBOARD_ADMIN), dashboardController.getAdminDashboard);
router.get('/dashboard/field-officer', authenticate, authorize(PERMISSIONS.DASHBOARD_FIELD), dashboardController.getFieldOfficerDashboard);
router.get('/dashboard/institution', authenticate, authorize(PERMISSIONS.DASHBOARD_INSTITUTION), dashboardController.getInstitutionDashboard);
router.get('/dashboard/council', authenticate, authorize(PERMISSIONS.DASHBOARD_COUNCIL), dashboardController.getCouncilDashboard);
router.get('/dashboard/monitoring', authenticate, authorize(PERMISSIONS.DASHBOARD_MONITORING), dashboardController.getMonitoringDashboard);
router.get('/dashboard/finance', authenticate, authorize(PERMISSIONS.DASHBOARD_FINANCE), dashboardController.getFinanceDashboard);

// Notifications & Audit
router.get('/notifications', authenticate, dashboardController.getNotifications);
router.patch('/notifications/:id/read', authenticate, dashboardController.markNotificationRead);
router.delete('/notifications/:id', authenticate, authorize(PERMISSIONS.NOTIFICATIONS_DELETE), dashboardController.deleteNotification);
router.get('/audit-logs', authenticate, authorize(PERMISSIONS.AUDIT_READ), dashboardController.getAuditLogs);

// Institutions
router.post('/institutions', authenticate, authorize(PERMISSIONS.INSTITUTIONS_CREATE), institutionController.createInstitution);
router.get('/institutions', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), institutionController.getInstitutions);
router.get('/institutions/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), institutionController.getInstitution);
router.patch('/institutions/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_UPDATE), institutionController.updateInstitution);
router.delete('/institutions/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_DELETE), institutionController.deleteInstitution);
router.get('/verify/institution/:registrationNumber', institutionController.verifyQR);

router.post('/institution-applications', authenticate, authorize(PERMISSIONS.INSTITUTIONS_CREATE), institutionController.createApplication);
router.get('/institution-applications', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), institutionController.getApplications);
router.get('/institution-applications/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_READ), institutionController.getApplication);
router.patch('/institution-applications/:id', authenticate, authorize(PERMISSIONS.INSTITUTIONS_UPDATE), institutionController.updateApplication);
router.delete('/institution-applications/:id', authenticate, authorize(PERMISSIONS.APPLICATIONS_DELETE), institutionController.deleteApplication);
router.post('/institution-applications/:id/submit', authenticate, authorize(PERMISSIONS.INSTITUTIONS_UPDATE), institutionController.submitApplication);
router.post('/institution-applications/:id/workflow', authenticate, authorize(PERMISSIONS.INSTITUTIONS_APPROVE), institutionController.advanceWorkflow);

// Students
router.post('/students', authenticate, authorize(PERMISSIONS.STUDENTS_CREATE), studentController.createStudent);
router.get('/students', authenticate, authorize(PERMISSIONS.STUDENTS_READ), studentController.getStudents);
router.get('/students/:id', authenticate, authorize(PERMISSIONS.STUDENTS_READ), studentController.getStudent);
router.patch('/students/:id', authenticate, authorize(PERMISSIONS.STUDENTS_UPDATE), studentController.updateStudent);
router.delete('/students/:id', authenticate, authorize(PERMISSIONS.STUDENTS_DELETE), studentController.deleteStudent);
router.post('/students/:id/workflow', authenticate, authorize(PERMISSIONS.STUDENTS_APPROVE), studentController.advanceWorkflow);
router.get('/verify/student/:registrationNumber', studentController.verifyQR);

// Faculty
router.post('/faculty', authenticate, authorize(PERMISSIONS.FACULTY_CREATE), facultyController.createFaculty);
router.get('/faculty', authenticate, authorize(PERMISSIONS.FACULTY_READ), facultyController.getFacultyList);
router.get('/faculty/:id', authenticate, authorize(PERMISSIONS.FACULTY_READ), facultyController.getFaculty);
router.patch('/faculty/:id', authenticate, authorize(PERMISSIONS.FACULTY_UPDATE), facultyController.updateFaculty);
router.delete('/faculty/:id', authenticate, authorize(PERMISSIONS.FACULTY_DELETE), facultyController.deleteFaculty);
router.post('/faculty/:id/workflow', authenticate, authorize(PERMISSIONS.FACULTY_APPROVE), facultyController.advanceWorkflow);

// Attendance
router.post('/attendance/students', authenticate, authorize(PERMISSIONS.ATTENDANCE_MANAGE), attendanceController.markStudentAttendance);
router.get('/attendance/students/:studentId', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), attendanceController.getStudentAttendance);
router.get('/attendance/students/:studentId/records', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), attendanceController.getStudentAttendanceRecords);
router.post('/attendance/faculty', authenticate, authorize(PERMISSIONS.ATTENDANCE_MANAGE), attendanceController.markFacultyAttendance);
router.get('/attendance/faculty/:facultyId', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), attendanceController.getFacultyAttendance);
router.get('/attendance/institution/:institutionId?', authenticate, authorize(PERMISSIONS.ATTENDANCE_READ), attendanceController.getInstitutionDashboard);

// Payments & Renewals
router.get('/payments/config', authenticate, authorize(PERMISSIONS.PAYMENTS_READ), paymentController.getPaymentConfig);
router.post('/payments', authenticate, authorize(PERMISSIONS.PAYMENTS_CREATE), paymentController.createPayment);
router.post('/payments/:invoiceNumber/verify', paymentController.verifyPayment);
router.get('/payments', authenticate, authorize(PERMISSIONS.PAYMENTS_READ), paymentController.getPayments);
router.post('/renewals', authenticate, authorize(PERMISSIONS.STUDENTS_RENEW), paymentController.createRenewal);
router.get('/renewals', authenticate, authorize(PERMISSIONS.PAYMENTS_READ), paymentController.getRenewals);
router.delete('/renewals/:id', authenticate, authorize(PERMISSIONS.RENEWALS_DELETE), paymentController.deleteRenewal);
router.post('/renewals/:id/approve', authenticate, authorize(PERMISSIONS.PAYMENTS_VERIFY), paymentController.approveRenewal);

// Affidavits
router.post('/affidavits', authenticate, authorize(PERMISSIONS.AFFIDAVITS_CREATE), moduleController.createAffidavit);
router.get('/affidavits', authenticate, authorize(PERMISSIONS.AFFIDAVITS_READ), moduleController.getAffidavits);
router.patch('/affidavits/:id', authenticate, authorize(PERMISSIONS.AFFIDAVITS_UPDATE), moduleController.updateAffidavit);
router.patch('/affidavits/:id/status', authenticate, authorize(PERMISSIONS.AFFIDAVITS_APPROVE), moduleController.updateAffidavitStatus);
router.delete('/affidavits/:id', authenticate, authorize(PERMISSIONS.AFFIDAVITS_DELETE), moduleController.deleteAffidavit);

// Field Inspections
router.post('/inspections', authenticate, authorize(PERMISSIONS.INSPECTIONS_CREATE), moduleController.createInspection);
router.get('/inspections', authenticate, authorize(PERMISSIONS.INSPECTIONS_READ), moduleController.getInspections);
router.patch('/inspections/:id', authenticate, authorize(PERMISSIONS.INSPECTIONS_UPDATE, PERMISSIONS.INSPECTIONS_SUBMIT), moduleController.updateInspection);
router.delete('/inspections/:id', authenticate, authorize(PERMISSIONS.INSPECTIONS_DELETE), moduleController.deleteInspection);

// Committees
router.get('/committees', authenticate, authorize(PERMISSIONS.COMMITTEES_READ), moduleController.getCommittees);
router.post('/committees', authenticate, authorize(PERMISSIONS.COMMITTEES_MANAGE), moduleController.createCommittee);
router.patch('/committees/:id', authenticate, authorize(PERMISSIONS.COMMITTEES_MANAGE), moduleController.updateCommittee);
router.delete('/committees/:id', authenticate, authorize(PERMISSIONS.COMMITTEES_DELETE), moduleController.deleteCommittee);
router.post('/committees/:id/meetings', authenticate, authorize(PERMISSIONS.COMMITTEES_MANAGE), moduleController.scheduleMeeting);
router.post('/committees/vote', authenticate, authorize(PERMISSIONS.COMMITTEES_VOTE), moduleController.committeeVote);

// Council
router.get('/council/meetings', authenticate, authorize(PERMISSIONS.COUNCIL_READ), moduleController.getCouncilMeetings);
router.post('/council/meetings', authenticate, authorize(PERMISSIONS.COUNCIL_RESOLUTION), moduleController.createCouncilMeeting);
router.patch('/council/meetings/:id', authenticate, authorize(PERMISSIONS.COUNCIL_RESOLUTION), moduleController.updateCouncilMeeting);
router.delete('/council/meetings/:id', authenticate, authorize(PERMISSIONS.COUNCIL_DELETE), moduleController.deleteCouncilMeeting);
router.post('/council/meetings/:id/resolutions', authenticate, authorize(PERMISSIONS.COUNCIL_RESOLUTION), moduleController.addResolution);

// Biometric
router.get('/biometric/devices', authenticate, authorize(PERMISSIONS.BIOMETRIC_READ), moduleController.getDevices);
router.post('/biometric/devices', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), moduleController.registerDevice);
router.patch('/biometric/devices/:id', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), moduleController.updateDevice);
router.delete('/biometric/devices/:id', authenticate, authorize(PERMISSIONS.BIOMETRIC_DELETE), moduleController.deleteDevice);
router.post('/biometric/devices/:deviceId/sync', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), moduleController.syncDevice);
router.post('/biometric/devices/:deviceId/map', authenticate, authorize(PERMISSIONS.BIOMETRIC_MANAGE), moduleController.mapBiometricUser);
router.post('/biometric/devices/:deviceId/events', moduleController.receiveBiometricEvent);

// Camera Monitoring
router.get('/monitoring/streams', authenticate, authorize(PERMISSIONS.MONITORING_READ), moduleController.getCameraStreams);
router.post('/monitoring/streams', authenticate, authorize(PERMISSIONS.MONITORING_STREAM), moduleController.createCameraStream);
router.patch('/monitoring/streams/:id', authenticate, authorize(PERMISSIONS.MONITORING_STREAM), moduleController.updateCameraStream);
router.delete('/monitoring/streams/:id', authenticate, authorize(PERMISSIONS.MONITORING_DELETE), moduleController.deleteCameraStream);
router.post('/monitoring/streams/:id/snapshot', authenticate, authorize(PERMISSIONS.MONITORING_CAPTURE), moduleController.captureSnapshot);

// Documents
router.post('/documents/upload', authenticate, authorize(PERMISSIONS.DOCUMENTS_UPLOAD), upload.single('file'), moduleController.uploadDocument);
router.get('/documents/:id/url', authenticate, authorize(PERMISSIONS.DOCUMENTS_READ), moduleController.getDocumentUrl);
router.get('/documents/:id/download', authenticate, authorize(PERMISSIONS.DOCUMENTS_READ), moduleController.downloadDocument);

module.exports = router;
