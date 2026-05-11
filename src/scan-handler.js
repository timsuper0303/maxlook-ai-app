// ═══════════════════════════════════════════════════════
// Scan Handler — orchestrate AI face scan workflow
// 1. Read image, convert to base64
// 2. Call AI Vision (provider: gemini | openai)
// 3. Parse JSON output
// 4. Validate + enrich
// ═══════════════════════════════════════════════════════

const fs = require('fs');
const aiClient = require('./ai-clients');
const { buildFaceScanPrompt } = require('./prompts/face-scan-prompt');

async function runFullScan({ imagePath, gender, variant, userInfo = {}, priorContext = null }) {
  // Read image and convert to base64
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');
  const mimeType = imagePath.toLowerCase().endsWith('.png')
    ? 'image/png'
    : imagePath.toLowerCase().endsWith('.webp')
      ? 'image/webp'
      : 'image/jpeg';

  const wearsHijab = !!userInfo.wears_hijab;
  let prompt = buildFaceScanPrompt({ gender, variant, wearsHijab, priorContext });

  // Append user info to prompt if provided
  if (userInfo.age || userInfo.height_cm || userInfo.weight_kg || (userInfo.goals && userInfo.goals.length)) {
    prompt += `\n\n═══ USER INFO ═══\n`;
    if (userInfo.age) prompt += `Umur: ${userInfo.age} tahun\n`;
    if (userInfo.height_cm) prompt += `Tinggi: ${userInfo.height_cm} cm\n`;
    if (userInfo.weight_kg) prompt += `Berat: ${userInfo.weight_kg} kg\n`;
    if (userInfo.goals && userInfo.goals.length) prompt += `Goals user: ${userInfo.goals.join(', ')}\n`;
    prompt += `\nGunakan info ini untuk personalisasi analysis (e.g. aging detection sesuai umur, body proportion considerations, goals jadi priority).\n`;
  }

  const provider = aiClient.getActiveProvider();
  console.log(`[ai-scan] Provider: ${provider.name} (${provider.model})`);

  let response;
  try {
    response = await aiClient.visionScan({
      prompt,
      imageBase64: base64Image,
      mimeType
    });
  } catch (err) {
    console.error('[ai-scan] AI API Error:', {
      provider: provider.name,
      model: provider.model,
      message: err.message,
      status: err.status,
      code: err.code
    });

    // User-friendly error messages
    if (err.status === 404 || err.message?.includes('not found')) {
      throw new Error(`Model "${provider.model}" gak ditemukan. Cek .env file.`);
    }
    if (err.status === 401 || err.status === 403 || err.message?.includes('API key')) {
      throw new Error('API key invalid/expired. Cek .env file (GEMINI_API_KEY atau KIE_API_KEY).');
    }
    if (err.status === 429 || err.message?.includes('rate')) {
      throw new Error('AI rate limit. Tunggu 1 menit, coba scan lagi.');
    }
    if (err.status === 500 || err.status === 502 || err.status === 503) {
      throw new Error('AI service lagi down. Coba lagi 5 menit.');
    }
    throw new Error(`AI scan gagal: ${err.message}`);
  }

  const rawText = response.text || '';
  console.log(`[ai-scan] Response: ${rawText.length} chars, ${response.usage?.totalTokens || '?'} tokens`);

  if (!rawText.trim()) {
    throw new Error('AI response kosong. Coba upload foto yang lebih clear.');
  }

  // Parse JSON with multi-stage repair
  let result;
  result = tryParseJson(rawText);
  if (!result) {
    console.error('[ai-scan] Could not parse AI response. First 1000 chars:', rawText.slice(0, 1000));
    console.error('[ai-scan] Last 500 chars:', rawText.slice(-500));
    throw new Error('AI response gak valid JSON. Coba scan ulang.');
  }

  // Validate & enrich (with priorContext for progression floor)
  result = validateAndEnrich(result, { gender, priorContext });

  // Attach metadata + persist user-info flags relevant to facecard
  result._meta = {
    provider: provider.name,
    model: provider.model,
    tokens: response.usage?.totalTokens || 0
  };
  result.wears_hijab = wearsHijab;
  result.user_info = {
    age: userInfo.age,
    height_cm: userInfo.height_cm,
    weight_kg: userInfo.weight_kg,
    wears_hijab: wearsHijab,
    goals: userInfo.goals || []
  };

  return result;
}

