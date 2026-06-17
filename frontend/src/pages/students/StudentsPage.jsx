import { Button } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import CrudListPage from '../../components/crud/CrudListPage';
import StatusChip from '../../components/common/StatusChip';
import { canRegisterStudents, canViewDocuments } from '../../utils/constants';
import { RECORD_STATUS_OPTIONS } from '../../utils/crudOptions';

const baseColumns = [
  { field: 'registrationNumber', headerName: 'Reg. No', width: 150 },
  { field: 'fullName', headerName: 'Name', flex: 1, valueGetter: (p) => p.row.personalInfo?.fullName },
  { field: 'loginEmail', headerName: 'Login Email', width: 200, valueGetter: (p) => p.row.user?.email || p.row.personalInfo?.email || '-' },
  { field: 'cnic', headerName: 'CNIC', width: 160, valueGetter: (p) => p.row.personalInfo?.cnic },
  { field: 'institution', headerName: 'Institution', width: 200, valueGetter: (p) => p.row.institution?.name },
  { field: 'program', headerName: 'Program', width: 140, valueGetter: (p) => p.row.programInfo?.course },
  { field: 'attendance', headerName: 'Attendance', width: 110, valueGetter: (p) => `${p.row.attendancePercentage || 0}%` },
  { field: 'documentCount', headerName: 'Files', width: 90, valueFormatter: (p) => (p.value ? `${p.value}` : '0') },
  { field: 'status', headerName: 'Status', width: 140, renderCell: (p) => <StatusChip status={p.value} /> },
];

const fields = [
  { name: 'fullName', label: 'Full Name', required: true },
  { name: 'cnic', label: 'CNIC', required: true },
  { name: 'loginEmail', label: 'Login Email', type: 'email' },
  { name: 'loginPassword', label: 'New Password', type: 'password' },
  { name: 'contact', label: 'Contact' },
  { name: 'course', label: 'Course', defaultValue: 'BSN' },
  { name: 'status', label: 'Status', type: 'select', options: RECORD_STATUS_OPTIONS, defaultValue: 'active' },
];

export default function StudentsPage() {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const showRegister = canRegisterStudents(user?.role);
  const columns = canViewDocuments(user?.role)
    ? baseColumns
    : baseColumns.filter((c) => c.field !== 'documentCount');

  return (
    <CrudListPage
      title="Students"
      endpoint="students"
      columns={columns}
      fields={fields}
      showCreate={false}
      extraHeader={showRegister ? (
        <Button variant="contained" startIcon={<Add />} onClick={() => navigate('/students/register')}>
          Register Student
        </Button>
      ) : null}
      mapRowToForm={(row) => ({
        fullName: row.personalInfo?.fullName || '',
        cnic: row.personalInfo?.cnic || '',
        loginEmail: row.user?.email || row.personalInfo?.email || '',
        loginPassword: '',
        contact: row.personalInfo?.contact || '',
        course: row.programInfo?.course || 'BSN',
        status: row.status || 'draft',
      })}
      mapFormToPayload={(form, row) => ({
        status: form.status,
        ...(form.loginEmail ? { loginEmail: form.loginEmail } : {}),
        ...(form.loginPassword ? { loginPassword: form.loginPassword } : {}),
        personalInfo: {
          ...row?.personalInfo,
          fullName: form.fullName,
          cnic: form.cnic,
          contact: form.contact,
          email: form.loginEmail || row?.personalInfo?.email,
        },
        programInfo: {
          ...row?.programInfo,
          course: form.course,
        },
      })}
      detailPath={(row) => `/students/${row._id}`}
    />
  );
}
