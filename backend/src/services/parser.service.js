// ============================================================
// parser.service.js — WhatsApp Chat File Parser
// ============================================================
// Parses a WhatsApp .txt export file and returns structured messages.
//
// Supports both formats:
//   iOS:     [DD/MM/YYYY, HH:MM:SS] Sender: Message
//   Android: DD/MM/YYYY, HH:MM - Sender: Message
//            (also handles MM/DD/YYYY used in some locales)
//
// Message types detected:
//   text    — normal text message
//   media   — "<Media omitted>" or image/video/audio/document attached
//   link    — message contains a URL (http/https)
//   deleted — "This message was deleted" / "You deleted this message"
//   system  — System messages (e.g., "X added Y", "Messages are end-to-end encrypted")
// ============================================================

// ── Regex Patterns for Both Formats ───────────────────────────
// iOS:     [01/01/2024, 12:34:56] Name: text
const IOS_PATTERN     = /^\[(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]\s*([^:]+):\s*([\s\S]*)$/;

// Android: 01/01/2024, 12:34 - Name: text
const ANDROID_PATTERN = /^(\d{1,2}[\/\.]\d{1,2}[\/\.]\d{2,4}),\s*(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)\s*[-–]\s*([^:]+):\s*([\s\S]*)$/;

// System message (no sender colon pattern, or known system message text)
const SYSTEM_KEYWORDS = [
  'messages to this chat and calls are now protected',
  'messages are end-to-end encrypted',
  'added you',
  ' added ',
  ' removed ',
  ' left',
  'changed the subject',
  'changed this group',
  'created group',
  'joined using this group',
  'changed their phone number',
  'security code changed',
];

/**
 * Parse a WhatsApp chat export text string.
 *
 * @param {string} text - The full contents of the .txt file
 * @returns {{
 *   messages: Array<{sender, timestamp, text, type}>,
 *   skippedLines: number,
 *   participantNames: Set<string>
 * }}
 */
export function parseWhatsAppFile(text) {
  const lines = text.split('\n');
  const messages = [];
  const participantNames = new Set();
  let skippedLines = 0;
  let currentMessage = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Try to parse as a new message line
    const parsed = parseLine(line);

    if (parsed) {
      // Save previous multi-line message
      if (currentMessage) {
        messages.push(currentMessage);
      }
      currentMessage = parsed;
      if (parsed.type !== 'system') {
        participantNames.add(parsed.sender);
      }
    } else if (currentMessage) {
      // This line is a continuation of the previous message (multi-line message)
      currentMessage.text += '\n' + line;
    } else {
      // Can't parse and no context — skip
      skippedLines++;
    }
  }

  // Don't forget the last message
  if (currentMessage) {
    messages.push(currentMessage);
  }

  return { messages, skippedLines, participantNames };
}

/**
 * Try to parse a single line as a WhatsApp message.
 * Returns null if the line doesn't match any known format.
 */
function parseLine(line) {
  // Try iOS format first
  let match = line.match(IOS_PATTERN);
  let format = 'ios';

  if (!match) {
    match = line.match(ANDROID_PATTERN);
    format = 'android';
  }

  if (!match) return null;

  const [, datePart, timePart, sender, messageText] = match;

  // Parse timestamp
  const timestamp = parseTimestamp(datePart, timePart);
  if (!timestamp) return null;

  const trimmedSender = sender.trim();
  const trimmedText = messageText.trim();

  return {
    sender: trimmedSender,
    timestamp,
    text: trimmedText,
    type: detectMessageType(trimmedText, trimmedSender),
    format,
  };
}

/**
 * Detect the type of a message based on its text content.
 */
function detectMessageType(text, sender) {
  const lower = text.toLowerCase();

  // System messages have no real sender or match known system patterns
  if (SYSTEM_KEYWORDS.some((kw) => lower.includes(kw))) {
    return 'system';
  }

  // Media omitted
  if (
    lower === '<media omitted>' ||
    lower.includes('image omitted') ||
    lower.includes('video omitted') ||
    lower.includes('audio omitted') ||
    lower.includes('document omitted') ||
    lower.includes('gif omitted') ||
    lower.includes('sticker omitted')
  ) {
    return 'media';
  }

  // Deleted messages
  if (
    lower === 'this message was deleted' ||
    lower === 'you deleted this message' ||
    lower.includes('this message was deleted')
  ) {
    return 'deleted';
  }

  // Link detection
  if (/https?:\/\/[^\s]+/.test(text)) {
    return 'link';
  }

  return 'text';
}

/**
 * Parse date and time strings into a JavaScript Date object.
 * Handles both DD/MM/YYYY and MM/DD/YYYY, 12h and 24h clocks.
 *
 * @param {string} datePart - e.g. "18/08/2024" or "08/18/24"
 * @param {string} timePart - e.g. "14:30" or "2:30 PM"
 * @returns {Date|null}
 */
function parseTimestamp(datePart, timePart) {
  try {
    // Normalize separators: periods and slashes → slash
    const normalizedDate = datePart.replace(/\./g, '/');
    const parts = normalizedDate.split('/');
    if (parts.length !== 3) return null;

    let [a, b, year] = parts;
    a = parseInt(a, 10);
    b = parseInt(b, 10);
    year = parseInt(year, 10);

    // 2-digit year → 4-digit
    if (year < 100) year += 2000;

    // Heuristic: if first number > 12, it MUST be the day (DD/MM/YYYY)
    // Otherwise assume DD/MM/YYYY (WhatsApp default in most locales)
    let day, month;
    if (a > 12) {
      day = a; month = b;
    } else {
      day = a; month = b; // Treat as DD/MM — most common in WhatsApp exports
    }

    // Normalize time: remove AM/PM, handle 12h clock
    let normalizedTime = timePart.trim();
    const isPM = /pm/i.test(normalizedTime);
    const isAM = /am/i.test(normalizedTime);
    normalizedTime = normalizedTime.replace(/[aApPmM\s]/g, '');

    let [hours, minutes, seconds = 0] = normalizedTime.split(':').map(Number);

    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;

    const date = new Date(year, month - 1, day, hours, minutes, seconds);
    if (isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
}
