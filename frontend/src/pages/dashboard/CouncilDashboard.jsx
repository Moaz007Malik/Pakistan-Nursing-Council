import { Grid, Typography, Box, Card, CardContent } from '@mui/material';
import { PendingActions, CheckCircle, Cancel } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function CouncilDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['council-dashboard'],
    queryFn: () => api.get('/dashboard/council').then((r) => r.data.data),
  });

  const columns = [
    { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (p) => <StatusChip status={p.value} /> },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Council Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><StatCard title="Pending Decisions" value={data?.stats?.pending || 0} icon={<PendingActions />} color="warning.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Approved" value={data?.stats?.approved || 0} icon={<CheckCircle />} color="success.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Rejected" value={data?.stats?.rejected || 0} icon={<Cancel />} color="error.main" loading={isLoading} /></Grid>
      </Grid>
      <Card><CardContent>
        <Typography variant="h6" gutterBottom>Pending Council Review</Typography>
        <DataTable rows={data?.pendingDecisions || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
