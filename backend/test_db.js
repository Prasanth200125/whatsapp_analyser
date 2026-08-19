import { query } from './src/config/db.js';
async function test() {
  const res = await query("SELECT data FROM analytics_cache WHERE cache_key = 'overview'");
  console.log(res.rows);
  process.exit();
}
test();
