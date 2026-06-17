import { useState } from 'react';
import { Box, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';

const WORKFLOW_CONFIG = {
  institution: {
    endpoint: (id) => `/institution-applications/${id}/workflow`,
    approveLabel: 'Approve / Advance',
    steps: {
      submitted: { roles: ['super_admin', 'council_member'], label: 'Accept for Review' },
      under_review: { roles: ['super_admin', 'council_member'], label: 'Assign Field Inspection' },
      field_inspection_pending: { roles: ['super_admin', 'field_officer'], label: 'Send to Committee' },
      committee_review: { roles: ['super_admin', 'committee_member'], label: 'Committee Approved' },
      council_review: { roles: ['super_admin', 'council_member'], label: 'Council Final Approval' },
    },
  },
  student: {
    endpoint: (id) => `/students/${id}/workflow`,
    approveLabel: 'Approve',
    steps: {
      draft: { roles: ['super_admin', 'institution_admin', 'principal'], label: 'Verify at Institution' },
      institution_verification: { roles: ['super_admin', 'committee_member'], label: 'Committee Verify' },
      committee_verification: { roles: ['super_admin', 'council_member'], label: 'Final Approve' },
    },
  },
  faculty: {
    endpoint: (id) => `/faculty/${id}/workflow`,
    approveLabel: 'Approve',
    steps: {
      draft: { roles: ['super_admin', 'institution_admin', 'principal'], label: 'Institution Approve' },
      institution_approval: { roles: ['super_admin', 'council_member'], label: 'Council Approve' },
    },
  },
};

export default function WorkflowActions({ type, recordId, status, userRole, onSuccess, committeeVote }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState('');
  const [error, setError] = useState('');

  const config = WORKFLOW_CONFIG[type];
  const step = config?.steps[status];
  const canAct = step?.roles.includes(userRole) || userRole === 'super_admin';

  const mutation = useMutation({
    mutationFn: (payload) => {
      if (committeeVote && type === 'institution' && status === 'committee_review') {
        return api.post('/committees/vote', {
          applicationId: recordId,
          vote: payload.action === 'reject' ? 'reject' : 'approve',
          comments: payload.comments,
        });
      }
      return api.post(config.endpoint(recordId), payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setOpen(false);
      setComments('');
      setError('');
      onSuccess?.();
    },
    onError: (err) => setError(err.response?.data?.message || 'Action failed'),
  });

  if (!config || !canAct || ['approved', 'active', 'rejected'].includes(status)) return null;

  const handleAction = (action) => {
    mutation.mutate({ action, comments });
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      <Button
        variant="contained"
        color="success"
        size="small"
        startIcon={<CheckCircle />}
        onClick={() => setOpen(true)}
        disabled={mutation.isPending}
      >
        {step?.label || config.approveLabel}
      </Button>
      <Button
        variant="outlined"
        color="error"
        size="small"
        startIcon={<Cancel />}
        onClick={() => mutation.mutate({ action: 'reject', comments: 'Rejected' })}
        disabled={mutation.isPending}
      >
        Reject
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{step?.label || 'Confirm Action'}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Comments (optional)"
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleAction('approve')} disabled={mutation.isPending}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
