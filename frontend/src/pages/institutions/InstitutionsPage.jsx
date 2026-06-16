import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';
import { INSTITUTION_TYPES } from '../../utils/constants';

export default function InstitutionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['institutions'],
    queryFn: () => api.get('/institutions').then((r) => r.data),
  });

  const columns = [
    { field: 'registrationNumber', headerName: 'Reg. No', width: 150 },
    { field: 'name', headerName: 'Name', flex: 1 },
    { field: 'institutionType', headerName: 'Type', width: 180, valueFormatter: (p) => INSTITUTION_TYPES[p.value] || p.value },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 140 },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip status={p.value} /> },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Institutions</Typography>
      <Card sx={{ mt: 2 }}><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
