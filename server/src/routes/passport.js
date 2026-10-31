import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { db } from '../db/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditChain.js';
import { createNotification } from '../services/notificationService.js';

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
    const uniqueName = `cert_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const passportRouter = express.Router();

/**
 * GET current user's full passport
 */
passportRouter.get('/my-passport', authenticate, (req, res) => {
  try {
    const userId = req.user.id;

    const badges = db.prepare('SELECT * FROM passports WHERE user_id = ? ORDER BY issued_at DESC').all(userId);
    const certificates = db.prepare(`
      SELECT c.*, r.title as requirement_title, res.name as resource_name
      FROM certificates c
      JOIN resource_requirements r ON c.requirement_id = r.id
      JOIN resources res ON r.resource_id = res.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(userId);

    const quizAttempts = db.prepare(`
      SELECT qa.*, q.title as quiz_title, r.name as resource_name
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN resources r ON q.resource_id = r.id
      WHERE qa.user_id = ?
      ORDER BY qa.attempted_at DESC
    `).all(userId);

    const signoffs = db.prepare(`
      SELECT s.*, r.title as requirement_title, res.name as resource_name, u.name as approver_name
      FROM signoffs s
      JOIN resource_requirements r ON s.requirement_id = r.id
      JOIN resources res ON s.resource_id = res.id
      LEFT JOIN users u ON s.approved_by = u.id
      WHERE s.user_id = ?
      ORDER BY s.requested_at DESC
    `).all(userId);

    res.json({
      user: req.user,
      badges,
      certificates,
      quizAttempts,
      signoffs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET quiz details by requirement_id
 */
passportRouter.get('/quiz-by-requirement/:requirementId', authenticate, (req, res) => {
  try {
    const reqId = req.params.requirementId;
    const quiz = db.prepare('SELECT * FROM quizzes WHERE requirement_id = ?').get(reqId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found for this requirement' });
    }

    const questions = db.prepare('SELECT id, question, options FROM quiz_questions WHERE quiz_id = ?').all(quiz.id);
    const parsedQuestions = questions.map(q => ({
      ...q,
      options: JSON.parse(q.options)
    }));

    res.json({
      quiz,
      questions: parsedQuestions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Submit quiz answers and score
 */
passportRouter.post('/quizzes/:quizId/submit', authenticate, (req, res) => {
  try {
    const quizId = req.params.quizId;
    const { answers } = req.body; // e.g. { "questionId": selectedIndex }

    const quiz = db.prepare(`
      SELECT q.*, r.name as resource_name, req.title as requirement_title 
      FROM quizzes q
      JOIN resources r ON q.resource_id = r.id
      JOIN resource_requirements req ON q.requirement_id = req.id
      WHERE q.id = ?
    `).get(quizId);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = db.prepare('SELECT id, question, correct_option_index, explanation FROM quiz_questions WHERE quiz_id = ?').all(quizId);
    if (questions.length === 0) {
      return res.status(400).json({ error: 'Quiz has no questions configured' });
    }

    let correctCount = 0;
    const review = questions.map(q => {
      const userSelected = answers ? answers[q.id] : null;
      const isCorrect = userSelected !== undefined && Number(userSelected) === q.correct_option_index;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id,
        userSelected,
        correctIndex: q.correct_option_index,
        isCorrect,
        explanation: q.explanation
      };
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const passed = percentage >= quiz.pass_percentage ? 1 : 0;

    // Record attempt
    db.prepare(`
      INSERT INTO quiz_attempts (user_id, quiz_id, score, passed, answers)
      VALUES (?, ?, ?, ?, ?)
    `).run(req.user.id, quizId, percentage, passed, JSON.stringify(answers || {}));

    if (passed === 1) {
      // Award badge to passport
      const badgeKey = `req_${quiz.requirement_id}`;
      db.prepare(`
        INSERT OR IGNORE INTO passports (user_id, badge_key, title, description)
        VALUES (?, ?, ?, ?)
      `).run(
        req.user.id,
        badgeKey,
        `${quiz.resource_name}: ${quiz.requirement_title}`,
        `Passed competency assessment with ${percentage}% score.`
      );

      logAudit({
        actor_id: req.user.id,
        actor_name: req.user.name,
        actor_role: req.user.role,
        action: 'QUIZ_PASSED',
        entity_type: 'quiz',
        entity_id: Number(quizId),
        payload: { score: percentage, pass_percentage: quiz.pass_percentage, quiz_title: quiz.title }
      });

      createNotification({
        userId: req.user.id,
        title: 'Safety Quiz Passed! 🎉',
        message: `Congratulations! You passed "${quiz.title}" with a score of ${percentage}%. Your passport badge is now active.`,
        type: 'success',
        link: '/passport'
      });
    }

    res.json({
      passed: passed === 1,
      score: percentage,
      pass_percentage: quiz.pass_percentage,
      correctCount,
      totalQuestions: questions.length,
      review
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Upload certificate for a requirement
 */
passportRouter.post('/certificates/upload', authenticate, upload.single('certificate'), (req, res) => {
  try {
    const { requirement_id, notes } = req.body;
    if (!req.file || !requirement_id) {
      return res.status(400).json({ error: 'Certificate file and requirement_id are required' });
    }

    const requirement = db.prepare(`
      SELECT req.*, r.name as resource_name, r.owner_id, r.manager_id 
      FROM resource_requirements req
      JOIN resources r ON req.resource_id = r.id
      WHERE req.id = ?
    `).get(requirement_id);

    if (!requirement) {
      return res.status(404).json({ error: 'Requirement not found' });
    }

    const filePath = `/uploads/${req.file.filename}`;

    const stmt = db.prepare(`
      INSERT INTO certificates (user_id, requirement_id, file_path, original_name, status, notes)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `);
    const result = stmt.run(req.user.id, requirement_id, filePath, req.file.originalname, notes || null);
    const certId = result.lastInsertRowid;

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'CERTIFICATE_UPLOADED',
      entity_type: 'certificate',
      entity_id: certId,
      payload: { requirement_id, original_name: req.file.originalname }
    });

    // Notify resource owner & manager
    const recipientIds = [requirement.owner_id, requirement.manager_id].filter(Boolean);
    for (const recipientId of recipientIds) {
      createNotification({
        userId: recipientId,
        title: 'New Certificate for Verification',
        message: `${req.user.name} uploaded a certificate for "${requirement.title}" (${requirement.resource_name}).`,
        type: 'info',
        link: '/admin'
      });
    }

    res.status(201).json({
      message: 'Certificate uploaded successfully and queued for owner review',
      certificate_id: certId,
      file_path: filePath,
      status: 'pending'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Pending certificates list for review
 */
passportRouter.get('/certificates/pending', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    let query = `
      SELECT c.*, u.name as user_name, u.email as user_email, u.category as user_category,
             r.title as requirement_title, res.name as resource_name
      FROM certificates c
      JOIN users u ON c.user_id = u.id
      JOIN resource_requirements r ON c.requirement_id = r.id
      JOIN resources res ON r.resource_id = res.id
      WHERE c.status = 'pending'
    `;
    const params = [];

    if (req.user.role !== 'admin') {
      query += ` AND (res.owner_id = ? OR res.manager_id = ?)`;
      params.push(req.user.id, req.user.id);
    }

    query += ' ORDER BY c.created_at ASC';
    const pending = db.prepare(query).all(...params);
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Review certificate (verify or reject)
 */
passportRouter.post('/certificates/:id/review', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const certId = req.params.id;
    const { action, notes } = req.body; // action: 'verify' | 'reject'

    if (!['verify', 'reject'].includes(action)) {
      return res.status(400).json({ error: "Action must be 'verify' or 'reject'" });
    }

    const cert = db.prepare(`
      SELECT c.*, r.title as requirement_title, res.name as resource_name 
      FROM certificates c
      JOIN resource_requirements r ON c.requirement_id = r.id
      JOIN resources res ON r.resource_id = res.id
      WHERE c.id = ?
    `).get(certId);

    if (!cert) {
      return res.status(404).json({ error: 'Certificate record not found' });
    }

    const status = action === 'verify' ? 'verified' : 'rejected';
    const verifiedAt = new Date().toISOString();

    db.prepare(`
      UPDATE certificates 
      SET status = ?, verified_by = ?, verified_at = ?, notes = ?
      WHERE id = ?
    `).run(status, req.user.id, verifiedAt, notes || null, certId);

    if (status === 'verified') {
      // Award badge
      db.prepare(`
        INSERT OR IGNORE INTO passports (user_id, badge_key, title, description)
        VALUES (?, ?, ?, ?)
      `).run(
        cert.user_id,
        `cert_${cert.requirement_id}`,
        `Certified: ${cert.requirement_title}`,
        `Verified by ${req.user.name} on ${verifiedAt.substring(0, 10)}.`
      );
    }

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: status === 'verified' ? 'CERTIFICATE_VERIFIED' : 'CERTIFICATE_REJECTED',
      entity_type: 'certificate',
      entity_id: Number(certId),
      payload: { user_id: cert.user_id, requirement_title: cert.requirement_title, notes }
    });

    createNotification({
      userId: cert.user_id,
      title: status === 'verified' ? 'Certificate Verified! ✅' : 'Certificate Action Needed ⚠️',
      message: status === 'verified'
        ? `Your certificate for "${cert.requirement_title}" was verified by ${req.user.name}. You are now eligible to book!`
        : `Your certificate for "${cert.requirement_title}" was not approved: "${notes || 'Please resubmit'}".`,
      type: status === 'verified' ? 'success' : 'warning',
      link: '/passport'
    });

    res.json({ message: `Certificate successfully ${status}`, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Request manager sign-off
 */
passportRouter.post('/signoffs/request', authenticate, (req, res) => {
  try {
    const { requirement_id, resource_id, notes } = req.body;
    if (!requirement_id || !resource_id) {
      return res.status(400).json({ error: 'requirement_id and resource_id are required' });
    }

    const existing = db.prepare(`
      SELECT id, status FROM signoffs WHERE user_id = ? AND requirement_id = ? AND status IN ('pending', 'approved')
    `).get(req.user.id, requirement_id);

    if (existing) {
      return res.status(400).json({ error: `Sign-off request is already ${existing.status}` });
    }

    const stmt = db.prepare(`
      INSERT INTO signoffs (user_id, requirement_id, resource_id, notes)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, requirement_id, resource_id, notes || null);

    const resource = db.prepare('SELECT name, owner_id, manager_id FROM resources WHERE id = ?').get(resource_id);

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: 'SIGNOFF_REQUESTED',
      entity_type: 'signoff',
      entity_id: result.lastInsertRowid,
      payload: { resource_id, requirement_id }
    });

    if (resource?.manager_id) {
      createNotification({
        userId: resource.manager_id,
        title: 'Sign-Off Endorsement Requested',
        message: `${req.user.name} requested supervisor sign-off for ${resource.name}.`,
        type: 'info',
        link: '/admin'
      });
    }

    res.status(201).json({ message: 'Sign-off request submitted to lab manager' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * Approve or reject sign-off
 */
passportRouter.post('/signoffs/:id/review', authenticate, requireRole('owner', 'manager', 'admin'), (req, res) => {
  try {
    const signoffId = req.params.id;
    const { action, notes } = req.body; // 'approve' | 'reject'

    const signoff = db.prepare(`
      SELECT s.*, r.title as requirement_title, res.name as resource_name
      FROM signoffs s
      JOIN resource_requirements r ON s.requirement_id = r.id
      JOIN resources res ON s.resource_id = res.id
      WHERE s.id = ?
    `).get(signoffId);

    if (!signoff) {
      return res.status(404).json({ error: 'Sign-off request not found' });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';
    const approvedAt = new Date().toISOString();

    db.prepare(`
      UPDATE signoffs 
      SET status = ?, approved_by = ?, approved_at = ?, notes = ?
      WHERE id = ?
    `).run(status, req.user.id, approvedAt, notes || null, signoffId);

    if (status === 'approved') {
      db.prepare(`
        INSERT OR IGNORE INTO passports (user_id, badge_key, title, description)
        VALUES (?, ?, ?, ?)
      `).run(
        signoff.user_id,
        `signoff_${signoff.requirement_id}`,
        `Sign-off: ${signoff.requirement_title}`,
        `Endorsed by ${req.user.name} on ${approvedAt.substring(0, 10)}.`
      );
    }

    logAudit({
      actor_id: req.user.id,
      actor_name: req.user.name,
      actor_role: req.user.role,
      action: status === 'approved' ? 'SIGNOFF_APPROVED' : 'SIGNOFF_REJECTED',
      entity_type: 'signoff',
      entity_id: Number(signoffId),
      payload: { user_id: signoff.user_id, requirement_title: signoff.requirement_title }
    });

    createNotification({
      userId: signoff.user_id,
      title: status === 'approved' ? 'Supervisor Sign-Off Approved! 🌟' : 'Sign-Off Update',
      message: `Your sign-off for "${signoff.requirement_title}" was ${status} by ${req.user.name}.`,
      type: status === 'approved' ? 'success' : 'warning',
      link: '/passport'
    });

    res.json({ message: `Sign-off ${status} successfully` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

