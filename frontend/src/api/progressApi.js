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

// ── Progress Photos: AWS-native private S3 + presigned URLs ──────────────────

export async function getProgressPhotos(_userId) {
  return apiRequest('/photos');
}

export async function uploadProgressPhoto(_userId, date, angle, file) {
  if (!file) {
    throw new Error('Missing photo file.');
  }

  const contentType = file.type || 'image/jpeg';

  const uploadSession = await apiRequest('/photos/upload-url', {
    method: 'POST',
    body: JSON.stringify({ contentType }),
  });

  const uploadResponse = await fetch(uploadSession.uploadUrl, {
    method: 'PUT',
    headers: {
      'content-type': contentType,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error(`S3 upload failed: ${uploadResponse.status}`);
  }

  return apiRequest('/photos/complete', {
    method: 'POST',
    body: JSON.stringify({
      photoId: uploadSession.photoId,
      s3Key: uploadSession.s3Key,
      date,
      angle,
      contentType,
    }),
  });
}

export async function deleteProgressPhoto(photoId) {
  return apiRequest(`/photos/${encodeURIComponent(photoId)}`, {
    method: 'DELETE',
  });
}
