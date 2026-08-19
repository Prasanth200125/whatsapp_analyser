// Quick diagnostic — runs the parse+insert for a stuck session
import 'dotenv/config';
import { query, withTransaction } from './src/config/db.js';
import { parseWhatsAppFile } from './src/services/parser.service.js';
import { uploadToS3 } from './src/services/s3.service.js';
import { readFileSync } from 'fs';
import { join } from 'path';

// ── Step 1: List all sessions
const sessions = await query("SELECT id, name, parse_status FROM sessions ORDER BY created_at DESC");
console.log('\n📋 All sessions:');
sessions.rows.forEach(s => console.log(`  [${s.parse_status}] ${s.name}  id: ${s.id}`));

if (sessions.rows.length === 0) {
  console.log('No sessions found.');
  process.exit(0);
}

// ── Step 2: Pick the first "parsing" session
const stuck = sessions.rows.find(s => s.parse_status === 'parsing');
if (!stuck) {
  console.log('\nNo stuck sessions. All good!');
  process.exit(0);
}

console.log(`\n🔧 Attempting to diagnose session: ${stuck.id}`);

// ── Step 3: Try to get the file from S3
const { s3_file_key, user_id } = (await query('SELECT s3_file_key, user_id FROM sessions WHERE id=$1', [stuck.id])).rows[0];
console.log(`📁 S3 key: ${s3_file_key}`);

// We can't easily download from S3 without extra setup, so let's try importing
// the parse service directly and see what error it throws with test data
console.log('\n🧪 Testing parser with dummy data...');
try {
  const testText = `18/08/2024, 10:00 - Alice: Hello
18/08/2024, 10:01 - Bob: Hi there!
18/08/2024, 10:02 - Alice: How are you?`;
  
  const result = parseWhatsAppFile(testText);
  console.log(`✅ Parser works: ${result.messages.length} messages parsed`);
} catch (err) {
  console.error('❌ Parser threw an error:', err);
}

// ── Step 4: Test DB write
console.log('\n🧪 Testing DB transaction...');
try {
  await withTransaction(async (client) => {
    await client.query('SELECT 1');
    console.log('✅ DB transaction works');
    throw new Error('ROLLBACK_TEST'); // intentional rollback
  });
} catch(err) {
  if (err.message === 'ROLLBACK_TEST') {
    console.log('✅ Transaction rollback works correctly');
  } else {
    console.error('❌ DB transaction error:', err.message);
  }
}

// ── Step 5: Check if withTransaction is exported properly
console.log('\n🧪 withTransaction type:', typeof withTransaction);

// ── Step 6: Check participants table schema
console.log('\n📊 Checking messages table columns...');
const cols = await query(`
  SELECT column_name, data_type 
  FROM information_schema.columns 
  WHERE table_name = 'messages' 
  ORDER BY ordinal_position
`);
console.log(cols.rows.map(c => `  ${c.column_name}: ${c.data_type}`).join('\n'));

process.exit(0);
