# 🔌 API Status

<!-- ============================================================ -->
<!-- PURPOSE: Documents every API endpoint in the project.        -->
<!-- For each endpoint: URL, method, purpose, request/response,   -->
<!-- auth requirement, and build status.                          -->
<!-- This is the API contract — frontend and backend must match.  -->
<!-- ============================================================ -->
<!-- Status: ✅ Planned — Awaiting Implementation -->
<!-- Last Updated: 2026-08-18 -->
<!-- Version: 1.0 -->

---

## 📊 Progress

```
APIs Planned:  [ ✅ DONE ]  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
APIs Built:    [ ⬜ 0/22 ] ░░░░░░░░░░░░░░░░░░░░   0%
APIs Tested:   [ ⬜ 0/22 ] ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## 📋 All Endpoints At a Glance

| # | Method | Endpoint | Purpose | Auth | Status |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | Register new account | ❌ Public | ⬜ |
| 2 | POST | `/api/auth/login` | Login, receive JWT | ❌ Public | ⬜ |
| 3 | POST | `/api/auth/logout` | Invalidate token (client-side) | ✅ JWT | ⬜ |
| 4 | GET | `/api/auth/me` | Get current user profile | ✅ JWT | ⬜ |
| 5 | GET | `/api/sessions` | List all sessions for this user | ✅ JWT | ⬜ |
| 6 | POST | `/api/sessions` | Upload .txt file + create session | ✅ JWT | ⬜ |
| 7 | GET | `/api/sessions/:id` | Get session details + parse status | ✅ JWT | ⬜ |
| 8 | PATCH | `/api/sessions/:id` | Rename a session | ✅ JWT | ⬜ |
| 9 | DELETE | `/api/sessions/:id` | Delete session + all data + S3 file | ✅ JWT | ⬜ |
| 10 | GET | `/api/sessions/:id/analytics/overview` | Total messages, date range, participants | ✅ JWT | ⬜ |
| 11 | GET | `/api/sessions/:id/analytics/participants` | Per-person message breakdown | ✅ JWT | ⬜ |
| 12 | GET | `/api/sessions/:id/analytics/timeline` | Messages per day/week/month | ✅ JWT | ⬜ |
| 13 | GET | `/api/sessions/:id/analytics/peak-hours` | Hourly activity distribution | ✅ JWT | ⬜ |
| 14 | GET | `/api/sessions/:id/analytics/word-frequency` | Top N most used words | ✅ JWT | ⬜ |
| 15 | GET | `/api/sessions/:id/analytics/emoji-frequency` | Most used emojis | ✅ JWT | ⬜ |
| 16 | GET | `/api/sessions/:id/analytics/media-links` | Media + link counts | ✅ JWT | ⬜ |
| 17 | GET | `/api/sessions/:id/analytics/response-time` | Avg response time per sender | ✅ JWT | ⬜ |
| 18 | POST | `/api/sessions/:id/chat` | Ask a question (routes to rule/AI engine) | ✅ JWT | ⬜ |
| 19 | GET | `/api/sessions/:id/chat/history` | Get Q&A history for this session | ✅ JWT | ⬜ |
| 20 | DELETE | `/api/sessions/:id/chat/history` | Clear Q&A history for this session | ✅ JWT | ⬜ |
| 21 | PUT | `/api/users/password` | Change password | ✅ JWT | ⬜ |
| 22 | PUT | `/api/users/settings` | Update settings (e.g., preferred AI model) | ✅ JWT | ⬜ |
| 23 | DELETE | `/api/users/me` | Delete account + all data | ✅ JWT | ⬜ |

---

## 📐 Standard Response Format

> All API responses follow this exact structure:

```json
{
  "success": true,
  "message": "Human-readable description",
  "data": { ... }
}
```

> On error:
```json
{
  "success": false,
  "error": "Human-readable error message",
  "code": "MACHINE_READABLE_ERROR_CODE"
}
```

---

## 📝 Detailed API Documentation

---

### 🔐 Auth APIs

#### `POST /api/auth/register`

| Field | Details |
|---|---|
| **Purpose** | Create a new user account |
| **Auth Required** | ❌ No (public endpoint) |
| **Rate Limited** | ✅ Yes — 10 requests/15 min per IP |
| **Status** | ⬜ Not built |

**Request Body:**
```json
{ "email": "user@example.com", "password": "MyPass123!" }
```

**Success (201):**
```json
{ "success": true, "message": "Account created. Please log in.", "data": { "userId": "uuid-here" } }
```

**Errors:**
| Code | Meaning |
|---|---|
| 400 | Missing or invalid fields |
| 409 | Email already registered |
| 429 | Too many requests |

---

#### `POST /api/auth/login`

| Field | Details |
|---|---|
| **Purpose** | Authenticate user, return signed JWT |
| **Auth Required** | ❌ No |
| **Rate Limited** | ✅ Yes — 5 failed attempts locks IP for 15 min |
| **Status** | ⬜ Not built |

**Request Body:**
```json
{ "email": "user@example.com", "password": "MyPass123!" }
```

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGci...",
    "expiresIn": "7d",
    "user": { "id": "uuid", "email": "user@example.com" }
  }
}
```

