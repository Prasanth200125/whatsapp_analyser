# 🛠️ Tech Stack

<!-- ============================================================ -->
<!-- PURPOSE: Documents every technology used in the project.     -->
<!-- For each tech: what it is (simple English), why we chose it, -->
<!-- why alternatives weren't suited, real-world companies using  -->
<!-- it, libraries/packages involved, and programming language.   -->
<!-- This helps the user UNDERSTAND the tools, not just use them. -->
<!-- ============================================================ -->
<!-- Status: 🟡 DRAFT — Awaiting Blueprint Approval -->
<!-- Last Updated: 2026-08-20 -->
<!-- Version: 1.0 -->

---

## 📊 Progress

```
Tech Stack Defined: [ 🟡 DRAFT ] 50%
▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%
```

---

## 🧩 Tech Stack Overview

| Category | Technology | Status |
|---|---|---|
| Frontend Framework | React + Vite | 🟡 Draft |
| Frontend Styling | Tailwind CSS + shadcn/ui | 🟡 Draft |
| Backend Runtime | Node.js | 🟡 Draft |
| Backend Framework | Express.js | 🟡 Draft |
| Database | PostgreSQL (AWS RDS) | 🟡 Draft |
| Authentication | JWT + bcrypt | 🟡 Draft |
| File Storage | AWS S3 | 🟡 Draft |
| AI Gateway | OpenRouter | 🟡 Draft |
| AI Model | Google Gemini Flash | 🟡 Draft |
| AI Router/Adapter | LiteLLM | 🟡 Draft |
| AI Observability | Langfuse | 🟡 Draft |
| Frontend Hosting | AWS Amplify (or S3 + CloudFront) | 🟡 Draft |
| Backend Hosting | AWS EC2 | 🟡 Draft |
| Version Control | Git + GitHub | ⬜ To Set Up |

---

## 📝 Detailed Tech Explanations

---

### 🔹 React + Vite

| Field | Details |
|---|---|
| **Category** | Frontend Framework |
| **What It Is** | React is like a set of LEGO blocks — you build a web page from small, reusable pieces called "components" (e.g., a Sidebar component, a ChatBubble component). Vite is the ultra-fast tool that assembles those blocks instantly during development (like a super-fast factory). Together, they let you build complex, interactive UIs. |
| **Why We Chose It** | Our app has complex, stateful UI — a sidebar, a live chat window, analytics cards, modals, and a guide system. React handles all this elegantly with its component model. Vite gives us near-instant hot-reloads during development so we don't wait. |
| **Why Not Alternatives** | Plain HTML/JS becomes chaotic and unmaintainable at this level of UI complexity. Next.js is overkill — it's built for SEO/server-side rendering, which we don't need (our app is behind a login). Vue.js is also good but React has a larger ecosystem of libraries (like shadcn/ui). |
| **Real-World Companies** | Facebook (invented React), Netflix, Airbnb, WhatsApp Web, Instagram |
| **Libraries We Use** | `react`, `react-dom`, `react-router-dom` (for page routing), `recharts` (charts), `react-dropzone` (file upload) |
| **Programming Language** | JavaScript (JSX) |

---

### 🔹 Tailwind CSS + shadcn/ui

| Field | Details |
|---|---|
| **Category** | Frontend Styling |
| **What It Is** | Tailwind CSS lets you style elements by adding class names directly in your HTML (e.g., `class="bg-gray-900 text-white p-4 rounded-lg"`). Instead of writing a separate CSS file, you describe styles inline. Think of it as having every possible CSS rule already named as a shortcut. shadcn/ui is a library of pre-built, beautiful React components (buttons, modals, dropdowns, tooltips) built on top of Tailwind — like pre-assembled furniture. |
| **Why We Chose It** | We need a premium, polished dark-mode UI with tooltips (for our ℹ️ guide system), sidebars, and dialogs. shadcn/ui provides these components ready to use, and Tailwind lets us customize them to look exactly how we want. Together, they make building a stunning UI fast. |
| **Why Not Alternatives** | Plain CSS requires writing too much boilerplate. Material UI (MUI) forces a very "Google-like" look that's hard to escape. Bootstrap looks dated. Chakra UI is similar but less customizable at the token level. |
| **Real-World Companies** | Vercel, Linear, Resend, and most modern SaaS companies use Tailwind + shadcn/ui |
| **Libraries We Use** | `tailwindcss`, `@shadcn/ui` components: `Tooltip`, `Dialog`, `Sheet` (sidebar), `Button`, `Input`, `Card`, `Badge` |
| **Programming Language** | CSS (utility classes) |

