# 🔑 Secrets & API Keys Structure

<!-- ============================================================ -->
<!-- PURPOSE: Documents all required environment variables and     -->
<!-- where to get them. NEVER put actual secret values here!       -->
<!-- Used to quickly set up a new local dev environment or         -->
<!-- configure cloud deployments (Render).                       -->
<!-- ============================================================ -->
<!-- Status: ✅ Completed -->
<!-- Last Updated: 2026-08-20 -->
<!-- Version: 1.1 -->

---

## 🔒 Backend `.env`

Create a `.env` file in the `/backend` folder with these variables. 

| Variable Name | Purpose | Where to Get It |
|---|---|---|
| `PORT` | The port the server runs on | Usually `5000` locally |
| `NODE_ENV` | Environment identifier | `development` or `production` |
| `DATABASE_URL` | PostgreSQL connection string | AWS RDS Console or Render PostgreSQL |
| `JWT_SECRET` | Secret to sign auth tokens | Generate a random 64-char hex string |
| `AWS_REGION` | S3 Bucket Region | AWS Console (e.g. `us-east-1`) |
| `AWS_ACCESS_KEY_ID` | IAM User Access Key | AWS IAM Console |
| `AWS_SECRET_ACCESS_KEY`| IAM User Secret Key | AWS IAM Console |
| `AWS_S3_BUCKET_NAME` | Name of the bucket for `.txt` | AWS S3 Console |
| `OPENROUTER_API_KEY` | Key for LLM Inference | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `SITE_URL` | Used for CORS allowance | e.g. `http://localhost:5173` or `https://whatsapp-analyzer-frontend.onrender.com` |

---

## 🖥️ Frontend `.env`

Create a `.env` file in the `/frontend` folder.

| Variable Name | Purpose | Where to Get It |
|---|---|---|
| `VITE_API_URL` | Base URL for backend API | Local: `http://localhost:5000`. Prod: `https://whatsapp-analyzer-backend-gd67.onrender.com` |

---

> ⚠️ **SECURITY REMINDER:** `.env` files are in `.gitignore` by default. Never commit them!
