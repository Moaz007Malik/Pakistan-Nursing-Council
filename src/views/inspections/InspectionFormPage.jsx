import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Button, TextField, Grid, Alert, Slider, MenuItem,
} from '@mui/material';
import { ArrowBack, Save, Send } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../services/api';

const SECTIONS = [
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'faculty', label: 'Faculty' },
  { key: 'labs', label: 'Laboratories' },
  { key: 'library', label: 'Library' },
  { key: 'hostel', label: 'Hostel' },
  { key: 'hospitalAffiliation', label: 'Hospital Affiliation' },
  { key: 'studentRecords', label: 'Student Records' },
];

const defaultSections = () => SECTIONS.reduce((acc, s) => {
  acc[s.key] = { name: s.label, score: 70, remarks: '', compliant: true };
  return acc;
}, {});

export default function InspectionFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sections, setSections] = useState(defaultSections());
  const [summary, setSummary] = useState('');
  const [recommendation, setRecommendation] = useState('recommended');
  const [geo, setGeo] = useState(null);
  const [error, setError] = useState('');
  const [initialized, setInitialized] = useState(false);

  const { data: inspection, isLoading } = useQuery({
    queryKey: ['inspection', id],
    queryFn: () => api.get(`/inspections/${id}`).then((r) => r.data.data),
  });

  useEffect(() => {
    if (inspection && !initialized) {
      if (inspection.sections) setSections({ ...defaultSections(), ...inspection.sections });
      if (inspection.summary) setSummary(inspection.summary);
      if (inspection.recommendation) setRecommendation(inspection.recommendation);
      if (inspection.geolocation) setGeo(inspection.geolocation);
      setInitialized(true);
    }
  }, [inspection, initialized]);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch(`/inspections/${id}`, payload),
    onError: (err) => setError(err.response?.data?.message || 'Save failed'),
  });

  const captureLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        capturedAt: new Date().toISOString(),
      }),
      () => setError('Could not capture GPS location'),
      { enableHighAccuracy: true }
    );
  };

  const buildPayload = (status) => ({
    status,
    sections,
    summary,
    recommendation,
    geolocation: geo,
    visitDate: new Date().toISOString(),
  });

  if (isLoading) return <Typography>Loading inspection...</Typography>;
  if (!inspection) return <Typography>Inspection not found</Typography>;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/inspections')} sx={{ mb: 2 }}>
        Back
      </Button>

      <Typography variant="h5" fontWeight={700} gutterBottom>
        Field Inspection — {inspection.institution?.name}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Officer: {inspection.fieldOfficer?.firstName} {inspection.fieldOfficer?.lastName}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {inspection.status === 'submitted' && (
        <Alert severity="info" sx={{ mb: 2 }}>This inspection has been submitted to committee.</Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Geolocation</Typography>
          <Button variant="outlined" onClick={captureLocation} sx={{ mb: 1 }}>
            Capture GPS at Site
          </Button>
          {geo && (
            <Typography variant="body2">
              Lat: {geo.latitude.toFixed(6)}, Lng: {geo.longitude.toFixed(6)} (±{Math.round(geo.accuracy)}m)
            </Typography>
          )}
        </CardContent>
      </Card>

      <Grid container spacing={2}>
        {SECTIONS.map(({ key, label }) => (
          <Grid item xs={12} md={6} key={key}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={600}>{label}</Typography>
                <Typography variant="body2" gutterBottom>Score: {sections[key]?.score ?? 0}%</Typography>
                <Slider
                  value={sections[key]?.score ?? 0}
                  onChange={(_, v) => setSections({ ...sections, [key]: { ...sections[key], score: v } })}
                  min={0}
                  max={100}
                  disabled={inspection.status === 'submitted'}
                />
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Remarks"
                  value={sections[key]?.remarks || ''}
                  onChange={(e) => setSections({ ...sections, [key]: { ...sections[key], remarks: e.target.value } })}
                  disabled={inspection.status === 'submitted'}
                  sx={{ mt: 1 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Inspection Summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            disabled={inspection.status === 'submitted'}
            sx={{ mb: 2 }}
          />
          <TextField
            select
            fullWidth
            label="Recommendation"
            value={recommendation}
            onChange={(e) => setRecommendation(e.target.value)}
            disabled={inspection.status === 'submitted'}
          >
            <MenuItem value="recommended">Recommended</MenuItem>
            <MenuItem value="conditional">Conditional</MenuItem>
            <MenuItem value="not_recommended">Not Recommended</MenuItem>
          </TextField>
        </CardContent>
      </Card>

      {inspection.status !== 'submitted' && (
        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<Save />}
            onClick={() => saveMutation.mutate(buildPayload('in_progress'))}
            disabled={saveMutation.isPending}
          >
            Save Draft
          </Button>
          <Button
            variant="contained"
            startIcon={<Send />}
            onClick={() => {
              saveMutation.mutate(buildPayload('submitted'), {
                onSuccess: () => {
                  if (inspection.application) {
                    navigate(`/institution-applications/${inspection.application._id || inspection.application}`);
                  }
                },
              });
            }}
            disabled={saveMutation.isPending || !geo}
          >
            Submit to Committee
          </Button>
        </Box>
      )}
    </Box>
  );
}
