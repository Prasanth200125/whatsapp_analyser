import 'dotenv/config';
import { query } from './src/config/db.js';

const result = await query(
  "UPDATE sessions SET parse_status = 'failed', parsed_at = NOW() WHERE parse_status = 'parsing'"
);
console.log(`✅ Reset ${result.rowCount} stuck session(s) from 'parsing' → 'failed'`);

const all = await query("SELECT id, name, parse_status FROM sessions ORDER BY created_at DESC");
console.log('\nAll sessions:');
all.rows.forEach(s => console.log(`  ${s.parse_status.padEnd(12)} ${s.name} (${s.id})`));

process.exit(0);
