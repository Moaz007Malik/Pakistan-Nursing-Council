import { Grid, Typography, Card, CardContent, Box } from '@mui/material';
import { Business, School, People, AttachMoney, Autorenew, PendingActions, Warning } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/dashboard/admin').then((r) => r.data.data),
  });

  const stats = data?.stats || {};

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
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>System-wide overview and analytics</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Institutions" value={stats.institutions || 0} icon={<Business />} loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Active Students" value={stats.students || 0} icon={<School />} color="secondary.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Active Faculty" value={stats.faculty || 0} icon={<People />} color="#7b1fa2" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Revenue (PKR)" value={(stats.revenue || 0).toLocaleString()} icon={<AttachMoney />} color="success.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Pending Renewals" value={stats.pendingRenewals || 0} icon={<Autorenew />} color="warning.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Pending Approvals" value={stats.pendingApprovals || 0} icon={<PendingActions />} loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6} md={3}><StatCard title="Expiring Licenses" value={stats.expiringLicenses || 0} icon={<Warning />} color="error.main" loading={isLoading} /></Grid>

        <Grid item xs={12} md={5}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>System Overview</Typography>
            <Box sx={{ height: 280 }}><Doughnut data={overviewData} options={{ maintainAspectRatio: false }} /></Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={7}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Key Metrics</Typography>
            <Box sx={{ height: 280 }}><Bar data={revenueData} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></Box>
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
