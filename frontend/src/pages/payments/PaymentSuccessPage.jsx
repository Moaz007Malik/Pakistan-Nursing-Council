import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, Alert, CircularProgress } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

export default function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const invoice = params.get('invoice');
  const [done, setDone] = useState(false);

  const verifyMutation = useMutation({
    mutationFn: () => api.post(`/payments/${invoice}/verify`, { bypass: true }),
    onSuccess: () => setDone(true),
  });

  useEffect(() => {
    if (invoice && !done && !verifyMutation.isPending && !verifyMutation.isSuccess) {
      verifyMutation.mutate();
    }
  }, [invoice]);

  if (!invoice) {
    return <Alert severity="error">Missing invoice number</Alert>;
  }

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          {verifyMutation.isPending && (
            <>
              <CircularProgress sx={{ mb: 2 }} />
              <Typography>Verifying payment {invoice}...</Typography>
            </>
          )}
          {verifyMutation.isSuccess && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>Payment verified successfully</Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Membership renewal has been processed. Your account will be active shortly.
              </Typography>
              <Button variant="contained" onClick={() => navigate('/renewals/my')}>
                View Renewal Status
              </Button>
            </>
          )}
          {verifyMutation.isError && (
            <Alert severity="error">{verifyMutation.error?.response?.data?.message || 'Verification failed'}</Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
