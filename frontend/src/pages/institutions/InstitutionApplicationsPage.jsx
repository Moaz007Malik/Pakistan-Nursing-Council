import CrudListPage from '../../components/crud/CrudListPage';
import StatusChip from '../../components/common/StatusChip';
import { INSTITUTION_STATUS_OPTIONS } from '../../utils/crudOptions';

const columns = [
  { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
  { field: 'submittedBy', headerName: 'Submitted By', width: 180, valueGetter: (p) => p.row.submittedBy ? `${p.row.submittedBy.firstName} ${p.row.submittedBy.lastName}` : '-' },
  { field: 'status', headerName: 'Status', width: 160, renderCell: (p) => <StatusChip status={p.value} /> },
  { field: 'createdAt', headerName: 'Date', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
];

const fields = [
  { name: 'institution', label: 'Institution', type: 'institution', required: true },
  { name: 'status', label: 'Status', type: 'select', options: INSTITUTION_STATUS_OPTIONS, defaultValue: 'draft' },
];

export default function InstitutionApplicationsPage() {
  return (
    <CrudListPage
      title="Institution Applications"
      endpoint="institution-applications"
      columns={columns}
      fields={fields}
      mapRowToForm={(row) => ({
        institution: row.institution?._id || row.institution || '',
        status: row.status || 'draft',
      })}
      mapFormToPayload={(form) => ({ institution: form.institution, status: form.status })}
    />
  );
}
