import express from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { verifyAuditChain, tamperWithAuditRow, restoreTamperedRow, tamperedBackup } from '../services/auditChain.js';

export const auditRouter = express.Router();

auditRouter.get('/', authenticate, (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit || '50', 10));
    const offset = parseInt(req.query.offset || '0', 10);
    const entityType = req.query.entity_type;

    let query = 'SELECT * FROM audit_log';
    const params = [];

    if (entityType) {
      query += ' WHERE entity_type = ?';
      params.push(entityType);
    }

    query += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const logs = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM audit_log').get().count;

    const parsedLogs = logs.map(l => {
      let payload = null;
      try {
        payload = JSON.parse(l.payload);
      } catch (e) {
        payload = l.payload;
      }
      return { ...l, payload };
    });

    res.json({
      logs: parsedLogs,
      total,
      hasTamperedRowBackup: Boolean(tamperedBackup)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Verify complete cryptographic hash chain
 */
auditRouter.get('/verify', (req, res) => {
  try {
    const result = verifyAuditChain();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Judge Demo Tool: Tamper with a row in place
 */
auditRouter.post('/tamper', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { row_id = 3, payload } = req.body;
    const result = tamperWithAuditRow(row_id, payload);
    res.json({
      message: `Row #${row_id} payload modified intentionally to demonstrate tamper detection.`,
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Judge Demo Tool: Restore tampered row
 */
auditRouter.post('/restore', authenticate, requireRole('admin'), (req, res) => {
  try {
    const restored = restoreTamperedRow();
    res.json({
      message: `Row #${restored.id} successfully restored to original cryptographic state.`,
      restored
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

