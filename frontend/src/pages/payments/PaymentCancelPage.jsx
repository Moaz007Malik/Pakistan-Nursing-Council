import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material';

export default function PaymentCancelPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const invoice = params.get('invoice');

  return (
    <Box sx={{ maxWidth: 480, mx: 'auto', mt: 8 }}>
      <Card>
        <CardContent sx={{ textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 2 }}>Payment cancelled</Alert>
          {invoice && <Typography variant="body2" sx={{ mb: 2 }}>Invoice: {invoice}</Typography>}
          <Button variant="contained" onClick={() => navigate('/renewals/my')}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
