import { useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import DataTable from '../common/DataTable';
import { ROLES } from '../../utils/constants';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {string} props.endpoint - API path without leading slash
 * @param {string} [props.queryKey]
 * @param {Array} props.columns - DataGrid columns (without actions)
 * @param {Array} [props.fields] - Form fields; when provided, admin gets add/edit/delete
 * @param {Function} [props.mapRowToForm]
 * @param {Function} [props.mapFormToPayload]
 * @param {React.ReactNode} [props.extraHeader]
 * @param {object} [props.listParams]
 * @param {boolean} [props.showCreate=true]
 */
export default function CrudListPage({
  title,
  subtitle,
  endpoint,
  queryKey,
  columns,
  fields = [],
  mapRowToForm,
  mapFormToPayload,
  extraHeader,
  listParams,
  showCreate = true,
  allowDelete = false,
}) {
  const queryClient = useQueryClient();
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === ROLES.SUPER_ADMIN;
  const canCrud = isAdmin && (fields.length > 0 || allowDelete);
  const canEdit = isAdmin && fields.length > 0;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState('');

  const qk = queryKey || endpoint;

  const { data, isLoading } = useQuery({
    queryKey: [qk, listParams],
    queryFn: () => api.get(`/${endpoint}`, { params: listParams }).then((r) => r.data),
  });

  const needsInstitutions = canCrud && fields.some((f) => f.type === 'institution');
  const { data: institutions = [] } = useQuery({
    queryKey: ['institutions-picker'],
    queryFn: () => api.get('/institutions', { params: { limit: 100 } }).then((r) => r.data.data),
    enabled: needsInstitutions,
  });

  const rows = data?.data ?? (Array.isArray(data) ? data : []);

  const saveMutation = useMutation({
    mutationFn: (payload) => (editing
      ? api.patch(`/${endpoint}/${editing._id}`, payload)
      : api.post(`/${endpoint}`, payload)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [qk] });
      setDialogOpen(false);
      setEditing(null);
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Save failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/${endpoint}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [qk] }),
  });

  const defaultForm = () => fields.reduce((acc, f) => {
    acc[f.name] = f.defaultValue ?? '';
    return acc;
  }, {});

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm(mapRowToForm ? mapRowToForm(row) : fields.reduce((acc, f) => {
      acc[f.name] = row[f.name] ?? '';
      return acc;
    }, {}));
    setError('');
    setDialogOpen(true);
  };

  const handleSave = () => {
    const missing = fields.filter((f) => f.required && !form[f.name]);
    if (missing.length) {
      setError(`Please fill: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    const payload = mapFormToPayload ? mapFormToPayload(form, editing) : form;
    saveMutation.mutate(payload);
  };

  const handleDelete = (row) => {
    if (window.confirm('Delete this record? This cannot be undone.')) {
      deleteMutation.mutate(row._id);
    }
  };

  const actionColumn = canCrud ? [{
    field: '_actions',
    headerName: 'Actions',
    width: canEdit ? 110 : 70,
    sortable: false,
    renderCell: (p) => (
      <Box>
        {canEdit && (
          <IconButton size="small" onClick={() => openEdit(p.row)} aria-label="Edit">
            <Edit fontSize="small" />
          </IconButton>
        )}
        <IconButton size="small" color="error" onClick={() => handleDelete(p.row)} aria-label="Delete">
          <Delete fontSize="small" />
        </IconButton>
      </Box>
    ),
  }] : [];

  const renderField = (field) => {
    const value = form[field.name] ?? '';
    const onChange = (e) => setForm({ ...form, [field.name]: e.target.value });

    if (field.type === 'select') {
      return (
        <TextField
          key={field.name}
          select
          fullWidth
          label={field.label}
          value={value}
          onChange={onChange}
          required={field.required}
          sx={{ mb: 2 }}
        >
          {(field.options || []).map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      );
    }

    if (field.type === 'institution') {
      return (
        <TextField
          key={field.name}
          select
          fullWidth
          label={field.label}
          value={value}
          onChange={onChange}
          required={field.required}
          sx={{ mb: 2 }}
        >
          {institutions.map((inst) => (
            <MenuItem key={inst._id} value={inst._id}>{inst.name}</MenuItem>
          ))}
        </TextField>
      );
    }

    return (
      <TextField
        key={field.name}
        fullWidth
        label={field.label}
        type={field.type || 'text'}
        value={value}
        onChange={onChange}
        required={field.required}
        multiline={field.multiline}
        rows={field.rows}
        InputLabelProps={field.type === 'date' ? { shrink: true } : undefined}
        sx={{ mb: 2 }}
      />
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: subtitle ? 1 : 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {extraHeader}
          {canEdit && showCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add</Button>
          )}
        </Box>
      </Box>

      <Card sx={{ mt: subtitle ? 2 : 0 }}>
        <CardContent>
          <DataTable
            rows={rows}
            columns={[...columns, ...actionColumn]}
            loading={isLoading}
            getRowId={(r) => r._id}
          />
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? `Edit ${title}` : `Add ${title}`}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box sx={{ pt: 1 }}>
            {fields.map(renderField)}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
