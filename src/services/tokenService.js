// src/services/tokenService.js
// Handles all JWT token storage — single source of truth for localStorage access

import { STORAGE_KEYS } from '../constants/apiConstants';

const tokenService = {

  // ── Store ─────────────────────────────────────────────────────────────────

  setAccessToken(token) {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    console.debug('[TokenService] setAccessToken() → stored');
  },

  setRefreshToken(token) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    console.debug('[TokenService] setRefreshToken() → stored');
  },

  setTokens({ access, refresh }) {
    this.setAccessToken(access);
    this.setRefreshToken(refresh);
    console.debug('[TokenService] setTokens() → both tokens stored');
  },

  // ── Retrieve ──────────────────────────────────────────────────────────────

  getAccessToken() {
    const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.debug('[TokenService] getAccessToken() → present:', !!token);
    return token;
  },

  getRefreshToken() {
    const token = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.debug('[TokenService] getRefreshToken() → present:', !!token);
    return token;
  },

  // ── Clear ─────────────────────────────────────────────────────────────────

  clearAccessToken() {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    console.debug('[TokenService] clearAccessToken() → removed');
  },

  clearRefreshToken() {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.debug('[TokenService] clearRefreshToken() → removed');
  },

  clearAllTokens() {
    this.clearAccessToken();
    this.clearRefreshToken();
    localStorage.removeItem(STORAGE_KEYS.USER);
    console.debug('[TokenService] clearAllTokens() → all auth keys cleared');
  },

  // ── Utility ───────────────────────────────────────────────────────────────

  hasValidTokens() {
    const hasAccess  = !!this.getAccessToken();
    const hasRefresh = !!this.getRefreshToken();
    console.debug('[TokenService] hasValidTokens() → access:', hasAccess, '| refresh:', hasRefresh);
    return hasAccess && hasRefresh;
  },
};

export default tokenService;