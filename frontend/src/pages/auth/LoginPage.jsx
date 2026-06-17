import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../../features/auth/authSlice';
import { getDashboardRoute } from '../../utils/constants';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);
  const { register, handleSubmit } = useForm({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    const result = await dispatch(login(data));
    if (login.fulfilled.match(result)) {
      navigate(getDashboardRoute(result.payload.user.role));
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.dark', background: 'linear-gradient(135deg, #0d47a1 0%, #1565C0 50%, #00897B 100%)' }}>
      <Card sx={{ width: '100%', maxWidth: 440, mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700} color="primary">PNMC</Typography>
            <Typography variant="body2" color="text.secondary">Nursing & Midwifery Council Management System</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Email" margin="normal" {...register('email', { required: true })} />
            <TextField fullWidth label="Password" type="password" margin="normal" {...register('password', { required: true })} />
            <Button fullWidth type="submit" variant="contained" size="large" disabled={loading} sx={{ mt: 2, py: 1.5 }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
