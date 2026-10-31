import { db } from '../db/database.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Helper to call Gemini API if key is present
 */
async function callGemini(promptText) {
  if (!GEMINI_API_KEY) return null;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 500 }
      })
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
  } catch (err) {
    console.warn('[AI Service] Gemini call failed, using graceful fallback:', err.message);
    return null;
  }
}

/**
 * 1. Summarise incident / damage report
 */
export async function summarizeIncidentReport({ resourceName, conditionBefore, conditionAfter, notes, photosCount = 0 }) {
  const prompt = `
    You are an assistant for campus lab equipment. Summarize this damage/incident report for the lab owner.
    Resource: ${resourceName}
    Initial Condition: Working=${conditionBefore?.is_working ?? 1}, Scratches=${conditionBefore?.has_scratches ?? 0}, Missing Parts=${conditionBefore?.missing_parts ?? 0}, Cleanliness=${conditionBefore?.cleanliness ?? 5}/5
    Return Condition: Working=${conditionAfter?.is_working ?? 1}, Scratches=${conditionAfter?.has_scratches ?? 0}, Missing Parts=${conditionAfter?.missing_parts ?? 0}, Cleanliness=${conditionAfter?.cleanliness ?? 5}/5
    User Notes: "${notes || 'No description provided'}"
    Photos Attached: ${photosCount}

    Respond in JSON format:
    {
      "summary": "1-2 sentence plain summary of what appears changed or damaged",
      "suggested_severity": "low" | "medium" | "high" | "critical",
      "reasoning": "brief explanation",
      "recommended_action": "e.g. Inspect lens, request repair quote, or dismiss"
    }
  `;

  const aiResponse = await callGemini(prompt);
  if (aiResponse) {
    try {
      const cleanJson = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return {
        ...parsed,
        source: 'Gemini AI Suggestion',
        isAi: true
      };
    } catch (e) {
      // Fall through to deterministic fallback
    }
  }

  // Deterministic Graceful Non-AI Fallback
  let severity = 'low';
  const diffs = [];

  if (conditionBefore?.is_working && !conditionAfter?.is_working) {
    diffs.push('Device was functional at check-in but reported non-operational upon return');
    severity = 'critical';
  }
  if (!conditionBefore?.missing_parts && conditionAfter?.missing_parts) {
    diffs.push('Accessories or components reported missing');
    if (severity !== 'critical') severity = 'high';
  }
  if (!conditionBefore?.has_scratches && conditionAfter?.has_scratches) {
    diffs.push('New surface scratches or cosmetic blemishes detected');
    if (severity === 'low') severity = 'medium';
  }
  if ((conditionBefore?.cleanliness || 5) > (conditionAfter?.cleanliness || 5)) {
    diffs.push(`Cleanliness degraded from ${conditionBefore?.cleanliness || 5}/5 to ${conditionAfter?.cleanliness || 5}/5`);
  }

  const notesLower = (notes || '').toLowerCase();
  if (notesLower.includes('broken') || notesLower.includes('burnt') || notesLower.includes('shattered')) {
    severity = 'critical';
  } else if (notesLower.includes('crack') || notesLower.includes('deep scratch') || notesLower.includes('jammed')) {
    if (severity !== 'critical') severity = 'high';
  }

  const summary = diffs.length > 0 
    ? `${diffs.join('. ')}. User note: "${notes || 'None'}".`
    : `Return checklist flagged possible discrepancy: "${notes || 'General wear and tear'}".`;

  return {
    summary,
    suggested_severity: severity,
    reasoning: `Rule-based evaluation of before vs after condition checklist and user notes (${diffs.length} discrepancy markers detected).`,
    recommended_action: severity === 'critical' ? 'Lock resource for inspection and test power components' : 'Inspect equipment surface and discuss with student',
    source: 'Automated Diagnostic Engine (Fallback)',
    isAi: false
  };
}

/**
 * 2. Flag suspicious usage patterns for human review
 */
