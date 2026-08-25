# 📋 Master Project To-Do List

<!-- ============================================================ -->
<!-- PURPOSE: The single source of truth for project progress.    -->
<!-- Organized by build phase. All status files derive their      -->
<!-- progress from this list. Updated after every task.           -->
<!-- ============================================================ -->
<!-- Last Updated: 2026-08-20 -->
<!-- Version: 1.0 -->

---

## 📊 Overall Project Progress

```
Overall: [ ✅ PHASE 5 COMPLETED — PROJECT FINISHED ]
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100% (All features and deployments completed)
```

---

## 📌 Progress Key

| Symbol | Meaning |
|---|---|
| `[ ]` | Not started |
| `[/]` | In progress |
| `[x]` | Completed |
| ✅ | Completed (tables) |
| 🟨 | In progress (tables) |
| ⬜ | Not started (tables) |

---

## 📍 Section Progress Summary

| # | Section | Done | Total | Progress | Status |
|---|---|---|---|---|---|
| 1 | Planning & Blueprint | 10 | 10 | 100% | ✅ |
| 2 | Project Setup & Dev Environment | 7 | 7 | 100% | ✅ |
| 3 | Database Setup & Migrations | 6 | 6 | 100% | ✅ |
| 4 | Authentication (Backend) | 7 | 7 | 100% | ✅ |
| 5 | File Upload & Parsing Engine | 8 | 8 | 100% | ✅ |
| 6 | Rule-Based Analytics Engine | 11 | 11 | 100% | ✅ |
| 7 | AI Engine (LiteLLM + OpenRouter + Langfuse) | 6 | 6 | 100% | ✅ |
| 8 | Chat Q&A API (Query Router) | 4 | 4 | 100% | ✅ |
| 9 | User Settings & Account Management | 4 | 4 | 100% | ✅ |
| 10 | Frontend — Auth Screens | 4 | 4 | 100% | ✅ |
| 11 | Frontend — Dashboard | 5 | 5 | 100% | ✅ |
| 12 | Frontend — Session View & Chat UI | 7 | 7 | 100% | ✅ |
| 13 | Frontend — Analytics Panel | 6 | 6 | 100% | ✅ |
| 14 | Frontend — Guide System (ℹ️) | 3 | 3 | 100% | ✅ |
| 15 | Frontend — Offline Detection | 2 | 2 | 100% | ✅ |
| 16 | Cloud Deployment | 5 | 5 | 100% | ✅ |
| 17 | Integration & End-to-End Testing | 6 | 6 | 100% | ✅ |
| 18 | Documentation & Final WorkBench Cleanup | 5 | 5 | 100% | ✅ |

---

## 📝 Detailed To-Do by Section

---

### ✅ Section 1: Planning & Blueprint
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Discuss raw project idea
- [x] Phase 2: Ask & Analyze (users, platform, scale, budget)
- [x] Choose and document tech stack
- [x] Define features list (core + nice-to-have)
- [x] Define all screens
- [x] Define all reusable components
- [x] Design database schema (7 tables with full SQL)
- [x] Document error handling & edge cases (8 layers)
- [x] Plan all API endpoints (22 endpoints)
- [x] Get blueprint approval

---

### Section 2: Project Setup & Dev Environment
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Initialize Git repository (GitHub)
- [x] Create Node.js + Express backend project (`/backend`) — package.json, index.js, all dependencies installed
- [x] Create React + Vite frontend project (`/frontend`)
- [x] Install all backend dependencies (express, pg, bcryptjs, jsonwebtoken, multer, aws-sdk, langfuse etc)
- [x] Install all frontend dependencies (react-router, recharts, react-dropzone, lucide-react, axios)
- [x] Set up `.env` file structure (fill `secrets_and_keys.md`)
- [x] Verify all library versions are compatible (fill `techstack_versions.md`)

---

### Section 3: Database Setup & Migrations
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Provision AWS RDS PostgreSQL instance (free tier — db.t3.micro)
- [x] Connect backend to RDS (test connection)
- [x] Write migration SQL file (all 7 tables in correct order)
- [x] Run migration — create all tables and indexes
- [x] Verify tables created correctly (test basic INSERT/SELECT)
- [x] Update `database_status.md` with connection details and migration status

---

### Section 4: Authentication (Backend)
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] `POST /api/auth/register` — create user with bcrypt-hashed password
- [x] `POST /api/auth/login` — verify credentials, return signed JWT (timing-attack safe)
- [x] `GET /api/auth/me` — decode JWT, return user profile
- [x] `POST /api/auth/logout` — client-side token removal (documented)
- [x] JWT middleware — protect all private routes
- [x] Rate limiter middleware — 10 login attempts per 15 min lockout
- [x] Auth routes tested (syntax verified clean)

---

### Section 5: File Upload & Parsing Engine
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] `POST /api/sessions` — receive `.txt` file via multer
- [x] Validate file: type (.txt only), size (≤15MB), not empty
- [x] Upload raw file to AWS S3 (store s3_file_key)
- [x] Create session row in DB with `parse_status: 'parsing'`
- [x] WhatsApp parser: detect iOS vs Android format automatically
- [x] WhatsApp parser: parse each line (sender, timestamp, message text, type)
- [x] Handle partial failures (skip bad lines, count skipped)
- [x] Wrap all DB inserts in a transaction (rollback on failure)
- [x] Update session `parse_status` to `completed` / `failed` / `empty`

---

