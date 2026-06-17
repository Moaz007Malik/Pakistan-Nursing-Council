import {
  Box, Typography, Card, CardContent, Grid, Chip, Alert, Button, IconButton,
} from '@mui/material';
import { Videocam, VideocamOff, Refresh } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

function StreamPlayer({ stream }) {
  const url = stream.streamUrl || stream.hlsUrl || stream.rtspUrl;
  const live = stream.isLive;

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="subtitle1" fontWeight={600}>{stream.name}</Typography>
          <Chip
            size="small"
            icon={live ? <Videocam /> : <VideocamOff />}
            label={live ? 'LIVE' : 'Offline'}
            color={live ? 'error' : 'default'}
          />
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {stream.location?.replace(/_/g, ' ')} — {stream.locationDetail || stream.institution?.name}
        </Typography>
        <Box
          sx={{
            bgcolor: '#000',
            borderRadius: 1,
            height: 220,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {url && live ? (
            url.includes('.m3u8') || url.includes('hls') ? (
              <video
                src={url}
                controls
                autoPlay
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <iframe
                title={stream.name}
                src={url}
                style={{ width: '100%', height: '100%', border: 0 }}
                allow="camera; microphone; autoplay"
              />
            )
          ) : (
            <Typography color="grey.500" variant="body2">
              {live ? 'Stream URL not configured' : 'Camera offline — waiting for biometric sync'}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function MonitoringLivePage() {
  const queryClient = useQueryClient();

  const { data: streams = [], isLoading, refetch } = useQuery({
    queryKey: ['monitoring-streams'],
    queryFn: () => api.get('/monitoring/streams').then((r) => r.data.data),
    refetchInterval: 30000,
  });

  const syncMutation = useMutation({
    mutationFn: (deviceId) => api.post(`/biometric/devices/${deviceId}/sync`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitoring-streams'] }),
  });

  const { data: devices = [] } = useQuery({
    queryKey: ['biometric-devices-monitoring'],
    queryFn: () => api.get('/biometric/devices').then((r) => r.data.data),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Live Monitoring</Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time camera feeds aligned with biometric attendance machines
          </Typography>
        </Box>
        <IconButton onClick={() => refetch()}><Refresh /></IconButton>
      </Box>

      {devices.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Biometric Sync</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {devices.slice(0, 5).map((d) => (
                <Button
                  key={d._id}
                  size="small"
                  variant="outlined"
                  onClick={() => syncMutation.mutate(d.deviceId)}
                  disabled={syncMutation.isPending}
                >
                  Sync {d.name}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Typography>Loading streams...</Typography>
      ) : streams.length === 0 ? (
        <Alert severity="info">No camera streams configured. Add streams in the admin panel.</Alert>
      ) : (
        <Grid container spacing={2}>
          {streams.map((stream) => (
            <Grid item xs={12} md={6} lg={4} key={stream._id}>
              <StreamPlayer stream={stream} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
