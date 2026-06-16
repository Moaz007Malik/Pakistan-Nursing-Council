import { Grid, Typography, Box, Card, CardContent, Chip } from '@mui/material';
import { Videocam, Fingerprint, Business } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';

export default function MonitoringDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['monitoring-dashboard'],
    queryFn: () => api.get('/dashboard/monitoring').then((r) => r.data.data),
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Monitoring Center</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}><StatCard title="Live Streams" value={data?.stats?.activeStreams || 0} icon={<Videocam />} color="error.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Biometric Devices" value={data?.stats?.biometricDevices || 0} icon={<Fingerprint />} loading={isLoading} /></Grid>
        <Grid item xs={12} sm={4}><StatCard title="Institutions" value={data?.stats?.institutions || 0} icon={<Business />} color="secondary.main" loading={isLoading} /></Grid>
      </Grid>
      <Grid container spacing={3}>
        {(data?.streams || []).map((stream) => (
          <Grid item xs={12} md={6} key={stream._id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight={600}>{stream.name}</Typography>
                  <Chip label={stream.isLive ? 'LIVE' : 'Offline'} color={stream.isLive ? 'error' : 'default'} size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">{stream.institution?.name} — {stream.location}</Typography>
                <Box sx={{ mt: 2, height: 180, bgcolor: 'grey.900', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="grey.500">Camera Feed Ready</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
