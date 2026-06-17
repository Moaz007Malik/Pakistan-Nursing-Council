import { Grid, Typography, Box } from '@mui/material';
import { School, People, Autorenew } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';

export default function InstitutionDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution-dashboard'],
    queryFn: () => api.get('/dashboard/institution').then((r) => r.data.data),
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Institution Dashboard</Typography>
      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid item xs={12} sm={4}><StatCard title="Students" value={data?.stats?.students || 0} icon={<School />} loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Faculty" value={data?.stats?.faculty || 0} icon={<People />} color="secondary.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Pending Renewals" value={data?.stats?.pendingRenewals || 0} icon={<Autorenew />} color="warning.main" loading={isLoading} /></Grid>
      </Grid>
    </Box>
  );
}