---

### 🔹 Node.js + Express.js

| Field | Details |
|---|---|
| **Category** | Backend Runtime + Framework |
| **What It Is** | Node.js is JavaScript running on a server instead of in a browser — like taking the same language from the frontend and using it in the kitchen (backend). Express.js is a lightweight framework that defines what your server does when the browser asks for something. Think of Express as a well-organized menu system — "when someone requests `/api/sessions`, serve them the sessions list". |
| **Why We Chose It** | Our entire project is now JavaScript (React frontend + Node.js backend). Same language everywhere = simpler debugging, shared code, and one developer can understand everything. The WhatsApp `.txt` file parsing is straightforward in Node.js using streams. |
| **Why Not Alternatives** | Python (FastAPI/Django) is excellent for heavy ML workloads, but we're offloading all AI work to Gemini via API calls, so Python's ML advantage doesn't apply here. Go is very fast but overkill for our ~5-10 user app. |
| **Real-World Companies** | Netflix (API gateway), Uber (real-time matching), LinkedIn (mobile backend), PayPal |
| **Libraries We Use** | `express`, `multer` (file upload handling), `pg` (PostgreSQL client), `bcryptjs` (password hashing), `jsonwebtoken` (JWT), `dotenv` (environment variables), `cors`, `helmet` (security headers) |
| **Programming Language** | JavaScript |

---

### 🔹 PostgreSQL (on AWS RDS)

| Field | Details |
|---|---|
| **Category** | Database |
| **What It Is** | PostgreSQL is a full-featured relational database — think of it as a very organized Excel spreadsheet on steroids. Data is stored in tables with rows and columns, and you can ask complex questions like "give me all messages from person X in the month of March, sorted by time". It speaks SQL (Structured Query Language). |
| **Why We Chose It** | Our **Rule-Based Analytics Engine** is built entirely on SQL queries. Things like "top 10 words", "messages per day", "most active user" are all SQL GROUP BY + COUNT queries — PostgreSQL handles these blazingly fast. It also has excellent text search capabilities. AWS RDS manages all the boring stuff (backups, patches, restarts) for us. |
| **Why Not Alternatives** | MongoDB (NoSQL) is great for unstructured data but loses the power of SQL joins and aggregate queries that drive our analytics engine. SQLite is only for local/dev, not a deployed app. MySQL is fine but PostgreSQL has better text search and JSON support for future flexibility. |
| **Real-World Companies** | Instagram (stored all photos metadata), Spotify (user data), Apple (iCloud backend) |
| **Libraries We Use** | `pg` (Node.js PostgreSQL client), or `prisma` (ORM for easier queries — to be decided) |
| **Programming Language** | SQL |

---

### 🔹 JWT + bcrypt (Authentication)

| Field | Details |
|---|---|
| **Category** | Authentication |
| **What It Is** | JWT (JSON Web Token) is like a stamped passport. When you log in, the server gives you a digital token (the passport). You send this token with every request, and the server verifies it's authentic — without needing to check the database every time. bcrypt is an algorithm that transforms a password into a scrambled, one-way hash. Even if someone steals the database, they can't recover the real password. |
| **Why We Chose It** | Industry standard for stateless API authentication. JWT means the server doesn't need to store session data — it just validates the token. bcrypt ensures passwords are never stored in plain text. |
| **Why Not Alternatives** | Session cookies require server-side session storage — adds complexity. OAuth-only (Google login) is simpler but depends on a third-party service and doesn't fit the "invite-only private app" model. |
| **Real-World Companies** | Every major SaaS product (Stripe, GitHub, Notion) uses JWT for API auth |
| **Libraries We Use** | `jsonwebtoken`, `bcryptjs` |
| **Programming Language** | JavaScript |

