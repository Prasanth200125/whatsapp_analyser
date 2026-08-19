// ============================================================
// query-router.service.js — Hybrid Query Router
// ============================================================
// Decides whether a user's question should be answered by:
//   (A) The rule-based SQL engine — fast, deterministic, offline-capable
//   (B) The AI engine — flexible, contextual, requires internet
//
// Routing strategy:
// - If keywords match a known analytics intent → rule_based
// - If offline → force rule_based (AI is unavailable)
// - Otherwise → ai
// ============================================================

import { askAI, buildChatContext, AIServiceError } from './ai.service.js';

// ── Keyword sets that map to rule-based analytics ─────────────
// If the question contains any of these, we can answer it
// deterministically from the DB without calling the AI.
const RULE_BASED_PATTERNS = [
  // Count/frequency queries
  /\bhow many\b/i,
  /\bcount\b/i,
  /\btotal\b/i,
  /\bnumber of\b/i,
  // Ranking/top queries
  /\bmost active\b/i,
  /\bmost messages\b/i,
  /\btop\b/i,
  /\bmost used\b/i,
  /\bmost frequent\b/i,
  /\bmost common\b/i,
  // Timeline queries
  /\bwhen did\b/i,
  /\bfirst message\b/i,
  /\blast message\b/i,
  /\bstart.*(chat|conversation)\b/i,
  /\bbegin.*(chat|conversation)\b/i,
  // Media/links
  /\bimage[s]?\b/i,
  /\bvideo[s]?\b/i,
  /\bmedia\b/i,
  /\blink[s]?\b/i,
  /\burl[s]?\b/i,
  // Emoji
  /\bemoji\b/i,
  // Words
  /\bword frequency\b/i,
  /\bmost used word\b/i,
  /\bcommon word\b/i,
  // Response time
  /\bresponse time\b/i,
  /\breply.*(fast|quick|slow|time)\b/i,
  // Active times
  /\bpeak hour\b/i,
  /\bbusiest\b/i,
  /\bactive time\b/i,
  /\bwhat time\b/i,
  /\bwhat day\b/i,
];

/**
 * Decide which engine should handle this question.
 * @param {string} question
 * @param {object} analyticsData
 * @param {boolean} isOnline
 * @returns {'rule_based' | 'ai'}
 */
export function routeQuery(question, analyticsData, isOnline = true) {
  if (!isOnline) return 'rule_based';

  const q = question.toLowerCase();

  // If the question contains a participant's name, it's a targeted query
  // that the global rule-based engine cannot answer (e.g. "what is X's most used word").
  // Route these directly to the AI engine.
  const participants = analyticsData?.participants || [];
  for (const p of participants) {
    if (!p.sender_name) continue;
    const nameParts = p.sender_name.toLowerCase().split(' ');
    for (const part of nameParts) {
      if (part.length > 2 && q.includes(part)) {
        return 'ai';
      }
    }
  }

  const isRuleBased = RULE_BASED_PATTERNS.some((pattern) => pattern.test(question));
  return isRuleBased ? 'rule_based' : 'ai';
}

/**
 * Main entry point: route and answer a question.
 *
 * @param {object} params
 * @param {string} params.question
 * @param {string} params.sessionId
 * @param {string} params.userId
 * @param {string} params.sessionName
 * @param {object} params.analyticsData  - Pre-fetched analytics from DB (for rule-based)
 * @param {Array}  params.messages       - Recent messages from DB (for AI context)
 * @param {string} [params.preferredModel] - User's preferred AI model
 * @param {boolean} [params.isOnline]    - Whether the client is online
 * @param {string} [params.engineOverride] - Force 'rule_based' or 'ai'
 *
 * @returns {Promise<{answer: string, engine: 'rule_based'|'ai', modelUsed: string|null, latencyMs: number, disclaimer: string|null}>}
 */
