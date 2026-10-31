import express from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditChain.js';
import { summarizeIncidentReport } from '../services/aiService.js';
import { createNotification } from '../services/notificationService.js';

export const incidentsRouter = express.Router();

incidentsRouter.get('/', authenticate, (req, res) => {
  try {
    let query = `
      SELECT i.*, r.name as resource_name, r.location, u.name as reporter_name, b.start_time, b.end_time
      FROM incidents i
      JOIN resources r ON i.resource_id = r.id
      JOIN users u ON i.reported_by = u.id
      LEFT JOIN bookings b ON i.booking_id = b.id
    `;
    const params = [];

    if (req.user.role === 'user') {
      query += ` WHERE i.reported_by = ?`;
      params.push(req.user.id);
    } else if (req.user.role !== 'admin') {
      query += ` WHERE (r.owner_id = ? OR r.manager_id = ?)`;
      params.push(req.user.id, req.user.id);
    }

    query += ' ORDER BY i.created_at DESC';
    const incidents = db.prepare(query).all(...params).map(i => ({
      ...i,
      photos: JSON.parse(i.photos || '[]')
    }));

    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

incidentsRouter.get('/:id', authenticate, (req, res) => {
  try {
    const incident = db.prepare(`
      SELECT i.*, r.name as resource_name, r.location, r.owner_id, r.manager_id,
             u.name as reporter_name, u.email as reporter_email,
             res_u.name as resolver_name
      FROM incidents i
      JOIN resources r ON i.resource_id = r.id
      JOIN users u ON i.reported_by = u.id
      LEFT JOIN users res_u ON i.resolved_by = res_u.id
      WHERE i.id = ?
    `).get(req.params.id);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    incident.photos = JSON.parse(incident.photos || '[]');

    let conditionReports = [];
    if (incident.booking_id) {
      conditionReports = db.prepare('SELECT * FROM condition_reports WHERE booking_id = ?').all(incident.booking_id).map(c => ({
        ...c,
        photos: JSON.parse(c.photos || '[]')
      }));
    }

    res.json({
      ...incident,
      condition_reports: conditionReports
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

incidentsRouter.post('/:id/resolve', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const incidentId = req.params.id;
    const { resolution_notes, action_taken = 'dismissed' } = req.body;

    if (!resolution_notes) {
      return res.status(400).json({ error: 'Resolution notes are required' });
    }

    const incident = db.prepare(`
      SELECT i.*, r.name as resource_name, r.owner_id, r.manager_id 
      FROM incidents i
      JOIN resources r ON i.resource_id = r.id
      WHERE i.id = ?
    `).get(incidentId);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const resolvedAt = new Date().toISOString();

    db.prepare(`
      UPDATE incidents
      SET status = 'resolved', resolution_notes = ?, resolved_by = ?, resolved_at = ?
      WHERE id = ?
    `).run(resolution_notes, req.user.id, resolvedAt, incidentId);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'INCIDENT_RESOLVED',
      entity_type: 'incident',
      entity_id: Number(incidentId),
      payload: { resolution_notes, action_taken }
    });

    createNotification({
      userId: incident.reported_by,
      title: 'Incident Report Resolved',
      message: `The incident report for ${incident.resource_name} has been resolved by ${req.user.name}: "${resolution_notes}".`,
      type: 'info',
      link: `/incidents/${incidentId}`
    });

    res.json({ message: 'Incident resolved successfully', resolved_at: resolvedAt });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

