import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: () => api.get('/payments').then((r) => r.data),
  });

  const columns = [
    { field: 'invoiceNumber', headerName: 'Invoice', width: 180 },
    { field: 'paymentType', headerName: 'Type', flex: 1, valueFormatter: (p) => p.value?.replace(/_/g, ' ') },
    { field: 'gateway', headerName: 'Gateway', width: 120 },
    { field: 'amount', headerName: 'Amount', width: 130, valueFormatter: (p) => `PKR ${p.value?.toLocaleString()}` },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'paidAt', headerName: 'Paid At', width: 130, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Payments</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Stripe / Easypaisa / JazzCash</Typography>
      <Card><CardContent>
        <DataTable rows={data?.data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
