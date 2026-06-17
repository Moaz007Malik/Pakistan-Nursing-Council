import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Card, CardContent, Button, Grid } from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import StatusChip from '../../components/common/StatusChip';
import WorkflowActions from '../../components/workflow/WorkflowActions';
import WorkflowTimeline from '../../components/workflow/WorkflowTimeline';
import StudentDocumentsPanel from '../../components/students/StudentDocumentsSection';
import FacultyDocumentsPanel from '../../components/faculty/FacultyDocumentsSection';
import { canRegisterStudents, canRegisterFaculty, canViewDocuments } from '../../utils/constants';

const CONFIG = {
  students: { type: 'student', title: 'Student' },
  faculty: { type: 'faculty', title: 'Faculty' },
};

export default function EntityDetailPage({ entityPath }) {
  const path = entityPath || useParams().entity;
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const cfg = CONFIG[path] || CONFIG.students;

  const { data: record, isLoading, refetch } = useQuery({
    queryKey: [path, id],
    queryFn: () => api.get(`/${path}/${id}`).then((r) => r.data.data),
  });

  if (isLoading) return <Typography>Loading...</Typography>;
  if (!record) return <Typography>Record not found</Typography>;

  const name = record.personalInfo?.fullName
    || `${record.personalInfo?.firstName || ''} ${record.personalInfo?.lastName || ''}`.trim();

  return (
    <Box>
      <Button startIcon={<ArrowBack />} onClick={() => navigate(`/${path}`)} sx={{ mb: 2 }}>
        Back
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>{cfg.title}: {name}</Typography>
        <StatusChip status={record.status} />
      </Box>

      <WorkflowActions
        type={cfg.type}
        recordId={record._id}
        status={record.status}
        userRole={user?.role}
        onSuccess={refetch}
      />

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Details</Typography>
              <Typography><strong>Reg. No:</strong> {record.registrationNumber || '—'}</Typography>
              <Typography><strong>CNIC:</strong> {record.personalInfo?.cnic}</Typography>
              <Typography><strong>Institution:</strong> {record.institution?.name}</Typography>
              <Typography><strong>Expires:</strong> {record.expiresAt ? new Date(record.expiresAt).toLocaleDateString() : '—'}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Attendance:</strong> {record.attendancePercentage || 0}%</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Workflow</Typography>
              <WorkflowTimeline workflow={record.workflow} currentStatus={record.status} />
            </CardContent>
          </Card>
        </Grid>
        {path === 'students' && canViewDocuments(user?.role) && (
          <Grid item xs={12}>
            <StudentDocumentsPanel
              student={record}
              canView
              canEdit={canRegisterStudents(user?.role)}
            />
          </Grid>
        )}
        {path === 'faculty' && canViewDocuments(user?.role) && (
          <Grid item xs={12}>
            <FacultyDocumentsPanel
              faculty={record}
              canView
              canEdit={canRegisterFaculty(user?.role)}
            />
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