function validateAndEnrich(result, { gender, priorContext = null }) {
  // Core scores
  result.overall = clamp(result.overall || 60, 0, 100);

  // PROGRESSION FLOOR — bila ada scan sebelumnya, skor jangan turun lebih dari 2 poin
  // (allowance 2 poin untuk AI variance, tapi cap regression hard)
  if (priorContext && priorContext.previous_overall) {
    const minAllowed = Math.max(0, priorContext.previous_overall - 2);
    if (result.overall < minAllowed) {
      console.log(`[scan] Progression floor: ${result.overall} → ${minAllowed} (prev was ${priorContext.previous_overall})`);
      result.overall = minAllowed;
    }
  }

  // POTENTIAL — floor 80 (motivasi user) + minimal +15 dari current
  // Cap 98 (selalu ada room buat tumbuh)
  const aiPotential = result.potential || (result.overall + 20);
  result.potential = clamp(
    Math.max(80, result.overall + 15, aiPotential),
    result.overall,
    98
  );

  result.scores = result.scores || {};
  ['skin_glow', 'symmetry', 'jawline', 'eye_area', 'harmony'].forEach(k => {
    result.scores[k] = clamp(result.scores[k] || result.overall, 0, 100);
  });

  result.skin_type = result.skin_type || 'combination';
  result.undertone = result.undertone || 'neutral';
  result.season = result.season || (gender === 'woman' ? 'Soft Summer' : 'Soft Autumn');

  result.color_palette = result.color_palette || [];
  result.colors_to_avoid = result.colors_to_avoid || [];
  result.improvements = result.improvements || [];
  result.outfit_ideas = result.outfit_ideas || [];

  if (!result.skincare_routine) {
    result.skincare_routine = { am: [], pm: [], products: [] };
  }

  // Lemon8-mode classifications — remap flat slim schema to nested structure for backward compat
  result.lemon8_analysis = result.lemon8_analysis || {
    face_shape_label: result.face_shape || 'Oval',
    facial_proportion_label: result.proportion || 'Standard',
    eye_shape_label: result.eye_shape || 'Almond',
    eyebrow_shape_label: result.eyebrow_shape || 'Straight',
    nose_size_label: result.nose_size || 'Medium',
    lip_shape_label: result.lip_shape || 'Medium',
    golden_angle_degrees: result.golden_angle || 60,
    eyebrow_arch_angle: 12,
    eye_corner_angle: 5,
    masculinity_score: result.masculinity_score || result.harmony || result.overall,
    femininity_score: result.femininity_score || result.harmony || result.overall,
    cheekbones_score: result.cheekbones_score || result.harmony || result.overall
  };

  // Zone defaults (untuk fallback kalau AI gak return)
  result.zones = result.zones || generateDefaultZones();

  // Photo quality (default: assume OK)
  result.photo_quality = result.photo_quality || {
    overall_quality: 'good',
    lighting: 'good',
    sharpness: 'sharp',
    angle: 'frontal',
    face_visibility: 'full',
    should_retake: false,
    retake_reason: '',
    tips_to_improve: []
  };

  // Bone structure — remap from slim schema for backward compat
  result.bone_structure = result.bone_structure || {
    phi_ratio_face: 1.5,
    phi_ratio_eye: 1.5,
    phi_ratio_nose: 1.5,
    phi_ratio_lip: 1.5,
    facial_harmony_score: result.cheekbones_score || result.harmony || result.overall,
    feature_balance: 'balanced',
    structural_strengths: [],
    structural_improvement_areas: []
  };

  // Top concerns — slim schema sudah ada di root, ensure array
  if (Array.isArray(result.top_concerns)) {
    // Add coords_normalized fallback if missing (some animations need it)
    result.top_concerns = result.top_concerns.map((c, i) => ({
      ...c,
      coords_normalized: c.coords_normalized || generateDefaultConcernCoords(i),
      rank: c.rank || i + 1
    }));
  } else {
    result.top_concerns = [];
  }

  result.key_insight = result.key_insight || 'Scan ulang seminggu lagi untuk track progress.';
  result.encouragement = result.encouragement || (gender === 'woman'
    ? 'Glow up kamu udah dimulai. Konsisten 30 hari, hasilnya nyata. 💖'
    : 'Lo udah on track. Eksekusi 30 hari konsisten, skor naik signifikan.');

  result.scanned_at = new Date().toISOString();
  return result;
}

