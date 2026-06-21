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
    throw new Error(data?.message || data?.error || `API request failed: ${response.status}`);
  }

  return data;
}

export function analyzeBMI(profile) {
  const weightKg = Number(profile?.startingWeightKg);
  const rawHeight = Number(profile?.heightCm);

  let heightCm = rawHeight;

  if (Number.isFinite(rawHeight)) {
    if (rawHeight > 0 && rawHeight < 3) {
      heightCm = rawHeight * 100;
    } else if (rawHeight >= 3 && rawHeight < 30) {
      heightCm = rawHeight * 10;
    }
  }

  const heightM = heightCm / 100;

  if (
    !Number.isFinite(weightKg) ||
    !Number.isFinite(heightM) ||
    heightM <= 0
  ) {
    return { bmi: 0, category: 'Unknown' };
  }

  const bmi = weightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;

  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 25 && bmi < 30) category = 'Overweight';
  else if (bmi >= 30) category = 'Obese';

  return { bmi: bmiRounded, category };
}

/**
 * Public signature kept stable.
 * userId/profile/logs are intentionally accepted for compatibility,
 * but the backend uses Cognito JWT identity and stored DynamoDB data.
 */
export async function requestAnalysis(_userId, profile, weightLogs = [], measurementLogs = []) {
  return apiRequest('/ai/recommendation/generate', {
    method: 'POST',
    body: JSON.stringify({
      profile,
      weightLogs,
      measurementLogs,
    }),
  });
}

/**
 * Public signature kept stable.
 * userId is ignored intentionally.
 */
export async function getRecommendation(_userId) {
  return apiRequest('/ai/recommendation');
}
