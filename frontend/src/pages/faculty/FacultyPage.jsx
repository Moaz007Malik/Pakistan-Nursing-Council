import { Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CrudListPage from '../../components/crud/CrudListPage';
import StatusChip from '../../components/common/StatusChip';
import { canRegisterFaculty, canViewDocuments } from '../../utils/constants';
import { RECORD_STATUS_OPTIONS } from '../../utils/crudOptions';

const baseColumns = [
  { field: 'registrationNumber', headerName: 'Reg. No', width: 150 },
  { field: 'fullName', headerName: 'Name', flex: 1, valueGetter: (p) => p.row.personalInfo?.fullName },
  { field: 'loginEmail', headerName: 'Login Email', width: 200, valueGetter: (p) => p.row.user?.email || p.row.personalInfo?.email || '-' },
  { field: 'cnic', headerName: 'CNIC', width: 160, valueGetter: (p) => p.row.personalInfo?.cnic },
  { field: 'designation', headerName: 'Designation', width: 160, valueGetter: (p) => p.row.professionalInfo?.designation },
  { field: 'qualification', headerName: 'Qualification', width: 160, valueGetter: (p) => p.row.professionalInfo?.qualification },
  { field: 'institution', headerName: 'Institution', width: 180, valueGetter: (p) => p.row.institution?.name },
  { field: 'documentCount', headerName: 'Files', width: 90, valueFormatter: (p) => (p.value ? `${p.value}` : '0') },
  { field: 'status', headerName: 'Status', width: 130, renderCell: (p) => <StatusChip status={p.value} /> },
];

const fields = [
  { name: 'fullName', label: 'Full Name', required: true },
  { name: 'cnic', label: 'CNIC', required: true },
  { name: 'loginEmail', label: 'Login Email', type: 'email' },
  { name: 'loginPassword', label: 'New Password', type: 'password' },
  { name: 'designation', label: 'Designation' },
  { name: 'qualification', label: 'Qualification' },
  { name: 'institution', label: 'Institution', type: 'institution' },
  { name: 'status', label: 'Status', type: 'select', options: RECORD_STATUS_OPTIONS, defaultValue: 'active' },
];

export default function FacultyPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const showRegister = canRegisterFaculty(user?.role);
  const columns = canViewDocuments(user?.role)
    ? baseColumns
    : baseColumns.filter((c) => c.field !== 'documentCount');

  return (
    <CrudListPage
      title="Faculty Management"
      subtitle="Based on PNC Faculty Registration Form 2020"
      endpoint="faculty"
      columns={columns}
      fields={fields}
      showCreate={false}
      extraHeader={showRegister ? (
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/faculty/register')}>
          Register Faculty
        </Button>
      ) : null}
      mapRowToForm={(row) => ({
        fullName: row.personalInfo?.fullName || '',
        cnic: row.personalInfo?.cnic || '',
        loginEmail: row.user?.email || row.personalInfo?.email || '',
        loginPassword: '',
        designation: row.professionalInfo?.designation || '',
        qualification: row.professionalInfo?.qualification || '',
        institution: row.institution?._id || row.institution || '',
        status: row.status || 'draft',
      })}
      mapFormToPayload={(form, row) => ({
        status: form.status,
        institution: form.institution || undefined,
        ...(form.loginEmail ? { loginEmail: form.loginEmail } : {}),
        ...(form.loginPassword ? { loginPassword: form.loginPassword } : {}),
        personalInfo: {
          ...row?.personalInfo,
          fullName: form.fullName,
          cnic: form.cnic,
          email: form.loginEmail || row?.personalInfo?.email,
        },
        professionalInfo: {
          ...row?.professionalInfo,
          designation: form.designation,
          qualification: form.qualification,
        },
      })}
      detailPath={(row) => `/faculty/${row._id}`}
    />
  );
}
