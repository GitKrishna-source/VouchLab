import { db } from '../db/database.js';
import { logAudit } from './auditChain.js';
import { createNotification } from './notificationService.js';

/**
 * Scans for active checked-in bookings that have exceeded their scheduled end_time.
 * Automatically flags them as OVERDUE, alerts user and owner, and logs to the audit chain.
 */
export function checkOverdueBookings() {
  const now = new Date().toISOString();

  // Find bookings that are checked in but past their scheduled end_time
  const overdueBookings = db.prepare(`
    SELECT b.id, b.user_id, b.resource_id, b.end_time,
           r.name as resource_name, r.owner_id, r.manager_id,
           u.name as user_name
    FROM bookings b
    JOIN resources r ON b.resource_id = r.id
    JOIN users u ON b.user_id = u.id
    WHERE b.status = 'checked_in' AND b.end_time < ?
  `).all(now);

  const updatedIds = [];

  for (const booking of overdueBookings) {
    db.prepare(`
      UPDATE bookings
      SET status = 'overdue'
      WHERE id = ?
    `).run(booking.id);

    // 1. Audit Log Entry (tamper-evident SHA-256 chain)
    logAudit({
      actor_id: null,
      actor_name: 'SYSTEM_SCHEDULER',
      actor_role: 'system',
      action: 'BOOKING_MARKED_OVERDUE',
      entity_type: 'booking',
      entity_id: booking.id,
      payload: {
        resource_id: booking.resource_id,
        user_id: booking.user_id,
        scheduled_end: booking.end_time,
        detected_at: now
      }
    });

    // 2. Alert the Borrower
    createNotification({
      userId: booking.user_id,
      title: 'Action Required: Return Overdue ⚠️',
      message: `Your booking for "${booking.resource_name}" ended at ${new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Please complete return checklist immediately.`,
      type: 'warning',
      link: `/bookings/${booking.id}/return`
    });

    // 3. Alert the Resource Owner
    if (booking.owner_id) {
      createNotification({
        userId: booking.owner_id,
        title: 'Overdue Equipment Alert',
        message: `${booking.user_name} has not returned "${booking.resource_name}" on schedule.`,
        type: 'warning',
        link: `/bookings/${booking.id}`
      });
    }

    updatedIds.push(booking.id);
  }

  return updatedIds;
}

/**
 * Starts periodic overdue scanning
 */
export function startOverdueWatcher(intervalMs = 60000) {
  // Run once immediately
  try {
    checkOverdueBookings();
  } catch (err) {
    console.error('Initial overdue check error:', err.message);
  }

  const intervalId = setInterval(() => {
    try {
      checkOverdueBookings();
    } catch (err) {
      console.error('Periodic overdue check error:', err.message);
    }
  }, intervalMs);

  return () => clearInterval(intervalId);
}

