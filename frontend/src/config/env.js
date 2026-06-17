const trimSlash = (value) => String(value || '').replace(/\/$/, '');

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const rawApiUrl = import.meta.env.VITE_API_URL || '/api';

/** Axios base URL — path (`/api`) for local proxy, or full URL in production. */
export const API_BASE_URL = trimSlash(rawApiUrl);

/**
 * Backend server origin (protocol + host).
 * Used for document URLs when API is on another host.
 */
export const getApiOrigin = () => {
  if (isAbsoluteUrl(API_BASE_URL)) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return '';
    }
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
};

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PNMC Management System';
