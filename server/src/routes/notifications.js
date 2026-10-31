import express from 'express';
import { db } from '../db/database.js';
import { authenticate } from '../middleware/auth.js';

export const notificationsRouter = express.Router();

notificationsRouter.get('/', authenticate, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 50
    `).all(req.user.id);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications 
      WHERE user_id = ? AND read = 0
    `).get(req.user.id).count;

    res.json({
      notifications,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

notificationsRouter.put('/:id/read', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

notificationsRouter.put('/read-all', authenticate, (req, res) => {
  try {
    db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

