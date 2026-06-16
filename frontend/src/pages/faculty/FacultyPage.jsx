import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function FacultyPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['faculty'],
    queryFn: () => api.get('/faculty').then((r) => r.data),
  });

  const columns = [
    { field: 'registrationNumber', headerName: 'Reg. No', width: 150 },
    { field: 'fullName', headerName: 'Name', flex: 1, valueGetter: (p) => p.row.personalInfo?.fullName },
    { field: 'cnic', headerName: 'CNIC', width: 160, valueGetter: (p) => p.row.personalInfo?.cnic },
    { field: 'designation', headerName: 'Designation', width: 160, valueGetter: (p) => p.row.professionalInfo?.designation },
    { field: 'qualification', headerName: 'Qualification', width: 160, valueGetter: (p) => p.row.professionalInfo?.qualification },
    { field: 'institution', headerName: 'Institution', width: 180, valueGetter: (p) => p.row.institution?.name },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Faculty Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Based on PNC Faculty Registration Form 2020</Typography>
      <Card><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
