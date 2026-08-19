import OpenAI from 'openai';

const baseOpenAI = new OpenAI({
  apiKey: "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",
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://whatsapp-analyzer.app',
    'X-Title': 'WhatsApp Chat Analyzer',
  },
});

async function main() {
  try {
    const completion = await baseOpenAI.chat.completions.create({
      model: 'gemini/gemini-flash',
      messages: [{ role: 'user', content: 'test' }],
      max_tokens: 1024,
    });
    console.log(completion.choices[0].message.content);
  } catch (err) {
    console.error("ERROR:", err.message, err.response?.data);
  }
}

main();
