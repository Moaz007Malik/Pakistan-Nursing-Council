import { Typography, Box, Button, Card, CardContent } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function StudentsPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: () => api.get('/students').then((r) => r.data),
  });

  const columns = [
    { field: 'registrationNumber', headerName: 'Reg. No', width: 150 },
    { field: 'fullName', headerName: 'Name', flex: 1, valueGetter: (p) => p.row.personalInfo?.fullName },
    { field: 'cnic', headerName: 'CNIC', width: 160, valueGetter: (p) => p.row.personalInfo?.cnic },
    { field: 'institution', headerName: 'Institution', width: 200, valueGetter: (p) => p.row.institution?.name },
    { field: 'program', headerName: 'Program', width: 140, valueGetter: (p) => p.row.programInfo?.course },
    { field: 'attendance', headerName: 'Attendance', width: 110, valueGetter: (p) => `${p.row.attendancePercentage || 0}%` },
    { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip status={p.value} /> },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Students</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/students/register')}>Register Student</Button>
      </Box>
      <Card><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