**Errors:**
| Code | Meaning |
|---|---|
| 401 | Incorrect email or password (deliberately vague) |
| 429 | IP locked after 5 failed attempts |

---

#### `GET /api/auth/me`

| Field | Details |
|---|---|
| **Purpose** | Get the currently logged-in user's profile |
| **Auth Required** | ✅ JWT Bearer token required |
| **Status** | ⬜ Not built |

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "preferred_ai_model": "gemini/gemini-flash",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### 📁 Session APIs

#### `POST /api/sessions`

| Field | Details |
|---|---|
| **Purpose** | Upload a WhatsApp `.txt` file and begin parsing |
| **Auth Required** | ✅ JWT |
| **Content-Type** | `multipart/form-data` |
| **Max File Size** | 15MB |
| **Status** | ⬜ Not built |

**Request:** `multipart/form-data` with field `file` (the `.txt` file)

**Success (202 — Accepted, parsing starts in background):**
```json
{
  "success": true,
  "message": "File uploaded. Parsing in progress.",
  "data": {
    "sessionId": "uuid",
    "parseStatus": "parsing"
  }
}
```

**Errors:**
| Code | Meaning |
|---|---|
| 400 | Wrong file type / empty file / too large |
| 500 | S3 upload failed |

> ⚠️ Parsing happens asynchronously. Client polls `GET /api/sessions/:id` to check `parse_status` until it becomes `completed`, `failed`, or `empty`.

---

#### `GET /api/sessions/:id`

| Field | Details |
|---|---|
| **Purpose** | Get session details and current parse status |
| **Auth Required** | ✅ JWT — user can only access their own sessions |
| **Status** | ⬜ Not built |

