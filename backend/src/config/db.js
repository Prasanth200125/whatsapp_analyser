// ============================================================
// db.js — PostgreSQL Connection Pool
// ============================================================
import pg from 'pg';

const { Pool } = pg;

// Connection pool — reuses connections efficiently
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,              // Max 10 simultaneous connections (fine for our scale)
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // AWS RDS requires SSL — rejectUnauthorized: false accepts the RDS
  // self-signed certificate (standard for private apps on RDS)
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('💥 Unexpected PostgreSQL pool error:', err.message);
});

/**
 * Run a single query.
 * @param {string} text - SQL string
 * @param {Array}  params - Query parameters
 */
export async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🗄️  Query (${duration}ms):`, text.slice(0, 80));
    }
    return res;
  } catch (error) {
    console.error('❌ DB Query Error:', error.message, '\nSQL:', text);
    throw error;
  }
}

/**
 * Get a client for transactions (must be released after use).
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Run a function inside a transaction.
 * Automatically commits on success, rolls back on error.
 *
 * @param {Function} fn - async function that receives (client)
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Test the database connection on startup.
 */
export async function testConnection() {
  try {
    const res = await pool.query('SELECT NOW() as now');
    console.log(`✅ PostgreSQL connected. Server time: ${res.rows[0].now}`);
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error.message);
    console.error('   Check your DATABASE_URL in .env');
    throw error;
  }
}

export default pool;
