import { Grid, Typography, Box, Card, CardContent } from '@mui/material';
import { AttachMoney, PendingActions } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StatCard from '../../components/common/StatCard';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

export default function FinanceDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['finance-dashboard'],
    queryFn: () => api.get('/dashboard/finance').then((r) => r.data.data),
  });

  const totalRevenue = data?.revenueByType?.reduce((sum, r) => sum + r.total, 0) || 0;

  const columns = [
    { field: 'invoiceNumber', headerName: 'Invoice', width: 180 },
    { field: 'paymentType', headerName: 'Type', flex: 1, valueFormatter: (p) => p.value?.replace(/_/g, ' ') },
    { field: 'amount', headerName: 'Amount', width: 120, valueFormatter: (p) => `PKR ${p.value?.toLocaleString()}` },
    { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
    { field: 'payer', headerName: 'Payer', width: 160, valueGetter: (p) => p.row.payer ? `${p.row.payer.firstName} ${p.row.payer.lastName}` : '-' },
  ];

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>Finance Dashboard</Typography>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6}><StatCard title="Total Revenue" value={`PKR ${totalRevenue.toLocaleString()}`} icon={<AttachMoney />} color="success.main" loading={isLoading} /></Grid>
        <Grid item xs={12} sm={6}><StatCard title="Pending Payments" value={data?.pendingPayments || 0} icon={<PendingActions />} color="warning.main" loading={isLoading} /></Grid>
      </Grid>
      <Card><CardContent>
        <Typography variant="h6" gutterBottom>Recent Payments</Typography>
        <DataTable rows={data?.recentPayments || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
}
