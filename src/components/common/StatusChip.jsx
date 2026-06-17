import { Chip } from '@mui/material';
import { STATUS_COLORS } from '../../utils/constants';

export default function StatusChip({ status }) {
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
  return <Chip label={label} color={STATUS_COLORS[status] || 'default'} size="small" />;
}
