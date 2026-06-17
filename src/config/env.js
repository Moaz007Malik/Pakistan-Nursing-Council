const trimSlash = (value) => String(value || '').replace(/\/$/, '');

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';

/** Axios base URL — same origin `/api` in dev (custom server) and production. */
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

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'PNMC Management System';
