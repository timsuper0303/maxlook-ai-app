// ═══════════════════════════════════════════════════════
// OpenAI Client wrapper (vision scan)
// Compatible signature dengan Gemini client untuk swap-able
// ═══════════════════════════════════════════════════════

const { OpenAI } = require('openai');

const OPENAI_API_KEY = process.env.KIE_API_KEY;
const OPENAI_BASE_URL = process.env.KIE_API_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.AI_VISION_MODEL || 'gpt-4o-mini';

let client = null;
if (OPENAI_API_KEY) {
  client = new OpenAI({
    apiKey: OPENAI_API_KEY,
    baseURL: OPENAI_BASE_URL
  });
}

async function visionScan({ prompt, imageBase64, mimeType = 'image/jpeg' }) {
  if (!client) {
    throw new Error('OpenAI client not initialized. Set KIE_API_KEY in .env.');
  }

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: { url: `data:${mimeType};base64,${imageBase64}` }
        }
      ]
    }],
    temperature: 0.4,
    max_tokens: 4096,
    response_format: OPENAI_MODEL.includes('claude') ? undefined : { type: 'json_object' }
  });

  return {
    text: completion.choices[0]?.message?.content || '',
    usage: {
      promptTokens: completion.usage?.prompt_tokens || 0,
      completionTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0
    }
  };
}

module.exports = {
  visionScan,
  isConfigured: () => !!client,
  modelName: OPENAI_MODEL
};
