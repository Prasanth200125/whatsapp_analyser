import 'dotenv/config';
import { query } from './src/config/db.js';

async function addIndex() {
  console.log('Adding index on messages(session_id)...');
  await query(`
    CREATE INDEX IF NOT EXISTS idx_messages_session_id 
    ON messages (session_id);
  `);
  console.log('✅ Index added successfully.');
  process.exit(0);
}

addIndex().catch(err => {
  console.error('Error adding index:', err);
  process.exit(1);
});
