/**
 * api/aiApi.js — FRONTEND AI API CLIENT
 * ─────────────────────────────────────────────────────────────────────────────
 * MIGRATION GUIDE (when going to production / AWS):
 *
 *   Step 1: Set USE_REAL_API = true
 *   Step 2: Set API_BASE_URL to your API Gateway URL
 *
 *   That's it. All function signatures stay identical.
 *   The Lambda functions in backend/functions/ai/handler.js mirror this exactly.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { base44 } from '@/api/base44Client';

// ─── MIGRATION SWITCHES ───────────────────────────────────────────────────────
// Phase 1 → Phase 2: flip USE_REAL_API to true and set your API Gateway URL.
const USE_REAL_API = false;
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://YOUR_API_GATEWAY_URL/prod';
// ─────────────────────────────────────────────────────────────────────────────


// ── Pure helper: BMI calculation (always runs client-side, no network) ────────

export function analyzeBMI(profile) {
  const heightM = profile.heightCm / 100;
  const bmi = profile.startingWeightKg / (heightM * heightM);
  const bmiRounded = Math.round(bmi * 10) / 10;
  let category = 'Normal weight';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 25 && bmi < 30) category = 'Overweight';
  else if (bmi >= 30) category = 'Obese';
  return { bmi: bmiRounded, category };
}


// ── requestAnalysis ───────────────────────────────────────────────────────────
// Phase 1: generates stub text using Base44 InvokeLLM.
// Phase 2: POST {profile, weightLogs, measurementLogs} → API Gateway → Lambda → OpenAI.

export async function requestAnalysis(userId, profile, weightLogs = [], measurementLogs = []) {
  if (USE_REAL_API) {
    // ── PHASE 2 (uncomment when API key is in SSM and Lambda is deployed) ──
    // const res = await fetch(`${API_BASE_URL}/users/${userId}/insights/generate`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getJwtToken()}` },
    //   body: JSON.stringify({ profile, weightLogs, measurementLogs }),
    // });
    // return res.json();
  }

  // ── PHASE 1: Base44 InvokeLLM (current) ──────────────────────────────────
  const { bmi, category } = analyzeBMI(profile);
  const logsCount = (weightLogs?.length || 0) + (measurementLogs?.length || 0);

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `
You are a professional fitness coach and nutritionist. Generate personalized insights for this user:

Profile:
- Name: ${profile.name}
- Age: ${profile.age}, Sex: ${profile.sex}
- Height: ${profile.heightCm}cm, Starting weight: ${profile.startingWeightKg}kg, Goal weight: ${profile.goalWeightKg}kg
- BMI: ${bmi} (${category})
- Activity level: ${profile.activityLevel}
- Primary goal: ${profile.primaryGoal}
- Total progress entries logged: ${logsCount}

Write concise, motivating, actionable insights for each section. Be specific to their numbers.
    `.trim(),
    response_json_schema: {
      type: 'object',
      properties: {
        bmiAnalysis:      { type: 'string' },
        fitnessPath:      { type: 'string' },
        mealGuidance:     { type: 'string' },
        workoutPlan:      { type: 'string' },
        progressInsights: { type: 'string' },
      },
    },
  });

  const payload = {
    userId,
    generatedAt: new Date().toISOString(),
    bmiAnalysis:      result.bmiAnalysis,
    fitnessPath:      result.fitnessPath,
    mealGuidance:     result.mealGuidance,
    workoutPlan:      result.workoutPlan,
    progressInsights: result.progressInsights,
    status: 'ready',
  };

  const existing = await base44.entities.AIRecommendation.filter({ userId });
  if (existing?.length > 0) return base44.entities.AIRecommendation.update(existing[0].id, payload);
  return base44.entities.AIRecommendation.create(payload);
}


// ── getRecommendation ─────────────────────────────────────────────────────────
// Phase 1: reads from Base44 entity store.
// Phase 2: GET → API Gateway → Lambda → DynamoDB.

export async function getRecommendation(userId) {
  if (USE_REAL_API) {
    // ── PHASE 2 ──
    // const res = await fetch(`${API_BASE_URL}/users/${userId}/insights`, {
    //   headers: { Authorization: `Bearer ${getJwtToken()}` },
    // });
    // return res.json();
  }

  // ── PHASE 1 ──
  const results = await base44.entities.AIRecommendation.filter({ userId });
  return results[0] || null;
}