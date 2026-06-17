import api from '../services/api';
import { API_BASE_URL } from '../config/env';

export function resolveDocumentUrl(url) {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  if (url.startsWith('/api/')) return `${origin}${url}`;
  if (url.startsWith('/')) return `${origin}${API_BASE_URL.replace(/\/api\/v1$/, '')}${url}`;
  return url;
}

export async function getDocumentUrl(documentId) {
  const { data } = await api.get(`/documents/${documentId}/url`);
  return resolveDocumentUrl(data.data.url);
}

export function resolveInstitutionId(institution) {
  if (!institution) return null;
  if (typeof institution === 'string') {
    return institution === '[object Object]' ? null : institution;
  }
  if (typeof institution === 'object' && institution._id) {
    return String(institution._id);
  }
  return null;
}

export async function uploadDocument(file, { category = 'other', institution } = {}) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  const institutionId = resolveInstitutionId(institution);
  if (institutionId) formData.append('institution', institutionId);

  const { data } = await api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data;
}

export const ACCEPT_PDF_IMAGE = 'image/jpeg,image/png,image/webp,image/gif,application/pdf';
