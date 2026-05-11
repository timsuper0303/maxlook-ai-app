// ═══════════════════════════════════════════════════════
// Gemini Client — Google Generative AI
// Model: gemini-2.0-flash (cheap & fast vision)
// Pricing: ~$0.075/1M input, $0.30/1M output (60% cheaper than gpt-4o-mini)
// ═══════════════════════════════════════════════════════

const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

let genAI = null;
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
  console.warn('[gemini] GEMINI_API_KEY belum di-set di .env');
}

/**
 * Run vision scan via Gemini.
 * @param {Object} params
 * @param {string} params.prompt - text prompt
 * @param {string} params.imageBase64 - base64-encoded image (without data: prefix)
 * @param {string} params.mimeType - 'image/jpeg' | 'image/png' | 'image/webp'
 * @returns {Promise<{text: string, usage: Object}>}
 */
async function visionScan({ prompt, imageBase64, mimeType = 'image/jpeg' }) {
  if (!genAI) {
    throw new Error('Gemini client not initialized. Set GEMINI_API_KEY in .env.');
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 16384,  // bumped — full JSON with 50+ concerns + zones + bone structure
      responseMimeType: 'application/json'
    }
  });

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType,
        data: imageBase64
      }
    }
  ]);

  const response = result.response;
  const text = response.text();
  const usage = {
    promptTokens: response.usageMetadata?.promptTokenCount || 0,
    completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
    totalTokens: response.usageMetadata?.totalTokenCount || 0
  };

  return { text, usage };
}

module.exports = {
  visionScan,
  isConfigured: () => !!genAI,
  modelName: GEMINI_MODEL
};
