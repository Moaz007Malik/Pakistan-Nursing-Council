import { Typography, Box, Grid, Card, CardContent, List, ListItem, ListItemText } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import { useAttendanceFeed } from '../../hooks/useRealtime';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AttendancePage() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['attendance-dashboard'],
    queryFn: () => api.get('/attendance/institution').then((r) => r.data.data),
  });

  const liveEvents = useAttendanceFeed(() => refetch());

  const studentData = {
    labels: ['Present', 'Absent', 'Late', 'Leave'],
    datasets: [{
      data: [data?.students?.present || 0, data?.students?.absent || 0, data?.students?.late || 0, data?.students?.leave || 0],
      backgroundColor: ['#2e7d32', '#d32f2f', '#ed6c02', '#1565C0'],
    }],
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Attendance Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Biometric, Face Recognition & Manual Adjustment — Warning at &lt;75%, Exam block at &lt;60%
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={6} sm={3}><StatCard title="Students Present" value={data?.students?.present || 0} color="success.main" loading={isLoading} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Students Absent" value={data?.students?.absent || 0} color="error.main" loading={isLoading} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Faculty Present" value={data?.faculty?.present || 0} color="success.main" loading={isLoading} /></Grid>
        <Grid item xs={6} sm={3}><StatCard title="Faculty Absent" value={data?.faculty?.absent || 0} color="error.main" loading={isLoading} /></Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Student Attendance Today</Typography>
            <Box sx={{ height: 250 }}><Doughnut data={studentData} options={{ maintainAspectRatio: false }} /></Box>
          </CardContent></Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card><CardContent>
            <Typography variant="h6" gutterBottom>Live Biometric Events</Typography>
            {liveEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Waiting for machine sync...</Typography>
            ) : (
              <List dense>
                {liveEvents.slice(0, 8).map((ev, i) => (
                  <ListItem key={i} disablePadding>
                    <ListItemText
                      primary={ev.studentName || ev.facultyName || ev.entityType || 'Check-in'}
                      secondary={new Date(ev.timestamp || Date.now()).toLocaleTimeString()}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Box>
  );
}
