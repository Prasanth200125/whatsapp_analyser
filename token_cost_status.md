# 💸 Token & Cost Tracking

<!-- ============================================================ -->
<!-- PURPOSE: Keep strict tabs on AI token usage and database      -->
<!-- costs to ensure the project stays well within the free tier.  -->
<!-- ============================================================ -->
<!-- Last Updated: 2026-08-20 -->
<!-- Version: 2.0 -->

---

## 🎯 Cost Goal
**$0.00 / month**

## 💡 Current Strategy

We have officially migrated from paid APIs (like OpenAI GPT-4o) to completely **free Open Source models** hosted on OpenRouter. Because of this, our AI generation costs are strictly $0.

### Supported Free Models
- `google/gemma-4-31b-it:free`
- `openai/gpt-oss-20b:free`
- `nvidia/nemotron-3-nano-30b-a3b:free`

---

## 🌩️ Infrastructure Costs (AWS & Render)

| Service | Tier Used | Current Monthly Cost | Limit / Quota |
|---|---|---|---|
| **AWS RDS (PostgreSQL)** | `db.t3.micro` (Free Tier) | $0.00 | 750 hours/month (1 instance = free) |
| **AWS S3 (Storage)** | S3 Standard (Free Tier) | $0.00 | 5GB Storage, 20k GET requests |
| **Render (Backend)** | Web Service (Free Tier) | $0.00 | 500 build minutes, 750 hrs runtime |
| **Render (Frontend)** | Static Site (Free Tier) | $0.00 | 100GB bandwidth |
| **OpenRouter (AI)** | Free Models Only | $0.00 | Rate limits apply, but cost is $0 |

## 💰 Total Estimated Cost: $0.00 / month

---

## 🛑 Cost Protection Measures Activated

1. **RAG Context Limits**: Only +/- 125 messages are fetched per query. We do not pass the entire chat history to the LLM, preventing massive token burn.
2. **Hardcoded Model Validation**: `user.routes.js` strictly rejects any preferred model that is not in the hardcoded allowlist, completely preventing users from maliciously switching to paid models like `gpt-4o`.
3. **Analytics Cache**: All heavy SQL aggregations (word clouds, timelines) are calculated once and stored in `analytics_cache`, preventing RDS CPU exhaustion and keeping us well within the free tier.