---

### 🔹 LiteLLM

| Field | Details |
|---|---|
| **Category** | AI Router / Adapter |
| **What It Is** | LiteLLM is a universal translator for AI models. You write your AI call code once using a standard format, and LiteLLM can route that call to Gemini, OpenAI, Anthropic Claude, Mistral, or any other model — by just changing one config value. Think of it as a universal TV remote that works with any brand of TV. |
| **Why We Chose It** | Your manager specifically requested AI model switching capability. With LiteLLM, switching from Gemini to GPT-4o only requires changing `model: "gemini/gemini-flash"` to `model: "gpt-4o"`. No code rewrite needed. Also integrates natively with Langfuse for observability. |
| **Why Not Alternatives** | Without LiteLLM, switching AI models requires rewriting all integration code for each provider's unique API format. That's a lot of wasted work. |
| **Real-World Companies** | Used by startups and enterprises building AI products who want model flexibility (Zapier AI, Relevance AI) |
| **Libraries We Use** | `litellm` (Python package — this means our AI engine microservice will be Python, calling Gemini; the main backend remains Node.js) |
| **Programming Language** | Python (for the AI engine service) |

> ⚠️ **Note:** LiteLLM is a Python library. This means we'll have a small Python microservice (or use it via LiteLLM Proxy — a standalone server). The main backend stays Node.js. LiteLLM Proxy runs as a separate local service on EC2, and our Node.js backend calls it via HTTP.

---

### 🔹 OpenRouter

| Field | Details |
|---|---|
| **Category** | AI Model Gateway |
| **What It Is** | OpenRouter is an AI marketplace that gives you one API key and one billing account, but access to 100+ AI models: Gemini, GPT-4o, Claude, Mistral, Llama, and more. Think of it as a universal SIM card for AI — one account, all networks. |
| **Why We Chose It** | Instead of managing separate API keys and billing accounts for Google (Gemini), OpenAI, Anthropic, etc., we use one OpenRouter account. It also has a generous free tier for some models and lets us easily experiment with different models. |
| **Why Not Alternatives** | Going directly to Google's Gemini API is also fine but locks us to one provider. If Gemini has an outage or becomes expensive, we'd need to rewrite code. OpenRouter + LiteLLM gives us a future-proof setup. |
| **Real-World Companies** | Used by indie developers, startups, and AI tool builders who want model flexibility without multi-provider billing headaches |
| **Libraries We Use** | No special library needed — OpenRouter provides an OpenAI-compatible API. LiteLLM routes through it. |
| **Programming Language** | HTTP/REST API |

---

### 🔹 Langfuse

| Field | Details |
|---|---|
| **Category** | AI Observability & Monitoring |
| **What It Is** | Langfuse is a CCTV system for your AI application. Every time your app asks an AI model a question, Langfuse records: exactly what prompt was sent, what the AI responded, how long it took, and how much it cost. It provides a dashboard where you can browse all these "traces" and debug weird AI behavior. |
| **Why We Chose It** | Your manager specifically recommended this. If a user asks a question and gets a strange answer, you can look at the Langfuse dashboard, find that specific conversation, and see exactly what was sent to the AI and what came back. Essential for debugging and cost monitoring. |
| **Why Not Alternatives** | Helicone is similar but has a less polished free tier. LangSmith (by LangChain) is excellent but more complex to set up. Langfuse has a very generous free tier (50K traces/month) and integrates directly with LiteLLM with one line of config. |
| **Real-World Companies** | Used by AI-first companies and developers building LLM applications who need to debug and monitor AI behavior |
| **Libraries We Use** | Langfuse Cloud (free tier) — integrates automatically when used with LiteLLM via environment variables |
| **Programming Language** | No code needed — configure via environment variables |

---

### 🔹 AWS EC2

