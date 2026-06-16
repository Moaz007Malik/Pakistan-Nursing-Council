import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function InspectionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['inspections'],
    queryFn: () => api.get('/inspections').then((r) => r.data),
  });

  const columns = [
    { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
    { field: 'fieldOfficer', headerName: 'Officer', width: 160, valueGetter: (p) => p.row.fieldOfficer ? `${p.row.fieldOfficer.firstName} ${p.row.fieldOfficer.lastName}` : '-' },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'overallScore', headerName: 'Score', width: 90 },
    { field: 'recommendation', headerName: 'Recommendation', width: 150, valueFormatter: (p) => p.value?.replace(/_/g, ' ') || '-' },
    { field: 'visitDate', headerName: 'Visit Date', width: 130, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Field Inspections</Typography>
      <Card sx={{ mt: 2 }}><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
