import { Grid, Typography, Card, CardContent, Box, Divider, Chip } from '@mui/material';
import {
  Business, School, People, AttachMoney, Autorenew, PendingActions, Warning,
  CheckCircle, Cancel, Assignment, HourglassEmpty, Videocam, Fingerprint,
} from '@mui/icons-material';
import { useQueries } from '@tanstack/react-query';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Section = ({ title, subtitle, children }) => (
  <Box sx={{ mb: 5 }}>
    <Typography variant="h6" fontWeight={700} gutterBottom>{title}</Typography>
    {subtitle && (
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{subtitle}</Typography>
    )}
    {children}
  </Box>
);

const institutionCol = { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name };
const statusCol = { field: 'status', headerName: 'Status', width: 150, renderCell: (p) => <StatusChip status={p.value} /> };

const paymentColumns = [
  { field: 'invoiceNumber', headerName: 'Invoice', width: 180 },
  { field: 'paymentType', headerName: 'Type', flex: 1, valueFormatter: (p) => p.value?.replace(/_/g, ' ') },
  { field: 'amount', headerName: 'Amount', width: 120, valueFormatter: (p) => `PKR ${p.value?.toLocaleString()}` },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
  { field: 'payer', headerName: 'Payer', width: 160, valueGetter: (p) => p.row.payer ? `${p.row.payer.firstName} ${p.row.payer.lastName}` : '-' },
];

