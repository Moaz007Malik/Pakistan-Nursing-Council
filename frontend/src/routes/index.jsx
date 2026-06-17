import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '../components/layout/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboard from '../pages/dashboard/AdminDashboard';
import InstitutionDashboard from '../pages/dashboard/InstitutionDashboard';
import FieldOfficerDashboard from '../pages/dashboard/FieldOfficerDashboard';
import CouncilDashboard from '../pages/dashboard/CouncilDashboard';
import CommitteeDashboard from '../pages/dashboard/CommitteeDashboard';
import FinanceDashboard from '../pages/dashboard/FinanceDashboard';
import MonitoringDashboard from '../pages/dashboard/MonitoringDashboard';
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import InstitutionsPage from '../pages/institutions/InstitutionsPage';
import InstitutionApplicationsPage from '../pages/institutions/InstitutionApplicationsPage';
import StudentsPage from '../pages/students/StudentsPage';
import StudentRegistrationPage from '../pages/students/StudentRegistrationPage';
import FacultyPage from '../pages/faculty/FacultyPage';
import FacultyRegistrationPage from '../pages/faculty/FacultyRegistrationPage';
import AttendancePage from '../pages/attendance/AttendancePage';
import InspectionsPage from '../pages/inspections/InspectionsPage';
import PaymentsPage from '../pages/payments/PaymentsPage';
import RenewalsPage from '../pages/renewals/RenewalsPage';
import AffidavitsPage from '../pages/affidavits/AffidavitsPage';
import CommitteesPage from '../pages/committees/CommitteesPage';
import CouncilPage from '../pages/council/CouncilPage';
import BiometricPage from '../pages/biometric/BiometricPage';
import MonitoringPage from '../pages/monitoring/MonitoringPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import AuditLogsPage from '../pages/audit/AuditLogsPage';
import VerifyPage from '../pages/verify/VerifyPage';
import ApplicationDetailPage from '../pages/institutions/ApplicationDetailPage';
import InspectionFormPage from '../pages/inspections/InspectionFormPage';
import EntityDetailPage from '../pages/shared/EntityDetailPage';
import PaymentSuccessPage from '../pages/payments/PaymentSuccessPage';
import PaymentCancelPage from '../pages/payments/PaymentCancelPage';
import MyRenewalPage from '../pages/renewals/MyRenewalPage';
import MonitoringLivePage from '../pages/monitoring/MonitoringLivePage';
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
