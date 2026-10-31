import express from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditChain.js';
import { createNotification } from '../services/notificationService.js';
import { scanAndRecordCampusAnomalies, analyzeUserSuspiciousPatterns } from '../services/aiService.js';

export const aiRouter = express.Router();

/**
 * GET all AI usage anomaly flags
 */
aiRouter.get('/flags', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const { status = 'all' } = req.query;

    let query = `
      SELECT f.*, u.name as user_name, u.email as user_email, u.category as user_category, u.department,
             r.name as reviewer_name
      FROM ai_usage_flags f
      JOIN users u ON f.user_id = u.id
      LEFT JOIN users r ON f.reviewed_by = r.id
    `;
    const params = [];

    if (status !== 'all') {
      query += ` WHERE f.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY f.created_at DESC`;

    const flags = db.prepare(query).all(...params).map(f => ({
      ...f,
      metrics: JSON.parse(f.metrics || '{}')
    }));

    res.json(flags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Trigger immediate AI scan across campus
 */
aiRouter.post('/scan', authenticate, requireRole('owner', 'manager', 'admin'), async (req, res) => {
  try {
    const newlyDetected = await scanAndRecordCampusAnomalies();
    res.json({
      message: `Campus scan complete. ${newlyDetected.length} new usage anomalies flagged for review.`,
      detected: newlyDetected
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Human-in-the-loop review of an AI usage flag
 * Actions: 'dismiss' | 'warning' | 'cooldown'
 */
aiRouter.post('/flags/:id/review', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const flagId = req.params.id;
    const { action, notes = '' } = req.body;

    if (!['dismiss', 'warning', 'cooldown'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'dismiss', 'warning', or 'cooldown'" });
    }

    const flag = db.prepare(`
      SELECT f.*, u.name as user_name, u.email as user_email
      FROM ai_usage_flags f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = ?
    `).get(flagId);

    if (!flag) {
      return res.status(404).json({ error: 'AI Usage Flag not found' });
    }

    const statusMap = {
      dismiss: 'dismissed',
      warning: 'warning_issued',
      cooldown: 'cooldown_applied'
    };
    const newStatus = statusMap[action];
    const reviewedAt = new Date().toISOString();

    db.prepare(`
      UPDATE ai_usage_flags
      SET status = ?, reviewed_by = ?, reviewed_at = ?, review_notes = ?
      WHERE id = ?
    `).run(newStatus, req.user.id, reviewedAt, notes, flagId);

    // Cryptographic SHA-256 Audit Entry (Mandatory Human Decision Logging)
    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: `AI_FLAG_${action.toUpperCase()}`,
      entity_type: 'ai_usage_flag',
      entity_id: Number(flagId),
      payload: {
        target_user_id: flag.user_id,
        target_user_name: flag.user_name,
        pattern_type: flag.pattern_type,
        human_decision: action,
        review_notes: notes,
        reviewed_at: reviewedAt
      }
    });

    // Handle warning notification to the student
    if (action === 'warning') {
      createNotification({
        userId: flag.user_id,
        title: 'Campus Fair-Usage Advisory ⚠️',
        message: notes && notes.trim().length > 0 
          ? `Lab Advisory: ${notes}`
          : `Please be mindful when reserving peak hours: Multiple recent cancellations were detected (${flag.pattern_type}). To ensure fair access for peers, please only reserve slots you plan to use.`,
        type: 'warning',
        link: '/my-bookings'
      });
    } else if (action === 'cooldown') {
      createNotification({
        userId: flag.user_id,
        title: 'Booking Privilege Advisory ⏸️',
        message: `Your booking privileges have been placed on temporary hold following administrative review of usage patterns (${flag.pattern_type}). Reason: "${notes || 'Excessive slot churn'}".`,
        type: 'danger',
        link: '/passport'
      });
    }

    res.json({
      message: `AI suggestion successfully reviewed: ${action} applied.`,
      status: newStatus,
      reviewed_at: reviewedAt
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

