import test from 'node:test';
import assert from 'node:assert/strict';
import { findConflictingBookings } from '../src/services/fairShare.js';
import { db, initDatabase } from '../src/db/database.js';

test('Conflict Detection - Accurately Detects Overlapping Slots', () => {
  initDatabase();
  const printer = db.prepare('SELECT id FROM resources WHERE name LIKE ?').get('%3D Printer%');
  assert.ok(printer, '3D printer resource must exist');

  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const slotStart = `${tomorrowStr}T14:00:00`;
  const slotEnd = `${tomorrowStr}T16:00:00`;

  // Pre-seeded conflicting requests exist for tomorrow 14:00-16:00
  const conflicts = findConflictingBookings(printer.id, slotStart, slotEnd);
  assert.equal(conflicts.length >= 2, true, 'Must find at least 2 competing/overlapping requests for tomorrow');

  // Non-overlapping slot
  const eveningStart = `${tomorrowStr}T21:00:00`;
  const eveningEnd = `${tomorrowStr}T23:00:00`;
  const noConflicts = findConflictingBookings(printer.id, eveningStart, eveningEnd);
  assert.equal(noConflicts.length, 0, 'No conflicts should exist for empty evening window');
});
