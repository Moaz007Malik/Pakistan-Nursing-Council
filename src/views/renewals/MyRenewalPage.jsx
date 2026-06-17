import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Alert, Grid, Chip,
} from '@mui/material';
import { Autorenew } from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { ROLES } from '../../utils/constants';

export default function MyRenewalPage() {
  const { user } = useSelector((state) => state.auth);
  const [paying, setPaying] = useState(false);

  const entityType = user?.role === ROLES.FACULTY ? 'faculty' : 'student';

  const { data: membership } = useQuery({
    queryKey: ['membership-status'],
    queryFn: () => api.get('/membership/status').then((r) => r.data.data),
    enabled: [ROLES.STUDENT, ROLES.FACULTY].includes(user?.role),
  });

  const { data: entity } = useQuery({
    queryKey: ['my-entity', entityType],
    queryFn: () => api.get(`/${entityType === 'faculty' ? 'faculty' : 'students'}`, { params: { limit: 1 } })
      .then((r) => r.data.data?.[0]),
    enabled: [ROLES.STUDENT, ROLES.FACULTY].includes(user?.role),
  });

  const { data: renewals, refetch } = useQuery({
    queryKey: ['my-renewals'],
    queryFn: () => api.get('/renewals', { params: { limit: 5 } }).then((r) => r.data.data),
  });

  const renewMutation = useMutation({
    mutationFn: () => api.post('/renewals/request', {
      entityType,
      entityId: entity._id,
      institutionId: entity.institution?._id || entity.institution,
    }),
    onSuccess: async (res) => {
      const { checkoutUrl, bypassed } = res.data.data;
      if (bypassed && checkoutUrl) {
        window.location.href = checkoutUrl;
      } else if (checkoutUrl) {
        window.location.href = checkoutUrl;
      }
      refetch();
    },
  });

  const handleRenew = () => {
    if (!entity?._id) return;
    setPaying(true);
    renewMutation.mutate();
  };

  const expired = membership && !membership.active;
  const pendingRenewal = membership?.pendingRenewal || entity?.status === 'pending_renewal';

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Membership Renewal</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Renew your PNMC registration to maintain portal access, attendance, and exam eligibility.
      </Typography>

      {expired && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Your membership has expired. Renew now to restore access.
        </Alert>
      )}
      {pendingRenewal && !expired && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Membership expires in {membership?.daysToExpiry} days. Renew early to avoid blocking.
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Current Membership</Typography>
              {entity ? (
                <>
                  <Typography><strong>Status:</strong> <Chip size="small" label={entity.status} /></Typography>
                  <Typography sx={{ mt: 1 }}>
                    <strong>Expires:</strong> {entity.expiresAt ? new Date(entity.expiresAt).toLocaleDateString() : '—'}
                  </Typography>
                  <Typography sx={{ mt: 1 }}>
                    <strong>Reg. No:</strong> {entity.registrationNumber || 'Pending'}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">No registration record found</Typography>
              )}
              <Button
                variant="contained"
                startIcon={<Autorenew />}
                sx={{ mt: 2 }}
                onClick={handleRenew}
                disabled={!entity?._id || renewMutation.isPending || paying}
              >
                {renewMutation.isPending ? 'Processing...' : 'Renew Membership'}
              </Button>
              {renewMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {renewMutation.error?.response?.data?.message || 'Renewal request failed'}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Renewal History</Typography>
              {(renewals || []).length === 0 ? (
                <Typography color="text.secondary">No renewal requests yet</Typography>
              ) : (
                renewals.map((r) => (
                  <Box key={r._id} sx={{ py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2">{r.renewalYear} — {r.status?.replace(/_/g, ' ')}</Typography>
                    {r.newExpiryDate && (
                      <Typography variant="caption" color="text.secondary">
                        New expiry: {new Date(r.newExpiryDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
