import test from 'node:test';
import assert from 'node:assert/strict';
import {
  verifyAuditChain,
  logAudit,
  tamperWithAuditRow,
  restoreTamperedRow
} from '../src/services/auditChain.js';
import { initDatabase } from '../src/db/database.js';

test('Tamper-Evident Audit Chain - Verifies Cryptographic Integrity', () => {
  initDatabase();
  const verification = verifyAuditChain();
  assert.equal(verification.valid, true, 'Original chain must be cryptographically valid');
  assert.equal(verification.totalEntries > 0, true, 'Chain should have entries');
});

test('Tamper-Evident Audit Chain - Detects Unauthorized Database Modification and Restores', () => {
  initDatabase();
  // Tamper with row #2
  tamperWithAuditRow(2, JSON.stringify({ tampered_by_attacker: true, amount_stolen: 9999 }));

  const tamperedCheck = verifyAuditChain();
  assert.equal(tamperedCheck.valid, false, 'Tampered chain must fail verification');
  assert.equal(tamperedCheck.brokenId, 2, 'Must pinpoint the exact broken row #2');

  // Restore the row
  restoreTamperedRow();
  const restoredCheck = verifyAuditChain();
  assert.equal(restoredCheck.valid, true, 'Restored chain must pass verification again');
});

