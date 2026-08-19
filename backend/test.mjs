import 'dotenv/config';
import { query } from './src/config/db.js';

const result = await query("SELECT data FROM analytics_cache WHERE cache_key='overview' ORDER BY computed_at DESC LIMIT 1");
console.log(result.rows[0]?.data);
process.exit(0);
