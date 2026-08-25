# 🔌 API Status

<!-- ============================================================ -->
<!-- PURPOSE: Documents every API endpoint in the project.        -->
<!-- For each endpoint: URL, method, purpose, request/response,   -->
<!-- auth requirement, and build status.                          -->
<!-- This is the API contract — frontend and backend must match.  -->
<!-- ============================================================ -->
<!-- Status: ✅ COMPLETED -->
<!-- Last Updated: 2026-08-25 -->
<!-- Version: 2.0 -->

---

## 📊 Progress

```
APIs Planned:  [ ✅ DONE ]  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
APIs Built:    [ ✅ DONE ]  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
APIs Tested:   [ ✅ DONE ]  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```

---

## 📋 All Endpoints At a Glance

| # | Method | Endpoint | Purpose | Auth | Status |
|---|---|---|---|---|---|
| 1 | POST | `/api/auth/register` | Register new account | ❌ Public | ✅ |
| 2 | POST | `/api/auth/login` | Login, receive JWT | ❌ Public | ✅ |
| 3 | POST | `/api/auth/logout` | Invalidate token (client-side) | ❌ Public | ✅ |
| 4 | GET | `/api/auth/me` | Get current user profile | ✅ JWT | ✅ |
| 5 | GET | `/api/sessions` | List all sessions for this user | ✅ JWT | ✅ |
| 6 | POST | `/api/sessions` | Upload .txt file + create session | ✅ JWT | ✅ |
| 7 | GET | `/api/sessions/:id` | Get session details + parse status | ✅ JWT | ✅ |
| 8 | DELETE | `/api/sessions/:id` | Delete session + all data + S3 file | ✅ JWT | ✅ |
| 9 | GET | `/api/sessions/:id/analytics/overview` | Total messages, date range, participants | ✅ JWT | ✅ |
| 10 | GET | `/api/sessions/:id/analytics/participants` | Per-person message breakdown | ✅ JWT | ✅ |
| 11 | GET | `/api/sessions/:id/analytics/timeline` | Messages per day/week/month | ✅ JWT | ✅ |
| 12 | GET | `/api/sessions/:id/analytics/peak-hours` | Hourly activity distribution | ✅ JWT | ✅ |
| 13 | GET | `/api/sessions/:id/analytics/word-frequency` | Top N most used words | ✅ JWT | ✅ |
| 14 | GET | `/api/sessions/:id/analytics/emoji-frequency` | Most used emojis | ✅ JWT | ✅ |
| 15 | GET | `/api/sessions/:id/analytics/media-links` | Media + link counts | ✅ JWT | ✅ |
| 16 | GET | `/api/sessions/:id/analytics/response-time` | Avg response time per sender | ✅ JWT | ✅ |
| 17 | POST | `/api/sessions/:id/chat` | Ask a question (routes to rule/AI engine) | ✅ JWT | ✅ |
| 18 | GET | `/api/sessions/:id/chat/history` | Get Q&A history for this session | ✅ JWT | ✅ |
| 19 | DELETE | `/api/sessions/:id/chat/history` | Clear Q&A history for this session | ✅ JWT | ✅ |
| 20 | PUT | `/api/users/password` | Change password | ✅ JWT | ✅ |
| 21 | PUT | `/api/users/settings` | Update settings (e.g., preferred AI model) | ✅ JWT | ✅ |
| 22 | DELETE | `/api/users/me` | Delete account + all data | ✅ JWT | ✅ |

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
| **Status** | ✅ Built & Working |

**Request Body:**
```json
{ "email": "user@example.com", "password": "MyPass123!", "name": "Prasanth" }
```

**Success (201):**
```json
{ "success": true, "message": "Account created successfully. Please log in.", "user": { "id": "uuid", "email": "user@example.com", "name": "Prasanth" } }
```

**Errors:**
| Code | Meaning |
|---|---|
| 400 | Missing or invalid fields (email, password, name) |
| 409 | Email already registered |
| 429 | Too many requests |

---

#### `POST /api/auth/login`

| Field | Details |
|---|---|
| **Purpose** | Authenticate user, return signed JWT |
| **Auth Required** | ❌ No |
| **Rate Limited** | ✅ Yes — 10 attempts per 15 min per IP |
| **Status** | ✅ Built & Working |

**Request Body:**
```json
{ "email": "user@example.com", "password": "MyPass123!" }
```

**Success (200):**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "id": "uuid", "email": "user@example.com", "name": "Prasanth" }
}
```

**Errors:**
| Code | Meaning |
|---|---|
| 401 | Incorrect email or password (deliberately vague) |
| 429 | IP locked after 10 failed attempts |

---

#### `GET /api/auth/me`

| Field | Details |
|---|---|
| **Purpose** | Get the currently logged-in user's profile |
| **Auth Required** | ✅ JWT Bearer token required |
| **Status** | ✅ Built & Working |

**Success (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Prasanth",
    "preferred_model": "google/gemma-4-31b-it:free",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### `POST /api/auth/logout`

| Field | Details |
|---|---|
| **Purpose** | Confirm logout (client-side token removal) |
| **Auth Required** | ❌ No (even expired tokens can "logout") |
| **Status** | ✅ Built & Working |

**Success (200):**
```json
{ "success": true, "message": "Logged out successfully. Please delete your token on the client." }
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
| **Status** | ✅ Built & Working |

**Request:** `multipart/form-data` with field `chatFile` (the `.txt` file)

