/**
 * api/userApi.js — FRONTEND API CLIENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Runs in the BROWSER. Gets bundled into dist/ by Vite. Goes to S3.
 *
 * Phase 1 (current): calls Base44 SDK directly (no HTTP server needed).
 * Phase 2 (AWS):     replace each function body with:
 *                    fetch(`${import.meta.env.VITE_API_URL}/users/${userId}/profile`, ...)
 *                    The shape of requests/responses stays identical.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { base44 } from '@/api/base44Client';

export async function getProfile(userId) {
  const results = await base44.entities.UserProfile.filter({ userId });
  return results[0] || null;
}

export async function createProfile(profileData) {
  return base44.entities.UserProfile.create(profileData);
}

export async function updateProfile(profileId, updates) {
  return base44.entities.UserProfile.update(profileId, updates);
}

export async function upsertProfile(userId, profileData) {
  const existing = await getProfile(userId);
  if (existing) return updateProfile(existing.id, profileData);
  return createProfile({ ...profileData, userId });
}