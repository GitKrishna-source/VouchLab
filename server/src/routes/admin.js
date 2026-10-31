import express from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { getFairnessConfig, updateFairnessConfig } from '../services/fairShare.js';
import { analyzeUserSuspiciousPatterns } from '../services/aiService.js';
import { seedDatabase } from '../db/seed.js';
import { logAudit } from '../services/auditChain.js';

export const adminRouter = express.Router();

adminRouter.get('/stats', authenticate, requireRole('admin', 'owner'), (req, res) => {
  try {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const verifiedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE verified_status = 1').get().count;
    const pendingVerifications = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE status = "pending"').get().count;
    const totalResources = db.prepare('SELECT COUNT(*) as count FROM resources WHERE is_active = 1').get().count;
    const activeBookings = db.prepare('SELECT COUNT(*) as count FROM bookings WHERE status IN ("approved", "checked_in")').get().count;
    const reportedIncidents = db.prepare('SELECT COUNT(*) as count FROM incidents WHERE status = "open"').get().count;

    const recentActivity = db.prepare(`
      SELECT a.*, u.name as user_name
      FROM audit_log a
      LEFT JOIN users u ON a.actor_id = u.id
      ORDER BY a.id DESC LIMIT 10
    `).all();

    res.json({
      stats: {
        totalUsers,
        verifiedUsers,
        pendingVerifications,
        totalResources,
        activeBookings,
        reportedIncidents
      },
      recentActivity
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/users', authenticate, requireRole('admin'), (req, res) => {
  try {
    const users = db.prepare('SELECT id, name, email, role, category, department, verified_status, created_at FROM users ORDER BY id ASC').all();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post('/users/:id/verify', authenticate, requireRole('admin'), (req, res) => {
  try {
    const userId = req.params.id;
    const { status = 1 } = req.body;

    db.prepare('UPDATE users SET verified_status = ? WHERE id = ?').run(status, userId);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: status === 1 ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
      entity_type: 'user',
      entity_id: Number(userId),
      payload: { status }
    });

    res.json({ message: `User verification updated to ${status === 1 ? 'Verified' : 'Unverified'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/fairness-config', (req, res) => {
  try {
    const config = getFairnessConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.put('/fairness-config', authenticate, requireRole('admin'), (req, res) => {
  try {
    const updated = updateFairnessConfig(req.body);
    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'FAIRNESS_CONFIG_UPDATED',
      entity_type: 'config',
      entity_id: 1,
      payload: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.get('/anomalies/:userId', authenticate, requireRole('admin', 'owner', 'manager'), async (req, res) => {
  try {
    const result = await analyzeUserSuspiciousPatterns(req.params.userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 1-Click Reset Demo Data
 */
adminRouter.post('/reset-demo', async (req, res) => {
  try {
    await seedDatabase(true);
    res.json({ message: 'Demo database reset and seeded with initial demo scenarios successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

