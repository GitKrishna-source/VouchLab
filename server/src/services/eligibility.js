import { db } from '../db/database.js';

/**
 * Checks all requirements declared for a resource against a user's passport and records
 */
export function evaluateResourceEligibility(userId, resourceId) {
  const user = db.prepare('SELECT id, role, category, verified_status FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('User not found');

  const requirements = db.prepare(`
    SELECT * FROM resource_requirements WHERE resource_id = ? ORDER BY id ASC
  `).all(resourceId);

  if (requirements.length === 0) {
    return {
      isEligible: true,
      totalCount: 0,
      metCount: 0,
      requirements: []
    };
  }

  let metCount = 0;
  const checklist = requirements.map(req => {
    let status = 'missing'; // 'met' | 'pending_verification' | 'missing'
    let action = null;
    let details = null;
    let config = {};
    try {
      config = req.config ? JSON.parse(req.config) : {};
    } catch (e) {
      config = {};
    }

    if (req.type === 'quiz') {
      const quiz = db.prepare('SELECT id, pass_percentage FROM quizzes WHERE requirement_id = ?').get(req.id);
      if (quiz) {
        const attempt = db.prepare(`
          SELECT score, passed, attempted_at 
          FROM quiz_attempts 
          WHERE user_id = ? AND quiz_id = ? AND passed = 1
          ORDER BY score DESC LIMIT 1
        `).get(userId, quiz.id);

        if (attempt && attempt.passed === 1) {
          status = 'met';
          details = `Passed with ${attempt.score}%`;
        } else {
          status = 'missing';
          action = 'take_quiz';
          details = `Pass mark: ${quiz.pass_percentage}%`;
        }
      } else {
        // Fallback: check passport badge
        const badge = db.prepare('SELECT * FROM passports WHERE user_id = ? AND badge_key = ?').get(userId, `req_${req.id}`);
        status = badge ? 'met' : 'missing';
        action = badge ? null : 'take_quiz';
      }
    } else if (req.type === 'certificate') {
      const cert = db.prepare(`
        SELECT id, status, original_name, verified_at, notes
        FROM certificates 
        WHERE user_id = ? AND requirement_id = ?
        ORDER BY id DESC LIMIT 1
      `).get(userId, req.id);

      if (cert) {
        if (cert.status === 'verified') {
          status = 'met';
          details = `Verified certificate (${cert.original_name})`;
        } else if (cert.status === 'pending') {
          status = 'pending_verification';
          details = `Document uploaded (${cert.original_name}), awaiting owner/manager review`;
        } else {
          status = 'missing';
          action = 'upload_certificate';
          details = `Previous document rejected: ${cert.notes || 'Please re-upload a valid document'}`;
        }
      } else {
        status = 'missing';
        action = 'upload_certificate';
        details = 'Requires official certification document';
      }
    } else if (req.type === 'supervised_session') {
      const requiredSessions = config.required_sessions || 1;
      // Count completed bookings for this resource or category where manager was present / signed off
      const completedSessions = db.prepare(`
        SELECT COUNT(*) as count 
        FROM bookings 
        WHERE user_id = ? AND resource_id = ? AND status IN ('completed', 'returned')
      `).get(userId, resourceId);

      const count = completedSessions ? completedSessions.count : 0;
      if (count >= requiredSessions) {
        status = 'met';
        details = `${count} of ${requiredSessions} supervised sessions completed`;
      } else {
        status = 'missing';
        action = 'request_signoff';
        details = `${count} of ${requiredSessions} supervised sessions completed`;
      }
    } else if (req.type === 'signoff') {
      const signoff = db.prepare(`
        SELECT id, status, approved_at, notes 
        FROM signoffs 
        WHERE user_id = ? AND requirement_id = ?
        ORDER BY id DESC LIMIT 1
      `).get(userId, req.id);

      if (signoff) {
        if (signoff.status === 'approved') {
          status = 'met';
          details = `Manager approved on ${signoff.approved_at?.substring(0, 10) || 'file'}`;
        } else if (signoff.status === 'pending') {
          status = 'pending_verification';
          details = 'Approval request sent to manager/faculty';
        } else {
          status = 'missing';
          action = 'request_signoff';
          details = `Signoff rejected: ${signoff.notes || 'Contact manager'}`;
        }
      } else {
        status = 'missing';
        action = 'request_signoff';
        details = 'Requires faculty/manager endorsement';
      }
    } else if (req.type === 'membership') {
      const requiredRole = config.required_role || 'student';
      if (user.verified_status === 1 && (user.role === 'user' || user.role === requiredRole || user.category === requiredRole)) {
        status = 'met';
        details = `Verified active campus member (${user.role})`;
      } else {
        status = 'missing';
        action = 'request_verification';
        details = `Requires verified ${requiredRole} status`;
      }
    }

    if (status === 'met') metCount++;

    return {
      id: req.id,
      resource_id: req.resource_id,
      type: req.type,
      title: req.title,
      description: req.description,
      status, // 'met' | 'pending_verification' | 'missing'
      action,
      details
    };
  });

  const isEligible = metCount === requirements.length;

  return {
    isEligible,
    totalCount: requirements.length,
    metCount,
    requirements: checklist
  };
}

/**
 * Enforces server-side eligibility check before allowing booking creation
 */
export function assertUserIsEligible(userId, resourceId) {
  const result = evaluateResourceEligibility(userId, resourceId);
  if (!result.isEligible) {
    const missing = result.requirements
      .filter(r => r.status !== 'met')
      .map(r => `• ${r.title} (${r.status === 'pending_verification' ? 'Pending Review' : 'Missing'})`)
      .join('\n');

    const err = new Error(`Ineligible to book this resource. Missing required qualifications:\n${missing}`);
    err.status = 403;
    err.details = result;
    throw err;
  }
  return true;
}

