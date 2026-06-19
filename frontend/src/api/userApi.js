/**
 * frontend/src/api/userApi.js
 *
 * Frontend API client for User Profile.
 *
 * This file runs in the browser.
 * It talks only to API Gateway.
 * It does NOT import Base44.
 * It does NOT talk to DynamoDB directly.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const STORAGE_KEYS = {
  accessToken: 'fitops_cognito_access_token',
};

function assertApiBaseUrl() {
  if (!API_BASE_URL) {
    throw new Error('Missing VITE_API_BASE_URL');
  }
}

function getAccessToken() {
  return window.localStorage.getItem(STORAGE_KEYS.accessToken);
}

function getAuthHeaders() {
  const token = getAccessToken();

  if (!token) {
    throw new Error('Missing Cognito access token');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

async function apiRequest(path, options = {}) {
  assertApiBaseUrl();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || `API request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Keep the public signature stable.
 * userId is ignored intentionally.
 * The backend gets the real userId from Cognito JWT claims.
 */
export async function getProfile(_userId) {
  try {
    return await apiRequest('/profile', {
      method: 'GET',
    });
  } catch (error) {
    if (error.status === 404) {
      return null;
    }

    throw error;
  }
}

/**
 * Keep the public signature stable.
 */
export async function createProfile(profileData) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

/**
 * Keep the public signature stable.
 * profileId is ignored intentionally.
 * There is one profile per authenticated Cognito user.
 */
export async function updateProfile(_profileId, updates) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

/**
 * Keep the public signature stable.
 * userId is ignored intentionally.
 */
export async function upsertProfile(_userId, profileData) {
  return apiRequest('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}