import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../views/auth/LoginPage';
import AdminDashboard from '../views/dashboard/AdminDashboard';
import InstitutionDashboard from '../views/dashboard/InstitutionDashboard';
import FieldOfficerDashboard from '../views/dashboard/FieldOfficerDashboard';
import CouncilDashboard from '../views/dashboard/CouncilDashboard';
import CommitteeDashboard from '../views/dashboard/CommitteeDashboard';
import FinanceDashboard from '../views/dashboard/FinanceDashboard';
import MonitoringDashboard from '../views/dashboard/MonitoringDashboard';
import StudentDashboard from '../views/dashboard/StudentDashboard';
import InstitutionsPage from '../views/institutions/InstitutionsPage';
import InstitutionApplicationsPage from '../views/institutions/InstitutionApplicationsPage';
import StudentsPage from '../views/students/StudentsPage';
import StudentRegistrationPage from '../views/students/StudentRegistrationPage';
import FacultyPage from '../views/faculty/FacultyPage';
import FacultyRegistrationPage from '../views/faculty/FacultyRegistrationPage';
import AttendancePage from '../views/attendance/AttendancePage';
import InspectionsPage from '../views/inspections/InspectionsPage';
import PaymentsPage from '../views/payments/PaymentsPage';
import RenewalsPage from '../views/renewals/RenewalsPage';
import AffidavitsPage from '../views/affidavits/AffidavitsPage';
import CommitteesPage from '../views/committees/CommitteesPage';
import CouncilPage from '../views/council/CouncilPage';
import BiometricPage from '../views/biometric/BiometricPage';
import MonitoringPage from '../views/monitoring/MonitoringPage';
import NotificationsPage from '../views/notifications/NotificationsPage';
import AuditLogsPage from '../views/audit/AuditLogsPage';
import VerifyPage from '../views/verify/VerifyPage';
import ApplicationDetailPage from '../views/institutions/ApplicationDetailPage';
import InspectionFormPage from '../views/inspections/InspectionFormPage';
import EntityDetailPage from '../views/shared/EntityDetailPage';
import PaymentSuccessPage from '../views/payments/PaymentSuccessPage';
import PaymentCancelPage from '../views/payments/PaymentCancelPage';
import MyRenewalPage from '../views/renewals/MyRenewalPage';
import MonitoringLivePage from '../views/monitoring/MonitoringLivePage';
import { getDashboardRoute } from '../utils/constants';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const DashboardRedirect = () => {
  const { user } = useSelector((state) => state.auth);
  return <Navigate to={getDashboardRoute(user?.role)} replace />;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify/:type/:id" element={<VerifyPage />} />
      <Route path="/payments/success" element={<ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>} />
      <Route path="/payments/cancel" element={<ProtectedRoute><PaymentCancelPage /></ProtectedRoute>} />

      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<DashboardRedirect />} />
        <Route path="dashboard/admin" element={<AdminDashboard />} />
        <Route path="dashboard/institution" element={<InstitutionDashboard />} />
        <Route path="dashboard/field-officer" element={<FieldOfficerDashboard />} />
        <Route path="dashboard/council" element={<CouncilDashboard />} />
        <Route path="dashboard/committee" element={<CommitteeDashboard />} />
        <Route path="dashboard/finance" element={<FinanceDashboard />} />
        <Route path="dashboard/monitoring" element={<MonitoringDashboard />} />
        <Route path="dashboard/student" element={<StudentDashboard />} />
        <Route path="institutions" element={<InstitutionsPage />} />
        <Route path="institution-applications" element={<InstitutionApplicationsPage />} />
        <Route path="institution-applications/:id" element={<ApplicationDetailPage />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:id" element={<EntityDetailPage entityPath="students" />} />
        <Route path="students/register" element={<StudentRegistrationPage />} />
        <Route path="faculty" element={<FacultyPage />} />
        <Route path="faculty/:id" element={<EntityDetailPage entityPath="faculty" />} />
        <Route path="faculty/register" element={<FacultyRegistrationPage />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="inspections" element={<InspectionsPage />} />
        <Route path="inspections/:id" element={<InspectionFormPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="renewals" element={<RenewalsPage />} />
        <Route path="renewals/my" element={<MyRenewalPage />} />
        <Route path="affidavits" element={<AffidavitsPage />} />
        <Route path="committees" element={<CommitteesPage />} />
        <Route path="council" element={<CouncilPage />} />
        <Route path="biometric" element={<BiometricPage />} />
        <Route path="monitoring" element={<MonitoringLivePage />} />
        <Route path="monitoring/streams" element={<MonitoringPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