const committeeColumns = [
  institutionCol,
  statusCol,
  { field: 'createdAt', headerName: 'Submitted', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
];

const inspectionColumns = [
  institutionCol,
  statusCol,
  { field: 'scheduledDate', headerName: 'Scheduled', width: 130, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
  { field: 'overallScore', headerName: 'Score', width: 90 },
];

export default function AdminDashboard() {
  const [
    { data: admin, isLoading: adminLoading },
    { data: finance, isLoading: financeLoading },
    { data: council, isLoading: councilLoading },
    { data: committee, isLoading: committeeLoading },
    { data: fieldOfficer, isLoading: fieldLoading },
    { data: institution, isLoading: institutionLoading },
    { data: monitoring, isLoading: monitoringLoading },
  ] = useQueries({
    queries: [
      { queryKey: ['admin-dashboard'], queryFn: () => api.get('/dashboard/admin').then((r) => r.data.data) },
      { queryKey: ['finance-dashboard'], queryFn: () => api.get('/dashboard/finance').then((r) => r.data.data) },
      { queryKey: ['council-dashboard'], queryFn: () => api.get('/dashboard/council').then((r) => r.data.data) },
      { queryKey: ['committee-dashboard'], queryFn: () => api.get('/institution-applications', { params: { status: 'committee_review' } }).then((r) => r.data.data) },
      { queryKey: ['field-dashboard'], queryFn: () => api.get('/dashboard/field-officer').then((r) => r.data.data) },
      { queryKey: ['institution-dashboard'], queryFn: () => api.get('/dashboard/institution').then((r) => r.data.data) },
      { queryKey: ['monitoring-dashboard'], queryFn: () => api.get('/dashboard/monitoring').then((r) => r.data.data) },
    ],
  });

  const stats = admin?.stats || {};
  const totalRevenue = finance?.revenueByType?.reduce((sum, r) => sum + r.total, 0) || 0;

  const overviewData = {
    labels: ['Institutions', 'Students', 'Faculty', 'Pending'],
    datasets: [{
      data: [stats.institutions || 0, stats.students || 0, stats.faculty || 0, stats.pendingApprovals || 0],
      backgroundColor: ['#1565C0', '#00897B', '#7b1fa2', '#ed6c02'],
    }],
  };

  const revenueData = {
    labels: ['Revenue', 'Renewals Due', 'Expiring'],
    datasets: [{
      label: 'Count / Amount',
      data: [stats.revenue || 0, stats.pendingRenewals || 0, stats.expiringLicenses || 0],
      backgroundColor: '#1565C0',
    }],
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Super Admin Dashboard</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Unified system overview — all departments on one page
      </Typography>

      <Section title="Admin Overview" subtitle="System-wide analytics and key metrics">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Institutions" value={stats.institutions || 0} icon={<Business />} loading={adminLoading} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Active Students" value={stats.students || 0} icon={<School />} color="secondary.main" loading={adminLoading} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Active Faculty" value={stats.faculty || 0} icon={<People />} color="#7b1fa2" loading={adminLoading} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Revenue (PKR)" value={(stats.revenue || 0).toLocaleString()} icon={<AttachMoney />} color="success.main" loading={adminLoading} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Pending Renewals" value={stats.pendingRenewals || 0} icon={<Autorenew />} color="warning.main" loading={adminLoading} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Pending Approvals" value={stats.pendingApprovals || 0} icon={<PendingActions />} loading={adminLoading} /></Grid>
          <Grid item xs={12} sm={6} md={3}><StatCard title="Expiring Licenses" value={stats.expiringLicenses || 0} icon={<Warning />} color="error.main" loading={adminLoading} /></Grid>
          <Grid item xs={12} md={5}>
            <Card><CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>System Overview</Typography>
              <Box sx={{ height: 260 }}><Doughnut data={overviewData} options={{ maintainAspectRatio: false }} /></Box>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={7}>
            <Card><CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Key Metrics</Typography>
              <Box sx={{ height: 260 }}><Bar data={revenueData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></Box>
            </CardContent></Card>
          </Grid>
        </Grid>
      </Section>

      <Divider sx={{ mb: 4 }} />

      <Section title="Finance Overview" subtitle="Revenue and payment activity">
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}><StatCard title="Total Revenue" value={`PKR ${totalRevenue.toLocaleString()}`} icon={<AttachMoney />} color="success.main" loading={financeLoading} /></Grid>
          <Grid item xs={12} sm={6}><StatCard title="Pending Payments" value={finance?.pendingPayments || 0} icon={<PendingActions />} color="warning.main" loading={financeLoading} /></Grid>
        </Grid>
        <Card><CardContent>
          <Typography variant="subtitle2" gutterBottom>Recent Payments</Typography>
          <DataTable rows={finance?.recentPayments || []} columns={paymentColumns} loading={financeLoading} getRowId={(r) => r._id} pageSize={5} />
        </CardContent></Card>
      </Section>

      <Divider sx={{ mb: 4 }} />

      <Section title="Council Overview" subtitle="Council decisions and pending reviews">
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}><StatCard title="Pending Decisions" value={council?.stats?.pending || 0} icon={<PendingActions />} color="warning.main" loading={councilLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Approved" value={council?.stats?.approved || 0} icon={<CheckCircle />} color="success.main" loading={councilLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Rejected" value={council?.stats?.rejected || 0} icon={<Cancel />} color="error.main" loading={councilLoading} /></Grid>
        </Grid>
        <Card><CardContent>
          <Typography variant="subtitle2" gutterBottom>Pending Council Review</Typography>
          <DataTable rows={council?.pendingDecisions || []} columns={[institutionCol, statusCol]} loading={councilLoading} getRowId={(r) => r._id} pageSize={5} />
        </CardContent></Card>
      </Section>

      <Divider sx={{ mb: 4 }} />

      <Section title="Committee Overview" subtitle="Applications awaiting committee review">
        <Card><CardContent>
          <DataTable rows={committee || []} columns={committeeColumns} loading={committeeLoading} getRowId={(r) => r._id} pageSize={5} />
        </CardContent></Card>
      </Section>

      <Divider sx={{ mb: 4 }} />

      <Section title="Field Officer Overview" subtitle="Field inspections across all officers">
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}><StatCard title="Assigned" value={fieldOfficer?.stats?.assigned || 0} icon={<Assignment />} loading={fieldLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="In Progress" value={fieldOfficer?.stats?.inProgress || 0} icon={<HourglassEmpty />} color="warning.main" loading={fieldLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Submitted" value={fieldOfficer?.stats?.submitted || 0} icon={<CheckCircle />} color="success.main" loading={fieldLoading} /></Grid>
        </Grid>
        <Card><CardContent>
          <Typography variant="subtitle2" gutterBottom>Inspections</Typography>
          <DataTable rows={fieldOfficer?.inspections || []} columns={inspectionColumns} loading={fieldLoading} getRowId={(r) => r._id} pageSize={5} />
        </CardContent></Card>
      </Section>

      <Divider sx={{ mb: 4 }} />

      <Section title="Institution Overview" subtitle="System-wide institution statistics">
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}><StatCard title="Students" value={institution?.stats?.students || 0} icon={<School />} loading={institutionLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Faculty" value={institution?.stats?.faculty || 0} icon={<People />} color="secondary.main" loading={institutionLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Pending Renewals" value={institution?.stats?.pendingRenewals || 0} icon={<Autorenew />} color="warning.main" loading={institutionLoading} /></Grid>
        </Grid>
      </Section>

      <Divider sx={{ mb: 4 }} />

      <Section title="Monitoring Overview" subtitle="Live streams and biometric devices">
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={4}><StatCard title="Live Streams" value={monitoring?.stats?.activeStreams || 0} icon={<Videocam />} color="error.main" loading={monitoringLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Biometric Devices" value={monitoring?.stats?.biometricDevices || 0} icon={<Fingerprint />} loading={monitoringLoading} /></Grid>
          <Grid item xs={12} sm={4}><StatCard title="Institutions" value={monitoring?.stats?.institutions || 0} icon={<Business />} color="secondary.main" loading={monitoringLoading} /></Grid>
        </Grid>
        <Grid container spacing={3}>
          {(monitoring?.streams || []).map((stream) => (
            <Grid item xs={12} md={6} key={stream._id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>{stream.name}</Typography>
                    <Chip label={stream.isLive ? 'LIVE' : 'Offline'} color={stream.isLive ? 'error' : 'default'} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">{stream.institution?.name} — {stream.location}</Typography>
                  <Box sx={{ mt: 2, height: 140, bgcolor: 'grey.900', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="grey.500" variant="body2">Camera Feed Ready</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Section>
    </Box>
  );
}
