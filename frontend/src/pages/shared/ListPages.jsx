import { Typography, Box, Card, CardContent } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import DataTable from '../../components/common/DataTable';
import StatusChip from '../../components/common/StatusChip';

const pageFactory = (title, endpoint, columns) => function Page() {
  const { data, isLoading } = useQuery({
    queryKey: [endpoint],
    queryFn: () => api.get(`/${endpoint}`).then((r) => r.data),
  });
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>{title}</Typography>
      <Card sx={{ mt: 2 }}><CardContent>
        <DataTable rows={data?.data || data || []} columns={columns} loading={isLoading} getRowId={(r) => r._id} />
      </CardContent></Card>
    </Box>
  );
};

export const RenewalsPage = pageFactory('Renewals', 'renewals', [
  { field: 'entityType', headerName: 'Type', width: 120 },
  { field: 'renewalYear', headerName: 'Year', width: 100 },
  { field: 'status', headerName: 'Status', width: 160, renderCell: (p) => <StatusChip status={p.value} /> },
  { field: 'newExpiryDate', headerName: 'New Expiry', width: 140, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
]);

export const AffidavitsPage = pageFactory('Affidavits', 'affidavits', [
  { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
  { field: 'status', headerName: 'Status', width: 160, renderCell: (p) => <StatusChip status={p.value} /> },
  { field: 'createdAt', headerName: 'Uploaded', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
]);

export const CommitteesPage = pageFactory('Committees', 'committees', [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'type', headerName: 'Type', width: 140, valueFormatter: (p) => p.value?.replace(/_/g, ' ') },
  { field: 'isActive', headerName: 'Active', width: 100, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
]);

export const CouncilPage = pageFactory('Council Meetings', 'council/meetings', [
  { field: 'title', headerName: 'Title', flex: 1 },
  { field: 'meetingDate', headerName: 'Date', width: 140, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
]);

export const BiometricPage = pageFactory('Biometric Devices', 'biometric/devices', [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'deviceId', headerName: 'Device ID', width: 150 },
  { field: 'vendor', headerName: 'Vendor', width: 120 },
  { field: 'location', headerName: 'Location', width: 160 },
  { field: 'isActive', headerName: 'Active', width: 100, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
]);

export const MonitoringPage = pageFactory('Camera Streams', 'monitoring/streams', [
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'location', headerName: 'Location', width: 160 },
  { field: 'locationDetail', headerName: 'Detail', width: 180 },
  { field: 'isLive', headerName: 'Live', width: 90, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
]);

export const NotificationsPage = pageFactory('Notifications', 'notifications', [
  { field: 'title', headerName: 'Title', flex: 1 },
  { field: 'type', headerName: 'Type', width: 140 },
  { field: 'isRead', headerName: 'Read', width: 90, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
  { field: 'createdAt', headerName: 'Date', width: 140, valueFormatter: (p) => new Date(p.value).toLocaleString() },
]);

export const AuditLogsPage = pageFactory('Audit Logs', 'audit-logs', [
  { field: 'action', headerName: 'Action', width: 140 },
  { field: 'module', headerName: 'Module', width: 140 },
  { field: 'user', headerName: 'User', width: 160, valueGetter: (p) => p.row.user ? `${p.row.user.firstName} ${p.row.user.lastName}` : 'System' },
  { field: 'ipAddress', headerName: 'IP', width: 130 },
  { field: 'createdAt', headerName: 'Timestamp', width: 170, valueFormatter: (p) => new Date(p.value).toLocaleString() },
]);
