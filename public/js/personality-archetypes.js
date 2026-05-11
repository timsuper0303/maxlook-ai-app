/* ═══════════════════════════════════════════════════════
   Maxlook Personality Archetypes — 12 Combos for Indonesia
   Map 6 facial traits → personality archetype + description
   ═══════════════════════════════════════════════════════ */

const ARCHETYPES = {
  // ── WOMAN ARCHETYPES ──────────────────────────────────
  sweet_pearl: {
    name: 'Sweet Pearl',
    gender: 'woman',
    population_pct: 12.56,
    description: 'Wajah Sweet Pearl punya garis lembut yang flowing dan rounded — bikin kesan cute, innocent, dan approachable. Makeup style yang cocok: gentle, dewy, dan delicate. Hindari look yang terlalu sharp/dramatic karena kurang harmonis dengan natural softness wajahmu.',
    style_tip: 'Glow-skin foundation + soft blush peach + nude lip gloss',
    celebrity_match: ['Tasya Kamila', 'Mawar Eva', 'Anya Geraldine'],
    traits: { face_shape: 'Oval', eye_shape: 'Monolid', brow_shape: 'Arched', nose_size: 'Small', lip_shape: 'Full', proportion: 'Standard' }
  },
  doll_aesthetic: {
    name: 'Doll Aesthetic',
    gender: 'woman',
    population_pct: 8.32,
    description: 'Doll Aesthetic — kombinasi rounded soft features dengan eye yang fuller bikin look ageless dan fresh kayak baby doll. Aura innocent tapi captivating.',
    style_tip: 'Pink-tone makeup + circle lens + glossy lip + soft pink blush',
    celebrity_match: ['Fuji An', 'Aaliyah Massaid', 'Beby Tsabina'],
    traits: { face_shape: 'Round', eye_shape: 'Hooded', brow_shape: 'Rounded', nose_size: 'Small', lip_shape: 'Full', proportion: 'Standard' }
  },
  soft_editorial: {
    name: 'Soft Editorial',
    gender: 'woman',
    population_pct: 18.41,
    description: 'Soft Editorial wajah dengan harmony yang balanced — versatile banget, bisa go from natural daily look ke high-fashion editorial. Beautiful in any style.',
    style_tip: 'Skin tint + bushy brow + nude blush + matte berry lip — adaptable untuk semua occasion',
    celebrity_match: ['Yura Yunita', 'Pevita Pearce', 'Raisa'],
    traits: { face_shape: 'Heart', eye_shape: 'Almond', brow_shape: 'S-shape', nose_size: 'Medium', lip_shape: 'Medium', proportion: 'Standard' }
  },
  k_drama_lead: {
    name: 'K-Drama Lead',
    gender: 'woman',
    population_pct: 10.74,
    description: 'K-Drama Lead — fitur yang elegant, bersih, dan natural-glowy. Cocok dengan minimalist Korean beauty aesthetic. Look angelic tanpa banyak makeup.',
    style_tip: 'Glass skin + straight brow + gradient lip + light contour',
    celebrity_match: ['Cinta Laura', 'Tatjana Saphira', 'Adhisty Zara'],
    traits: { face_shape: 'Oval', eye_shape: 'Almond', brow_shape: 'Straight', nose_size: 'Medium', lip_shape: 'Medium', proportion: 'Standard' }
  },
  kpop_idol: {
    name: 'Kpop Idol',
    gender: 'woman',
    population_pct: 7.18,
    description: 'Kpop Idol — kombinasi striking dari heart-shaped face, eye yang captivating, dan lip yang full. Photogenic banget di every angle. Stage-ready features.',
    style_tip: 'Sharp brow + dramatic eyeliner + matte vibrant lip + strong contour',
    celebrity_match: ['Lyodra Ginting', 'Tiara Andini', 'Mahalini'],
    traits: { face_shape: 'Heart', eye_shape: 'Hooded', brow_shape: 'Arched', nose_size: 'Small', lip_shape: 'Full', proportion: 'Standard' }
  },
  modern_empress: {
    name: 'Modern Empress',
    gender: 'woman',
    population_pct: 5.92,
    description: 'Modern Empress — wajah dengan cheekbone tinggi dan struktur yang prominent. Aura confident, powerful, dan timeless beauty. Underdog-favorite face type.',
    style_tip: 'Defined contour + sharp brow + matte foundation + bold red/burgundy lip',
    celebrity_match: ['Dian Sastrowardoyo', 'Bunga Citra Lestari', 'Luna Maya'],
    traits: { face_shape: 'Diamond', eye_shape: 'Almond', brow_shape: 'Arched', nose_size: 'Medium', lip_shape: 'Medium', proportion: 'Standard' }
  },

  // ── MAN ARCHETYPES ────────────────────────────────────
  cool_boy: {
    name: 'Cool Boy',
    gender: 'man',
    population_pct: 14.83,
    description: 'Cool Boy — square-ish jaw + hooded eye + relaxed feature bikin look effortlessly chill. Aura cool tanpa try too hard.',
    style_tip: 'Skin care: minimal but consistent. Hairstyle: textured crop atau messy fringe. Avoid over-styling.',
    celebrity_match: ['Iqbaal Ramadhan', 'Jefri Nichol', 'Angga Yunanda'],
    traits: { face_shape: 'Square', eye_shape: 'Hooded', brow_shape: 'Straight', nose_size: 'Medium', lip_shape: 'Thin', proportion: 'Standard' }
  },
  sharp_edge: {
    name: 'Sharp Edge',
    gender: 'man',
    population_pct: 9.21,
    description: 'Sharp Edge — diamond face dengan high cheekbones + sharp jaw, look magnetic dan striking. Aura mature confident dengan mystery factor.',
    style_tip: 'Defined skincare routine, slick-back atau side-part hair, fitted minimalist clothing untuk highlight angles',
    celebrity_match: ['Reza Rahadian', 'Nicholas Saputra', 'Joe Taslim'],
    traits: { face_shape: 'Diamond', eye_shape: 'Almond', brow_shape: 'Arched', nose_size: 'Medium', lip_shape: 'Medium', proportion: 'Standard' }
  },
  soft_visual: {
    name: 'Soft Visual',
    gender: 'man',
    population_pct: 11.46,
    description: 'Soft Visual — oval face dengan softer features, K-drama main lead vibe. Approachable, charismatic, photogenic. Versatile bisa cute atau mature look.',
    style_tip: 'Glass skin routine + clean grooming + bushy brow + middle-part atau curtain hair',
    celebrity_match: ['Rizky Nazar', 'Maxime Bouttier', 'Junior Roberts'],
    traits: { face_shape: 'Oval', eye_shape: 'Hooded', brow_shape: 'Rounded', nose_size: 'Medium', lip_shape: 'Full', proportion: 'Standard' }
  },
  k_actor: {
    name: 'K-Actor',
    gender: 'man',
    population_pct: 13.05,
    description: 'K-Actor — clean-cut handsome dengan harmony yang balanced. Mature, refined, ageless. Gentleman-style face yang aging well.',
    style_tip: 'Korean grooming routine, well-kept brows, soft fringe atau side-comb. Premium minimalist outfit.',
    celebrity_match: ['Chicco Jerikho', 'Dimas Anggara', 'Ariel Tatum'],
    traits: { face_shape: 'Oval', eye_shape: 'Almond', brow_shape: 'Straight', nose_size: 'Medium', lip_shape: 'Medium', proportion: 'Standard' }
  },
  strong_lead: {
    name: 'Strong Lead',
    gender: 'man',
    population_pct: 8.67,
    description: 'Strong Lead — square jaw + commanding features + strong angles. Action-hero face. Aura authoritative, decisive, leader vibe.',
    style_tip: 'Define jawline (mewing + face training), short clean haircut atau crew cut, structured fit clothing',
    celebrity_match: ['Joe Taslim', 'Yoshi Sudarso', 'Christian Sugiono'],
    traits: { face_shape: 'Square', eye_shape: 'Monolid', brow_shape: 'Straight', nose_size: 'Large', lip_shape: 'Thin', proportion: 'Wide' }
  },
  mysterious_charm: {
    name: 'Mysterious Charm',
    gender: 'man',
    population_pct: 5.34,
    description: 'Mysterious Charm — heart face dengan downturned eye dan unique features. Brooding aura, intellectual, unforgettable presence.',
    style_tip: 'Subtle skincare, longer hair atau natural texture, monochromatic outfit, minimal accessories',
    celebrity_match: ['Reza Rahadian', 'Donny Damara', 'Vino G. Bastian'],
    traits: { face_shape: 'Heart', eye_shape: 'Downturned', brow_shape: 'S-shape', nose_size: 'Medium', lip_shape: 'Medium', proportion: 'Standard' }
  }
};

