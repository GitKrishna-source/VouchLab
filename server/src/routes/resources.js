import express from 'express';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditChain.js';
import { evaluateResourceEligibility } from '../services/eligibility.js';
import { searchResourcesNL } from '../services/aiService.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vouchlab_hackathon_demo_secret_2026';

export const resourcesRouter = express.Router();

function getOptionalUserId(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (e) {
    return null;
  }
}

resourcesRouter.get('/', async (req, res) => {
  try {
    const { category, location, q, eligibleOnly } = req.query;
    const currentUserId = getOptionalUserId(req);

    let resources = [];

    if (q && q.trim()) {
      resources = await searchResourcesNL(q.trim());
    } else {
      let query = 'SELECT r.*, u.name as owner_name, m.name as manager_name FROM resources r LEFT JOIN users u ON r.owner_id = u.id LEFT JOIN users m ON r.manager_id = m.id WHERE r.is_active = 1';
      const params = [];

      if (category && category !== 'All') {
        query += ' AND r.category = ?';
        params.push(category);
      }
      if (location && location !== 'All') {
        query += ' AND r.location LIKE ?';
        params.push(`%${location}%`);
      }

      query += ' ORDER BY r.id ASC';
      resources = db.prepare(query).all(...params);
    }

    // Attach requirements summary and eligibility state if user logged in
    const enriched = resources.map(r => {
      const requirements = db.prepare('SELECT id, type, title FROM resource_requirements WHERE resource_id = ?').all(r.id);
      let eligibility = null;
      if (currentUserId) {
        try {
          eligibility = evaluateResourceEligibility(currentUserId, r.id);
        } catch (e) {
          eligibility = null;
        }
      }
      return {
        ...r,
        requirements,
        eligibility
      };
    });

    if (eligibleOnly === 'true' && currentUserId) {
      return res.json(enriched.filter(r => r.eligibility && r.eligibility.isEligible));
    }

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

resourcesRouter.get('/:id', (req, res) => {
  try {
    const resource = db.prepare(`
      SELECT r.*, u.name as owner_name, u.email as owner_email, m.name as manager_name, m.email as manager_email
      FROM resources r
      LEFT JOIN users u ON r.owner_id = u.id
      LEFT JOIN users m ON r.manager_id = m.id
      WHERE r.id = ?
    `).get(req.params.id);

    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const currentUserId = getOptionalUserId(req);
    let eligibility = null;
    if (currentUserId) {
      eligibility = evaluateResourceEligibility(currentUserId, resource.id);
    }

    const requirements = db.prepare('SELECT * FROM resource_requirements WHERE resource_id = ?').all(resource.id);

    res.json({
      ...resource,
      requirements,
      eligibility
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

resourcesRouter.get('/:id/slots', (req, res) => {
  try {
    const resourceId = req.params.id;
    const date = req.query.date || new Date().toISOString().substring(0, 10);

    const standardSlots = [
      { start: '09:00', end: '11:00', label: '09:00 AM - 11:00 AM' },
      { start: '11:00', end: '13:00', label: '11:00 AM - 01:00 PM' },
      { start: '14:00', end: '16:00', label: '02:00 PM - 04:00 PM' },
      { start: '16:00', end: '18:00', label: '04:00 PM - 06:00 PM' },
      { start: '18:00', end: '20:00', label: '06:00 PM - 08:00 PM' }
    ];

    const bookings = db.prepare(`
      SELECT id, user_id, start_time, end_time, status, waitlist_position
      FROM bookings
      WHERE resource_id = ?
        AND start_time LIKE ?
        AND status IN ('pending', 'approved', 'waitlisted', 'checked_in')
    `).all(resourceId, `${date}%`);

    const slotsWithStatus = standardSlots.map(slot => {
      const slotStart = `${date}T${slot.start}:00`;
      const slotEnd = `${date}T${slot.end}:00`;

      const matchedBookings = bookings.filter(b => {
        return (b.start_time <= slotStart && b.end_time > slotStart) ||
               (b.start_time < slotEnd && b.end_time >= slotEnd);
      });

      const approvedBooking = matchedBookings.find(b => b.status === 'approved' || b.status === 'checked_in');
      const pendingBookings = matchedBookings.filter(b => b.status === 'pending' || b.status === 'waitlisted');

      let status = 'available';
      if (approvedBooking) {
        status = 'booked';
      } else if (pendingBookings.length > 0) {
        status = 'contested'; // multiple pending requests competing
      }

      return {
        ...slot,
        start_time: slotStart,
        end_time: slotEnd,
        status, // 'available' | 'booked' | 'contested'
        pendingCount: pendingBookings.length,
        approvedBookingId: approvedBooking ? approvedBooking.id : null
      };
    });

    res.json({ date, slots: slotsWithStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

resourcesRouter.post('/', authenticate, requireRole('owner', 'admin'), (req, res) => {
  try {
    const {
      name,
      category,
      description,
      location,
      manager_id,
      image_url,
      availability_hours,
      rules,
      access_conditions,
      deposit = 0,
      max_session_hours = 4,
      monthly_cap_hours = 20,
      requirements = []
    } = req.body;

    if (!name || !category || !location) {
      return res.status(400).json({ error: 'Name, category, and location are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO resources (
        name, category, description, location, owner_id, manager_id,
        image_url, availability_hours, rules, access_conditions,
        deposit, max_session_hours, monthly_cap_hours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name,
      category,
      description || '',
      location,
      req.user.id,
      manager_id || req.user.id,
      image_url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      typeof availability_hours === 'object' ? JSON.stringify(availability_hours) : availability_hours || '{"open": "09:00", "close": "18:00"}',
      rules || '',
      access_conditions || '',
      deposit,
      max_session_hours,
      monthly_cap_hours
    );

    const resourceId = result.lastInsertRowid;

    if (Array.isArray(requirements) && requirements.length > 0) {
      const insertReq = db.prepare(`
        INSERT INTO resource_requirements (resource_id, type, title, description, config)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const reqItem of requirements) {
        insertReq.run(
          resourceId,
          reqItem.type,
          reqItem.title,
          reqItem.description || '',
          typeof reqItem.config === 'object' ? JSON.stringify(reqItem.config) : (reqItem.config || '{}')
        );
      }
    }

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'RESOURCE_CREATED',
      entity_type: 'resource',
      entity_id: resourceId,
      payload: { name, category, location, deposit, requirements_count: requirements.length }
    });

    const created = db.prepare('SELECT * FROM resources WHERE id = ?').get(resourceId);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

