# 🔑 Secrets, Keys & Credentials

<!-- ============================================================ -->
<!-- PURPOSE: Lists every API key, password, token, and           -->
<!-- environment variable the project needs.                       -->
<!-- The user fills in actual values here for reference.          -->
<!--                                                              -->
<!-- ⚠️ CRITICAL SECURITY RULES:                                 -->
<!-- 1. NEVER commit this file to Git. Add to .gitignore NOW.    -->
<!-- 2. NEVER paste keys in a chat window (already done — rotate!)-->
<!-- 3. The actual .env file on the server is the live source.    -->
<!-- 4. This file is only a reference/setup guide.                -->
<!-- ============================================================ -->
<!-- Status: 🟡 Keys Obtained — Configuration Pending -->
<!-- Last Updated: 2026-08-18 -->
<!-- Version: 1.0 -->

---

## ⚠️ IMMEDIATE ACTION REQUIRED

> The keys below were shared in a chat window. Rotate them after setup:
>
> - **OpenRouter:** Go to https://openrouter.ai/settings/keys → Delete old key → Create new key
> - **Langfuse:** Go to https://us.cloud.langfuse.com → Project Settings → API Keys → Rotate

---

## 📊 Progress

```
Secrets Obtained:  [ 🟡 2 OF 6 SERVICES ] ▓▓▓▓▓▓▓░░░░░░░░░░░░░ 33%
Secrets Configured:[ ⬜ NOT CONFIGURED   ] ░░░░░░░░░░░░░░░░░░░░  0%
```

---

## 🔐 Credentials Overview

| # | Credential | Service | Required For | Status | Priority |
|---|---|---|---|---|---|
| 1 | `OPENROUTER_API_KEY` | OpenRouter | Routing AI calls to Gemini/GPT/Claude | 🟨 Obtained | 🔴 High |
| 2 | `LANGFUSE_SECRET_KEY` | Langfuse | Server-side AI call logging | 🟨 Obtained | 🔴 High |
| 3 | `LANGFUSE_PUBLIC_KEY` | Langfuse | Client identification for Langfuse | 🟨 Obtained | 🔴 High |
| 4 | `LANGFUSE_BASE_URL` | Langfuse | Which Langfuse region to connect to | 🟨 Obtained | 🔴 High |
| 5 | `DATABASE_URL` | AWS RDS | PostgreSQL connection string | ⬜ Pending | 🔴 High |
| 6 | `JWT_SECRET` | App Auth | Signing JWT tokens | ⬜ Generate locally | 🔴 High |
| 7 | `AWS_ACCESS_KEY_ID` | AWS S3 | Uploading/deleting files in S3 | ⬜ Pending | 🟡 Medium |
| 8 | `AWS_SECRET_ACCESS_KEY` | AWS S3 | S3 authentication | ⬜ Pending | 🟡 Medium |
| 9 | `AWS_S3_BUCKET_NAME` | AWS S3 | Which bucket to store files in | ⬜ Pending | 🟡 Medium |
| 10 | `AWS_REGION` | AWS | AWS region for all services | ⬜ Pending | 🟡 Medium |

---

## 📝 Credential Details & Setup Instructions

---

### 🔹 1. OpenRouter API Key

| Field | Value |
|---|---|
| **Variable Name** | `OPENROUTER_API_KEY` |
| **Current Value** | `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` |
| **Status** | 🟨 Obtained — ⚠️ ROTATE after setup |
| **Used In** | LiteLLM Proxy config → routes all AI calls |

**What it does:** This key allows our LiteLLM Proxy to send AI requests through OpenRouter's gateway. OpenRouter routes the call to whichever model we choose (Gemini Flash, GPT-4o, etc.) and bills us per token.

**How to get a new one (after rotating):**
1. Go to https://openrouter.ai/settings/keys
2. Click "Create Key"
3. Give it a name: "WhatsApp Analyzer - Production"
4. Copy the key and paste it below

**Where it goes in the project:**
```
# /backend/.env
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxx

# /litellm/config.yaml
api_key: os.environ/OPENROUTER_API_KEY
```

---

### 🔹 2 & 3 & 4. Langfuse Keys

| Field | Value |
|---|---|
| **Variable Names** | `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_BASE_URL` |
| **Secret Key** | `sk-lf-9a1b46db-5321-4e81-bf04-3dc5f7a612ab` |
| **Public Key** | `pk-lf-58562487-91e9-403a-8398-44d249351e3e` |
| **Base URL** | `https://us.cloud.langfuse.com` |
| **Status** | 🟨 Obtained — ⚠️ ROTATE after setup |
| **Used In** | LiteLLM Proxy config — auto-logs every AI call |

