import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Alert, Divider, Chip,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import StatusChip from '../../components/common/StatusChip';
import WorkflowTimeline from '../../components/workflow/WorkflowTimeline';
import WorkflowActions from '../../components/workflow/WorkflowActions';

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const { data: application, isLoading, refetch } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/institution-applications/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!application) return <Typography>Application not found</Typography>;

  const inspectionId = application.fieldInspection?._id || application.fieldInspection;

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/institution-applications')} sx={{ mb: 2 }}>
        Back to Applications
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {application.institution?.name || 'Institution Application'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Application ID: {application._id}
          </Typography>
        </Box>
        <StatusChip status={application.status} />
      </Box>

      {application.status === 'rejected' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Rejected: {application.rejectionReason || 'No reason provided'}
        </Alert>
      )}

      {application.status === 'approved' && application.affidavit && (
        <Alert severity="success" sx={{ mb: 2 }}>
          Council approved — institution affidavit issued. View under Affidavits module.
        </Alert>
      )}

      <WorkflowActions
        type="institution"
        recordId={application._id}
        status={application.status}
        userRole={user?.role}
        committeeVote
        onSuccess={refetch}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Approval Workflow</Typography>
              <WorkflowTimeline workflow={application.workflow} currentStatus={application.status} />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Institution Details</Typography>
              <Typography><strong>Type:</strong> {application.institution?.institutionType?.replace(/_/g, ' ')}</Typography>
              <Typography><strong>Submitted by:</strong> {application.submittedBy?.firstName} {application.submittedBy?.lastName}</Typography>
              <Typography><strong>Email:</strong> {application.submittedBy?.email}</Typography>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Field Inspection</Typography>
              {inspectionId ? (
                <Box>
                  <Chip label={application.fieldInspection?.status || 'assigned'} size="small" sx={{ mb: 1 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Score: {application.fieldInspection?.overallScore ?? '—'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate(`/inspections/${inspectionId}`)}
                  >
                    Open Inspection Form
                  </Button>
                </Box>
              ) : (
                <Typography color="text.secondary">Inspection not assigned yet</Typography>
              )}
            </CardContent>
          </Card>

          {application.committeeReview?.votes?.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Committee Votes</Typography>
                <Typography variant="body2">Decision: {application.committeeReview.decision || 'pending'}</Typography>
                <Typography variant="body2">Votes: {application.committeeReview.votes.length}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {application.status === 'draft' && (
        <>
          <Divider sx={{ my: 3 }} />
          <Button
            variant="contained"
            onClick={async () => {
              await api.post(`/institution-applications/${id}/submit`);
              refetch();
            }}
          >
            Submit Application
          </Button>
        </>
      )}
    </Box>
  );
}
