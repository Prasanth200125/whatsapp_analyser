/**
 * test-langfuse.mjs
 * Quick connectivity test — verifies Langfuse and OpenRouter keys work.
 * Run with: node test-langfuse.mjs
 * Delete this file after confirming everything works.
 */

import 'dotenv/config';
import OpenAI from 'openai';
import { observeOpenAI } from '@langfuse/openai';
import { Langfuse } from 'langfuse';

console.log('🔍 Testing Langfuse + OpenRouter connection...\n');

// Verify env vars are loaded
const requiredVars = [
  'OPENROUTER_API_KEY',
  'LANGFUSE_SECRET_KEY',
  'LANGFUSE_PUBLIC_KEY',
  'LANGFUSE_BASE_URL',
];

let missing = false;
for (const key of requiredVars) {
  if (!process.env[key]) {
    console.error(`❌ Missing env var: ${key}`);
    missing = true;
  } else {
    console.log(`✅ ${key} is set`);
  }
}

if (missing) {
  console.error('\n⛔ Fix missing env vars before proceeding.');
  process.exit(1);
}

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL,
  flushAt: 1,
});

const baseOpenAI = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://whatsapp-analyzer.app',
    'X-Title': 'WhatsApp Chat Analyzer',
  },
});

try {
  console.log('\n🤖 Sending test request via OpenRouter → Gemini Flash...');

  const trace = langfuse.trace({
    name: 'test-connection',
    input: 'Connection test',
    metadata: { test: true },
    tags: ['test'],
  });

  const tracedClient = observeOpenAI(baseOpenAI, {
    parent: trace,
    generationName: 'test-generation',
  });

  const response = await tracedClient.chat.completions.create({
    model: 'google/gemini-2.5-flash',
    messages: [
      { role: 'user', content: 'Reply with exactly: "WhatsApp Analyzer is connected!"' },
    ],
    max_tokens: 50,
  });

  const answer = response.choices[0]?.message?.content;
  console.log(`\n✅ AI Response: "${answer}"`);

  trace.update({ output: answer });

  await langfuse.flushAsync();
  console.log('\n✅ Langfuse trace flushed successfully!');
  console.log('   → Go to https://us.cloud.langfuse.com to see the trace.');
  console.log('\n🎉 All connections working! You can delete this test file now.\n');

} catch (error) {
  console.error('\n❌ Connection test failed:', error.message);
  console.error('   Check that your API keys are valid and not expired.');
  process.exit(1);
}
