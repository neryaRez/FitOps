/**
 * api/progressApi.js — FRONTEND API CLIENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs in the BROWSER. Gets bundled into dist/ by Vite. Goes to S3.
 *
 * Phase 1 (current): calls Base44 SDK directly.
 * Phase 2 (AWS):     replace each body with fetch() calls to API Gateway.
 *   GET    /users/{userId}/weight
 *   POST   /users/{userId}/weight
 *   DELETE /users/{userId}/weight/{logId}
 *   GET    /users/{userId}/measurements
 *   POST   /users/{userId}/measurements
 *   DELETE /users/{userId}/measurements/{logId}
 *   GET    /users/{userId}/photos
 *   POST   /users/{userId}/photos
 *   DELETE /users/{userId}/photos/{photoId}
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { base44 } from '@/api/base44Client';

// ── Weight Logs ───────────────────────────────────────────────────────────────

export async function getWeightLogs(userId) {
  return base44.entities.WeightLog.filter({ userId }, 'date', 100);
}

export async function addWeightLog(userId, date, weightKg) {
  return base44.entities.WeightLog.create({ userId, date, weightKg });
}

export async function deleteWeightLog(logId) {
  return base44.entities.WeightLog.delete(logId);
}

// ── Measurement Logs ──────────────────────────────────────────────────────────

export async function getMeasurementLogs(userId) {
  return base44.entities.MeasurementLog.filter({ userId }, 'date', 100);
}

export async function addMeasurementLog(userId, data) {
  return base44.entities.MeasurementLog.create({ userId, ...data });
}

export async function deleteMeasurementLog(logId) {
  return base44.entities.MeasurementLog.delete(logId);
}

// ── Progress Photos ───────────────────────────────────────────────────────────

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