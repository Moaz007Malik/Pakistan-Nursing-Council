import CrudListPage from '../../components/crud/CrudListPage';
import StatusChip from '../../components/common/StatusChip';
import { INSPECTION_STATUS_OPTIONS } from '../../utils/crudOptions';

const columns = [
  { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name },
  { field: 'fieldOfficer', headerName: 'Officer', width: 160, valueGetter: (p) => p.row.fieldOfficer ? `${p.row.fieldOfficer.firstName} ${p.row.fieldOfficer.lastName}` : '-' },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
  { field: 'overallScore', headerName: 'Score', width: 90 },
  { field: 'recommendation', headerName: 'Recommendation', width: 150, valueFormatter: (p) => p.value?.replace(/_/g, ' ') || '-' },
  { field: 'visitDate', headerName: 'Visit Date', width: 130, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
];

const fields = [
  { name: 'institution', label: 'Institution', type: 'institution', required: true },
  { name: 'status', label: 'Status', type: 'select', options: INSPECTION_STATUS_OPTIONS, defaultValue: 'assigned' },
  { name: 'overallScore', label: 'Overall Score', type: 'number' },
  { name: 'recommendation', label: 'Recommendation' },
  { name: 'visitDate', label: 'Visit Date', type: 'date' },
];

export default function InspectionsPage() {
  return (
    <CrudListPage
      title="Field Inspections"
      endpoint="inspections"
      columns={columns}
      fields={fields}
      mapRowToForm={(row) => ({
        institution: row.institution?._id || row.institution || '',
        status: row.status || 'assigned',
        overallScore: row.overallScore ?? '',
        recommendation: row.recommendation || '',
        visitDate: row.visitDate ? row.visitDate.split('T')[0] : '',
      })}
      mapFormToPayload={(form) => ({
        institution: form.institution,
        status: form.status,
        overallScore: form.overallScore ? Number(form.overallScore) : undefined,
        recommendation: form.recommendation || undefined,
        visitDate: form.visitDate || undefined,
      })}
      detailPath={(row) => `/inspections/${row._id}`}
    />
  );
}
