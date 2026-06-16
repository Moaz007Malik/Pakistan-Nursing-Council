import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function InstitutionApplicationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['institution-applications'],
    queryFn: () => api.get('/institution-applications').then((r) => r.data),
  });

  const columns = [
    { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
    { field: 'submittedBy', headerName: 'Submitted By', width: 180, valueGetter: (p) => p.row.submittedBy ? `${p.row.submittedBy.firstName} ${p.row.submittedBy.lastName}` : '-' },
    { field: 'status', headerName: 'Status', width: 160, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'createdAt', headerName: 'Date', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Institution Applications</Typography>
      <Card sx={{ mt: 2 }}><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
