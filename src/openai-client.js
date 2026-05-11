// ═══════════════════════════════════════════════════════
// OpenAI Client — pakai KIE.ai sebagai proxy (OpenAI-compatible)
// Endpoint: https://api.kie.ai/v1
// Compatible dengan OpenAI SDK official
// ═══════════════════════════════════════════════════════

const { OpenAI } = require('openai');

const apiKey = process.env.KIE_API_KEY;
const baseURL = process.env.KIE_API_BASE_URL || 'https://api.kie.ai/v1';

if (!apiKey) {
  console.warn('⚠️  KIE_API_KEY belum di-set di .env. AI scanner ngga bakal jalan.');
}

const client = new OpenAI({
  apiKey: apiKey || 'placeholder',
  baseURL
});

module.exports = client;
