import { useQuery } from '@tanstack/react-query';
import {
  Box, Typography, Grid, Card, CardMedia, CardContent, Button, Skeleton, Chip,
} from '@mui/material';
import { PictureAsPdf, OpenInNew } from '@mui/icons-material';
import { getDocumentUrl } from '../../utils/uploadDocument';

function DocumentPreviewCard({ label, document: doc }) {
  const docId = typeof doc === 'string' ? doc : doc?._id;
  const mimeType = doc?.mimeType || '';
  const name = doc?.originalName || 'Document';

  const { data: url, isLoading, isError } = useQuery({
    queryKey: ['doc-url', docId],
    queryFn: async () => {
      if (doc?.metadata?.secureUrl) return doc.metadata.secureUrl;
      return getDocumentUrl(docId);
    },
    enabled: Boolean(docId),
  });

  const isImage = mimeType.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(name);
  const isPdf = mimeType === 'application/pdf' || /\.pdf$/i.test(name);

  const openFile = () => {
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <Box
        sx={{
          height: 160,
          bgcolor: 'grey.100',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: url ? 'pointer' : 'default',
        }}
        onClick={openFile}
      >
        {isLoading && <Skeleton variant="rectangular" width="100%" height={160} />}
        {!isLoading && isImage && url && (
          <CardMedia component="img" image={url} alt={label} sx={{ maxHeight: 160, objectFit: 'contain' }} />
        )}
        {!isLoading && isPdf && (
          <Box sx={{ textAlign: 'center', color: 'error.main' }}>
            <PictureAsPdf sx={{ fontSize: 48 }} />
            <Typography variant="caption" display="block">PDF</Typography>
          </Box>
        )}
        {!isLoading && !isImage && !isPdf && url && (
          <Typography variant="body2" color="text.secondary">File ready</Typography>
        )}
        {isError && <Typography variant="caption" color="error">Failed to load</Typography>}
      </Box>
      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="subtitle2" noWrap>{label}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap display="block">{name}</Typography>
        <Button
          size="small"
          startIcon={<OpenInNew />}
          onClick={openFile}
          disabled={!url}
          sx={{ mt: 0.5, px: 0 }}
        >
          Open
        </Button>
      </CardContent>
    </Card>
  );
}

export default function DocumentGallery({ items = [], emptyMessage = 'No documents uploaded yet.' }) {
  const validItems = items
    .map(({ label, doc }) => ({ label, doc }))
    .filter(({ doc }) => doc && (typeof doc === 'string' || doc._id));

  if (!validItems.length) {
    return <Typography variant="body2" color="text.secondary">{emptyMessage}</Typography>;
  }

  return (
    <Box>
      <Chip label={`${validItems.length} file(s)`} size="small" sx={{ mb: 2 }} />
      <Grid container spacing={2}>
        {validItems.map(({ label, doc }) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={typeof doc === 'string' ? doc : doc._id}>
            <DocumentPreviewCard label={label} document={doc} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
