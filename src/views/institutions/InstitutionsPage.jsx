import CrudListPage from '../../components/crud/CrudListPage';
import StatusChip from '../../components/common/StatusChip';
import {
  INSTITUTION_TYPE_OPTIONS, INSTITUTION_STATUS_OPTIONS,
} from '../../utils/crudOptions';

const columns = [
  { field: 'registrationNumber', headerName: 'Reg. No', width: 150 },
  { field: 'name', headerName: 'Name', flex: 1 },
  { field: 'institutionType', headerName: 'Type', width: 180, valueFormatter: (p) => INSTITUTION_TYPE_OPTIONS.find((o) => o.value === p.value)?.label || p.value },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'phone', headerName: 'Phone', width: 140 },
  { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip status={p.value} /> },
];

const fields = [
  { name: 'name', label: 'Institution Name', required: true },
  { name: 'institutionType', label: 'Type', type: 'select', required: true, options: INSTITUTION_TYPE_OPTIONS, defaultValue: 'college_of_nursing' },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone' },
  { name: 'principalName', label: 'Principal Name' },
  { name: 'establishedYear', label: 'Established Year', type: 'number' },
  { name: 'status', label: 'Status', type: 'select', options: INSTITUTION_STATUS_OPTIONS, defaultValue: 'draft' },
];

export default function InstitutionsPage() {
  return (
    <CrudListPage
      title="Institutions"
      endpoint="institutions"
      columns={columns}
      fields={fields}
      mapFormToPayload={(form) => ({
        ...form,
        establishedYear: form.establishedYear ? Number(form.establishedYear) : undefined,
        address: { city: '', province: '', country: 'Pakistan' },
      })}
    />
  );
}
