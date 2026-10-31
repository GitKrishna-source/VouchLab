import test from 'node:test';
import assert from 'node:assert/strict';
import { db, initDatabase } from '../src/db/database.js';
import { analyzeUserSuspiciousPatterns, scanAndRecordCampusAnomalies } from '../src/services/aiService.js';
import { logAudit } from '../src/services/auditChain.js';

test('AI Anomaly Engine - Flags Prime-Hour Slot Churning for Human Review', async () => {
  initDatabase();

  // Pick or create a test user
  const user = db.prepare("SELECT id, name FROM users WHERE role = 'user' LIMIT 1").get();
  assert.ok(user, 'User should exist');

  const resource = db.prepare('SELECT id FROM resources LIMIT 1').get();
  assert.ok(resource, 'Resource should exist');

  // Insert 3 cancellations during prime hours (12:00 PM)
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 12, 0, 0).toISOString();
    const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 14, 0, 0).toISOString();
    
    db.prepare(`
      INSERT INTO bookings (resource_id, user_id, start_time, end_time, purpose, status, created_at)
      VALUES (?, ?, ?, ?, 'Prime hour test booking', 'cancelled', ?)
    `).run(resource.id, user.id, startTime, endTime, startTime);
  }

  // Run AI / Heuristic Analysis
  const analysis = await analyzeUserSuspiciousPatterns(user.id);
  assert.ok(analysis, 'Analysis should return results');
  assert.equal(analysis.flagged, true, 'User with 3 prime hour cancellations must be flagged');
  assert.match(analysis.pattern_type, /Prime-Time|Churn/, 'Pattern type should identify churn');
  assert.equal(analysis.metrics.prime_cancellations >= 3, true);

  // Run scan and record
  const newlyFlagged = await scanAndRecordCampusAnomalies();
  assert.ok(Array.isArray(newlyFlagged));

  // Verify flag row in ai_usage_flags table
  const flagRow = db.prepare(`
    SELECT * FROM ai_usage_flags WHERE user_id = ? ORDER BY id DESC LIMIT 1
  `).get(user.id);

  assert.ok(flagRow, 'AI usage flag record should exist in database');
  assert.equal(flagRow.status, 'pending_review');

  // Simulate Human-in-the-Loop review (action = warning)
  const adminUser = db.prepare("SELECT id, name, role FROM users WHERE role IN ('admin', 'owner', 'manager') LIMIT 1").get() || user;
  const reviewedAt = new Date().toISOString();
  db.prepare(`
    UPDATE ai_usage_flags
    SET status = 'warning_issued', reviewed_by = ?, reviewed_at = ?, review_notes = 'Reviewed by lab manager.'
    WHERE id = ?
  `).run(adminUser.id, reviewedAt, flagRow.id);

  // Log to audit chain
  logAudit({
    actor_id: adminUser.id,
    actor_name: adminUser.name || 'Dr. Vikram Rao',
    actor_role: adminUser.role || 'owner',
    action: 'AI_FLAG_WARNING',
    entity_type: 'ai_usage_flag',
    entity_id: flagRow.id,
    payload: { action: 'warning', notes: 'Reviewed by lab manager.' }
  });

  const updatedFlag = db.prepare('SELECT status FROM ai_usage_flags WHERE id = ?').get(flagRow.id);
  assert.equal(updatedFlag.status, 'warning_issued');

  // Verify audit log has recorded the human decision
  const auditEntry = db.prepare(`
    SELECT * FROM audit_log WHERE action = 'AI_FLAG_WARNING' AND entity_id = ?
  `).get(flagRow.id);
  assert.ok(auditEntry, 'Audit chain must log human review decision');
});
