import { Box, Stepper, Step, StepLabel, Typography, Chip } from '@mui/material';

const STEP_LABELS = {
  institution_submission: 'Institution Submission',
  field_inspection: 'Field Officer Inspection',
  committee_review: 'Committee Review',
  council_review: 'Council Approval',
  institution_verification: 'Institution Verification',
  committee_verification: 'Committee Verification',
  institution_approval: 'Institution Approval',
  council_approval: 'Council Approval',
};

const statusColor = (status) => {
  if (status === 'completed') return 'success';
  if (status === 'in_progress') return 'primary';
  if (status === 'rejected') return 'error';
  return 'default';
};

export default function WorkflowTimeline({ workflow = [], currentStatus }) {
  if (!workflow.length) {
    return <Typography color="text.secondary">No workflow steps recorded.</Typography>;
  }

  const activeIndex = workflow.findIndex((s) => s.status === 'in_progress');

  return (
    <Box sx={{ mt: 2 }}>
      <Stepper activeStep={activeIndex >= 0 ? activeIndex : workflow.length} orientation="vertical">
        {workflow.map((step) => (
          <Step key={step.step} completed={step.status === 'completed'}>
            <StepLabel
              optional={
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                  <Chip size="small" label={step.status?.replace(/_/g, ' ')} color={statusColor(step.status)} />
                  {step.completedAt && (
                    <Typography variant="caption" color="text.secondary">
                      {new Date(step.completedAt).toLocaleString()}
                    </Typography>
                  )}
                </Box>
              }
            >
              {STEP_LABELS[step.step] || step.step?.replace(/_/g, ' ')}
            </StepLabel>
            {step.comments && (
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 1 }}>
                {step.comments}
              </Typography>
            )}
          </Step>
        ))}
      </Stepper>
      {currentStatus && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          Current status: <strong>{currentStatus.replace(/_/g, ' ')}</strong>
        </Typography>
      )}
    </Box>
  );
}
