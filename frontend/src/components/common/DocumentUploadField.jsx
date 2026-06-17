import { useState, useRef } from 'react';
import {
  Box, Typography, Button, LinearProgress, Alert, Chip, IconButton,
} from '@mui/material';
import { CloudUpload, Close, OpenInNew } from '@mui/icons-material';
import { uploadDocument, getDocumentUrl, resolveDocumentUrl, ACCEPT_PDF_IMAGE } from '../../utils/uploadDocument';

export default function DocumentUploadField({
  label,
  helperText,
  category = 'other',
  institution,
  accept = ACCEPT_PDF_IMAGE,
  document,
  onChange,
  disabled = false,
  requireInstitution = false,
}) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setError('Only PDF and image files (JPG, PNG, WebP) are allowed');
      return;
    }

    setError('');
    setUploading(true);
    try {
      const doc = await uploadDocument(file, { category, institution });
      onChange?.(doc);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const openDocument = async () => {
    if (!document?._id) return;
    try {
      const url = resolveDocumentUrl(document.viewUrl)
        || document.metadata?.secureUrl
        || await getDocumentUrl(document._id);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      setError('Could not open file');
    }
  };

  const clear = () => onChange?.(null);

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>{label}</Typography>
      {helperText && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {helperText}
        </Typography>
      )}

      {document ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={document.originalName || 'Uploaded'}
            color="success"
            variant="outlined"
            onClick={openDocument}
            onDelete={disabled ? undefined : clear}
            deleteIcon={disabled ? undefined : <Close />}
          />
          <IconButton size="small" onClick={openDocument} aria-label="Open file">
            <OpenInNew fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUpload />}
          disabled={disabled || uploading || (requireInstitution && !institution)}
          size="small"
        >
          {uploading ? 'Uploading...' : 'Choose PDF or Image'}
          <input
            ref={inputRef}
            type="file"
            hidden
            accept={accept}
            onChange={handleFile}
            disabled={disabled || uploading || (requireInstitution && !institution)}
          />
        </Button>
      )}

      {uploading && <LinearProgress sx={{ mt: 1 }} />}
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}