function generateDefaultConcernCoords(idx) {
  // Spread default concern positions around face zones
  const positions = [
    { x: 0.36, y: 0.40 },  // left eye area
    { x: 0.64, y: 0.40 },  // right eye area
    { x: 0.50, y: 0.30 },  // forehead
    { x: 0.50, y: 0.55 },  // nose
    { x: 0.50, y: 0.78 },  // lips
    { x: 0.32, y: 0.72 },  // left jaw
    { x: 0.68, y: 0.72 }   // right jaw
  ];
  return positions[idx % positions.length];
}

function generateDefaultZones() {
  // Fallback zones — typical face composition
  return {
    full_face:   { x: 0.50, y: 0.50, width: 0.65, height: 0.85 },
    forehead:    { x: 0.50, y: 0.22, width: 0.50, height: 0.15 },
    left_brow:   { x: 0.36, y: 0.34, width: 0.16, height: 0.04 },
    right_brow:  { x: 0.64, y: 0.34, width: 0.16, height: 0.04 },
    left_eye:    { x: 0.36, y: 0.40, width: 0.14, height: 0.06 },
    right_eye:   { x: 0.64, y: 0.40, width: 0.14, height: 0.06 },
    nose:        { x: 0.50, y: 0.55, width: 0.18, height: 0.20 },
    left_cheek:  { x: 0.30, y: 0.55, width: 0.18, height: 0.18 },
    right_cheek: { x: 0.70, y: 0.55, width: 0.18, height: 0.18 },
    lips:        { x: 0.50, y: 0.76, width: 0.22, height: 0.06 },
    chin:        { x: 0.50, y: 0.88, width: 0.30, height: 0.10 },
    jawline:     { x: 0.50, y: 0.80, width: 0.55, height: 0.20 }
  };
}

function clamp(n, min, max) {
  n = parseFloat(n);
  if (isNaN(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

/**
 * Multi-stage JSON parser dengan repair logic.
 * Tries:
 *   1. Direct JSON.parse
 *   2. Strip markdown code fence (```json ... ```)
 *   3. Extract first {...} block
 *   4. Repair common errors: trailing commas, unescaped newlines in strings,
 *      truncated JSON (add missing closing braces)
 * Returns parsed object or null if all attempts fail.
 */
function tryParseJson(text) {
  if (!text || typeof text !== 'string') return null;

  // Attempt 1: direct parse
  try { return JSON.parse(text); } catch (e) {}

  // Attempt 2: extract from markdown code fence
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1]); } catch (e) {}
    try { return JSON.parse(repairJson(fenceMatch[1])); } catch (e) {}
  }

  // Attempt 3: extract first {...} block
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch (e) {}
    try { return JSON.parse(repairJson(objMatch[0])); } catch (e) {}
  }

  // Attempt 4: repair raw text
  try { return JSON.parse(repairJson(text)); } catch (e) {}

  return null;
}

/**
 * Repair common JSON malformations:
 * - Remove trailing commas in arrays/objects
 * - Add missing closing braces/brackets (for truncated output)
 * - Strip control chars in strings
 */
function repairJson(s) {
  if (!s) return '{}';

  // Strip BOM, leading/trailing whitespace
  s = s.replace(/^﻿/, '').trim();

  // Remove trailing commas before } or ]
  s = s.replace(/,(\s*[}\]])/g, '$1');

  // Remove control characters inside strings (keep \n, \r, \t escaped)
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

  // Count braces and brackets — auto-close if truncated
  const openBrace = (s.match(/\{/g) || []).length;
  const closeBrace = (s.match(/\}/g) || []).length;
  const openBracket = (s.match(/\[/g) || []).length;
  const closeBracket = (s.match(/\]/g) || []).length;

  if (openBracket > closeBracket) {
    s += ']'.repeat(openBracket - closeBracket);
  }
  if (openBrace > closeBrace) {
    s += '}'.repeat(openBrace - closeBrace);
  }

  return s;
}

module.exports = { runFullScan };