export async function handleQuestion({
  question,
  sessionId,
  userId,
  sessionName,
  analyticsData,
  messages,
  preferredModel,
  isOnline = true,
  engineOverride,
}) {
  const startTime = Date.now();

  if (!question?.trim()) {
    return {
      answer: 'Please ask a question about your chat.',
      engine: 'rule_based',
      modelUsed: null,
      latencyMs: 0,
      disclaimer: null,
    };
  }

  const engine = engineOverride || routeQuery(question, analyticsData, isOnline);

  // ── Rule-Based Path ──────────────────────────────────────────
  if (engine === 'rule_based') {
    const answer = answerWithRules(question, analyticsData);
    return {
      answer,
      engine: 'rule_based',
      modelUsed: null,
      latencyMs: Date.now() - startTime,
      disclaimer: null,
    };
  }

  // ── AI Path ──────────────────────────────────────────────────
  try {
    const chatContext = buildChatContext(messages);
    const result = await askAI({
      question,
      sessionId,
      userId,
      chatContext,
      sessionName,
      model: preferredModel,
    });

    return {
      answer: result.answer,
      engine: 'ai',
      modelUsed: result.modelUsed,
      latencyMs: result.latencyMs,
      disclaimer: result.disclaimer,
    };

  } catch (error) {
    // ── AI Failure Fallback ──────────────────────────────────
    // If AI fails, attempt a rule-based answer as fallback.
    // If that also fails, return a clear error message.
    if (error instanceof AIServiceError) {
      const ruleFallback = answerWithRules(question, analyticsData);

      if (ruleFallback) {
        return {
          answer: `${ruleFallback}\n\n_(AI was unavailable — answered with analytics engine instead.)_`,
          engine: 'rule_based',
          modelUsed: null,
          latencyMs: Date.now() - startTime,
          disclaimer: null,
          fallbackUsed: true,
        };
      }

      return {
        answer: `⚠️ ${error.message}`,
        engine: 'ai',
        modelUsed: null,
        latencyMs: Date.now() - startTime,
        disclaimer: null,
        error: true,
      };
    }

    throw error; // Unexpected errors bubble up
  }
}

/**
 * Answer common analytics questions from pre-fetched DB data.
 * Returns null if the question doesn't match any rule.
 *
 * @param {string} question
 * @param {object} data - analytics data from DB/cache
 * @returns {string|null}
 */
function answerWithRules(question, data) {
  if (!data) return null;
  const q = question.toLowerCase();

  // Total messages
  if (/total|how many message|count/.test(q)) {
    return `This chat has a total of **${data.overview?.total_messages?.toLocaleString() || 0} messages** exchanged over ${data.overview?.duration_days || 0} days.`;
  }

  // Most active person
  if (/most active|most message|who sent/.test(q)) {
    const top = data.participants?.[0];
    if (top) {
      return `**${top.sender_name}** sent the most messages with **${top.message_count?.toLocaleString()} messages** (${top.percentage}% of total).`;
    }
  }

  // First / last message
  if (/first message|start|begin/.test(q)) {
    return data.overview?.first_message_at
      ? `The first message in this chat was sent on **${new Date(data.overview.first_message_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}**.`
      : null;
  }
  if (/last message|most recent|latest/.test(q)) {
    return data.overview?.last_message_at
      ? `The most recent message was sent on **${new Date(data.overview.last_message_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}**.`
      : null;
  }

  // Media count
  if (/image|photo|video|media|file/.test(q)) {
    const media = data.media_counts;
    if (media) {
      return `This chat contains **${media.media_count} media files** (images, videos, and documents).`;
    }
  }

  // Links
  if (/link|url/.test(q)) {
    return data.media_counts?.link_count !== undefined
      ? `**${data.media_counts.link_count} links** were shared in this chat.`
      : null;
  }

  // Peak hour
  if (/peak|busiest|most active time|what time/.test(q)) {
    if (data.peak_hours?.length > 0) {
      const peak = data.peak_hours.reduce((max, h) => (Number(h.message_count) > Number(max.message_count) ? h : max), data.peak_hours[0]);
      if (peak) {
        const hour12 = peak.hour === 0 ? '12 AM' : peak.hour < 12 ? `${peak.hour} AM` : peak.hour === 12 ? '12 PM' : `${peak.hour - 12} PM`;
        return `The busiest time for this chat is **${hour12}** with ${Number(peak.message_count).toLocaleString()} messages sent during that hour.`;
      }
    }
  }

  // Top words
  if (/word|common word|most used word/.test(q)) {
    const words = data.top_words?.slice(0, 5);
    if (words?.length) {
      const list = words.map((w, i) => `${i + 1}. "${w.word}" (${w.frequency}x)`).join(', ');
      return `The most frequently used words are: ${list}.`;
    }
  }

  // Participants count
  if (/how many people|participants|who is in/.test(q)) {
    return data.overview?.participant_count
      ? `There are **${data.overview.participant_count} participants** in this chat.`
      : null;
  }

  return null; // No rule matched
}
