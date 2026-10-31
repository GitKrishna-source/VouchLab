import { db } from '../db/database.js';

export function getFairnessConfig() {
  const config = db.prepare('SELECT * FROM fairness_config WHERE id = 1').get();
  if (!config) {
    return {
      w_wait: 10.0,
      w_usage: 2.0,
      bonus_academic: 30.0,
      bonus_research: 20.0,
      bonus_startup: 10.0,
      bonus_casual: 0.0,
      monthly_hour_cap: 20.0,
      cancellation_penalty_threshold: 3,
      cancellation_block_days: 7
    };
  }
  return config;
}

export function updateFairnessConfig(newConfig) {
  db.prepare(`
    UPDATE fairness_config SET
      w_wait = COALESCE(?, w_wait),
      w_usage = COALESCE(?, w_usage),
      bonus_academic = COALESCE(?, bonus_academic),
      bonus_research = COALESCE(?, bonus_research),
      bonus_startup = COALESCE(?, bonus_startup),
      bonus_casual = COALESCE(?, bonus_casual),
      monthly_hour_cap = COALESCE(?, monthly_hour_cap),
      cancellation_penalty_threshold = COALESCE(?, cancellation_penalty_threshold),
      cancellation_block_days = COALESCE(?, cancellation_block_days),
      updated_at = datetime('now')
    WHERE id = 1
  `).run(
    newConfig.w_wait,
    newConfig.w_usage,
    newConfig.bonus_academic,
    newConfig.bonus_research,
    newConfig.bonus_startup,
    newConfig.bonus_casual,
    newConfig.monthly_hour_cap,
    newConfig.cancellation_penalty_threshold,
    newConfig.cancellation_block_days
  );
  return getFairnessConfig();
}

/**
 * Calculates hours used by a user for a specific resource in the last 30 days
 */
export function getHoursUsedLast30Days(userId, resourceId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const bookings = db.prepare(`
    SELECT start_time, end_time 
    FROM bookings 
    WHERE user_id = ? 
      AND resource_id = ? 
      AND status IN ('completed', 'returned', 'checked_in', 'approved')
      AND start_time >= ?
  `).all(userId, resourceId, thirtyDaysAgo);

  let totalHours = 0;
  for (const b of bookings) {
    const start = new Date(b.start_time);
    const end = new Date(b.end_time);
    const diffHours = Math.max(0, (end - start) / (1000 * 60 * 60));
    totalHours += diffHours;
  }
  return Math.round(totalHours * 10) / 10;
}

/**
 * Calculates cancellation count in the last 30 days
 */
export function getCancellationsLast30Days(userId) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const row = db.prepare(`
    SELECT COUNT(*) as count 
    FROM bookings 
    WHERE user_id = ? 
      AND status = 'cancelled'
      AND created_at >= ?
  `).get(userId, thirtyDaysAgo);
  return row ? row.count : 0;
}

/**
 * Evaluates user constraints:
 * - monthly hour cap
 * - cancellation cooldown
 * - max active concurrent bookings
 */
export function checkUserBookingConstraints(userId, resourceId, requestedHours = 2) {
  const config = getFairnessConfig();
  const hoursUsed = getHoursUsedLast30Days(userId, resourceId);
  const resource = db.prepare('SELECT monthly_cap_hours, name FROM resources WHERE id = ?').get(resourceId);
  const cap = resource?.monthly_cap_hours || config.monthly_hour_cap;

  if (hoursUsed + requestedHours > cap) {
    return {
      allowed: false,
      reason: `Monthly usage cap exceeded for ${resource?.name || 'this resource'}. You have used ${hoursUsed} hrs of your ${cap} hrs monthly allowance (requesting ${requestedHours} hrs).`
    };
  }

  const cancellations = getCancellationsLast30Days(userId);
  if (cancellations >= config.cancellation_penalty_threshold) {
    return {
      allowed: false,
      reason: `Account under cancellation cooldown: You have ${cancellations} recent cancellations in the past 30 days (limit: ${config.cancellation_penalty_threshold}). New requests are paused for ${config.cancellation_block_days} days to preserve fair equipment availability.`
    };
  }

  const activeBookings = db.prepare(`
    SELECT COUNT(*) as count 
    FROM bookings 
    WHERE user_id = ? 
      AND status IN ('pending', 'approved', 'checked_in')
  `).get(userId);

  if (activeBookings && activeBookings.count >= 3) {
    return {
      allowed: false,
      reason: `Maximum active bookings limit reached (3 active requests/sessions). Please complete or return your current sessions before booking new slots.`
    };
  }

  return { allowed: true };
}

