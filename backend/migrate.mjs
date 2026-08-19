// ============================================================
// migrate.mjs — One-time database migration script
// ============================================================
// Run: node migrate.mjs
//
// This script connects to your PostgreSQL database using DATABASE_URL
// from .env and creates all 7 tables in the correct order.
// It is SAFE to run multiple times — uses IF NOT EXISTS everywhere.
// ============================================================
import 'dotenv/config';
import pg from 'pg';

const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 10000,
  ssl: {
    // AWS RDS requires SSL. rejectUnauthorized: false accepts the
    // self-signed RDS cert — fine for our private app.
    rejectUnauthorized: false,
  },
});

const migration = `
-- ============================================================
-- WhatsApp Analyzer — Full Database Migration
-- Safe to run multiple times (IF NOT EXISTS everywhere)
-- ============================================================

-- Enable UUID generation (built-in on PostgreSQL 13+)
-- gen_random_uuid() is built-in — no extension needed.

-- ── 1. users ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    name              VARCHAR(255) NOT NULL DEFAULT 'User',
    preferred_model   VARCHAR(100) NOT NULL DEFAULT 'gemini/gemini-flash',
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_login_at     TIMESTAMPTZ
);

-- ── 2. sessions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name              VARCHAR(255) NOT NULL,
    s3_file_key       VARCHAR(500),
    parse_status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                          CHECK (parse_status IN ('pending','parsing','completed','failed','empty')),
    message_count     INTEGER      NOT NULL DEFAULT 0,
    participant_count INTEGER      NOT NULL DEFAULT 0,
    skipped_lines     INTEGER      NOT NULL DEFAULT 0,
    first_message_at  TIMESTAMPTZ,
    last_message_at   TIMESTAMPTZ,
    parsed_at         TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id     ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_parse_status ON sessions(parse_status);

-- ── 3. messages ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
    id             BIGSERIAL    PRIMARY KEY,
    session_id     UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    sender_name    VARCHAR(255) NOT NULL,
    message_text   TEXT,
    message_type   VARCHAR(20)  NOT NULL DEFAULT 'text'
                       CHECK (message_type IN ('text','media','link','system','deleted')),
    sent_at        TIMESTAMPTZ  NOT NULL,
    character_count INTEGER     NOT NULL DEFAULT 0,
    word_count     INTEGER      NOT NULL DEFAULT 0,
    has_emoji      BOOLEAN      NOT NULL DEFAULT false,
    has_link       BOOLEAN      NOT NULL DEFAULT false,
    is_media       BOOLEAN      NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_messages_session_id       ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_sent_at  ON messages(session_id, sent_at);
CREATE INDEX IF NOT EXISTS idx_messages_session_sender   ON messages(session_id, sender_name);
CREATE INDEX IF NOT EXISTS idx_messages_session_type     ON messages(session_id, message_type);

-- ── 4. participants ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS participants (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id       UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    message_count    INTEGER      NOT NULL DEFAULT 0,
    total_words      INTEGER      NOT NULL DEFAULT 0,
    first_message_at TIMESTAMPTZ,
    last_message_at  TIMESTAMPTZ,
    UNIQUE(session_id, name)
);

CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);

-- ── 5. analytics_cache ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analytics_cache (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id  UUID         NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    cache_key   VARCHAR(100) NOT NULL,
    data        JSONB        NOT NULL,
    computed_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE(session_id, cache_key)
);

CREATE INDEX IF NOT EXISTS idx_analytics_cache_session_id ON analytics_cache(session_id);

-- ── 6. chat_history ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_history (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id   UUID        NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    user_id      UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    question     TEXT        NOT NULL,
    answer       TEXT        NOT NULL,
    engine_used  VARCHAR(20) NOT NULL CHECK (engine_used IN ('rule_based', 'ai')),
    ai_model     VARCHAR(100),
    latency_ms   INTEGER,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id    ON chat_history(user_id);

-- ── 7. rate_limit_log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limit_log (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address   VARCHAR(45)  NOT NULL,
    attempt_type VARCHAR(50)  NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_log(ip_address, created_at);
`;

async function runMigration() {
  console.log('🔄 Connecting to PostgreSQL...');
  console.log(`   Host: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'unknown'}`);

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🔄 Running migration...\n');
    await client.query(migration);

    // Verify all tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('✅ Migration complete! Tables in database:');
    result.rows.forEach(row => console.log(`   📋 ${row.table_name}`));

    // Quick sanity check — count expected tables
    const expectedTables = ['analytics_cache','chat_history','messages','participants','rate_limit_log','sessions','users'];
    const foundTables = result.rows.map(r => r.table_name);
    const missing = expectedTables.filter(t => !foundTables.includes(t));

    if (missing.length === 0) {
      console.log('\n🎉 All 7 tables created successfully! Database is ready.');
    } else {
      console.warn('\n⚠️  Missing tables:', missing.join(', '));
    }

  } catch (err) {
    console.error('\n❌ Migration failed!');
    console.error('   Error:', err.message);

    if (err.message.includes('ECONNREFUSED') || err.message.includes('connect')) {
      console.error('\n💡 Possible reasons:');
      console.error('   1. RDS "Publicly Accessible" is still set to NO');
      console.error('   2. Security Group does not allow your IP on port 5432');
      console.error('   3. DATABASE_URL in .env is incorrect (wrong password or host)');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
