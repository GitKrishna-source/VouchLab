import crypto from 'crypto';
import { db } from '../db/database.js';

const GENESIS_PREV_HASH = '0'.repeat(64);

/**
 * Creates canonical string representation of an audit entry for reproducible hashing.
 */
function canonicalizeEntry(entry) {
  // Sort keys deterministically
  const payloadStr = typeof entry.payload === 'string' ? entry.payload : JSON.stringify(entry.payload);
  const canonicalObj = {
    action: entry.action,
    actor_id: entry.actor_id ?? null,
    actor_name: entry.actor_name ?? null,
    actor_role: entry.actor_role ?? null,
    entity_id: entry.entity_id ?? null,
    entity_type: entry.entity_type,
    payload: payloadStr,
    prev_hash: entry.prev_hash,
    timestamp: entry.timestamp
  };
  return JSON.stringify(canonicalObj, Object.keys(canonicalObj).sort());
}

/**
 * Computes SHA-256 of prev_hash + canonical JSON
 */
export function computeHash(prevHash, entry) {
  const data = prevHash + canonicalizeEntry({ ...entry, prev_hash: prevHash });
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Appends a new tamper-evident audit record to the chain
 */
export function logAudit({
  actor_id = null,
  actor_name = 'System',
  actor_role = 'system',
  action,
  entity_type,
  entity_id = null,
  payload = {}
}) {
  const lastEntry = db.prepare('SELECT id, hash FROM audit_log ORDER BY id DESC LIMIT 1').get();
  const prev_hash = lastEntry ? lastEntry.hash : GENESIS_PREV_HASH;
  const timestamp = new Date().toISOString();

  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);

  const entryData = {
    timestamp,
    actor_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    payload: payloadString,
    prev_hash
  };

  const hash = computeHash(prev_hash, entryData);

  const stmt = db.prepare(`
    INSERT INTO audit_log (timestamp, actor_id, actor_name, actor_role, action, entity_type, entity_id, payload, prev_hash, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    timestamp,
    actor_id,
    actor_name,
    actor_role,
    action,
    entity_type,
    entity_id,
    payloadString,
    prev_hash,
    hash
  );

  return {
    id: result.lastInsertRowid,
    timestamp,
    prev_hash,
    hash
  };
}

/**
 * Verifies the entire audit chain from genesis to head
 */
export function verifyAuditChain() {
  const entries = db.prepare('SELECT * FROM audit_log ORDER BY id ASC').all();

  if (entries.length === 0) {
    return {
      valid: true,
      totalEntries: 0,
      brokenIndex: null,
      message: 'Audit log is empty; chain is valid by definition.'
    };
  }

  let expectedPrevHash = GENESIS_PREV_HASH;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];

    // Check prev_hash linkage
    if (entry.prev_hash !== expectedPrevHash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenIndex: i + 1,
        brokenId: entry.id,
        reason: `Broken chain link at row #${entry.id}: stored prev_hash does not match previous entry's hash.`,
        entry
      };
    }

    // Recompute current entry hash
    const recomputedHash = computeHash(entry.prev_hash, entry);
    if (recomputedHash !== entry.hash) {
      return {
        valid: false,
        totalEntries: entries.length,
        brokenIndex: i + 1,
        brokenId: entry.id,
        reason: `Hash mismatch at row #${entry.id}: entry data was tampered with! Recomputed: ${recomputedHash.substring(0, 16)}... != Stored: ${entry.hash.substring(0, 16)}...`,
        entry
      };
    }

    expectedPrevHash = entry.hash;
  }

  return {
    valid: true,
    totalEntries: entries.length,
    brokenIndex: null,
    message: `All ${entries.length} audit entries verified successfully. Chain is intact and untampered.`
  };
}

// Dev-only demo tools for hackathon judges
export let tamperedBackup = null;

export function tamperWithAuditRow(rowId, tamperedPayloadText) {
  const row = db.prepare('SELECT * FROM audit_log WHERE id = ?').get(rowId);
  if (!row) throw new Error(`Row #${rowId} not found`);

  tamperedBackup = { ...row };

  db.prepare('UPDATE audit_log SET payload = ? WHERE id = ?').run(
    tamperedPayloadText || JSON.stringify({ tampered: true, note: 'Malicious modification by unauthorized party' }),
    rowId
  );

  return { rowId, tamperedBackup };
}

export function restoreTamperedRow() {
  if (!tamperedBackup) {
    throw new Error('No tampered row backup found to restore');
  }
  db.prepare(`
    UPDATE audit_log 
    SET payload = ?, hash = ?, prev_hash = ?, timestamp = ?, actor_id = ?, actor_name = ?, actor_role = ?, action = ?, entity_type = ?, entity_id = ?
    WHERE id = ?
  `).run(
    tamperedBackup.payload,
    tamperedBackup.hash,
    tamperedBackup.prev_hash,
    tamperedBackup.timestamp,
    tamperedBackup.actor_id,
    tamperedBackup.actor_name,
    tamperedBackup.actor_role,
    tamperedBackup.action,
    tamperedBackup.entity_type,
    tamperedBackup.entity_id,
    tamperedBackup.id
  );

  const restored = { ...tamperedBackup };
  tamperedBackup = null;
  return restored;
}

