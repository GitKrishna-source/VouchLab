import test from 'node:test';
import assert from 'node:assert/strict';
import { computeFairShareScore, getFairnessConfig } from '../src/services/fairShare.js';
import { db, initDatabase } from '../src/db/database.js';

test('Fair-Share Engine - Formula and Weight Calculations', () => {
  initDatabase();
  const config = getFairnessConfig();

  // Test transparent score calculation:
  // score = (waiting_days * W_WAIT) - (hours_used_last_30_days * W_USAGE) + category_bonus
  // Academic project with 1 day wait and 2 hours used:
  // (1.0 * 10) - (2.0 * 2) + 30 = 10 - 4 + 30 = 36.0
  const mockBooking = {
    user_id: 999999, // user with 0 recent hours
    resource_id: 1,
    project_category: 'academic_project',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 1 day ago
  };

  const { score, breakdown } = computeFairShareScore(mockBooking);
  assert.equal(breakdown.w_wait, 10.0);
  assert.equal(breakdown.w_usage, 2.0);
  assert.equal(breakdown.category_bonus, 30.0);
  assert.equal(breakdown.hours_used_last_30_days, 0);
  assert.equal(score >= 38.0 && score <= 42.0, true, `Expected score around 40, got ${score}`);
});

test('Fair-Share Engine - Higher Priority for Academic Project over Casual', () => {
  const academicBooking = {
    user_id: 999999,
    resource_id: 1,
    project_category: 'academic_project',
    created_at: new Date().toISOString()
  };

  const casualBooking = {
    user_id: 999999,
    resource_id: 1,
    project_category: 'casual',
    created_at: new Date().toISOString()
  };

  const academic = computeFairShareScore(academicBooking);
  const casual = computeFairShareScore(casualBooking);

  assert.equal(academic.score > casual.score, true, 'Academic project must have strictly higher priority bonus than casual');
  assert.equal(academic.breakdown.category_bonus, 30.0);
  assert.equal(casual.breakdown.category_bonus, 0.0);
});

