import { Typography, Box, Card, CardContent, Alert, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function PaymentsPage() {
  const { data: config } = useQuery({
    queryKey: ['payments-config'],
    queryFn: () => api.get('/payments/config').then((r) => r.data.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const columns = [
    { field: 'invoiceNumber', headerName: 'Invoice', width: 180 },
    { field: 'paymentType', headerName: 'Type', flex: 1, valueFormatter: (p) => p.value?.replace(/_/g, ' ') },
    { field: 'gateway', headerName: 'Gateway', width: 120, valueFormatter: (p) => p.value === 'bypass' ? 'Auto-pass' : p.value },
    { field: 'amount', headerName: 'Amount', width: 130, valueFormatter: (p) => `PKR ${p.value?.toLocaleString()}` },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'paidAt', headerName: 'Paid At', width: 130, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h5" fontWeight={700}>Payments</Typography>
        {config && (
          <Chip
            label={config.enabled ? 'Gateways Enabled' : 'Bypass Mode'}
            color={config.enabled ? 'success' : 'warning'}
            size="small"
          />
        )}
      </Box>

      {config && !config.enabled && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Payment gateways are <strong>disabled</strong> ({`PAYMENTS_ENABLED=false`}).
          All payments auto-complete without real charges — useful for development and staging.
        </Alert>
      )}

      {config?.enabled && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Live mode: Stripe / Easypaisa / JazzCash — {config.availableGateways?.join(', ') || 'none configured'}
        </Typography>
      )}

      <Card><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
