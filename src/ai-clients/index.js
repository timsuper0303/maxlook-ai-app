// ═══════════════════════════════════════════════════════
// AI Clients Abstraction Layer
// Pick provider based on AI_PROVIDER env var (default: gemini)
// Supports: gemini | openai
// ═══════════════════════════════════════════════════════

const gemini = require('./gemini-client');
const openai = require('./openai-client');

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase();

const PROVIDERS = {
  gemini,
  openai
};

function getClient() {
  const client = PROVIDERS[PROVIDER];
  if (!client) {
    throw new Error(`Unknown AI_PROVIDER "${PROVIDER}". Use: gemini | openai`);
  }
  if (!client.isConfigured()) {
    // Try fallback to other configured provider
    for (const [name, c] of Object.entries(PROVIDERS)) {
      if (c.isConfigured()) {
        console.warn(`[ai-clients] ${PROVIDER} not configured, fallback to ${name}`);
        return c;
      }
    }
    throw new Error(`No AI provider configured. Set GEMINI_API_KEY or KIE_API_KEY in .env.`);
  }
  return client;
}

async function visionScan(params) {
  const client = getClient();
  console.log(`[ai-clients] Using ${PROVIDER} (model: ${client.modelName})`);
  return client.visionScan(params);
}

function getActiveProvider() {
  const client = getClient();
  return {
    name: PROVIDERS.gemini === client ? 'gemini' : 'openai',
    model: client.modelName
  };
}

module.exports = {
  visionScan,
  getActiveProvider,
  isConfigured: () => Object.values(PROVIDERS).some(c => c.isConfigured())
};
