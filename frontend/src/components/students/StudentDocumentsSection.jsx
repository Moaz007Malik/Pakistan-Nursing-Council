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
  { key: 'matric', label: 'Matric Certificate', category: 'certificate' },
  { key: 'fsc', label: 'FSC / Intermediate Certificate', category: 'certificate' },
];

export function StudentDocumentsForm({
  institution,
  files,
  setFiles,
  extraCertificates,
  setExtraCertificates,
  embedded = false,
}) {
  const content = (
    <>
      {!embedded && (
        <>
          <Typography variant="h6" gutterBottom>Documents (PDF / Images)</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Upload CNIC, photo, and academic certificates. Files are stored on Cloudinary.
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

        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Additional Certificates</Typography>
        {extraCertificates.map((doc, idx) => (
          <DocumentUploadField
            key={doc?._id || `extra-${idx}`}
            label={`Certificate ${idx + 1}`}
            category="certificate"
            institution={institution}
            requireInstitution
            document={doc}
            onChange={(d) => {
              const next = [...extraCertificates];
              if (d) next[idx] = d;
              else next.splice(idx, 1);
              setExtraCertificates(next);
            }}
          />
        ))}
        <Button
          size="small"
          startIcon={<Add />}
          onClick={() => setExtraCertificates([...extraCertificates, null])}
          disabled={extraCertificates.length > 0 && extraCertificates[extraCertificates.length - 1] == null}
        >
          Add another certificate
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

export function buildStudentDocumentIds(files, extraCertificates = []) {
  const payload = { documents: {}, academicInfo: {} };

  if (files.cnic?._id) payload.documents.cnic = files.cnic._id;
  if (files.picture?._id) payload.documents.picture = files.picture._id;

  const certs = extraCertificates.filter((d) => d?._id).map((d) => d._id);
  if (certs.length) payload.documents.certificates = certs;

  if (files.matric?._id) {
    payload.academicInfo.matric = { certificate: files.matric._id };
  }
  if (files.fsc?._id) {
    payload.academicInfo.fsc = { certificate: files.fsc._id };
  }

  return payload;
}

export default function StudentDocumentsPanel({ student, canEdit = false, canView = true }) {
  const queryClient = useQueryClient();
  const institutionId = student.institution?._id || student.institution;
  const [files, setFiles] = useState({});
  const [extra, setExtra] = useState([]);
  const [editing, setEditing] = useState(false);

  const saveMutation = useMutation({
    mutationFn: (payload) => api.patch(`/students/${student._id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', student._id] });
      setEditing(false);
    },
  });

  const items = [
    { label: 'CNIC Copy', doc: student.documents?.cnic },
    { label: 'Passport Photo', doc: student.documents?.picture },
    { label: 'Matric Certificate', doc: student.academicInfo?.matric?.certificate },
    { label: 'FSC Certificate', doc: student.academicInfo?.fsc?.certificate },
    ...(student.documents?.certificates || []).map((doc, i) => ({
      label: `Certificate ${i + 1}`,
      doc,
    })),
  ].filter((item) => item.doc);

  const hasDocs = items.length > 0;

  if (!canView) return null;

  const startEdit = () => {
    setFiles({
      cnic: student.documents?.cnic || null,
      picture: student.documents?.picture || null,
      matric: student.academicInfo?.matric?.certificate || null,
      fsc: student.academicInfo?.fsc?.certificate || null,
    });
    setExtra([...(student.documents?.certificates || [])]);
    setEditing(true);
  };

  const handleSave = () => {
    saveMutation.mutate(buildStudentDocumentIds(files, extra));
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
            <StudentDocumentsForm
              institution={institutionId}
              files={files}
              setFiles={setFiles}
              extraCertificates={extra}
              setExtraCertificates={setExtra}
              embedded
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
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
