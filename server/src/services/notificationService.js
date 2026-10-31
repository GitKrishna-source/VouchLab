import { db } from '../db/database.js';

export function createNotification({ userId, title, message, type = 'info', link = null }) {
  const stmt = db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(userId, title, message, type, link);

  // Email stub to console
  const user = db.prepare('SELECT email, name FROM users WHERE id = ?').get(userId);
  if (user) {
    console.log(`\n📧 [EMAIL STUB] ───────────────────────────────────────────────────`);
    console.log(`To: ${user.name} <${user.email}>`);
    console.log(`Subject: [ShareSpace] ${title}`);
    console.log(`Message: ${message}`);
    if (link) console.log(`Link: http://localhost:5173${link}`);
    console.log(`──────────────────────────────────────────────────────────────────\n`);
  }
}

export function notifyBookingStatusChange(bookingId, status, extraReason = '') {
  const booking = db.prepare(`
    SELECT b.*, u.id as user_id, u.name as user_name, r.name as resource_name
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    JOIN resources r ON b.resource_id = r.id
    WHERE b.id = ?
  `).get(bookingId);

  if (!booking) return;

  const titles = {
    approved: 'Booking Approved!',
    rejected: 'Booking Request Declined',
    waitlisted: 'Added to Waitlist',
    checked_in: 'Check-In Confirmed',
    returned: 'Equipment Returned',
    completed: 'Booking Completed',
    overdue: '⚠️ OVERDUE EQUIPMENT RETURN NOTICE'
  };

  const types = {
    approved: 'success',
    rejected: 'danger',
    waitlisted: 'warning',
    checked_in: 'info',
    returned: 'success',
    completed: 'success',
    overdue: 'danger'
  };

  let message = `Your request for ${booking.resource_name} (${booking.start_time.substring(11, 16)} - ${booking.end_time.substring(11, 16)}) is now ${status.toUpperCase()}.`;
  if (extraReason) {
    message += ` Details: ${extraReason}`;
  }

  createNotification({
    userId: booking.user_id,
    title: titles[status] || `Booking Update: ${status}`,
    message,
    type: types[status] || 'info',
    link: `/bookings/${booking.id}`
  });
}

