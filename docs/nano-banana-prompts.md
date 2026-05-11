# Maxlook AI — Nano Banana 2 Image Generation Prompts

**Provider**: KIE.ai → Nano Banana 2 (Google Gemini-style)
**Endpoint**: `POST https://api.kie.ai/api/v1/gemini/generate-image` (atau sesuai docs KIE.ai terbaru)
**Cost**: ~$0.02-0.05 per image
**Note**: Semua prompt ditulis dalam **bahasa Inggris** karena image-gen models trained mostly on English data. Hasil lebih konsisten.

---

## ⚙️ Variables Reference

Saat generate, replace `{placeholders}` dengan output AI scan:

| Placeholder | Source | Example |
|---|---|---|
| `{overall}` | `result.overall` | `78` |
| `{potential}` | `result.potential` | `92` |
| `{season}` | `result.season` | `Soft Summer` |
| `{undertone}` | `result.undertone` | `cool` |
| `{skin_type}` | `result.skin_type` | `combination` |
| `{face_shape}` | `result.face_shape` | `oval` |
| `{gender}` | `user.gender` | `man` / `woman` |
| `{top_concerns}` | `result.top_concerns[]` | array of issues |
| `{color_palette}` | `result.color_palette[]` | array of hex colors |
| `{occasion}` | per outfit | `office casual` |

---

## 🎨 Brand Style Guide (Embed di Setiap Prompt)

