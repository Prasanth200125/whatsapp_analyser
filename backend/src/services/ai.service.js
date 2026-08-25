// ============================================================
// ai.service.js — AI Engine with Langfuse Tracing
// ============================================================
// TRACING STRATEGY (Langfuse best practices from skills/langfuse):
//
// Every call to this service produces one Langfuse trace:
//   Trace: "chat-response"         (the full user Q&A interaction)
//     └─ Span:  "query-router"     (decides rule-based vs AI)
//     └─ Generation: "ai-chat"     (the actual LLM generation — captures model, tokens, cost)
//
// Key decisions:
// - We use @langfuse/openai wrapper — it auto-captures model name,
//   token usage, and input/output. No manual instrumentation needed
//   for the generation itself.
// - We manually create a parent trace to add our own metadata:
//   userId, sessionId, question, engine used, latency.
// - Trace input is set to only the user's question (not raw args)
//   to keep the Langfuse UI clean and avoid leaking internal data.
// - AI failure is isolated — returns a graceful error message
//   without crashing the parent trace.
// ============================================================

import OpenAI from 'openai';
import { observeOpenAI } from '@langfuse/openai';
import { LangfuseSpanProcessor } from '@langfuse/otel';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { startActiveObservation, propagateAttributes, updateActiveObservation } from '@langfuse/tracing';

// ── Langfuse client (server-side) ────────────────────────────
// Uses LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL
// from environment variables (auto-detected by the SDK).
const langfuseSpanProcessor = new LangfuseSpanProcessor();
const provider = new NodeTracerProvider({
  spanProcessors: [langfuseSpanProcessor],
});
provider.register();

// ── OpenAI-compatible client pointing to OpenRouter ──────────
// OpenRouter is fully compatible with the OpenAI API spec.
// @langfuse/openai wraps this client to auto-trace every call.
const baseOpenAI = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': process.env.SITE_URL || 'https://whatsapp-analyzer.app',
    'X-Title': 'WhatsApp Chat Analyzer',
  },
});

// ── AI disclaimer text ────────────────────────────────────────
export const AI_DISCLAIMER =
  'AI answers are generated based on your chat content and may not be 100% accurate. Always verify important information in the original chat.';

// ── Default model ─────────────────────────────────────────────
const DEFAULT_MODEL = 'gemini/gemini-flash';

const OPENROUTER_MODEL_MAP = {
  'gemini/gemini-flash': 'google/gemma-4-31b-it:free',
  'openai/gpt-4o': 'minimax/minimax-m3:free',
  'anthropic/claude-3-haiku': 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
};

/**
 * Ask an AI question about a WhatsApp session.
 *
 * @param {object} params
 * @param {string} params.question       - The user's natural language question
 * @param {string} params.sessionId      - The analysis session ID (for tracing)
 * @param {string} params.userId         - The user's ID (for tracing)
 * @param {string} params.chatContext    - Relevant chat excerpt (last N messages or summary)
 * @param {string} params.sessionName    - Human-readable session name (e.g. "Chat with Mom")
 * @param {string} [params.model]        - Optional model override (from user settings)
 *
 * @returns {Promise<{answer: string, modelUsed: string, latencyMs: number, disclaimer: string}>}
 */