/**
 * Score how well a user's traits match an archetype.
 * Returns 0-100 (higher = better match).
 */
function scoreArchetypeMatch(userTraits, archetype) {
  const keys = ['face_shape', 'eye_shape', 'brow_shape', 'nose_size', 'lip_shape', 'proportion'];
  let matches = 0;
  let total = 0;
  for (const key of keys) {
    const userVal = (userTraits[key] || '').toLowerCase();
    const archeVal = (archetype.traits[key] || '').toLowerCase();
    if (!archeVal) continue;
    total++;
    if (userVal === archeVal) matches += 2;        // exact match
    else if (areCloseTraits(key, userVal, archeVal)) matches += 1; // close match
  }
  return total > 0 ? Math.round((matches / (total * 2)) * 100) : 0;
}

/**
 * Define which traits are "close" to each other (for partial matches).
 */
function areCloseTraits(key, a, b) {
  const closeMap = {
    face_shape: [
      ['oval', 'oblong'], ['square', 'diamond'], ['heart', 'diamond'],
      ['round', 'oval'], ['triangle', 'square']
    ],
    eye_shape: [
      ['monolid', 'hooded'], ['almond', 'upturned'], ['round', 'downturned'],
      ['hooded', 'deep-set']
    ],
    brow_shape: [
      ['arched', 'rounded'], ['s-shape', 'arched'], ['rounded', 'straight']
    ],
    nose_size: [['small', 'medium'], ['medium', 'large']],
    lip_shape: [['thin', 'medium'], ['medium', 'full']],
    proportion: [['standard', 'long'], ['standard', 'short'], ['standard', 'wide']]
  };
  const pairs = closeMap[key] || [];
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

/**
 * Find best matching archetype given user traits + gender.
 * Returns { archetype, matchScore }.
 */
function findArchetype(userTraits, gender) {
  const candidates = Object.entries(ARCHETYPES)
    .filter(([_, a]) => a.gender === gender)
    .map(([id, a]) => ({
      id,
      archetype: a,
      score: scoreArchetypeMatch(userTraits, a)
    }))
    .sort((a, b) => b.score - a.score);

  return candidates[0] || null;
}

// Export for browser
if (typeof window !== 'undefined') {
  window.MaxlookArchetypes = { ARCHETYPES, scoreArchetypeMatch, findArchetype };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ARCHETYPES, scoreArchetypeMatch, findArchetype };
}
