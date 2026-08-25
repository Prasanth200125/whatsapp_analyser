<div align="center">

# 📊 WhatsApp Chat Analyzer & AI Assistant 🤖

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Available-success?style=for-the-badge&logo=vercel)](https://whatsapp-analyzer-frontend.onrender.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![OpenRouter](https://img.shields.io/badge/OpenRouter-AI-purple?style=for-the-badge)](https://openrouter.ai/)

**A full-stack, secure web application to extract powerful analytics and AI-driven insights from your raw WhatsApp export files (`.txt`).**

[Live Demo](https://whatsapp-analyzer-frontend.onrender.com) • [Report Bug](https://github.com/Prasanth200125/whatsapp_analyser/issues) • [Request Feature](https://github.com/Prasanth200125/whatsapp_analyser/issues)

</div>

---

## 📖 About The Project

WhatsApp Analyzer transforms your plain, unstructured WhatsApp chat exports into rich, interactive dashboards and allows you to chat with your own data using AI. 

Have you ever wondered:
- *Who texts the most in the group?*
- *What time of day is everyone most active?*
- *What are our most used words and emojis?*
- *When did we first meet according to our chat?* (Ask the AI!)

This project solves this by combining a robust PostgreSQL backend for rule-based analytical queries with an AI-powered RAG (Retrieval-Augmented Generation) pipeline to answer complex natural-language questions about your conversations.

### ✨ Key Features

- **🔒 Private & Secure by Design**: Your data is parsed, stored securely in AWS S3 and PostgreSQL, and can be permanently deleted with a single click. No data is sent to AI models unless explicitly queried.
- **📈 Rule-Based Analytics**: Get instant overviews of your chats, including participant activity, response time averages, peak messaging hours, word frequency, and emoji usage.
- **🧠 AI-Powered Chat Q&A**: Ask direct questions (e.g., "Who apologizes more?") and the AI will analyze a contextual window of your chat using a built-in RAG pipeline.
- **💰 Free Open-Source Models**: Powered by OpenRouter, seamlessly switch between completely free LLM models (like Gemma, MiniMax, Nemotron Omni).
- **📱 Cross-Platform & Responsive**: Automatically detects and parses both iOS and Android WhatsApp export formats. The UI works flawlessly on both desktop and mobile.

---

## 🛠️ Tech Stack & Architecture

We carefully selected a modern, scalable, and secure tech stack.

### Frontend
* **[React (Vite)](https://vitejs.dev/)**: For a blazingly fast development experience and optimized production builds.
* **[Tailwind CSS](https://tailwindcss.com/)**: For rapid, utility-first styling without leaving the HTML.
* **[Recharts](https://recharts.org/)**: For rendering beautiful, responsive SVG charts (Timeline, Peak Hours, etc.).
* **[Lucide React](https://lucide.dev/)**: For crisp, consistent iconography.

### Backend
* **[Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)**: Fast, non-blocking I/O, perfect for handling file uploads and API requests.
* **[PostgreSQL](https://www.postgresql.org/) (AWS RDS)**: The core engine. Used for robust data integrity, relational mapping, and Full-Text Search.
* **[AWS S3](https://aws.amazon.com/s3/)**: For secure, scalable raw file storage.
* **[JWT](https://jwt.io/) & [bcrypt](https://www.npmjs.com/package/bcryptjs)**: For stateless, secure authentication and password hashing.

### AI & Observability
* **[OpenRouter API](https://openrouter.ai/)**: Acts as a gateway to multiple LLMs, providing a unified API for interacting with AI models.
* **[Langfuse v4 (OpenTelemetry)](https://langfuse.com/)**: Integrated for LLM observability via the new v4 `@langfuse/tracing` and `@langfuse/otel` packages, allowing us to trace AI calls, monitor token usage, and debug prompts securely.

---

## 🧠 How We Achieved This (The Technical Flow)

Building this required orchestrating several complex flows:

### 1. The Parsing Engine (ETL Pipeline)
When a user uploads a `.txt` file, the backend doesn't just store it. It runs a custom Regex-based parsing engine that:
1. Automatically detects the OS format (iOS vs Android timestamp formats).
2. Extracts the `timestamp`, `sender`, and `message body`.
3. Normalizes the data and streams it into PostgreSQL using parameterized batch inserts.

### 2. The Analytics Engine (SQL Aggregations)
Instead of processing analytics on the frontend (which would crash the browser for large chats), we leverage PostgreSQL. 
* We created specific **B-Tree Composite Indexes** (e.g., `session_id + sent_at`) to make queries lightning fast.
* Endpoints execute complex `GROUP BY` and date-math SQL queries to instantly calculate things like "Avg Response Time" or "Messages per Hour".

### 3. The AI RAG Pipeline (Retrieval-Augmented Generation)
We couldn't feed an entire 50,000-message chat into an LLM (it would exceed token limits and cost too much). Instead, we built a RAG pipeline:
1. **Search**: When you ask a question, we use PostgreSQL's `to_tsvector` and `to_tsquery` to perform a Full-Text Search across the chat history to find relevant "hits".
2. **Contextualize**: We fetch a window of +/- 125 messages around the hit to provide conversation context.
3. **Generate**: We inject this context into a strict system prompt and send it to the OpenRouter LLM to generate a factual answer based *only* on the provided chat history.

---

## 🚀 Getting Started (Local Development)

To run this project locally, follow these steps:

### Prerequisites
* Node.js (v18+)
* PostgreSQL Database (Local or AWS RDS)
* AWS Account (For S3)
* OpenRouter API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Prasanth200125/whatsapp_analyser.git
   cd whatsapp_analyser
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` folder. Reference `.env.example` or the `secrets_and_keys.md` file for required variables (DB URL, JWT Secret, AWS Keys, OpenRouter Key).
   ```bash
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` folder:
   ```env
   VITE_API_URL=http://localhost:5000
   ```
   ```bash
   npm run dev
   ```

4. **Open your browser:** Navigate to `http://localhost:5173`.

---

## 🔒 Security & Privacy

Privacy is paramount when dealing with personal chats.
* **Authentication**: Secured via industry-standard JWTs and `bcrypt` password hashing (12 salt rounds).
* **Isolation**: Strict Row-Level-Security-style checks in the backend ensure users can only ever access their own data (`WHERE user_id = $1`).
* **Rate Limiting**: API routes are rate-limited to prevent brute-force and DDoS attacks.
* **No AI Data Mining**: We use OpenRouter models that explicitly state they do not use API inputs for training.

---

<div align="center">
  <i>Built with ❤️ by Prasanth</i>
</div>
