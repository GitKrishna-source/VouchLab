import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditChain.js';
import { assertUserIsEligible } from '../services/eligibility.js';
import {
  checkUserBookingConstraints,
  findConflictingBookings,
  computeFairShareScore,
  rankQueueForResource,
  getCancellationsLast30Days,
  getFairnessConfig
} from '../services/fairShare.js';
import { summarizeIncidentReport } from '../services/aiService.js';
import { createNotification, notifyBookingStatusChange } from '../services/notificationService.js';
import { photoFileFilter, uploadLimiter } from '../middleware/security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `condition_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: photoFileFilter
});

export const bookingsRouter = express.Router();

/**
 * Request a new booking
 */
bookingsRouter.post('/', authenticate, (req, res) => {
  try {
    const { resource_id, start_time, end_time, purpose, project_category = 'academic_project' } = req.body;

    if (!resource_id || !start_time || !end_time || !purpose) {
      return res.status(400).json({ error: 'resource_id, start_time, end_time, and purpose are required' });
    }

    // 1. Strict Server-Side Eligibility Enforcement
    assertUserIsEligible(req.user.id, resource_id);

    // 2. Check Fairness Constraints (monthly hour cap, cancellation cooldown, max bookings)
    const start = new Date(start_time);
    const end = new Date(end_time);
    const requestedHours = Math.max(1, (end - start) / (1000 * 60 * 60));

    const constraintCheck = checkUserBookingConstraints(req.user.id, resource_id, requestedHours);
    if (!constraintCheck.allowed) {
      return res.status(400).json({ error: constraintCheck.reason });
    }

    // 3. Detect Conflicts with existing approved or pending bookings
    const conflicts = findConflictingBookings(resource_id, start_time, end_time);
    const approvedConflict = conflicts.find(c => c.status === 'approved' || c.status === 'checked_in');

    const initialStatus = approvedConflict ? 'waitlisted' : 'pending';

    // Insert booking
    const stmt = db.prepare(`
      INSERT INTO bookings (
        resource_id, user_id, start_time, end_time, purpose, project_category, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(resource_id, req.user.id, start_time, end_time, purpose, project_category, initialStatus);
    const bookingId = result.lastInsertRowid;

    // 4. Compute Fair-Share Allocation & Re-rank
    const rankedQueue = rankQueueForResource(resource_id);
    const myRanked = rankedQueue.find(r => r.id === bookingId);

    const booking = db.prepare(`
      SELECT b.*, r.name as resource_name, r.owner_id, r.manager_id
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      WHERE b.id = ?
    `).get(bookingId);

    // 5. Append to Audit Log
    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'BOOKING_REQUESTED',
      entity_type: 'booking',
      entity_id: bookingId,
      payload: {
        resource_id,
        resource_name: booking.resource_name,
        start_time,
        end_time,
        project_category,
        conflicts_count: conflicts.length,
        initial_status: initialStatus,
        fair_share_score: myRanked?.score,
        decision_reason: myRanked?.decision_reason
      }
    });

    // Notify owner
    const ownersToNotify = [booking.owner_id, booking.manager_id].filter(Boolean);
    for (const ownerId of ownersToNotify) {
      createNotification({
        userId: ownerId,
        title: 'New Booking Request',
        message: `${req.user.name} requested ${booking.resource_name} for ${new Date(start_time).toLocaleDateString()} (${project_category}).`,
        type: 'info',
        link: `/owner/requests`
      });
    }

    res.status(201).json({
      booking,
      fairShare: myRanked ? {
        score: myRanked.score,
        rank: myRanked.waitlist_position,
        breakdown: myRanked.breakdown,
        explanation: myRanked.decision_reason
      } : null
    });
  } catch (err) {
    if (err.status === 403) {
      return res.status(403).json({ error: err.message, details: err.details });
    }
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get current user's bookings
 */
bookingsRouter.get('/my-bookings', authenticate, (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT b.*, r.name as resource_name, r.category as resource_category,
             r.location, r.image_url, u.name as owner_name
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      LEFT JOIN users u ON r.owner_id = u.id
      WHERE b.user_id = ?
    `;
    const params = [req.user.id];

    if (status && status !== 'All') {
      if (status === 'upcoming') {
        query += ` AND b.status IN ('approved', 'checked_in')`;
      } else if (status === 'pending') {
        query += ` AND b.status IN ('pending', 'waitlisted')`;
      } else if (status === 'completed') {
        query += ` AND b.status IN ('completed', 'returned')`;
      } else if (status === 'cancelled') {
        query += ` AND b.status IN ('cancelled', 'rejected')`;
      } else {
        query += ` AND b.status = ?`;
        params.push(status);
      }
    }

    query += ' ORDER BY b.start_time DESC';
    const bookings = db.prepare(query).all(...params);

    // Attach condition reports and overdue status
    const now = new Date().toISOString();
    const enriched = bookings.map(b => {
      const isOverdue = (b.status === 'checked_in' || b.status === 'approved') && b.end_time < now;
      const reports = db.prepare('SELECT * FROM condition_reports WHERE booking_id = ?').all(b.id);
      return {
        ...b,
        is_overdue: isOverdue,
        condition_reports: reports
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Owner/Manager: Get ranked queue for a resource
 */
bookingsRouter.get('/queue/:resourceId', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const resourceId = req.params.resourceId;
    const queue = rankQueueForResource(resourceId);
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Owner/Manager: Get all incoming requests across owned resources
 */
bookingsRouter.get('/incoming-requests', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    let query = `
      SELECT b.*, r.name as resource_name, r.category as resource_category, r.location,
             u.name as user_name, u.email as user_email, u.category as user_category
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN users u ON b.user_id = u.id
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ` WHERE (r.owner_id = ? OR r.manager_id = ?)`;
      params.push(req.user.id, req.user.id);
    }

    query += ' ORDER BY b.created_at DESC';
    const allRequests = db.prepare(query).all(...params);

    const parsed = allRequests.map(r => {
      let breakdown = null;
      try {
        breakdown = r.score_breakdown ? JSON.parse(r.score_breakdown) : null;
      } catch (e) {
        breakdown = null;
      }
      return {
        ...r,
        score_breakdown: breakdown
      };
    });

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Owner decision: approve / reject / waitlist (with transparent override support)
 */
bookingsRouter.post('/:id/decide', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const bookingId = req.params.id;
    const { action, override_reason } = req.body; // action: 'approve' | 'reject' | 'waitlist'

    if (!['approve', 'reject', 'waitlist'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'approve', 'reject', or 'waitlist'" });
    }

    const booking = db.prepare(`
      SELECT b.*, r.name as resource_name, r.owner_id, r.manager_id, u.name as user_name
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN users u ON b.user_id = u.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) {
      return res.status(404).json({ error: 'Booking request not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && booking.owner_id !== req.user.id && booking.manager_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to manage this resource' });
    }

    const newStatus = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'waitlisted');

    // Check if this approval overrides fair-share recommendation
    let isOverride = false;
    if (newStatus === 'approved') {
      const topCandidate = db.prepare(`
        SELECT id, score, user_id FROM bookings
        WHERE resource_id = ? AND status IN ('pending', 'waitlisted')
        ORDER BY score DESC, created_at ASC LIMIT 1
      `).get(booking.resource_id);

      if (topCandidate && topCandidate.id !== booking.id && topCandidate.score > (booking.score || 0)) {
        isOverride = true;
        if (!override_reason || override_reason.trim().length < 5) {
          return res.status(400).json({
            error: `Override detected: Applicant is ranked below top recommendation (Score ${booking.score} vs ${topCandidate.score}). A mandatory written override reason (min 5 characters) is required for audit compliance.`
          });
        }
      }
    }

    db.prepare(`
      UPDATE bookings
      SET status = ?, override_reason = ?, override_by = ?
      WHERE id = ?
    `).run(newStatus, isOverride ? override_reason : null, isOverride ? req.user.id : null, bookingId);

    // If approved, conflicting pending bookings are waitlisted
    if (newStatus === 'approved') {
      const conflicts = findConflictingBookings(booking.resource_id, booking.start_time, booking.end_time, booking.id);
      for (const conf of conflicts) {
        if (conf.status === 'pending') {
          db.prepare("UPDATE bookings SET status = 'waitlisted' WHERE id = ?").run(conf.id);
          notifyBookingStatusChange(conf.id, 'waitlisted', 'Another request was approved for this time slot.');
        }
      }
    }

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: isOverride ? 'BOOKING_OVERRIDE_APPROVED' : `BOOKING_${newStatus.toUpperCase()}`,
      entity_type: 'booking',
      entity_id: Number(bookingId),
      payload: {
        resource_id: booking.resource_id,
        user_id: booking.user_id,
        user_name: booking.user_name,
        decision: newStatus,
        is_override: isOverride,
        override_reason: override_reason || null
      }
    });

    notifyBookingStatusChange(bookingId, newStatus, isOverride ? `Owner note: ${override_reason}` : '');

    res.json({
      message: `Booking request successfully ${newStatus}`,
      status: newStatus,
      isOverride
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Check-in condition report + photos
 */
bookingsRouter.post('/:id/checkin', authenticate, uploadLimiter, upload.array('photos', 5), (req, res) => {
  try {
    const bookingId = req.params.id;
    const { is_working = 1, has_scratches = 0, missing_parts = 0, cleanliness = 5, notes } = req.body;

    const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized to check in this booking' });
    }

    const photoUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    if (req.body.existing_photos) {
      const existing = Array.isArray(req.body.existing_photos) ? req.body.existing_photos : [req.body.existing_photos];
      photoUrls.push(...existing);
    }

    // Default sample photos if none provided
    if (photoUrls.length === 0) {
      photoUrls.push('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80');
    }

    const checkedInAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO condition_reports (booking_id, type, user_id, is_working, has_scratches, missing_parts, cleanliness, notes, photos)
      VALUES (?, 'checkin', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      bookingId,
      req.user.id,
      Number(is_working),
      Number(has_scratches),
      Number(missing_parts),
      Number(cleanliness),
      notes || 'Clean condition, all parts present',
      JSON.stringify(photoUrls)
    );

    db.prepare(`
      UPDATE bookings SET status = 'checked_in', checked_in_at = ? WHERE id = ?
    `).run(checkedInAt, bookingId);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'CHECKIN_COMPLETED',
      entity_type: 'booking',
      entity_id: Number(bookingId),
      payload: { is_working, has_scratches, missing_parts, cleanliness, notes, photos_count: photoUrls.length }
    });

    notifyBookingStatusChange(bookingId, 'checked_in', 'Item collected. Please remember to return on time.');

    res.json({ message: 'Check-in completed successfully', checked_in_at: checkedInAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Return condition report + before/after diff + AI suggestion
 */
bookingsRouter.post('/:id/return', authenticate, uploadLimiter, upload.array('photos', 5), async (req, res) => {
  try {
    const bookingId = req.params.id;
    const { is_working = 1, has_scratches = 0, missing_parts = 0, cleanliness = 5, notes } = req.body;

    const booking = db.prepare(`
      SELECT b.*, r.name as resource_name, r.owner_id, r.manager_id
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const photoUrls = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    if (req.body.existing_photos) {
      const existing = Array.isArray(req.body.existing_photos) ? req.body.existing_photos : [req.body.existing_photos];
      photoUrls.push(...existing);
    }
    if (photoUrls.length === 0) {
      photoUrls.push('https://images.unsplash.com/photo-1631541909061-71e349d1f203?auto=format&fit=crop&w=600&q=80');
    }

    const checkinReport = db.prepare(`
      SELECT * FROM condition_reports WHERE booking_id = ? AND type = 'checkin' ORDER BY id DESC LIMIT 1
    `).get(bookingId);

    // Insert return report
    const stmt = db.prepare(`
      INSERT INTO condition_reports (booking_id, type, user_id, is_working, has_scratches, missing_parts, cleanliness, notes, photos)
      VALUES (?, 'return', ?, ?, ?, ?, ?, ?, ?)
    `);
    const returnReportId = stmt.run(
      bookingId,
      req.user.id,
      Number(is_working),
      Number(has_scratches),
      Number(missing_parts),
      Number(cleanliness),
      notes || 'Returned after session',
      JSON.stringify(photoUrls)
    ).lastInsertRowid;

    // Detect Condition Diff
    const diff = {
      working_changed: checkinReport ? (checkinReport.is_working !== Number(is_working)) : false,
      scratches_added: checkinReport ? (!checkinReport.has_scratches && Number(has_scratches) === 1) : false,
      parts_missing: checkinReport ? (!checkinReport.missing_parts && Number(missing_parts) === 1) : false,
      cleanliness_change: checkinReport ? (checkinReport.cleanliness - Number(cleanliness)) : 0
    };

    const hasNewDamage = diff.working_changed || diff.scratches_added || diff.parts_missing || diff.cleanliness_change > 1;

    // Check overdue
    const returnedAt = new Date().toISOString();
    const isLate = booking.end_time < returnedAt;

    let aiSuggestion = null;
    let incidentId = null;

    if (hasNewDamage) {
      aiSuggestion = await summarizeIncidentReport({
        resourceName: booking.resource_name,
        conditionBefore: checkinReport,
        conditionAfter: { is_working, has_scratches, missing_parts, cleanliness },
        notes,
        photosCount: photoUrls.length
      });

      const incStmt = db.prepare(`
        INSERT INTO incidents (
          booking_id, resource_id, reported_by, title, description,
          severity, status, ai_summary, ai_suggested_severity, photos
        ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)
      `);

      const incidentResult = incStmt.run(
        bookingId,
        booking.resource_id,
        req.user.id,
        `Condition Discrepancy on ${booking.resource_name}`,
        notes || 'Automated damage flag triggered by return condition comparison',
        aiSuggestion.suggested_severity || 'medium',
        aiSuggestion.summary,
        aiSuggestion.suggested_severity,
        JSON.stringify(photoUrls)
      );
      incidentId = incidentResult.lastInsertRowid;

      logAudit({
        actor_id: req.user.id,
        actor_name: req.user.name,
        actor_role: req.user.role,
        action: 'DAMAGE_REPORT_FILED',
        entity_type: 'incident',
        entity_id: incidentId,
        payload: { diff, aiSuggestion }
      });

      // Notify owner
      createNotification({
        userId: booking.owner_id,
        title: '⚠️ Damage/Condition Alert on Return',
        message: `${booking.resource_name} returned with condition discrepancies. AI suggested severity: ${(aiSuggestion.suggested_severity || 'medium').toUpperCase()}.`,
        type: 'danger',
        link: `/incidents/${incidentId}`
      });
    }

    const finalStatus = isLate ? 'overdue' : 'returned';
    db.prepare('UPDATE bookings SET status = ?, returned_at = ? WHERE id = ?').run(finalStatus, returnedAt, bookingId);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: isLate ? 'RETURN_LATE_OVERDUE' : 'RETURN_COMPLETED',
      entity_type: 'booking',
      entity_id: Number(bookingId),
      payload: { returned_at: returnedAt, is_late: isLate, has_new_damage: hasNewDamage, incident_id: incidentId }
    });

    notifyBookingStatusChange(bookingId, finalStatus, isLate ? 'Return was recorded past reservation end time.' : 'Thank you for returning equipment in good order.');

    res.json({
      message: 'Item returned successfully',
      status: finalStatus,
      diff,
      hasNewDamage,
      incidentId,
      aiSuggestion
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Cancel booking
 */
bookingsRouter.post('/:id/cancel', authenticate, (req, res) => {
  try {
    const bookingId = req.params.id;
    const { reason } = req.body;

    const booking = db.prepare(`
      SELECT b.*, r.name as resource_name 
      FROM bookings b 
      JOIN resources r ON b.resource_id = r.id 
      WHERE b.id = ?
    `).get(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Unauthorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }

    db.prepare("UPDATE bookings SET status = 'cancelled', decision_reason = ? WHERE id = ?").run(
      `Cancelled by ${req.user.name}: ${reason || 'User requested cancellation'}`,
      bookingId
    );

    const config = getFairnessConfig();
    const updatedCancellations = getCancellationsLast30Days(booking.user_id);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'BOOKING_CANCELLED',
      entity_type: 'booking',
      entity_id: Number(bookingId),
      payload: { reason, total_cancellations_30d: updatedCancellations }
    });

    // Re-rank queue for this resource
    rankQueueForResource(booking.resource_id);

    notifyBookingStatusChange(bookingId, 'cancelled', reason);

    let warning = null;
    if (updatedCancellations >= config.cancellation_penalty_threshold) {
      warning = `Warning: You now have ${updatedCancellations} cancellations in the past 30 days. Your account is on cooldown and future booking requests are temporarily paused for ${config.cancellation_block_days} days.`;
    }

    res.json({
      message: 'Booking successfully cancelled',
      cancellations_count: updatedCancellations,
      cooldown_threshold: config.cancellation_penalty_threshold,
      warning
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Request extension with conflict detection
 */
bookingsRouter.post('/:id/extend', authenticate, (req, res) => {
  try {
    const bookingId = req.params.id;
    const { new_end_time, reason } = req.body;

    const booking = db.prepare(`
      SELECT b.*, r.name as resource_name, r.owner_id 
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      WHERE b.id = ?
    `).get(bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ error: 'Unauthorized to extend this booking' });
    }

    if (booking.status !== 'approved' && booking.status !== 'checked_in') {
      return res.status(400).json({ error: `Cannot extend booking in '${booking.status}' status` });
    }

    // Default to +1 hour if no explicit new_end_time provided
    const targetEndTime = new_end_time || new Date(new Date(booking.end_time).getTime() + 60 * 60 * 1000).toISOString();

    // Conflict check for extension window
    const conflicts = findConflictingBookings(booking.resource_id, booking.end_time, targetEndTime, booking.id);
    if (conflicts.length > 0) {
      return res.status(400).json({
        error: `Cannot extend: Conflict detected with another booking (${conflicts[0].user_name} has requested or reserved this overlapping window).`
      });
    }

    db.prepare(`
      UPDATE bookings 
      SET end_time = ?, extension_requested_to = ?, extension_status = 'approved'
      WHERE id = ?
    `).run(targetEndTime, targetEndTime, bookingId);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'BOOKING_EXTENDED_1HR',
      entity_type: 'booking',
      entity_id: Number(bookingId),
      payload: { previous_end: booking.end_time, new_end: targetEndTime, reason }
    });

    createNotification({
      userId: booking.user_id,
      title: '1-Hour Extension Approved! ⏱️',
      message: `Your session for "${booking.resource_name}" has been extended to ${new Date(targetEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      type: 'success',
      link: `/bookings/${booking.id}`
    });

    if (booking.owner_id) {
      createNotification({
        userId: booking.owner_id,
        title: 'Booking Extended (1 hr)',
        message: `${req.user.name} extended their active booking for "${booking.resource_name}" by 1 hour.`,
        type: 'info',
        link: `/bookings/${booking.id}`
      });
    }

    res.json({
      message: 'Extension granted! +1 hour added with verified availability.',
      new_end_time: targetEndTime
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Booking Details & History
 */
bookingsRouter.get('/:id', authenticate, (req, res) => {
  try {
    const bookingId = req.params.id;
    const booking = db.prepare(`
      SELECT b.*, r.name as resource_name, r.category as resource_category, r.location, r.image_url,
             u.name as user_name, u.email as user_email, u.category as user_category,
             o.name as owner_name, o.email as owner_email
      FROM bookings b
      JOIN resources r ON b.resource_id = r.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN users o ON r.owner_id = o.id
      WHERE b.id = ?
    `).get(bookingId);

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Check authorization: user themselves, owner, manager, or admin
    if (booking.user_id !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'owner' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Unauthorized to view this booking' });
    }

    const conditionReports = db.prepare(`
      SELECT * FROM condition_reports WHERE booking_id = ? ORDER BY id ASC
    `).all(bookingId).map(r => ({
      ...r,
      photos: JSON.parse(r.photos || '[]')
    }));

    const incidents = db.prepare(`
      SELECT * FROM incidents WHERE booking_id = ? ORDER BY id DESC
    `).all(bookingId);

    const auditTrail = db.prepare(`
      SELECT * FROM audit_log WHERE entity_type = 'booking' AND entity_id = ? ORDER BY id ASC
    `).all(bookingId);

    let scoreBreakdown = null;
    try {
      scoreBreakdown = booking.score_breakdown ? JSON.parse(booking.score_breakdown) : null;
    } catch (e) {
      scoreBreakdown = null;
    }

    const cancellationsLast30Days = getCancellationsLast30Days(booking.user_id);
    const config = getFairnessConfig();

    res.json({
      ...booking,
      cancellations_last_30_days: cancellationsLast30Days,
      cancellation_penalty_threshold: config.cancellation_penalty_threshold,
      cancellation_block_days: config.cancellation_block_days,
      score_breakdown: scoreBreakdown,
      condition_reports: conditionReports,
      incidents,
      audit_trail: auditTrail
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