export async function analyzeUserSuspiciousPatterns(userId) {
  const user = db.prepare('SELECT id, name, email FROM users WHERE id = ?').get(userId);
  if (!user) return null;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const bookings = db.prepare(`
    SELECT b.*, r.name as resource_name 
    FROM bookings b
    JOIN resources r ON b.resource_id = r.id
    WHERE b.user_id = ? AND b.created_at >= ?
    ORDER BY b.created_at DESC
  `).all(userId, thirtyDaysAgo);

  const cancellations = bookings.filter(b => b.status === 'cancelled');
  const primeCancellations = cancellations.filter(b => {
    const hour = new Date(b.start_time).getHours();
    return hour >= 10 && hour <= 16;
  });

  const isHoarding = bookings.length >= 5 && cancellations.length >= 3;
  const isPrimeSniping = primeCancellations.length >= 2;

  if (!isHoarding && !isPrimeSniping) {
    return {
      flagged: false,
      message: 'Usage patterns appear normal and within community standards.'
    };
  }

  const patternDescription = isPrimeSniping 
    ? `${primeCancellations.length} cancellations during prime lab hours (10:00 - 16:00)`
    : `${cancellations.length} total cancellations out of ${bookings.length} reservations`;

  return {
    flagged: true,
    user_id: userId,
    user_name: user.name,
    pattern_type: isPrimeSniping ? 'Prime-Time Slot Churn' : 'High Frequency Reservation Churn',
    summary: `Student has ${patternDescription} in the last 30 days. Recommend human review to ensure fair access for peers.`,
    recommended_human_action: 'Send friendly reminder regarding campus cancellation etiquette or adjust monthly cap',
    source: 'Fairness Anomaly Scanner',
    isAi: false
  };
}

/**
 * 3. Suggest alternative resources when primary choice is full or ineligible
 */
export async function suggestAlternativeResources(currentResourceId, category) {
  const alternatives = db.prepare(`
    SELECT id, name, category, location, image_url, description 
    FROM resources 
    WHERE id != ? AND (category = ? OR category IN ('Labs', 'Equipment', 'Tools'))
    LIMIT 3
  `).all(currentResourceId, category);

  return alternatives.map(alt => ({
    ...alt,
    recommendation_reason: `Available alternative in ${alt.category} at ${alt.location}.`
  }));
}

/**
 * 4. Natural language resource search matcher
 */
export async function searchResourcesNL(query) {
  const allResources = db.prepare('SELECT id, name, category, description, location FROM resources').all();

  if (!query || query.trim() === '') return allResources;

  const prompt = `
    A student on a campus lab sharing platform is looking for equipment or space with this query: "${query}".
    Available resources:
    ${JSON.stringify(allResources.map(r => ({ id: r.id, name: r.name, category: r.category, description: r.description })))}

    Return a JSON array of matching resource IDs sorted by best relevance:
    [id1, id2, ...]
  `;

  const aiResult = await callGemini(prompt);
  if (aiResult) {
    try {
      const cleanJson = aiResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const ids = JSON.parse(cleanJson);
      if (Array.isArray(ids) && ids.length > 0) {
        return allResources.filter(r => ids.includes(r.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
      }
    } catch (e) {
      // Fallback
    }
  }

  // Smart heuristic keyword and synonym fallback
  const q = query.toLowerCase();
  const synonyms = {
    'cut': ['laser', 'acrylic', 'wood', 'sheet', 'cutter', 'saw'],
    'acrylic': ['laser', 'cutter', 'plastics'],
    'print': ['3d', 'printer', 'pla', 'filament', 'prototype'],
    'photo': ['camera', 'dslr', 'lens', 'video', 'canon', 'shoot'],
    'video': ['camera', 'dslr', 'mic', 'studio', 'media'],
    'circuit': ['oscilloscope', 'soldering', 'electronics', 'breadboard', 'resistor'],
    'solder': ['soldering', 'iron', 'wire', 'electronics', 'station'],
    'voltage': ['oscilloscope', 'multimeter', 'electronics'],
    'vr': ['headset', 'virtual', 'oculus', 'meta', 'quest', 'gaming', 'ar'],
    'meeting': ['room', 'conference', 'discussion', 'team', 'space']
  };

  const scores = allResources.map(res => {
    let score = 0;
    const text = `${res.name} ${res.category} ${res.description} ${res.location}`.toLowerCase();

    // Direct match
    if (text.includes(q)) score += 10;

    // Word match
    const words = q.split(/\s+/);
    for (const word of words) {
      if (word.length > 2 && text.includes(word)) score += 5;
      // Synonym matches
      for (const [key, synList] of Object.entries(synonyms)) {
        if (word.includes(key)) {
          for (const syn of synList) {
            if (text.includes(syn)) score += 3;
          }
        }
      }
    }
    return { res, score };
  });

  scores.sort((a, b) => b.score - a.score);
  return scores.filter(s => s.score > 0).map(s => s.res);
}

