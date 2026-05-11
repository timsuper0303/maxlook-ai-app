// ═══════════════════════════════════════════════════════
// Token Generator — MAX-XXXX-XXXX-XXXX format
// 12 random chars (no ambiguous: O, 0, I, 1, L) split jadi 3 grup of 4
// Plus prefix "MAX-" → total 16 chars + 3 dashes = 19 chars
// Total entropy: 32^12 = 1.15 quintillion combinations (collision-safe)
// ═══════════════════════════════════════════════════════

const { customAlphabet } = require('nanoid');

// 32 char alphabet — no ambiguous chars (O, 0, I, 1, L removed)
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const generate4 = customAlphabet(ALPHABET, 4);

function generateToken(prefix = 'MAX') {
  return `${prefix}-${generate4()}-${generate4()}-${generate4()}`;
}

// Validate format: PREFIX-XXXX-XXXX-XXXX
function isValidTokenFormat(token, prefix = 'MAX') {
  if (!token || typeof token !== 'string') return false;
  const re = new RegExp(`^${prefix}-[${ALPHABET}]{4}-[${ALPHABET}]{4}-[${ALPHABET}]{4}$`);
  return re.test(token);
}

module.exports = { generateToken, isValidTokenFormat, ALPHABET };
