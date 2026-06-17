import { INSTITUTION_TYPES } from './constants';

const status = (values) => values.map((v) => ({
  value: v,
  label: v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
}));

export const INSTITUTION_TYPE_OPTIONS = Object.entries(INSTITUTION_TYPES).map(([value, label]) => ({ value, label }));

export const INSTITUTION_STATUS_OPTIONS = status([
  'draft', 'submitted', 'under_review', 'field_inspection_pending',
  'committee_review', 'council_review', 'approved', 'rejected', 'suspended', 'expired',
]);

export const RECORD_STATUS_OPTIONS = status([
  'draft', 'submitted', 'under_review', 'approved', 'active', 'rejected', 'suspended', 'expired',
]);

export const INSPECTION_STATUS_OPTIONS = status([
  'assigned', 'in_progress', 'submitted', 'reviewed', 'approved', 'rejected',
]);

export const COMMITTEE_TYPE_OPTIONS = status([
  'academic', 'selection', 'discipline', 'social', 'finance', 'inspection',
]);

export const COUNCIL_STATUS_OPTIONS = status(['scheduled', 'in_progress', 'completed', 'cancelled']);

export const VENDOR_OPTIONS = [
  { value: 'zkteco', label: 'ZKTeco' },
  { value: 'hikvision', label: 'Hikvision' },
  { value: 'suprema', label: 'Suprema' },
  { value: 'other', label: 'Other' },
];

export const LOCATION_OPTIONS = status([
  'classroom', 'lab', 'auditorium', 'entrance', 'office', 'other',
]);
