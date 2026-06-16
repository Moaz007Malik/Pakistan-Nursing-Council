import { Grid, Typography, Box, Card, CardContent } from '@mui/material';
import { Assignment, HourglassEmpty, CheckCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function FieldOfficerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['field-dashboard'],
    queryFn: () => api.get('/dashboard/field-officer').then((r) => r.data.data),
  });

  const columns = [
    { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'scheduledDate', headerName: 'Scheduled', width: 130, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
    { field: 'overallScore', headerName: 'Score', width: 90 },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Field Officer Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><StatCard title="Assigned" value={data?.stats?.assigned || 0} icon={<Assignment />} loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="In Progress" value={data?.stats?.inProgress || 0} icon={<HourglassEmpty />} color="warning.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Submitted" value={data?.stats?.submitted || 0} icon={<CheckCircle />} color="success.main" loading={isLoading} /></Grid>
      </Grid>
      <Card><CardContent>
        <Typography variant="h6" gutterBottom>My Inspections</Typography>
        <DataTable rows={data?.inspections || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
