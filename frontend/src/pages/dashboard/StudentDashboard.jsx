import { Typography, Box, Card, CardContent, Grid } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusChip from '../../components/common/StatusChip';

export default function StudentDashboard() {
  const { user } = useSelector((state) => state.auth);

  const { data: students } = useQuery({
    queryKey: ['my-student'],
    queryFn: () => api.get('/students', { params: { limit: 1 } }).then((r) => r.data.data?.[0]),
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Student Portal</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Welcome, {user?.firstName}</Typography>
      {students && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card><CardContent>
              <Typography variant="h6" gutterBottom>Registration Details</Typography>
              <Typography><strong>Name:</strong> {students.personalInfo?.fullName}</Typography>
              <Typography><strong>Reg. No:</strong> {students.registrationNumber}</Typography>
              <Typography><strong>Program:</strong> {students.programInfo?.degree}</Typography>
              <Typography sx={{ mt: 1 }}><StatusChip status={students.status} /></Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <StatCard title="Attendance %" value={`${students.attendancePercentage || 100}%`} subtitle={students.examEligible ? 'Exam Eligible' : 'Exam Blocked'} color={students.examEligible ? 'success.main' : 'error.main'} />
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
