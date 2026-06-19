import { base44 } from '@/api/base44Client';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getAccessToken() {
  return localStorage.getItem('fitops_cognito_access_token');
}

async function apiRequest(path, options = {}) {
  const token = getAccessToken();

  if (!API_BASE_URL || !token) {
    return null;
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

async function getBase44Recommendation(userId) {
  const results = await base44.entities.AIRecommendation.filter({ userId });
  return results?.[0] || null;
}

async function saveBase44Recommendation(userId, payload) {
  const existing = await base44.entities.AIRecommendation.filter({ userId });

  if (existing?.length > 0) {
    return base44.entities.AIRecommendation.update(existing[0].id, payload);
  }

  return base44.entities.AIRecommendation.create(payload);
}

export async function requestAnalysis(userId, profile, weightLogs = [], measurementLogs = []) {
  try {
    const awsResult = await apiRequest('/ai/recommendation/generate', {
      method: 'POST',
      body: JSON.stringify({
        profile,
        weightLogs,
        measurementLogs,
      }),
    });

    if (awsResult) {
      return awsResult;
    }
  } catch (err) {
    console.warn('AWS AI generation failed, falling back to Base44:', err);
  }

  const bmi = analyzeBMI(profile);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `
You are a fitness and nutrition coach.
Generate practical, encouraging recommendations.

User profile:
${JSON.stringify(profile, null, 2)}

BMI:
${JSON.stringify(bmi, null, 2)}

Weight logs:
${JSON.stringify(weightLogs || [], null, 2)}

Measurement logs:
${JSON.stringify(measurementLogs || [], null, 2)}

Return concise recommendations.
Be specific to their numbers.
    `.trim(),
    response_json_schema: {
      type: 'object',
      properties: {
        bmiAnalysis: { type: 'string' },
        fitnessPath: { type: 'string' },
        mealGuidance: { type: 'string' },
        workoutPlan: { type: 'string' },
        progressInsights: { type: 'string' },
      },
    },
  });

  const payload = {
    userId,
    generatedAt: new Date().toISOString(),
    bmiAnalysis: result.bmiAnalysis,
    fitnessPath: result.fitnessPath,
    mealGuidance: result.mealGuidance,
    workoutPlan: result.workoutPlan,
    progressInsights: result.progressInsights,
    status: 'ready',
  };

  return saveBase44Recommendation(userId, payload);
}

export async function getRecommendation(userId) {
  try {
    const awsResult = await apiRequest('/ai/recommendation');

    if (
      awsResult &&
      awsResult.bmiAnalysis &&
      awsResult.fitnessPath &&
      awsResult.mealGuidance &&
      awsResult.workoutPlan
    ) {
      return awsResult;
    }
  } catch (err) {
    console.warn('AWS AI recommendation failed, falling back to Base44:', err);
  }

  return getBase44Recommendation(userId);
}
