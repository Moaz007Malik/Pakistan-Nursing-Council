const trimSlash = (value) => String(value || '').replace(/\/$/, '');

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const rawApiUrl = import.meta.env.VITE_API_URL || '/api/v1';

/** Axios base URL — path (`/api/v1`) for local proxy, or full URL in production. */
export const API_BASE_URL = trimSlash(rawApiUrl);

/**
 * Backend server origin (protocol + host).
 * Used for sockets, document URLs, and refresh-token calls when API is on another host.
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

/**
 * Socket.IO server URL.
 * Set VITE_SOCKET_URL in production when frontend and backend are on different hosts.
 */
export const getSocketUrl = () => {
  const explicit = import.meta.env.VITE_SOCKET_URL?.trim();
  if (explicit) return trimSlash(explicit);
  return getApiOrigin();
};

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'PNMC Management System';
