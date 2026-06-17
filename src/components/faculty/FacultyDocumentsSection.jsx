import { useState } from 'react';
import {
  Card, CardContent, Typography, Grid, Button, Box,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import DocumentUploadField from '../common/DocumentUploadField';
import DocumentGallery from '../common/DocumentGallery';

const DOC_FIELDS = [
  { key: 'cnic', label: 'CNIC Copy', category: 'cnic' },
  { key: 'picture', label: 'Passport Photo', category: 'registration' },
  { key: 'registrationCard', label: 'PNC Registration Card', category: 'registration' },
  { key: 'salarySlip', label: 'Salary Slip', category: 'salary_slip' },
];

export function FacultyDocumentsForm({
  institution,
  files,
  setFiles,
  extraDegrees,
  setExtraDegrees,
  extraLicenses,
  setExtraLicenses,
  embedded = false,
}) {
  const content = (
    <>
      {!embedded && (
        <>
          <Typography variant="h6" gutterBottom>Documents (PDF / Images)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload CNIC, photo, degrees, licenses, and salary slip. Files are stored on Cloudinary.
          </Typography>
        </>
      )}
      <Grid container spacing={2}>
        {DOC_FIELDS.map(({ key, label, category }) => (
          <Grid item xs={12} md={6} key={key}>
            <DocumentUploadField
              label={label}
              category={category}
              institution={institution}
              requireInstitution
              document={files[key]}
              onChange={(doc) => setFiles((prev) => ({ ...prev, [key]: doc }))}
            />
          </Grid>
        ))}
      </Grid>

      <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Degree Certificates</Typography>
      {extraDegrees.map((doc, idx) => (
        <DocumentUploadField
          key={doc?._id || `degree-${idx}`}
          label={`Degree ${idx + 1}`}
          category="degree"
          institution={institution}
          requireInstitution
          document={doc}
          onChange={(d) => {
            const next = [...extraDegrees];
            if (d) next[idx] = d;
            else next.splice(idx, 1);
            setExtraDegrees(next);
          }}
        />
      ))}
      <Button
        size="small"
        startIcon={<Add />}
        onClick={() => setExtraDegrees([...extraDegrees, null])}
        disabled={extraDegrees.length > 0 && extraDegrees[extraDegrees.length - 1] == null}
        sx={{ mb: 2 }}
      >
        Add degree certificate
      </Button>

      <Typography variant="subtitle2" sx={{ mb: 1 }}>Nursing Licenses</Typography>
      {extraLicenses.map((doc, idx) => (
        <DocumentUploadField
          key={doc?._id || `license-${idx}`}
          label={`License ${idx + 1}`}
          category="license"
          institution={institution}
          requireInstitution
          document={doc}
          onChange={(d) => {
            const next = [...extraLicenses];
            if (d) next[idx] = d;
            else next.splice(idx, 1);
            setExtraLicenses(next);
          }}
        />
      ))}
      <Button
        size="small"
        startIcon={<Add />}
        onClick={() => setExtraLicenses([...extraLicenses, null])}
        disabled={extraLicenses.length > 0 && extraLicenses[extraLicenses.length - 1] == null}
      >
        Add nursing license
      </Button>
    </>
  );

  if (embedded) return content;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

export function buildFacultyDocumentIds(files, extraDegrees = [], extraLicenses = []) {
  const documents = {};

  if (files.cnic?._id) documents.cnic = files.cnic._id;
  if (files.picture?._id) documents.picture = files.picture._id;
  if (files.registrationCard?._id) documents.registrationCard = files.registrationCard._id;
  if (files.salarySlip?._id) documents.salarySlip = files.salarySlip._id;

  const degrees = extraDegrees.filter((d) => d?._id).map((d) => d._id);
  if (degrees.length) documents.degrees = degrees;

  const licenses = extraLicenses.filter((d) => d?._id).map((d) => d._id);
  if (licenses.length) documents.licenses = licenses;

  return Object.keys(documents).length ? { documents } : {};
}

export default function FacultyDocumentsPanel({ faculty, canEdit = false, canView = true }) {
  const queryClient = useQueryClient();
  const institutionId = faculty.institution?._id || faculty.institution;
  const [files, setFiles] = useState({});
  const [degrees, setDegrees] = useState([]);
  const [licenses, setLicenses] = useState([]);
  const [editing, setEditing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch(`/faculty/${faculty._id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty', faculty._id] });
      setEditing(false);
    },
  });

  const items = [
    { label: 'CNIC Copy', doc: faculty.documents?.cnic },
    { label: 'Passport Photo', doc: faculty.documents?.picture },
    { label: 'PNC Registration Card', doc: faculty.documents?.registrationCard },
    { label: 'Salary Slip', doc: faculty.documents?.salarySlip },
    ...(faculty.documents?.degrees || []).map((doc, i) => ({ label: `Degree ${i + 1}`, doc })),
    ...(faculty.documents?.licenses || []).map((doc, i) => ({ label: `License ${i + 1}`, doc })),
  ].filter((item) => item.doc);

  const hasDocs = items.length > 0;

  if (!canView) return null;

  const startEdit = () => {
    setFiles({
      cnic: faculty.documents?.cnic || null,
      picture: faculty.documents?.picture || null,
      registrationCard: faculty.documents?.registrationCard || null,
      salarySlip: faculty.documents?.salarySlip || null,
    });
    setDegrees([...(faculty.documents?.degrees || [])]);
    setLicenses([...(faculty.documents?.licenses || [])]);
    setEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate(buildFacultyDocumentIds(files, degrees, licenses));
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Documents</Typography>
          {canEdit && !editing && (
            <Button size="small" onClick={startEdit}>
              {hasDocs ? 'Update' : 'Upload'}
            </Button>
          )}
        </Box>

        {editing ? (
          <>
            <FacultyDocumentsForm
              institution={institutionId}
              files={files}
              setFiles={setFiles}
              extraDegrees={degrees}
              setExtraDegrees={setDegrees}
              extraLicenses={licenses}
              setExtraLicenses={setLicenses}
              embedded
            />
            <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
              <Button variant="contained" size="small" onClick={handleSave} disabled={saveMutation.isPending}>
                Save Documents
              </Button>
              <Button size="small" onClick={() => setEditing(false)}>Cancel</Button>
            </Box>
          </>
        ) : hasDocs ? (
          <DocumentGallery items={items} />
        ) : (
          <Typography variant="body2" color="text.secondary">No documents uploaded yet.</Typography>
        )}
      </CardContent>
    </Card>
  );
}
