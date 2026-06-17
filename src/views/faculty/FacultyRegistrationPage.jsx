import { useState } from 'react';
import { Typography, Box, Card, CardContent, Grid, TextField, Button, MenuItem, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { resolveInstitutionId } from '../../utils/uploadDocument';
import { ROLES } from '../../utils/constants';
import { FacultyDocumentsForm, buildFacultyDocumentIds } from '../../components/faculty/FacultyDocumentsSection';

export default function FacultyRegistrationPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [files, setFiles] = useState({});
  const [extraDegrees, setExtraDegrees] = useState([]);
  const [extraLicenses, setExtraLicenses] = useState([]);

  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  const selectedInstitution = watch('institution');

  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions-picker'],
    queryFn: () => api.get('/institutions', { params: { limit: 100 } }).then((r) => r.data.data),
    enabled: isSuperAdmin,
  });

  const institutionId = isSuperAdmin
    ? selectedInstitution
    : resolveInstitutionId(user?.institution);

  const mutation = useMutation({
    mutationFn: (data) => {
      const docPayload = buildFacultyDocumentIds(files, extraDegrees, extraLicenses);
      return api.post('/faculty', {
        institution: data.institution || institutionId,
        loginEmail: data.loginEmail,
        loginPassword: data.loginPassword,
        personalInfo: {
          fullName: data.fullName,
          cnic: data.cnic,
          contact: data.contact,
          email: data.loginEmail,
          address: data.address,
          gender: data.gender,
        },
        professionalInfo: {
          qualification: data.qualification,
          specialization: data.specialization,
          designation: data.designation,
          department: data.department,
          teachingExperience: data.teachingExperience ? Number(data.teachingExperience) : undefined,
          joiningDate: data.joiningDate || undefined,
          licenseNumber: data.licenseNumber,
        },
        ...docPayload,
      });
    },
    onSuccess: () => navigate('/faculty'),
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Faculty Registration</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Register faculty and create their portal login credentials
      </Typography>

      {mutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {mutation.error?.response?.data?.message || 'Registration failed'}
        </Alert>
      )}

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
        {isSuperAdmin && (
          <Box sx={{ mb: 3 }}>
            <TextField
              select
              fullWidth
              label="Institution"
              {...register('institution', { required: true })}
              error={!!errors.institution}
            >
              {institutions.map((inst) => (
                <MenuItem key={inst._id} value={inst._id}>{inst.name}</MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        <Card sx={{ mb: 3 }}><CardContent>
          <Typography variant="h6" gutterBottom>Personal Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Full Name" {...register('fullName', { required: true })} error={!!errors.fullName} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="CNIC" placeholder="35202-1234567-1" {...register('cnic', { required: true })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Contact" {...register('contact', { required: true })} /></Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth label="Gender" select defaultValue="female" {...register('gender')}>
                <MenuItem value="female">Female</MenuItem>
                <MenuItem value="male">Male</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Address" multiline rows={2} {...register('address')} /></Grid>
          </Grid>
        </CardContent></Card>

        <Card sx={{ mb: 3 }}><CardContent>
          <Typography variant="h6" gutterBottom>Professional Information</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}><TextField fullWidth label="Qualification" {...register('qualification', { required: true })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Specialization" {...register('specialization')} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Designation" {...register('designation', { required: true })} /></Grid>
            <Grid item xs={12} md={6}><TextField fullWidth label="Department" {...register('department')} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Teaching Experience (years)" type="number" {...register('teachingExperience')} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="Joining Date" type="date" InputLabelProps={{ shrink: true }} {...register('joiningDate')} /></Grid>
            <Grid item xs={12} md={4}><TextField fullWidth label="License Number" {...register('licenseNumber')} /></Grid>
          </Grid>
        </CardContent></Card>

        <FacultyDocumentsForm
          institution={institutionId}
          files={files}
          setFiles={setFiles}
          extraDegrees={extraDegrees}
          setExtraDegrees={setExtraDegrees}
          extraLicenses={extraLicenses}
          setExtraLicenses={setExtraLicenses}
        />
        {isSuperAdmin && !institutionId && (
          <Alert severity="info" sx={{ mb: 2 }}>Select an institution above before uploading documents.</Alert>
        )}

        <Card sx={{ mb: 3 }}><CardContent>
          <Typography variant="h6" gutterBottom>Portal Login Credentials</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            The faculty member will use these credentials to sign in to the system.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Login Email"
                type="email"
                placeholder="faculty@pnmc.com"
                {...register('loginEmail', { required: true })}
                error={!!errors.loginEmail}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                helperText="Minimum 8 characters"
                {...register('loginPassword', { required: true, minLength: 8 })}
                error={!!errors.loginPassword}
              />
            </Grid>
          </Grid>
        </CardContent></Card>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/faculty')}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={mutation.isPending}>
            {mutation.isPending ? 'Submitting...' : 'Register Faculty'}
          </Button>
        </Box>
      </form>
    </Box>
  );
}
