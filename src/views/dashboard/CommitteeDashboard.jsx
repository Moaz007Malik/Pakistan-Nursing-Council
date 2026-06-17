import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function CommitteeDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution-applications'],
    queryFn: () => api.get('/institution-applications', { params: { status: 'committee_review' } }).then((r) => r.data.data),
  });

  const columns = [
    { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
    { field: 'status', headerName: 'Status', width: 150, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'createdAt', headerName: 'Submitted', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Committee Dashboard</Typography>
      <Card sx={{ mt: 2 }}><CardContent>
        <Typography variant="h6" gutterBottom>Cases for Review</Typography>
        <DataTable rows={data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
