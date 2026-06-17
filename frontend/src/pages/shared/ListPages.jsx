import CrudListPage from '../../components/crud/CrudListPage';
import StatusChip from '../../components/common/StatusChip';
import {
  RECORD_STATUS_OPTIONS, COMMITTEE_TYPE_OPTIONS, COUNCIL_STATUS_OPTIONS,
  VENDOR_OPTIONS, LOCATION_OPTIONS, INSTITUTION_STATUS_OPTIONS,
} from '../../utils/crudOptions';

const statusCol = { field: 'status', headerName: 'Status', width: 160, renderCell: (p) => <StatusChip status={p.value} /> };
const institutionCol = { field: 'institution', headerName: 'Institution', flex: 1, valueGetter: (p) => p.row.institution?.name };

export function RenewalsPage() {
  return (
    <CrudListPage
      title="Renewals"
      endpoint="renewals"
      columns={[
        { field: 'entityType', headerName: 'Type', width: 120 },
        { field: 'renewalYear', headerName: 'Year', width: 100 },
        statusCol,
        { field: 'newExpiryDate', headerName: 'New Expiry', width: 140, valueFormatter: (p) => p.value ? new Date(p.value).toLocaleDateString() : '-' },
      ]}
      fields={[
        { name: 'entityType', label: 'Entity Type', type: 'select', required: true, options: [
          { value: 'student', label: 'Student' }, { value: 'faculty', label: 'Faculty' }, { value: 'institution', label: 'Institution' },
        ] },
        { name: 'entityId', label: 'Entity ID', required: true },
        { name: 'status', label: 'Status', type: 'select', options: RECORD_STATUS_OPTIONS, defaultValue: 'pending' },
      ]}
      mapRowToForm={(row) => ({
        entityType: row.entityType || 'student',
        entityId: row.entityId || '',
        status: row.status || 'pending',
      })}
    />
  );
}

export function AffidavitsPage() {
  return (
    <CrudListPage
      title="Affidavits"
      endpoint="affidavits"
      columns={[
        institutionCol,
        statusCol,
        { field: 'createdAt', headerName: 'Uploaded', width: 130, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
      ]}
      fields={[
        { name: 'institution', label: 'Institution', type: 'institution', required: true },
        { name: 'status', label: 'Status', type: 'select', options: INSTITUTION_STATUS_OPTIONS, defaultValue: 'draft' },
      ]}
      mapRowToForm={(row) => ({
        institution: row.institution?._id || row.institution || '',
        status: row.status || 'draft',
      })}
      mapFormToPayload={(form) => ({ institution: form.institution, status: form.status })}
    />
  );
}

export function CommitteesPage() {
  return (
    <CrudListPage
      title="Committees"
      endpoint="committees"
      listParams={{ all: 'true' }}
      columns={[
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'type', headerName: 'Type', width: 140, valueFormatter: (p) => p.value?.replace(/_/g, ' ') },
        { field: 'isActive', headerName: 'Active', width: 100, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
      ]}
      fields={[
        { name: 'name', label: 'Committee Name', required: true },
        { name: 'type', label: 'Type', type: 'select', required: true, options: COMMITTEE_TYPE_OPTIONS, defaultValue: 'academic' },
        { name: 'isActive', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], defaultValue: 'true' },
      ]}
      mapRowToForm={(row) => ({
        name: row.name || '',
        type: row.type || 'academic',
        isActive: String(row.isActive !== false),
      })}
      mapFormToPayload={(form) => ({
        name: form.name,
        type: form.type,
        isActive: form.isActive === 'true',
      })}
    />
  );
}

export function CouncilPage() {
  return (
    <CrudListPage
      title="Council Meetings"
      endpoint="council/meetings"
      columns={[
        { field: 'title', headerName: 'Title', flex: 1 },
        { field: 'meetingDate', headerName: 'Date', width: 140, valueFormatter: (p) => new Date(p.value).toLocaleDateString() },
        statusCol,
      ]}
      fields={[
        { name: 'title', label: 'Meeting Title', required: true },
        { name: 'meetingDate', label: 'Meeting Date', type: 'date', required: true },
        { name: 'status', label: 'Status', type: 'select', options: COUNCIL_STATUS_OPTIONS, defaultValue: 'scheduled' },
        { name: 'venue', label: 'Venue' },
      ]}
      mapRowToForm={(row) => ({
        title: row.title || '',
        meetingDate: row.meetingDate ? row.meetingDate.split('T')[0] : '',
        status: row.status || 'scheduled',
        venue: row.venue || '',
      })}
    />
  );
}

