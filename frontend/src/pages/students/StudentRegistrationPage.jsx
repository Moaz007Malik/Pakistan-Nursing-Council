import { Typography, Box, Card, CardContent, Grid, TextField, Button, MenuItem, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../../services/api';

export default function StudentRegistrationPage() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const mutation = useMutation({
    mutationFn: (data) => api.post('/students', {
      personalInfo: {
        fullName: data.fullName,
        fatherHusbandName: data.fatherHusbandName,
        cnic: data.cnic,
        dateOfBirth: data.dateOfBirth,
        contact: data.contact,
        address: data.address,
        nationality: data.nationality || 'Pakistani',
        gender: data.gender,
      },
      academicInfo: {
        matric: { board: data.matricBoard, year: Number(data.matricYear), marks: Number(data.matricMarks), totalMarks: 1100, percentage: Number(data.matricPercentage) },
        fsc: { board: data.fscBoard, year: Number(data.fscYear), marks: Number(data.fscMarks), totalMarks: 1100, percentage: Number(data.fscPercentage), biologyMarks: Number(data.biologyMarks) },
      },
      programInfo: { course: data.course, degree: data.degree, session: data.session, semester: Number(data.semester), batch: data.batch },
    }),
    onSuccess: () => navigate('/students'),
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Student Registration Form</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Based on PNMC Pre-Registration Application Form</Typography>

      {mutation.isError && <Alert severity="error" sx={{ mb: 2 }}>{mutation.error?.response?.data?.message || 'Registration failed'}</Alert>}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        <Card sx={{ mb: 3 }}><CardContent>
          <Typography variant="h6" gutterBottom>Personal Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Full Name" {...register('fullName', { required: true })} error={!!errors.fullName} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Father/Husband Name" {...register('fatherHusbandName', { required: true })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="CNIC" placeholder="35202-1234567-1" {...register('cnic', { required: true })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} {...register('dateOfBirth', { required: true })} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Gender" select {...register('gender')} defaultValue="female"><MenuItem value="female">Female</MenuItem><MenuItem value="male">Male</MenuItem></TextField></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Contact" {...register('contact', { required: true })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Nationality" defaultValue="Pakistani" {...register('nationality')} /></Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} {...register('address', { required: true })} /></Grid>
          </Grid>
        </CardContent></Card>

        <Card sx={{ mb: 3 }}><CardContent>
          <Typography variant="h6" gutterBottom>Academic Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}><Typography variant="subtitle2" color="primary">Matriculation</Typography></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Board" {...register('matricBoard')} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Year" type="number" {...register('matricYear')} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Marks" type="number" {...register('matricMarks')} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Percentage" type="number" {...register('matricPercentage')} /></Grid>
            <Grid item xs={12}><Typography variant="subtitle2" color="primary">FSC / Intermediate</Typography></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Board" {...register('fscBoard')} /></Grid>
            <Grid item xs={12} md={3}><TextField fullWidth label="Year" type="number" {...register('fscYear')} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Marks" type="number" {...register('fscMarks')} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Percentage" type="number" {...register('fscPercentage')} /></Grid>
            <Grid item xs={12} md={2}><TextField fullWidth label="Biology Marks" type="number" {...register('biologyMarks')} /></Grid>
          </Grid>
        </CardContent></Card>

        <Card sx={{ mb: 3 }}><CardContent>
          <Typography variant="h6" gutterBottom>Program Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}><TextField fullWidth label="Course" select {...register('course')} defaultValue="BSN"><MenuItem value="BSN">BSN</MenuItem><MenuItem value="Post-RN BSN">Post-RN BSN</MenuItem><MenuItem value="Diploma">Diploma</MenuItem><MenuItem value="Midwifery">Midwifery</MenuItem></TextField></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Degree" {...register('degree')} defaultValue="Bachelor of Science in Nursing" /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Session" placeholder="2024-2028" {...register('session')} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Semester" type="number" {...register('semester')} defaultValue={1} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Batch" {...register('batch')} /></Grid>
          </Grid>
        </CardContent></Card>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/students')}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>{mutation.isPending ? 'Submitting...' : 'Submit Registration'}</Button>
        </Box>
      </form>
    </Box>
  );
}