**Success (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Chat with Mom",
    "parse_status": "completed",
    "total_messages": 4521,
    "skipped_messages": 3,
    "first_message_at": "2023-01-01T00:00:00Z",
    "last_message_at": "2024-06-01T00:00:00Z",
    "created_at": "2024-08-18T00:00:00Z"
  }
}
```

---

### 📊 Analytics APIs (Rule-Based — All Work Offline)

> All analytics endpoints return pre-computed data from `analytics_cache` if available, otherwise compute and cache on first request.

#### `GET /api/sessions/:id/analytics/overview`
Returns: `{ total_messages, date_range, participant_count, total_days }`

#### `GET /api/sessions/:id/analytics/participants`
Returns: `[{ name, message_count, total_words, percentage }]` — sorted by message count

#### `GET /api/sessions/:id/analytics/timeline`
Query params: `?granularity=daily|weekly|monthly`
Returns: `[{ date, count }]` — for charting

#### `GET /api/sessions/:id/analytics/peak-hours`
Returns: `[{ hour: 0-23, count }]` — for 24-hour activity chart

#### `GET /api/sessions/:id/analytics/word-frequency`
Query params: `?limit=50` (default 50)
Returns: `[{ word, count }]` — excludes stop words (the, is, a, etc.)

#### `GET /api/sessions/:id/analytics/emoji-frequency`
Returns: `[{ emoji, count }]`

#### `GET /api/sessions/:id/analytics/media-links`
Returns: `{ media_count, link_count, longest_message: { sender, length } }`

#### `GET /api/sessions/:id/analytics/response-time`
Returns: `[{ sender, avg_response_seconds }]`

> All analytics endpoints return **404** if `session.parse_status !== 'completed'`

---

### 🤖 Chat Q&A API

#### `POST /api/sessions/:id/chat`

| Field | Details |
|---|---|
| **Purpose** | Ask a natural language question about the chat |
| **Auth Required** | ✅ JWT |
| **Status** | ⬜ Not built |

**Request Body:**
```json
{
  "question": "Who sends the most messages?",
  "engine": "auto"
}
```

> `engine` can be `"auto"` (default — backend decides), `"rule_based"`, or `"ai"`

**Success (200):**
```json
{
  "success": true,
  "data": {
    "question": "Who sends the most messages?",
    "answer": "Alice has sent the most messages with 2,341 messages (52% of total).",
    "engine_used": "rule_based",
    "latency_ms": 45,
    "disclaimer": null
  }
}
```

> For AI responses, `disclaimer` = `"AI answers may not be 100% accurate. Verify important details in the original chat."`

**Errors:**
| Code | Meaning |
|---|---|
| 503 | AI engine unavailable (OpenRouter down) — rule_based answers still work |
| 429 | Rate limited |
| 400 | Empty question |

---

### 👤 User Settings APIs

#### `PUT /api/users/settings`

| Field | Details |
|---|---|
| **Purpose** | Update user preferences (e.g., preferred AI model) |
| **Auth Required** | ✅ JWT |
| **Status** | ⬜ Not built |

**Request Body:**
```json
{ "preferred_ai_model": "openai/gpt-4o-mini" }
```

#### `DELETE /api/users/me`

| Field | Details |
|---|---|
| **Purpose** | Permanently delete account + all sessions + all S3 files |
| **Auth Required** | ✅ JWT + password re-confirmation |
| **Status** | ⬜ Not built |

**Request Body (password confirmation required):**
```json
{ "password": "MyPass123!", "confirm": "DELETE MY ACCOUNT" }
```

---

## 📊 API Health Summary

| Category | Total | Built | Tested | Working | Broken |
|---|---|---|---|---|---|
| Auth APIs | 3 | 0 | 0 | 0 | 0 |
| Session APIs | 5 | 0 | 0 | 0 | 0 |
| Analytics APIs | 8 | 0 | 0 | 0 | 0 |
| Chat Q&A APIs | 3 | 0 | 0 | 0 | 0 |
| User Settings APIs | 3 | 0 | 0 | 0 | 0 |
| **Total** | **22** | **0** | **0** | **0** | **0** |

---

## 🔗 Third-Party API Integrations

| # | Service | Used For | Docs | Status |
|---|---|---|---|---|
| 1 | **OpenRouter** | AI model gateway (routes to Gemini) | https://openrouter.ai/docs | ⬜ |
| 2 | **LiteLLM Proxy** | Internal proxy — Node.js → LiteLLM HTTP | https://docs.litellm.ai | ⬜ |
| 3 | **Langfuse** | AI call observability + cost tracking | https://langfuse.com/docs | ⬜ |
| 4 | **AWS S3** | Raw `.txt` file storage | AWS SDK v3 docs | ⬜ |

---

<!-- END OF API STATUS -->
