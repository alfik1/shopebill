// src/controllers/profileController.js

import { API_ENDPOINTS } from '../constants/apiConstants';
import { ProfileModel }  from '../models/profileModel';
import { authFetch }     from '../services/apiService';

/**
 * GET /api/auth/me/
 * Fetches the logged-in user's profile.
 */
export async function getMyProfile() {
  console.debug('[ProfileController] getMyProfile() → called');

  const response = await authFetch(API_ENDPOINTS.AUTH.ME);

  console.debug('[ProfileController] getMyProfile() → response status:', response.status);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('[ProfileController] getMyProfile() → error:', errData);
    throw new Error(errData.detail || 'Failed to fetch profile');
  }

  const data = await response.json();
  console.debug('[ProfileController] getMyProfile() → raw data:', data);

  const profile = ProfileModel.fromJSON(data);
  console.debug('[ProfileController] getMyProfile() → profile model:', profile);

  return profile;
}

/**
 * PATCH /api/auth/profile/
 * Updates name and/or phone of the logged-in user.
 * @param {{ name: string, phone: string }} payload
 */
export async function updateMyProfile({ name, phone }) {
  console.debug('[ProfileController] updateMyProfile() → called with:', { name, phone });

  const response = await authFetch(API_ENDPOINTS.AUTH.UPDATE_PROFILE, {
    method: 'PATCH',
    body:   JSON.stringify({ name, phone }),
  });

  console.debug('[ProfileController] updateMyProfile() → response status:', response.status);

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    console.error('[ProfileController] updateMyProfile() → error:', errData);
    throw new Error(errData.detail || errData.message || 'Failed to update profile');
  }

  const data = await response.json();
  console.debug('[ProfileController] updateMyProfile() → raw data:', data);

  const updatedProfile = ProfileModel.fromJSON(data);
  console.debug('[ProfileController] updateMyProfile() → updated profile:', updatedProfile);

  return updatedProfile;
}