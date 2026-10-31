import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateResourceEligibility, assertUserIsEligible } from '../src/services/eligibility.js';
import { db, initDatabase } from '../src/db/database.js';

test('Eligibility Passport - Detects Missing Laser Safety Quiz for Student 1', () => {
  initDatabase();
  const student1 = db.prepare('SELECT id FROM users WHERE email = ?').get('student1@demo.edu');
  const laserCutter = db.prepare('SELECT id FROM resources WHERE name LIKE ?').get('%Laser Cutter%');

  assert.ok(student1, 'Student 1 must exist');
  assert.ok(laserCutter, 'Laser cutter must exist');

  const result = evaluateResourceEligibility(student1.id, laserCutter.id);

  // Student 1 has not taken the laser quiz yet
  assert.equal(result.isEligible, false, 'Student 1 must be ineligible until quiz is passed');
  const quizReq = result.requirements.find(r => r.type === 'quiz');
  assert.ok(quizReq, 'Laser quiz requirement must be present');
  assert.equal(quizReq.status, 'missing');
  assert.equal(quizReq.action, 'take_quiz');

  // Verify that calling assertUserIsEligible throws 403 error
  assert.throws(() => {
    assertUserIsEligible(student1.id, laserCutter.id);
  }, (err) => err.status === 403);
});
