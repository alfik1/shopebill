// src/services/apiService.js
// Smart fetch wrapper — auto refreshes token on 401

import tokenService        from './tokenService';
import { refreshAccessToken, logout } from '../controllers/authController';

/**
 * Drop-in replacement for fetch().
 * - Attaches Authorization header automatically
 * - On 401 → refreshes access token → retries once
 * - On refresh failure → logs out user
 */
export async function authFetch(url, options = {}) {
  console.debug('[ApiService] authFetch() → url:', url);

  // Build headers with current access token
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    Authorization: `Bearer ${tokenService.getAccessToken()}`,
  };

  let response = await fetch(url, { ...options, headers });
  console.debug('[ApiService] authFetch() → response status:', response.status);

  // ── Token expired → refresh and retry once ──────────────────────────────
  if (response.status === 401) {
    console.warn('[ApiService] authFetch() → 401 received, attempting token refresh...');

    try {
      const newAccessToken = await refreshAccessToken();
      console.debug('[ApiService] authFetch() → token refreshed, retrying request');

      // Retry the original request with new token
      response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          Authorization: `Bearer ${newAccessToken}`,
        },
      });

      console.debug('[ApiService] authFetch() → retry response status:', response.status);
    } catch (err) {
      console.error('[ApiService] authFetch() → refresh failed, logging out:', err.message);
      logout();
      window.location.href = '/login';
      throw err;
    }
  }

  return response;
}