### Maxlook MAN
- **Aesthetic**: dark, edgy, bold, cinematic, premium, masculine
- **Palette**: deep red (#FF0000), charcoal black (#0a0a0a), accent orange (#ff6633), success green (#00ff8c)
- **Vibe**: action movie poster, modern clinic premium, peak performance
- **Typography hint**: bold sans-serif, capital letters, sharp angles

### Maxlook WOMAN
- **Aesthetic**: soft, luxe, editorial, feminine, romantic, premium
- **Palette**: rose pink (#E8639A), warm cream (#FFF5F7), dusty rose (#FADADD), gold accent (#D4A574)
- **Vibe**: high-end magazine editorial, beauty campaign, gentle luminance
- **Typography hint**: elegant serif, lowercase, soft curves

---

# TIER 1 — Per Scan (Generated 1x per user scan)

## 1. HERO SCAN RESULT (Twibbon Replacement) ⭐ TOP PRIORITY

**Use case**: Main image di result page, downloadable, IG story share.
**Aspect ratio**: 9:16 (1080×1920)
**Reference image**: User's selfie (REQUIRED — image-to-image mode)

### Prompt Template (MAN variant):

```
Transform this selfie into a premium aesthetic clinic-style "Glow Up Analysis Report" portrait.

STYLE: Cinematic dark editorial poster, like a movie poster meets dermatology clinic infographic. Deep moody lighting with red and orange neon accents.

KEEP UNCHANGED:
- The subject's face, identity, skin tone, and facial features must remain 100% identical to the input photo
- Same eye color, hair, facial structure, ethnicity
- Original photo composition (head and shoulders frame)

ADD AS OVERLAY ELEMENTS (compositing, not changing the face):
- Top header banner: "MAXLOOK SCAN #1" in bold red sans-serif
- Score badge top-left: glowing red circle with text "SCORE {overall}/100" 
- Score badge top-right: glowing green circle with text "POTENTIAL {potential}/100"
- 5 thin annotation lines pointing to face zones with small labels in red/orange:
  {concern_1_zone}: "{concern_1_name}"
  {concern_2_zone}: "{concern_2_name}"
  {concern_3_zone}: "{concern_3_name}"
  {concern_4_zone}: "{concern_4_name}"
  {concern_5_zone}: "{concern_5_name}"
- Bottom footer: "MAXLOOK MAN · {season} · {skin_type} skin" in small caps
- Subtle red light grid pattern in background (sci-fi medical scanner vibe)
- Lens flare highlights on cheekbones for cinematic feel

COLOR GRADING: deep blacks, crushed shadows, red/orange highlights, slight teal in midtones.

QUALITY: photorealistic, 4K, sharp details, magazine-cover production quality.

NEGATIVE: cartoon, illustration, blurry, distorted face, different person, pixelated text, misspelled words, multiple people, blue or pink dominant, soft pastel.

ASPECT: 9:16 vertical, optimized for Instagram Story.
```

### Prompt Template (WOMAN variant):

```
Transform this selfie into a luxe editorial "Glow Up Analysis" portrait, like a high-end beauty magazine cover.

STYLE: Soft cinematic editorial, like Vogue beauty editorial meets aesthetic clinic report. Warm rose-gold lighting with creamy highlights.

KEEP UNCHANGED:
- The subject's face, identity, skin tone, and features must remain 100% identical
- Same eye color, hair, facial structure, ethnicity, makeup level
- Original photo composition

ADD AS OVERLAY ELEMENTS:
- Top header: "MAXLOOK SCAN #1" in elegant rose gold serif
- Score badge top-left: rose pink soft circle "GLOW {overall}/100"
- Score badge top-right: golden circle "POTENTIAL {potential}/100"
- 5 elegant thin gold annotation lines to face zones with cursive labels:
  {concern_1_zone}: "{concern_1_name}"
  {concern_2_zone}: "{concern_2_name}"
  {concern_3_zone}: "{concern_3_name}"
  {concern_4_zone}: "{concern_4_name}"
  {concern_5_zone}: "{concern_5_name}"
- Bottom footer: "Maxlook Woman · {season} · {skin_type}" in italic serif
- Soft pink rose-gold gradient overlay in background corners
- Subtle bokeh light particles for romantic feel

COLOR GRADING: rose pink highlights, cream undertones, soft golden light, slight cool shadows.

QUALITY: photorealistic, 8K, glass-skin glow, magazine-cover production.

NEGATIVE: harsh shadows, dark moody, red accent dominant, cartoon, distorted face, different person, misspelled text, bold or aggressive vibe.

ASPECT: 9:16 vertical, Instagram Story ready.
```

### Filled Example (MAN):

```
Transform this selfie into a premium aesthetic clinic-style "Glow Up Analysis Report" portrait.

STYLE: Cinematic dark editorial poster...

KEEP UNCHANGED: [...]

ADD AS OVERLAY ELEMENTS:
- Top header banner: "MAXLOOK SCAN #1" in bold red sans-serif
- Score badge top-left: glowing red circle with text "SCORE 72/100"
- Score badge top-right: glowing green circle with text "POTENTIAL 87/100"
- 5 thin annotation lines pointing to face zones with small labels:
  jawline: "Jawline Definition"
  left_under_eye: "Mata Panda"
  forehead: "Tekstur Kulit"
  chin: "Double Chin Subtle"
  left_cheek: "Pori-pori T-Zone"
- Bottom footer: "MAXLOOK MAN · Cool Winter · Oily skin"
[...]
```

### Quality Checklist (cek hasil sebelum lo nilai bagus):
- [ ] Wajah subject 95%+ identical sama photo asli
- [ ] Score badges visible & readable (text "SCORE 72/100" tidak misspelled)
- [ ] Annotation lines connect ke zona wajah yang correct
- [ ] Brand color (red Man / pink Woman) dominant
- [ ] Overall composition 9:16 vertical
- [ ] No extra people / hands / artifacts

---

## 2. PERSONAL COLOR MOOD BOARD

**Use case**: Section "Personal Color" di dashboard, replace text-only swatches.
**Aspect ratio**: 1:1 (1080×1080) atau 4:5
**Reference image**: NONE (text-to-image)

### Prompt Template:

```
Create a Pinterest-style aesthetic mood board collage representing the "{season}" personal color season for a {gender} with {undertone} undertone.

LAYOUT: 4-quadrant mood board grid, like a designer's color inspiration board.

CONTENTS (each quadrant):
1. Top-left: Fashion outfit flatlay using these exact hex colors: {color_palette_top_4}
2. Top-right: Aesthetic lifestyle photo (coffee cup, flowers, fabric textures) in palette colors
3. Bottom-left: Color swatch grid with hex values displayed: {all_12_colors}
4. Bottom-right: Portrait style reference (model with similar undertone wearing palette)

OVERLAY:
- Top text label: "{season}" in elegant typography
- Subtitle: "{undertone} undertone palette"
- Maxlook watermark bottom-right (subtle)

STYLE: clean editorial, magazine layout, Pinterest pin aesthetic, soft natural lighting, premium quality.

COLOR PALETTE TO USE EXCLUSIVELY: {hex_color_1}, {hex_color_2}, {hex_color_3}, {hex_color_4}, {hex_color_5}, {hex_color_6}.

NEGATIVE: cartoon, low quality, busy, cluttered, neon, oversaturated, off-palette colors, AI artifact, distorted text.

ASPECT: 1:1 square.
```

### Filled Example:

```
Create a Pinterest-style aesthetic mood board collage representing the "Cool Winter" personal color season for a man with cool undertone.

LAYOUT: 4-quadrant mood board grid.

CONTENTS:
1. Top-left: Outfit flatlay using these hex: #1a1a2e, #16213e, #c0c0c0, #ff0040
2. Top-right: Aesthetic photo of black coffee, white marble, silver watch
3. Bottom-left: Color swatch grid with hex labels:
   #1a1a2e (Midnight Navy)
   #16213e (Deep Indigo)
   #c0c0c0 (Silver Mist)
   #ff0040 (True Red)
   [...all 12]
4. Bottom-right: Male model portrait with cool undertone wearing navy/charcoal

OVERLAY: "Cool Winter" header, "Cool Undertone Palette" subtitle, Maxlook logo.

STYLE: editorial, premium, Pinterest aesthetic.
```

---

## 3. SKIN ANALYSIS COMPOSITE

**Use case**: Detailed skin section, annotated zones with skin concerns.
**Aspect ratio**: 4:5 (1080×1350) portrait
**Reference image**: User's selfie (REQUIRED)

### Prompt Template:

```
Transform this selfie into a clinical dermatology analysis composite showing skin assessment per zone.

STYLE: Medical dermatology illustration meets editorial portrait. Clean, scientific, professional.

KEEP UNCHANGED:
- Subject's face, identity, ethnicity, exact features
- Original lighting and skin tone

ADD AS OVERLAY:
- Translucent colored zone highlights showing skin concerns:
  - Red translucent overlay on areas with: {acne_zones}
  - Yellow translucent overlay on areas with: {hyperpigmentation_zones}
  - Blue translucent overlay on areas with: {dehydration_zones}
  - Green translucent overlay on areas with: healthy zones
- Small clinical labels with arrows pointing to each zone:
  - "Acne Active: {severity}"
  - "Open Pores: {severity}"
  - "Hyperpigmentation: {severity}"
  - "Hydration: {level}%"
- Side panel (right side, 30% width): chart showing scores
  - Skin Glow: {skin_glow}/100
  - Texture: {texture_score}
  - Tone Evenness: {evenness_score}
  - Hydration: {hydration_score}
- Footer: "MAXLOOK Skin Analysis · {skin_type} skin"

COLOR PALETTE: clinical blue-white background, red/yellow/blue/green zone overlays at 30% opacity.

NEGATIVE: distorted face, exaggerated issues, makeup added, filtering applied to skin, cartoon style.

QUALITY: photorealistic, 4K, sharp text, professional medical aesthetic.

ASPECT: 4:5 portrait.
```

---

# TIER 2 — Per User First Scan (Cached, reused)

## 4. GLOW UP BEFORE/AFTER POTENTIAL

**Use case**: Motivational visual, "what you'll look like after 30 days".
**Aspect ratio**: 1:1 (1080×1080)
**Reference image**: User's selfie (REQUIRED)

### Prompt Template:

```
Create a "Before / After 30-day Glow Up" split-screen composite from this selfie.

LEFT SIDE (50%): Original photo unchanged with label "DAY 1" in corner.

RIGHT SIDE (50%): Same person, same identity, same ethnicity, same hair — but visually showing the result of {duration_days}-day glow up:
- Skin: clearer, more glowy, hydrated, fewer blemishes (target: {target_skin_score})
- Eye area: brighter, less puffy, no dark circles
- Jawline: slightly more defined
- Overall: more rested, healthy, aesthetic
- Label "DAY 30" in corner

DIVIDER: thin gold/red glowing vertical line in the middle with arrow pointing right.

OVERLAY:
- Top header: "MAXLOOK GLOW UP — 30 DAY POTENTIAL"
- Bottom: small disclaimer "Estimated visual based on AI analysis"

CRITICAL CONSTRAINTS:
- Person must look like the SAME individual on both sides
- Identity, age range, ethnicity must be preserved
- Improvements must be REALISTIC (5-15% better, not unrecognizable)
- No makeup added on women if not present in original
- No filter / smoothing artifacts

STYLE: editorial dermatology before/after, professional clinic style.

NEGATIVE: cartoon, exaggerated improvements, different person on right side, plastic surgery look, unnatural, filtered, photoshopped obvious.

ASPECT: 1:1 square.
```

---

## 5. OUTFIT VISUALIZATION (per occasion, generate 5-7)

**Use case**: Outfit ideas section, per-occasion card.
**Aspect ratio**: 1:1 (1080×1080)
**Reference image**: NONE (text-to-image)

### Prompt Template:

```
Create a flatlay outfit photography for "{occasion}" using {season} color palette for a {gender}.

LAYOUT: Top-down flatlay on neutral background (warm cream for woman / charcoal slate for man).

ITEMS TO INCLUDE:
{outfit_item_1}
{outfit_item_2}
{outfit_item_3}
{outfit_item_4}
{accessories}

COLOR PALETTE: must use ONLY these hex colors for fabric/items: {top_5_palette_hex}

STYLE: minimalist editorial flatlay, like a fashion magazine. Soft natural shadow. Clean composition.

OVERLAY:
- Small text label top-left: "MAXLOOK · {occasion}"
- Tag bottom-right: "{vibe_keyword}"

QUALITY: photorealistic, professional product photography, 8K.

NEGATIVE: model wearing items, cluttered, neon colors, off-palette, low quality, ugly composition.

ASPECT: 1:1 square.
```

### Filled Example (Office Woman, Soft Summer):

```
Create a flatlay outfit photography for "Office Casual" using Soft Summer color palette for a woman.

LAYOUT: Top-down flatlay on warm cream background.

ITEMS:
- Dusty blue blazer
- Cream silk blouse
- Soft pink slim trousers
- Nude leather loafers
- Pearl earrings + thin gold watch

COLOR PALETTE: ONLY use these hex: #B8D4D4, #F5E6E8, #C9A9A0, #E8D5C4, #A8B5C4

STYLE: minimalist Vogue editorial flatlay.
[...]
```

---

## 6. HAIRSTYLE RECOMMENDATIONS (3 per scan)

**Use case**: Matched hairstyles based on face shape.
**Aspect ratio**: 1:1 (1080×1080)
**Reference image**: NONE OR optional reference for face shape

### Prompt Template:

```
Generate a hairstyle reference photo for {gender} with "{face_shape}" face shape, suitable for "{vibe_keyword}" aesthetic.

STYLE: Professional portrait headshot in modern salon photography style.

SUBJECT:
- {gender} model with {face_shape} face shape
- Asian (Indonesian) ethnicity, age 22-30
- Neutral expression, clean background
- {hair_color_suggestion} hair color
- {hair_length} length
- {hairstyle_specific_description}

LIGHTING: soft natural, professional headshot quality.

COMPOSITION: head and shoulders, slight three-quarter angle.

OVERLAY:
- Bottom label: "{hairstyle_name} · For {face_shape} face"
- Maxlook watermark corner

NEGATIVE: extreme stylization, anime, cartoon, multiple people, unrealistic, distorted face.

QUALITY: photorealistic, 4K, salon-grade hair texture.

ASPECT: 1:1.
```

### Filled Example (Oval face Man, casual vibe):

```
Generate a hairstyle reference for a man with "oval" face shape, "casual modern" vibe.

SUBJECT:
- Man with oval face
- Indonesian ethnicity, 25 years old
- Neutral expression
- Black hair color
- Medium-short length
- Mid-fade with textured top, slight side-sweep, modern Korean-Indonesian hybrid style

[...]
```

---

# TIER 3 — Universal Assets (Generate 1x for whole product, reuse)

## 7. MEWING TUTORIAL ILLUSTRATIONS (4 images)

**Use case**: Bible / Workbook step-by-step mewing guide.
**Aspect ratio**: 1:1 each
**Reference image**: NONE

### Step 1 Prompt:

```
Create a clean medical anatomy illustration showing "Mewing — Step 1: Tongue Position".

VIEW: side profile of human face, neutral expression, shown anatomically.

STYLE: Smart Servier-style medical illustration, semi-realistic, line-art with subtle color fills. Like a high-end dermatology textbook.

ELEMENTS:
- Side profile head with semi-transparent skin to show tongue inside mouth
- Tongue highlighted in pink, positioned on the ROOF of the mouth (palate)
- Small arrow with label: "Tongue against palate"
- Teeth slightly touching
- Lips closed gently
- Background: clean white with subtle grid

OVERLAY:
- Title top: "MEWING · STEP 1"
- Description bottom: "Place entire tongue flat against roof of mouth"

COLOR: muted clinical (cream, soft pink for muscle, light gray bones).

NEGATIVE: photorealistic skin, cartoon, anime, gore, scary anatomy.

ASPECT: 1:1.
```

### Step 2 Prompt:

```
[Same template as Step 1, but]:
TITLE: "MEWING · STEP 2"
DESCRIPTION: "Lips closed, teeth gently touching"
HIGHLIGHT: lips and teeth zone
[...]
```

### Step 3 Prompt:

```
[Same template, but]:
TITLE: "MEWING · STEP 3"
DESCRIPTION: "Apply gentle pressure upward — hold for 5-10 minutes"
ADD: small upward arrow on tongue + jaw
[...]
```

### Step 4 Prompt:

```
[Same template, but]:
TITLE: "MEWING · STEP 4 (Result over time)"
DESCRIPTION: "Daily practice → improved jaw definition"
SHOW: side profile with subtle dotted line showing jawline improvement potential
[...]
```

---

## 8. FACE YOGA EXERCISES (10 images)

**Use case**: Face yoga section, illustrated exercises.

### Generic Template:

```
Create a clean medical-style illustration of "Face Yoga: {exercise_name}".

STYLE: Smart Servier semi-realistic anatomy, line-art with muted color fills.

ELEMENTS:
- Front-facing portrait of {gender}
- Hand or finger position showing the exercise
- Highlighted facial muscles being engaged (in pink/red translucent overlay)
- Arrow showing direction of movement: "{movement_direction}"
- Number repetitions: "{reps_count} reps"

EXERCISES TO GENERATE (loop through these):
1. Cheek Lift — finger pushes cheek up + hold
2. Forehead Smoothing — palms press forehead outward
3. Neck Stretch — chin lifted, tongue out
4. Jawline Tap — fingertips tap along jawline
5. Eye Circle — finger traces around orbital bone
6. Lip Tone — lips pursed, then wide smile
7. Brow Lift — fingers under brow push up
8. Cheek Plump — air puff in cheeks
9. Smile Flex — exaggerated smile hold
10. Neck Resistance — chin against fist

OVERLAY:
- Title: "FACE YOGA · {exercise_name}"
- Subtitle: "{reps_count} × {hold_duration}s"

NEGATIVE: cartoon, anime, weird proportions, ugly.

ASPECT: 1:1.
```

---

## 9. SECTION HERO IMAGES (5 images, brand identity)

**Use case**: Section dividers di Bible/Workbook/Roadmap.
**Aspect ratio**: 16:9 wide

### Generic Template:

```
Create an aesthetic hero banner image for "{section_name}" section of Maxlook {variant}.

STYLE: Editorial premium magazine cover, cinematic, {variant_aesthetic}.

CONTENT: abstract aesthetic representation of "{section_topic}".

VARIANT-SPECIFIC:
{man_woman_brand_guidelines}

OVERLAY:
- Section title: "{SECTION_NAME}"
- Subtitle: "{section_tagline}"

QUALITY: 8K, magazine-cover aesthetic.

NEGATIVE: stock photo cliché, low quality, generic.

ASPECT: 16:9.
```

### Sections to Generate:

1. **Skincare Routine** — close-up of premium skincare bottles, water droplets
2. **Personal Color** — fabric + paint swatches in user's palette
3. **Face Yoga** — abstract muscle anatomy line art
4. **30-Day Roadmap** — timeline visual, calendar elements
5. **Outfit Ideas** — fashion flatlay collection

---

# 🧪 Testing Checklist (Pakai Manual di ChatGPT/Nano Banana)

Sebelum lo commit ke production:

### A. Konsistensi Wajah (paling penting!)
- [ ] Generate 3x dengan prompt yang sama → wajah tetap mirip subject asli?
- [ ] Identity preservation 90%+? (skin tone, eye shape, hair, ethnicity)
- [ ] Ada hallucination (eye color berubah, etc)?

### B. Text Accuracy
- [ ] "MAXLOOK SCAN #1" tertulis benar (bukan "MAXL00K" atau "MAXLOK")?
- [ ] Score badges "{overall}/100" formatnya benar?
- [ ] Concern labels readable & sesuai posisi zona?

### C. Brand Consistency
- [ ] Color palette dominan sesuai variant (red Man / pink Woman)?
- [ ] Mood matches brand (dark edgy Man / soft luxe Woman)?
- [ ] Maxlook watermark visible?

### D. Composition
- [ ] Aspect ratio benar (9:16 untuk hero, 1:1 untuk mood board)?
- [ ] Element tidak overlap / cluttered?
- [ ] Annotation arrows point ke zona wajah yang correct?

### E. Safety / Tone
- [ ] Tidak terlalu medical-scary (avoid uncanny valley)?
- [ ] Improvements yang ditampilin realistic, bukan plastic surgery vibes?
- [ ] Skin/feature representation tidak diskriminatif?

---

# 📋 Iteration Notes (Hans untuk fill saat manual testing)

Setelah lo test 3-5 generate per prompt, isi note ini untuk feedback gue:

```
PROMPT #1 — Hero Scan Result:
- Identity preservation:  ___/10
- Text accuracy:           ___/10
- Brand match:             ___/10
- Composition:             ___/10
- Issues observed:         _________________
- Things to add:           _________________
- Things to remove:        _________________
```

---

# 💰 Cost Estimation per User Scan

| Image | Generated | Cost USD | Cost IDR |
|---|---|---|---|
| Hero Scan Result | Per scan | $0.04 | Rp 640 |
| Personal Color Mood Board | Per scan | $0.04 | Rp 640 |
| Skin Analysis | Per scan (optional) | $0.04 | Rp 640 |
| Glow Up Before/After | Per first scan | $0.04 | Rp 640 |
| Outfit (5 occasions) | Per first scan | $0.20 | Rp 3.200 |
| Hairstyle (3 styles) | Per first scan | $0.12 | Rp 1.920 |
| **Per scan total** (Hero + Color only) | | **$0.08** | **Rp 1.280** |
| **Per first scan total** (full Tier 1+2) | | **$0.48** | **Rp 7.680** |
| Tier 3 (one-time, all users share) | Once | $1.00 | Rp 16.000 |

**Recommended: Generate Tier 1 + 2 first scan only, re-scans hanya update score (no image gen).**

Per 1.000 user paying:
- First scan: 1000 × $0.48 = $480 (~Rp 7.6 juta) one-time
- Re-scans (52/year): 1000 × 52 × $0.08 = $4,160/year (~Rp 66.5 juta/year)
- Total Year 1: ~Rp 74 juta untuk image gen

vs Revenue (kalau Rp 199rb/user × 1000 = Rp 199 juta)
→ Image gen cost: ~37% of revenue.

**Atau dengan strategi smart:**
- Generate Tier 1 saja per scan (Rp 1.280)
- Re-scan: cuma update annotations, skip Hero (gunain yang lama atau pakai twibbon SVG)
- Tier 2 generate sekali, cache lifetime
- Total per scan: ~Rp 1.280 (still 30x lebih mahal dari current Rp 40 tapi visual jauh lebih premium)

---

**End of prompts file.**

Test manual dulu di [Nano Banana playground](https://kie.ai) (atau ChatGPT untuk prompt iteration), iterasi prompt sampai output konsisten, baru kita integrate ke API.
