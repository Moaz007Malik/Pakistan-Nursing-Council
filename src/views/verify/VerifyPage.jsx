import { Typography, Box, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { API_BASE_URL } from '../../config/env';
import StatusChip from '../../components/common/StatusChip';

export default function VerifyPage() {
  const { type, id } = useParams();

  const { data, isLoading, error } = useQuery({
    queryKey: ['verify', type, id],
    queryFn: () => axios.get(`${API_BASE_URL}/verify/${type}/${id}`).then((r) => r.data.data),
    enabled: !!type && !!id,
  });

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>PNMC Verification</Typography>
          {error ? (
            <Alert severity="error">Verification failed. Invalid registration number.</Alert>
          ) : (
            <>
              <Alert severity={data?.valid ? 'success' : 'warning'} sx={{ mb: 2 }}>
                {data?.valid ? 'Valid Registration' : 'Invalid or Expired'}
              </Alert>
              {type === 'institution' && data?.institution && (
                <Box sx={{ textAlign: 'left' }}>
                  <Typography><strong>Name:</strong> {data.institution.name}</Typography>
                  <Typography><strong>Reg. No:</strong> {data.institution.registrationNumber}</Typography>
                  <Typography sx={{ mt: 1 }}><StatusChip status={data.institution.status} /></Typography>
                </Box>
              )}
              {type === 'student' && data?.student && (
                <Box sx={{ textAlign: 'left' }}>
                  <Typography><strong>Name:</strong> {data.student.name}</Typography>
                  <Typography><strong>Reg. No:</strong> {data.student.registrationNumber}</Typography>
                  <Typography><strong>Institution:</strong> {data.student.institution}</Typography>
                  <Typography sx={{ mt: 1 }}><StatusChip status={data.student.status} /></Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
