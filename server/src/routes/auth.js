import express from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/database.js';
import { generateToken, authenticate } from '../middleware/auth.js';
import { logAudit } from '../services/auditChain.js';

export const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'user', category = 'student', department, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, category, department, phone, verified_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `);
    const result = stmt.run(name, email.toLowerCase().trim(), password_hash, role, category, department || null, phone || null);
    const user = db.prepare('SELECT id, name, email, role, category, verified_status, department, phone FROM users WHERE id = ?').get(result.lastInsertRowid);

    logAudit({
      actor_id: user.id,
      actor_name: user.name,
      actor_role: user.role,
      action: 'USER_REGISTERED',
      entity_type: 'user',
      entity_id: user.id,
      payload: { email: user.email, role: user.role, category: user.category }
    });

    const token = generateToken(user);
    res.status(201).json({ user, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      department: user.department,
      phone: user.phone,
      verified_status: user.verified_status
    };

    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.post('/demo-login', (req, res) => {
  try {
    const { email, role } = req.body;
    let user = null;
    if (email) {
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    } else if (role) {
      user = db.prepare('SELECT * FROM users WHERE role = ? ORDER BY id ASC LIMIT 1').get(role);
    }

    if (!user) {
      return res.status(404).json({ error: 'Demo user not found' });
    }

    const safeUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      category: user.category,
      department: user.department,
      phone: user.phone,
      verified_status: user.verified_status
    };

    const token = generateToken(safeUser);
    res.json({ user: safeUser, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

authRouter.get('/demo-accounts', (req, res) => {
  const users = db.prepare('SELECT id, name, email, role, category, department FROM users ORDER BY role DESC, id ASC').all();
  res.json({ demo_accounts: users, default_password: 'password123' });
});

authRouter.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