export async function askAI({ question, sessionId, userId, chatContext, sessionName, model }) {
  const startTime = Date.now();
  const rawModel = model || DEFAULT_MODEL;
  const modelToUse = OPENROUTER_MODEL_MAP[rawModel] || rawModel;

  // ── Create a parent trace for the entire Q&A interaction ────
  // This groups the router span + LLM generation under one trace.
  return propagateAttributes({
    traceName: 'chat-response',
    userId: userId,
    sessionId: sessionId,
    metadata: {
      sessionName,
      modelRequested: modelToUse,
    },
    tags: ['chat', 'ai-engine'],
  }, async () => {
    // Input: only the user's question — clean, not internal args
    updateActiveObservation({ input: question });

    try {
      // ── Span: query router decision ──────────────────────────
      await startActiveObservation('query-router', async (span) => {
        updateActiveObservation({ input: { question, engine: 'ai' } });
        span.end({ output: { routed_to: 'ai', model: modelToUse } });
      });

      // ── Wrap the OpenAI client with Langfuse observability ───
      // observeOpenAI wraps the client for this specific trace,
      // so the generation is nested inside our parent trace above.
      const tracedOpenAI = observeOpenAI(baseOpenAI, {
        generationName: 'ai-chat',  // Descriptive name for the generation
      });

    // ── Build the system prompt ──────────────────────────────
    const systemPrompt = `You are a helpful assistant that answers questions about WhatsApp chat conversations.
You have been given a portion of the chat history as context.
Answer questions about this chat clearly and concisely.
If you cannot find the answer in the provided context, say so honestly — do not hallucinate.
Do not reveal the raw chat content in your answer unless directly asked.
If the user's message is just a simple greeting or acknowledgment (like "hi", "hello", "ok", "thanks"), simply reply conversationally and briefly (e.g. "Hello! How can I help you analyze this chat today?"). Do NOT attempt to analyze or summarize the chat context unless they actually ask a question about it.
Session: "${sessionName}"`;

    // ── Make the AI call (auto-traced by observeOpenAI) ──────
    const completion = await tracedOpenAI.chat.completions.create({
      model: modelToUse,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Here is a sample of the chat context:\n\n${chatContext}\n\nQuestion: ${question}`,
        },
      ],
      max_tokens: 1024,
      temperature: 0.3, // Lower temperature = more factual, less creative
    });

    const answer = completion.choices[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error('AI returned an empty response');
    }

    const latencyMs = Date.now() - startTime;

    // ── Update trace with final output and metadata ──────────
    updateActiveObservation({
      output: answer,
      metadata: {
        sessionName,
        modelUsed: modelToUse,
        latencyMs,
        tokensUsed: completion.usage?.total_tokens,
      },
    });

    // Ensure trace is sent before returning
    await langfuseSpanProcessor.forceFlush();

    return {
      answer,
      modelUsed: modelToUse,
      latencyMs,
      disclaimer: AI_DISCLAIMER,
    };

  } catch (error) {
    const latencyMs = Date.now() - startTime;

    // Record failure in Langfuse
    updateActiveObservation({
      output: null,
      metadata: { error: error.message, latencyMs },
      level: 'ERROR',
    });

    await langfuseSpanProcessor.forceFlush();

    // Log the actual underlying error for debugging
    console.error('OpenRouter API Error:', error);

    // Rethrow with clean message for the caller to handle gracefully
    throw new AIServiceError(
      error.message.includes('Rate limit')
        ? 'AI service is currently rate-limited. Please try again in a moment.'
        : 'AI service is temporarily unavailable. Rule-based analytics still work.',
      error
    );
  }
  });
}

/**
 * Build a context string from parsed messages for the AI prompt.
 * Limits to the most recent N messages to stay within token limits.
 *
 * @param {Array} messages - Array of message objects from the DB
 * @param {number} [limit=500] - Maximum number of messages to include
 * @returns {string}
 */
export function buildChatContext(messages, limit = 500) {
  if (!messages || messages.length === 0) return 'No messages available.';

  // Take the most recent messages up to the limit
  const recent = messages.slice(-limit);

  return recent
    .map((msg) => {
      if (msg.is_media) return `[${msg.sender_name}]: [media]`;
      if (!msg.message_text) return null;
      const time = new Date(msg.sent_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      return `[${time}] ${msg.sender_name}: ${msg.message_text}`;
    })
    .filter(Boolean)
    .join('\n');
}

/**
 * Custom error class for AI service failures.
 * Allows callers to distinguish AI errors from other errors
 * and serve rule-based answers as fallback.
 */
export class AIServiceError extends Error {
  constructor(message, originalError) {
    super(message);
    this.name = 'AIServiceError';
    this.originalError = originalError;
    this.isAIError = true;
  }
}

/**
 * Flush all pending Langfuse events.
 * Call this on app shutdown to ensure no traces are lost.
 */
export async function flushLangfuse() {
  await langfuseSpanProcessor.forceFlush();
}