### Section 6: Rule-Based Analytics Engine
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] `GET /api/sessions/:id/analytics/overview` — total messages, date range, participant count
- [x] `GET /api/sessions/:id/analytics/participants` — per-person breakdown (sorted by count)
- [x] `GET /api/sessions/:id/analytics/timeline` — messages per day/week/month
- [x] `GET /api/sessions/:id/analytics/peak-hours` — hourly activity (0-23)
- [x] `GET /api/sessions/:id/analytics/word-frequency` — top N words (exclude stop words)
- [x] `GET /api/sessions/:id/analytics/emoji-frequency` — most used emojis
- [x] `GET /api/sessions/:id/analytics/media-links` — media count + link count + longest message
- [x] `GET /api/sessions/:id/analytics/response-time` — avg response time per sender
- [x] Implement `analytics_cache` — compute once, serve cached thereafter
- [x] Stop-word filter list (the, is, a, and, etc.) for word frequency
- [x] Test all analytics queries on a real WhatsApp export file

---

### Section 7: AI Engine (OpenRouter + Langfuse)
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Configure OpenRouter API key in backend `.env`
- [x] Configure Langfuse keys in backend `.env` (auto-logging via `@langfuse/openai` wrapper)
- [x] Verify Langfuse receives and logs traces for every AI call
- [x] Write AI service module in backend (ai.service.js — sends messages to OpenRouter via OpenAI-compat API)
- [x] Implement message chunking (limit context to +/- 125 messages around relevant match)
- [x] Add AI disclaimer to all AI responses

---

### Section 8: Chat Q&A API (Query Router)
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] `POST /api/sessions/:id/chat` — receive question, route to correct engine
- [x] Implement keyword-based router (how many, count, most, top → rule_based; else → ai)
- [x] `GET /api/sessions/:id/chat/history` — return past Q&A exchanges
- [x] `DELETE /api/sessions/:id/chat/history` — clear Q&A history

---

### Section 9: User Settings & Account Management
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] `PUT /api/users/password` — change password (verify old password first)
- [x] `PUT /api/users/settings` — update preferred AI model (validated allowlist)
- [x] `DELETE /api/sessions/:id` — delete session (DB records + S3 file)
- [x] `DELETE /api/users/me` — delete account (all sessions + data + S3 files, password-confirmed)

---

### Section 10: Frontend — Auth Screens
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Login page UI (with form validation)
- [x] Register page UI (with form validation)
- [x] JWT token storage (localStorage) + auto-attach to API calls
- [x] Auto-redirect to Dashboard on valid token, to Login on expired/missing token

---

### Section 11: Frontend — Dashboard
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Dashboard layout — session list + upload area
- [x] FileUploadBox component (drag-and-drop + click-to-upload)
- [x] Upload progress bar + parsing status poller (polls `GET /api/sessions/:id` every 2s)
- [x] Session list (cards with name, date, message count, delete button)
- [x] ConfirmDialog before session deletion

---

### Section 12: Frontend — Session View & Chat UI
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Session View layout (sidebar + main content area)
- [x] Session Sidebar component (collapsible, lists all sessions)
- [x] ChatWindow component (scrollable message feed)
- [x] ChatInputBar component (text input + submit, disabled while loading)
- [x] Engine badge on each answer ("⚡ Rule-Based" or "🤖 AI")
- [x] "Show more / Show less" for long AI responses
- [x] AI answer disclaimer footer

---

### Section 13: Frontend — Analytics Panel
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Analytics Panel layout (tab or section within Session View)
- [x] AnalyticsCard components (total messages, most active user, date range)
- [x] Activity Timeline Chart (Recharts line/bar chart)
- [x] Peak Hours Chart (Recharts bar chart — 24 hours)
- [x] Word Frequency display (sorted list or word cloud)
- [x] Emoji Frequency display

---

### Section 14: Frontend — Guide System (ℹ️)
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] GuideTooltip component (small tooltip on ℹ️ hover)
- [x] GuideModal component (full modal with examples on ℹ️ click)
- [x] Add ℹ️ buttons to: Chat Input, Analytics Panel, File Upload, Session Sidebar

---

### Section 15: Frontend — Offline Detection
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] OfflineBanner component (orange bar when offline, green when reconnected)
- [x] Disable AI features (gray out ChatInput, show "AI offline" tooltip) when offline

---

### Section 16: Cloud Deployment (Render + AWS)
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Provision backend web service (Render.com)
- [x] Provision frontend static site (Render.com)
- [x] Configure backend environment variables
- [x] Configure frontend API URLs
- [x] Deploy to production

---

### Section 17: Integration & End-to-End Testing
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Test full flow: Register → Login → Upload → Parse → Ask rule-based question → See answer
- [x] Test full AI flow: Ask open question → See AI answer → Check Langfuse trace
- [x] Test offline mode: Disable internet → Verify AI disabled, analytics still work
- [x] Test deletion: Delete session → Verify DB + S3 cleaned up
- [x] Test account deletion: Delete account → Verify all data gone
- [x] Test on mobile browser (responsive design check)

---

### Section 18: Documentation & Final Cleanup
```
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 100%
```
- [x] Write `tutorial.md` (full user guide for using the app)
- [x] Fill `secrets_and_keys.md` with all credentials and setup instructions
- [x] Final review of all WorkBench `.md` files — all must be up to date
- [x] Final `session_status.md` update (mark project complete)
- [x] Create GitHub README for the project

---

<!-- END OF TO-DO LIST -->
