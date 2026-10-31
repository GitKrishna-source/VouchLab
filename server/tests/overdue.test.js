import test from 'node:test';
import assert from 'node:assert/strict';
import { db, initDatabase } from '../src/db/database.js';
import { checkOverdueBookings } from '../src/services/overdueWatcher.js';

test('Overdue Watcher - Automatically flags past-due checked-in bookings and alerts users', () => {
  initDatabase();

  // Pick a user and resource
  const user = db.prepare("SELECT id FROM users WHERE role = 'user' LIMIT 1").get();
  const resource = db.prepare('SELECT id, owner_id FROM resources LIMIT 1').get();

  assert.ok(user, 'User should exist in database');
  assert.ok(resource, 'Resource should exist in database');

  // Insert a test booking whose end_time was 2 hours ago
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

  const insertStmt = db.prepare(`
    INSERT INTO bookings (resource_id, user_id, start_time, end_time, status, purpose, checked_in_at)
    VALUES (?, ?, ?, ?, 'checked_in', 'Overdue automated test', ?)
  `);
  const result = insertStmt.run(resource.id, user.id, threeHoursAgo, twoHoursAgo, threeHoursAgo);
  const testBookingId = result.lastInsertRowid;

  // Run the overdue scanner
  const updatedIds = checkOverdueBookings();

  // Verify that our test booking was detected and updated
  assert.ok(updatedIds.includes(testBookingId), `Booking ${testBookingId} should be in updated overdue list`);

  const updatedBooking = db.prepare('SELECT status FROM bookings WHERE id = ?').get(testBookingId);
  assert.equal(updatedBooking.status, 'overdue');

  // Verify audit log has the event recorded
  const auditRow = db.prepare(`
    SELECT * FROM audit_log
    WHERE action = 'BOOKING_MARKED_OVERDUE' AND entity_id = ?
    ORDER BY id DESC LIMIT 1
  `).get(testBookingId);

  assert.ok(auditRow, 'Audit log entry should exist for overdue transition');
  assert.equal(auditRow.entity_type, 'booking');

  // Verify notifications generated
  const notif = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? AND type = 'warning' ORDER BY id DESC LIMIT 1
  `).get(user.id);
  assert.ok(notif, 'Borrower should receive an overdue warning notification');
  assert.match(notif.title, /Overdue/);
});
