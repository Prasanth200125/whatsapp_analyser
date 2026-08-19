// ============================================================
// index.js — Express App Entry Point
// ============================================================
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

import { testConnection } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { flushLangfuse } from './services/ai.service.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import sessionRoutes from './routes/session.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import chatRoutes from './routes/chat.routes.js';
import userRoutes from './routes/user.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// ── Security Middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.SITE_URL || 'http://localhost:5173',
  credentials: true,
}));

// ── Body Parsing ───────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Rate Limiting (global) ────────────────────────────────────
app.use(globalRateLimiter);

// ── Health Check ───────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/sessions', analyticsRoutes);
app.use('/api/sessions', chatRoutes);
app.use('/api/users', userRoutes);

// ── 404 & Error Handlers ──────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start Server ───────────────────────────────────────────────
async function start() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// ── Graceful Shutdown ──────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  await flushLangfuse();
  process.exit(0);
});

start();