**What it does:** These keys allow LiteLLM Proxy to send a trace to Langfuse every time an AI call is made. Langfuse records what was sent, what came back, how long it took, and how much it cost.

**How to rotate:**
1. Go to https://us.cloud.langfuse.com → Your Project → Settings → API Keys
2. Delete the current keys
3. Create new keys, paste below

**Where they go:**
```
# /backend/.env  (or LiteLLM Proxy environment)
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxxxxxxxx
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxxxxxxxx
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

---

### 🔹 5. Database URL (AWS RDS PostgreSQL)

| Field | Value |
|---|---|
| **Variable Name** | `DATABASE_URL` |
| **Current Value** | ⬜ Not yet provisioned |
| **Status** | ⬜ Pending — need to create RDS instance |

**Format when obtained:**
```
postgresql://USERNAME:PASSWORD@your-rds-endpoint.rds.amazonaws.com:5432/whatsapp_analyzer
```

**How to get it:**
1. AWS Console → RDS → Create Database
2. Engine: PostgreSQL, Template: Free Tier (db.t3.micro)
3. DB name: `whatsapp_analyzer`
4. Set username and password (save them!)
5. After creation, find the "Endpoint" under Connectivity → copy it
6. Format: `postgresql://admin:yourpassword@endpoint:5432/whatsapp_analyzer`

```
# /backend/.env
DATABASE_URL=postgresql://admin:PASSWORD@ENDPOINT:5432/whatsapp_analyzer
```

---

### 🔹 6. JWT Secret

| Field | Value |
|---|---|
| **Variable Name** | `JWT_SECRET` |
| **Current Value** | ⬜ Generate using command below |
| **Status** | ⬜ Pending |

**What it does:** A long random string used to cryptographically sign JWT tokens. If someone steals this, they can forge login tokens. Keep it secret.

**How to generate (run this in terminal):**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and paste it as your JWT_SECRET.

```
# /backend/.env
JWT_SECRET=your-64-character-random-hex-string-here
JWT_EXPIRY=7d
```

---

### 🔹 7, 8, 9, 10. AWS S3 Credentials

| Field | Value |
|---|---|
| **Variable Names** | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_REGION` |
| **Current Value** | ⬜ Not yet set up |
| **Status** | ⬜ Pending |

**How to get them:**
1. AWS Console → IAM → Users → Create User
2. Attach policy: `AmazonS3FullAccess` (or create a restricted policy for just our bucket)
3. Create Access Key → Download the key file
4. AWS Console → S3 → Create Bucket
   - Bucket name: `whatsapp-analyzer-uploads` (must be globally unique)
   - Region: `ap-south-1` (Mumbai, closest for India) or your preferred region
   - Block ALL public access: ✅ Yes (files are private)

```
# /backend/.env
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=whatsapp-analyzer-uploads
AWS_REGION=ap-south-1
```

---

## 📄 Complete `.env` Template

> Copy this into `/backend/.env` and fill in the values:

```env
# ============================================================
# WhatsApp Analyzer — Backend Environment Variables
# ============================================================
# ⚠️ NEVER commit this file to Git
# Add .env to your .gitignore immediately
# ============================================================

# --- App ---
NODE_ENV=development
PORT=3001

# --- Database ---
DATABASE_URL=postgresql://admin:PASSWORD@ENDPOINT:5432/whatsapp_analyzer

# --- Authentication ---
JWT_SECRET=your-64-char-random-hex-string
JWT_EXPIRY=7d

# --- AWS ---
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET_NAME=whatsapp-analyzer-uploads
AWS_REGION=ap-south-1

# --- OpenRouter (AI Gateway) ---
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxx

# --- Langfuse (AI Observability) ---
LANGFUSE_SECRET_KEY=sk-lf-xxxxxxxxxxxxxxxxxx
LANGFUSE_PUBLIC_KEY=pk-lf-xxxxxxxxxxxxxxxxxx
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

---

## 🔒 Security Checklist

| Check | Status |
|---|---|
| `secrets_and_keys.md` added to `.gitignore` | ⬜ |
| `.env` file added to `.gitignore` | ⬜ |
| OpenRouter key rotated after initial use | ⬜ |
| Langfuse keys rotated after initial use | ⬜ |
| AWS IAM user has MINIMUM required permissions (not root) | ⬜ |
| RDS is in a private VPC subnet (not publicly accessible) | ⬜ |
| JWT_SECRET is at least 64 random characters | ⬜ |

---

<!-- END OF SECRETS AND KEYS -->