/**
 * Computes fair share score for a booking request
 * score = (waiting_days * W_WAIT) - (hours_used_last_30_days * W_USAGE) + category_bonus
 */
export function computeFairShareScore(booking) {
  const config = getFairnessConfig();
  const createdDate = new Date(booking.created_at || Date.now());
  const now = new Date();
  const waitingDays = Math.max(0, (now - createdDate) / (1000 * 60 * 60 * 24));
  const waitingDaysRounded = Math.round(waitingDays * 10) / 10;

  const hoursUsed = getHoursUsedLast30Days(booking.user_id, booking.resource_id);

  let categoryBonus = 0;
  const cat = (booking.project_category || 'academic_project').toLowerCase();
  if (cat.includes('academic') || cat.includes('final')) {
    categoryBonus = config.bonus_academic;
  } else if (cat.includes('research')) {
    categoryBonus = config.bonus_research;
  } else if (cat.includes('startup') || cat.includes('creator')) {
    categoryBonus = config.bonus_startup;
  } else {
    categoryBonus = config.bonus_casual;
  }

  const waitContribution = Math.round(waitingDaysRounded * config.w_wait * 10) / 10;
  const usagePenalty = Math.round(hoursUsed * config.w_usage * 10) / 10;
  const score = Math.round((waitContribution - usagePenalty + categoryBonus) * 10) / 10;

  const breakdown = {
    formula: `score = (waiting_days × ${config.w_wait}) - (hours_used_30d × ${config.w_usage}) + category_bonus`,
    waiting_days: waitingDaysRounded,
    w_wait: config.w_wait,
    wait_contribution: waitContribution,
    hours_used_last_30_days: hoursUsed,
    w_usage: config.w_usage,
    usage_penalty: usagePenalty,
    project_category: booking.project_category || 'Academic Project',
    category_bonus: categoryBonus,
    final_score: score
  };

  return { score, breakdown };
}

/**
 * Detects overlapping requests for the same resource
 */
export function findConflictingBookings(resourceId, startTime, endTime, excludeBookingId = null) {
  let query = `
    SELECT b.*, u.name as user_name, u.email as user_email, u.category as user_category
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.resource_id = ?
      AND b.status IN ('pending', 'approved', 'waitlisted', 'checked_in')
      AND (
        (b.start_time < ? AND b.end_time > ?) OR
        (b.start_time >= ? AND b.start_time < ?) OR
        (b.end_time > ? AND b.end_time <= ?)
      )
  `;
  const params = [resourceId, endTime, startTime, startTime, endTime, startTime, endTime];

  if (excludeBookingId) {
    query += ` AND b.id != ?`;
    params.push(excludeBookingId);
  }

  return db.prepare(query).all(...params);
}

/**
 * Re-ranks all pending/waitlisted overlapping requests for a resource & window
 * and generates human-readable explanations with numbers.
 */
export function rankQueueForResource(resourceId) {
  const pendingRequests = db.prepare(`
    SELECT b.*, u.name as user_name, u.email as user_email, u.category as user_category
    FROM bookings b
    JOIN users u ON b.user_id = u.id
    WHERE b.resource_id = ? AND b.status IN ('pending', 'waitlisted')
    ORDER BY b.created_at ASC
  `).all(resourceId);

  if (pendingRequests.length === 0) return [];

  // Group by overlapping time clusters
  const scored = pendingRequests.map(req => {
    const { score, breakdown } = computeFairShareScore(req);
    return { ...req, score, breakdown };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  // Assign waitlist rank and plain language explanations
  return scored.map((req, idx) => {
    const rank = idx + 1;
    let plainExplanation = '';
    if (rank === 1) {
      plainExplanation = `Ranked #1 (Recommended for Approval): Fair-share score ${req.score}. Priority breakdown: ${req.breakdown.hours_used_last_30_days} hrs used this month, ${req.breakdown.waiting_days} days waited, +${req.breakdown.category_bonus} ${req.breakdown.project_category} bonus.`;
    } else {
      const ahead = scored[0];
      plainExplanation = `Placed #${rank} in queue (score ${req.score}): you used ${req.breakdown.hours_used_last_30_days} hrs this month; the person ahead (${ahead.user_name}) has score ${ahead.score} with ${ahead.breakdown.waiting_days} days waiting time.`;
    }

    // Persist score & rank
    db.prepare(`
      UPDATE bookings 
      SET score = ?, waitlist_position = ?, score_breakdown = ?, decision_reason = ?
      WHERE id = ?
    `).run(req.score, rank, JSON.stringify(req.breakdown), plainExplanation, req.id);

    return {
      ...req,
      waitlist_position: rank,
      decision_reason: plainExplanation
    };
  });
}