| Field | Details |
|---|---|
| **Category** | Backend Hosting |
| **What It Is** | EC2 (Elastic Compute Cloud) is like renting a computer from Amazon that runs 24/7 in a data center. You install your Node.js backend on it, and it's always running, ready to answer API requests. |
| **Why We Chose It** | You specified AWS deployment. EC2's free tier (t2.micro or t3.micro) gives us a free server for 12 months — more than enough for 5-10 users. It also gives us full control over the environment. |
| **Why Not Alternatives** | AWS Lambda (serverless) is cheaper at zero traffic but adds complexity for a long-running Node.js server and has cold start delays. Render/Railway are simpler PaaS platforms but you specifically asked for AWS. |
| **Real-World Companies** | Netflix, Airbnb, Dropbox, NASA all run on EC2 |
| **Libraries We Use** | N/A — EC2 is infrastructure, not a library |
| **Programming Language** | N/A |

---

### 🔹 AWS RDS (PostgreSQL)

| Field | Details |
|---|---|
| **Category** | Managed Database Hosting |
| **What It Is** | RDS (Relational Database Service) is Amazon's managed PostgreSQL service. Instead of setting up and maintaining a database server yourself (applying security patches, managing backups, handling crashes), Amazon does all that for you. You just connect to the database URL and use it. |
| **Why We Chose It** | AWS free tier gives us a free db.t3.micro instance with 20GB storage for 12 months. Automated daily backups are included. Perfect for our small project without any maintenance burden. |
| **Why Not Alternatives** | Self-hosting PostgreSQL on EC2 is possible but adds maintenance burden (you handle patches and backups). Supabase is an excellent alternative but you specified AWS. |
| **Real-World Companies** | Airbnb, Expedia, Samsung all use AWS RDS |
| **Libraries We Use** | N/A — RDS is infrastructure |
| **Programming Language** | N/A |

---

### 🔹 AWS S3

| Field | Details |
|---|---|
| **Category** | File Storage |
| **What It Is** | S3 (Simple Storage Service) is Amazon's cloud file storage. Think of it as a Google Drive for your app's files. You upload a file, and it gives you a permanent URL to access it. It's extremely cheap and reliable. |
| **Why We Chose It** | When a user uploads a `.txt` WhatsApp file, we store the raw file in S3. After parsing, the file stays in S3 as a backup. When the user deletes a session, we also delete from S3. Free tier includes 5GB storage + 20,000 GET requests/month — well within our needs. |
| **Why Not Alternatives** | Storing files directly on EC2 is risky (if the server is terminated, files are lost). S3 is persistent, infinitely scalable, and nearly free at our scale. |
| **Real-World Companies** | Netflix (stores all video), Airbnb (stores all photos), GitHub (stores all releases) |
| **Libraries We Use** | `@aws-sdk/client-s3` (AWS SDK v3 for Node.js) |
| **Programming Language** | JavaScript |

---

### 🔹 AWS Amplify (Frontend Hosting)

| Field | Details |
|---|---|
| **Category** | Frontend Hosting |
| **What It Is** | AWS Amplify is a service that hosts your React app (the built HTML/JS/CSS files) and serves it globally via Amazon's content delivery network (CDN). When you push code to GitHub, Amplify automatically rebuilds and redeploys your site. Think of it as GitHub Pages but on Amazon's super-fast global network. |
| **Why We Chose It** | Amplify's free tier includes 5GB storage, 15GB data transfer, and 1000 build minutes per month — more than enough. It connects directly to GitHub for auto-deploy on every push. |
| **Why Not Alternatives** | S3 + CloudFront is another AWS option (more manual setup but slightly more control). Vercel/Netlify are easier but you specified AWS. Amplify gives the best balance of ease + AWS ecosystem. |
| **Real-World Companies** | Thousands of companies hosting React/Next.js frontends on Amplify |
| **Libraries We Use** | N/A — Amplify is infrastructure (though `aws-amplify` JS SDK exists if needed later) |
| **Programming Language** | N/A |

---

<!-- END OF TECH STACK -->