export function BiometricPage() {
  return (
    <CrudListPage
      title="Biometric Devices"
      endpoint="biometric/devices"
      columns={[
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'deviceId', headerName: 'Device ID', width: 150 },
        { field: 'vendor', headerName: 'Vendor', width: 120 },
        { field: 'location', headerName: 'Location', width: 160 },
        { field: 'isActive', headerName: 'Active', width: 100, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
      ]}
      fields={[
        { name: 'name', label: 'Device Name', required: true },
        { name: 'deviceId', label: 'Device ID', required: true },
        { name: 'vendor', label: 'Vendor', type: 'select', options: VENDOR_OPTIONS, defaultValue: 'zkteco' },
        { name: 'institution', label: 'Institution', type: 'institution', required: true },
        { name: 'ipAddress', label: 'IP Address' },
        { name: 'location', label: 'Location' },
        { name: 'isActive', label: 'Active', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], defaultValue: 'true' },
      ]}
      mapRowToForm={(row) => ({
        name: row.name || '',
        deviceId: row.deviceId || '',
        vendor: row.vendor || 'zkteco',
        institution: row.institution?._id || row.institution || '',
        ipAddress: row.ipAddress || '',
        location: row.location || '',
        isActive: String(row.isActive !== false),
      })}
      mapFormToPayload={(form) => ({
        name: form.name,
        deviceId: form.deviceId,
        vendor: form.vendor,
        institution: form.institution,
        ipAddress: form.ipAddress || undefined,
        location: form.location || undefined,
        isActive: form.isActive === 'true',
      })}
    />
  );
}

export function MonitoringPage() {
  return (
    <CrudListPage
      title="Camera Streams"
      endpoint="monitoring/streams"
      columns={[
        { field: 'name', headerName: 'Name', flex: 1 },
        { field: 'location', headerName: 'Location', width: 160 },
        { field: 'locationDetail', headerName: 'Detail', width: 180 },
        { field: 'isLive', headerName: 'Live', width: 90, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
      ]}
      fields={[
        { name: 'name', label: 'Stream Name', required: true },
        { name: 'institution', label: 'Institution', type: 'institution', required: true },
        { name: 'location', label: 'Location', type: 'select', options: LOCATION_OPTIONS, defaultValue: 'classroom' },
        { name: 'locationDetail', label: 'Location Detail' },
        { name: 'streamUrl', label: 'Stream URL' },
        { name: 'isLive', label: 'Live', type: 'select', options: [{ value: 'true', label: 'Yes' }, { value: 'false', label: 'No' }], defaultValue: 'false' },
      ]}
      mapRowToForm={(row) => ({
        name: row.name || '',
        institution: row.institution?._id || row.institution || '',
        location: row.location || 'classroom',
        locationDetail: row.locationDetail || '',
        streamUrl: row.streamUrl || '',
        isLive: String(!!row.isLive),
      })}
      mapFormToPayload={(form) => ({
        name: form.name,
        institution: form.institution,
        location: form.location,
        locationDetail: form.locationDetail || undefined,
        streamUrl: form.streamUrl || undefined,
        isLive: form.isLive === 'true',
      })}
    />
  );
}

export function NotificationsPage() {
  return (
    <CrudListPage
      title="Notifications"
      endpoint="notifications"
      columns={[
        { field: 'title', headerName: 'Title', flex: 1 },
        { field: 'type', headerName: 'Type', width: 140 },
        { field: 'isRead', headerName: 'Read', width: 90, valueFormatter: (p) => p.value ? 'Yes' : 'No' },
        { field: 'createdAt', headerName: 'Date', width: 140, valueFormatter: (p) => new Date(p.value).toLocaleString() },
      ]}
      fields={[]}
      showCreate={false}
      allowDelete
    />
  );
}

export function AuditLogsPage() {
  return (
    <CrudListPage
      title="Audit Logs"
      endpoint="audit-logs"
      columns={[
        { field: 'action', headerName: 'Action', width: 140 },
        { field: 'module', headerName: 'Module', width: 140 },
        { field: 'user', headerName: 'User', width: 160, valueGetter: (p) => p.row.user ? `${p.row.user.firstName} ${p.row.user.lastName}` : 'System' },
        { field: 'ipAddress', headerName: 'IP', width: 130 },
        { field: 'createdAt', headerName: 'Timestamp', width: 170, valueFormatter: (p) => new Date(p.value).toLocaleString() },
      ]}
      fields={[]}
      showCreate={false}
    />
  );
}
