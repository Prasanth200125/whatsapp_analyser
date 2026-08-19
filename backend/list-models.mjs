import 'dotenv/config';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

const res = await client.models.list();
const gemini = res.data.filter(m => m.id.toLowerCase().includes('gemini'));
console.log('Available Gemini models on OpenRouter:');
console.log(gemini.map(m => m.id).join('\n'));
