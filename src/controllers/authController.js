// src/controllers/authController.js

import { API_ENDPOINTS, STORAGE_KEYS } from '../constants/apiConstants';
import { UserModel }                   from '../models/userModel';
import { AuthTokenModel }              from '../models/authModel';
import tokenService                    from '../services/tokenService';

/**
 * POST /api/auth/login/
 */
export async function login(email, password) {
  console.debug('[AuthController] login() → called with email:', email);

  const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
    method:  'POST',
    headers: {
      'Content-Type':               'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ email, password }),
  });

  console.debug('[AuthController] login() → response status:', response.status);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('[AuthController] login() → error response:', errData);
    throw new Error(errData.detail || errData.message || 'Invalid credentials');
  }

  const data = await response.json();
  console.debug('[AuthController] login() → raw response data:', data);

  // Store tokens via tokenService
  const tokens = new AuthTokenModel({ access: data.access, refresh: data.refresh });
  tokenService.setTokens(tokens);

  // Build user from API response
  const user = new UserModel({
    id:    data.user?.id    ?? data.id    ?? null,
    name:  data.user?.name  ?? data.name  ?? email.split('@')[0],
    email: data.user?.email ?? data.email ?? email,
    role:  data.user?.role  ?? data.role  ?? 'Store Manager',
  });

  localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user.toJSON()));
  console.debug('[AuthController] login() → user stored:', user);

  return user;
}

/**
 * POST /api/auth/refresh/
 * Called automatically by apiService when 401 is received.
 */
export async function refreshAccessToken() {
  const refresh = tokenService.getRefreshToken();
  console.debug('[AuthController] refreshAccessToken() → refresh token present:', !!refresh);

  if (!refresh) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(API_ENDPOINTS.AUTH.REFRESH, {
    method:  'POST',
    headers: {
      'Content-Type':               'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ refresh }),
  });

  console.debug('[AuthController] refreshAccessToken() → response status:', response.status);

  if (!response.ok) {
    console.error('[AuthController] refreshAccessToken() → failed, clearing auth');
    tokenService.clearAllTokens();
    throw new Error('Session expired. Please login again.');
  }

  const data = await response.json();
  tokenService.setAccessToken(data.access);
  console.debug('[AuthController] refreshAccessToken() → new access token stored');

  return data.access;
}

/**
 * Logout — clear all tokens and user data.
 */
export function logout() {
  console.debug('[AuthController] logout() → called');
  tokenService.clearAllTokens();
}

/**
 * Returns stored UserModel from localStorage or null.
 */
export function getStoredUser() {
  const raw = localStorage.getItem(STORAGE_KEYS.USER);
  console.debug('[AuthController] getStoredUser() → raw value:', raw);
  if (!raw) return null;
  try {
    return UserModel.fromJSON(JSON.parse(raw));
  } catch (e) {
    console.error('[AuthController] getStoredUser() → parse error:', e);
    return null;
  }
}

/**
 * Returns current access token string.
 */
export function getAccessToken() {
  return tokenService.getAccessToken();
}