**Success (202 — Accepted, parsing starts in background):**
```json
{
  "success": true,
  "message": "File received. Parsing in progress...",
  "session": {
    "id": "uuid",
    "name": "Chat with Mom",
    "parse_status": "parsing"
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
| **Status** | ✅ Built & Working |

**Success (200):**
```json
{
  "success": true,
  "session": {
    "id": "uuid",
    "name": "Chat with Mom",
    "parse_status": "completed",
    "message_count": 4521,
    "participant_count": 2,
    "skipped_lines": 3,
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
Returns: `{ total_messages, participant_count, first_message_at, last_message_at, duration_days, media_count, link_count }`

#### `GET /api/sessions/:id/analytics/participants`
Returns: `[{ sender_name, message_count, percentage, avg_message_length, media_count }]` — sorted by message count

#### `GET /api/sessions/:id/analytics/timeline`
Query params: `?granularity=day|week|month`
Returns: `[{ period, message_count }]` — for charting

#### `GET /api/sessions/:id/analytics/peak-hours`
Returns: `[{ hour: 0-23, message_count }]` — for 24-hour activity chart

#### `GET /api/sessions/:id/analytics/word-frequency`
Query params: `?limit=20` (default 20, max 100)
Returns: `[{ word, frequency }]` — excludes stop words (the, is, a, etc.)

#### `GET /api/sessions/:id/analytics/emoji-frequency`
Returns: `[{ emoji, frequency }]`

#### `GET /api/sessions/:id/analytics/media-links`
Returns: `{ media_count, link_count, deleted_count, longest_message_chars, avg_message_chars, longest_message: { sender_name, message_text, sent_at } }`

#### `GET /api/sessions/:id/analytics/response-time`
Returns: `[{ sender_name, avg_response_minutes }]`

> All analytics endpoints return **422** if `session.parse_status !== 'completed'`

---

### 🤖 Chat Q&A API

#### `POST /api/sessions/:id/chat`

| Field | Details |
|---|---|
| **Purpose** | Ask a natural language question about the chat |
| **Auth Required** | ✅ JWT |
| **Status** | ✅ Built & Working |

**Request Body:**
```json
{
  "question": "Who sends the most messages?",
  "password": null
}
```

> The backend automatically routes to `rule_based` or `ai` engine based on keyword analysis. The optional `password` field is only needed when the DLP guardrail detects a sensitive information query.

**Success (200):**
```json
{
  "success": true,
  "question": "Who sends the most messages?",
  "answer": "Alice has sent the most messages with 2,341 messages (52% of total).",
  "engine": "rule_based",
  "modelUsed": null
}
```

> For AI responses, a `disclaimer` field is included: `"AI answers are generated based on your chat content and may not be 100% accurate."`

**Errors:**
| Code | Meaning |
|---|---|
| 503 | AI engine unavailable (OpenRouter down) — rule_based answers still work |
| 429 | Rate limited |
| 400 | Empty question or question too long (>500 chars) |
| 403 | Sensitive query detected — requires password verification |

---

### 👤 User Settings APIs

#### `PUT /api/users/password`

| Field | Details |
|---|---|
| **Purpose** | Change the current user's password |
| **Auth Required** | ✅ JWT |
| **Status** | ✅ Built & Working |

**Request Body:**
```json
{ "currentPassword": "OldPass123!", "newPassword": "NewPass456!" }
```

---

#### `PUT /api/users/settings`

| Field | Details |
|---|---|
| **Purpose** | Update user preferences (preferred AI model) |
| **Auth Required** | ✅ JWT |
| **Status** | ✅ Built & Working |

**Request Body:**
```json
{ "preferred_model": "google/gemma-4-31b-it:free" }
```

**Allowed Models:** `google/gemma-4-31b-it:free`, `openai/gpt-oss-20b:free`, `nvidia/nemotron-3-nano-30b-a3b:free`, `gemini/gemini-flash`, `openai/gpt-4o`, `anthropic/claude-3-haiku`

---

#### `DELETE /api/users/me`

| Field | Details |
|---|---|
| **Purpose** | Permanently delete account + all sessions + all S3 files |
| **Auth Required** | ✅ JWT + password re-confirmation |
| **Status** | ✅ Built & Working |

**Request Body (password confirmation required):**
```json
{ "confirmPassword": "MyPass123!" }
```

---

## 📊 API Health Summary

| Category | Total | Built | Tested | Working |
|---|---|---|---|---|
| Auth APIs | 4 | 4 | 4 | 4 |
| Session APIs | 4 | 4 | 4 | 4 |
| Analytics APIs | 8 | 8 | 8 | 8 |
| Chat Q&A APIs | 3 | 3 | 3 | 3 |
| User Settings APIs | 3 | 3 | 3 | 3 |
| **Total** | **22** | **22** | **22** | **22** |

---

## 🔗 Third-Party API Integrations

| # | Service | Used For | Docs | Status |
|---|---|---|---|---|
| 1 | **OpenRouter** | AI model gateway (routes to free open-source models) | https://openrouter.ai/docs | ✅ |
| 2 | **Langfuse** | AI call observability + cost tracking via `@langfuse/openai` wrapper | https://langfuse.com/docs | ✅ |
| 3 | **AWS S3** | Raw `.txt` file storage (backup copies of uploaded chats) | AWS SDK v3 docs | ✅ |

---

<!-- END OF API STATUS -->
