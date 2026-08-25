# 🔀 Plan Changes & Deviations

<!-- ============================================================ -->
<!-- PURPOSE: Tracks when and why we deviated from the original   -->
<!-- blueprint. Helps future AI understand "why didn't we just    -->
<!-- do X like the blueprint said?"                              -->
<!-- ============================================================ -->
<!-- Last Updated: 2026-08-20 -->
<!-- Version: 1.1 -->

---

## 📝 Change Log

### 1. Shift from OpenAI to OpenRouter (Free Tier)
**Date:** 2026-08-19
**Deviation:** The original blueprint suggested using a LiteLLM Proxy in front of OpenAI (`gpt-4o`). 
**Reasoning:** To strictly maintain a $0/month budget, we shifted directly to **OpenRouter**. OpenRouter provides an OpenAI-compatible API that gives us direct access to high-quality *free* models (`google/gemma-4-31b-it:free`, etc). 
**Impact:** `ai.service.js` connects directly to `https://openrouter.ai/api/v1` instead of a self-hosted LiteLLM instance. This simplified the architecture and dropped AI costs to zero.

### 2. Implementation of Database-Driven RAG vs Vector DB
**Date:** 2026-08-19
**Deviation:** We did not implement Pinecone or a separate vector database for AI chat context retrieval.
**Reasoning:** To avoid syncing logic and additional infrastructure costs.
**Impact:** We leveraged **PostgreSQL Full-Text Search** (`to_tsvector` and `websearch_to_tsquery`) to find keyword matches, then simply retrieve a +/- 125 message slice around that match. This provides excellent conversational context using only a single RDS instance.

### 3. Analytics Caching
**Date:** 2026-08-19
**Deviation:** Analytics queries are now heavily cached in a new `analytics_cache` table.
**Reasoning:** Large group chats (20k+ messages) were causing heavy CPU load on the free tier RDS instance every time the dashboard was loaded.
**Impact:** Complex aggregations are computed once upon upload and stored. Subsequent loads read the JSON from `analytics_cache`.
