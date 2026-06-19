import { base44 } from '@/api/base44Client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAccessToken() {
  return localStorage.getItem('fitops_cognito_access_token');
}

async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not configured.');
  }

  if (!token) {
    throw new Error('Missing Cognito access token.');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'content-type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.message || `API request failed: ${response.status}`);
  }

  return data;
}

// ── Weight Logs: AWS-native ──────────────────────────────────────────────────

export async function getWeightLogs(_userId) {
  return apiRequest('/weight');
}

export async function addWeightLog(_userId, date, weightKg) {
  return apiRequest('/weight', {
    method: 'POST',
    body: JSON.stringify({
      date,
      weightKg: Number(weightKg),
    }),
  });
}

export async function deleteWeightLog(logId) {
  return apiRequest(`/weight/${encodeURIComponent(logId)}`, {
    method: 'DELETE',
  });
}

// ── Measurement Logs: AWS-native ─────────────────────────────────────────────

export async function getMeasurementLogs(_userId) {
  return apiRequest('/measurements');
}

export async function addMeasurementLog(_userId, data) {
  return apiRequest('/measurements', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteMeasurementLog(logId) {
  return apiRequest(`/measurements/${encodeURIComponent(logId)}`, {
    method: 'DELETE',
  });
}

// ── Progress Photos: still legacy until S3/presigned URL phase ───────────────

export async function getProgressPhotos(userId) {
  return base44.entities.ProgressPhoto.filter({ userId }, '-date', 100);
}

export async function uploadProgressPhoto(userId, date, angle, file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return base44.entities.ProgressPhoto.create({ userId, date, angle, photoUrl: file_url });
}

export async function deleteProgressPhoto(photoId) {
  return base44.entities.ProgressPhoto.delete(photoId);
}
