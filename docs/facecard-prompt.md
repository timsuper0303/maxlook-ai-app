# Maxlook Facecard Generation Prompt

**Provider**: OpenAI gpt-image-1 (low quality, edit endpoint)
**Input**: User selfie photo (image-to-image mode)
**Output**: 1024×1536 portrait (~2:3, close to 4:5)
**Cost**: ~Rp 176-528 per scan (with optional 1 retry)

---

## Master Prompt Template

```
Create a premium all-in-one modern infographic poster in PORTRAIT format
(close to 4:5 ratio) using the uploaded portrait as the main subject —
100% facial resemblance preserved.

POSTER STYLE: minimal, aesthetic, luxury editorial, visual-first,
clean typography, rounded cards, thin lines, subtle shadows,
premium infographic layout, soft modern UI design.

MAIN TITLE: "Personal Style & Face Analysis"

CANVAS & LAYOUT:
- Portrait orientation only
- Vertical editorial poster layout
- Elegant spacing with clean visual hierarchy
- Portrait placed as the main central focus
- Balanced infographic composition from top to bottom
- Premium magazine-style arrangement
- Modern luxury UI aesthetic

═══ CREATE ONE UNIFIED INFOGRAPHIC BOARD ═══

Combine these 4 sections into one cohesive poster:

1. FACE FEATURES ANALYSIS
2. PERSONAL COLOR ANALYSIS
3. HAIRSTYLE ANALYSIS
4. SPECTACLES GUIDE

───────────────────────────────────────────────
SECTION 1 — FACE FEATURES ANALYSIS
───────────────────────────────────────────────
Automatically analyze the actual facial features from the uploaded portrait.

Detect and label:
- Face shape
- Eyes
- Eyebrows
- Nose
- Cheeks
- Lips
- Jawline

Design:
- Thin elegant arrows pointing to each feature
- Rounded glassmorphism info cards
- Minimal icons
- Concise labels only — no paragraphs
- Each feature card: short title + 2-3 short bullet descriptions

───────────────────────────────────────────────
SECTION 2 — PERSONAL COLOR ANALYSIS
───────────────────────────────────────────────
Create side-by-side clothing color comparisons using the same portrait.

Show:
- Best colors (4 variations)
- Okay colors (2 variations)
- Unsuitable colors (4 variations)

Use realistic outfit color variations.
Add small palette swatches and seasonal palette inspiration.

Short labels only:
- "Best Match"
- "Soft Contrast"
- "Too Dull"
- "Brightens Skin"

───────────────────────────────────────────────
SECTION 3 — HAIRSTYLE ANALYSIS
───────────────────────────────────────────────
Create realistic hairstyle comparisons using the same face.

Include:
- Hairstyles that suit the face (3 best)
- Hairstyles that do not suit the face (3 less ideal)

Use modern trendy hairstyles with realistic texture and volume.
Examples: textured crop, messy fringe, soft middle part, taper fade,
side part, fluffy textured hair.

Short labels only:
- "Adds Balance"
- "Soft Volume"
- "Too Wide"
- "Sharp Structure"

───────────────────────────────────────────────
SECTION 4 — SPECTACLES GUIDE
───────────────────────────────────────────────
Create realistic glasses try-on comparisons using the same portrait.

Recommend:
- Suitable frames (4 best)
- Unsuitable frames (4 avoid)

Include frame types: round metal, square frames, rectangular frames,
thin metal, thick acetate, clubmaster, oversized frames.

Short labels only:
- "Best Fit"
- "Balances Face"
- "Too Heavy"
- "Softens Features"

═══ DESIGN RULES ═══

- Portrait poster only
- Close to 4:5 aspect ratio
- Ultra high quality
- Luxury editorial aesthetic
- Modern infographic composition
- Visual-first layout
- Elegant white space
- Cohesive premium design
- Realistic portrait preservation (face must remain identical)
- Soft neutral luxury color palette
- Subtle shadows and UI glow
- Apple-style infographic aesthetic
- Pinterest premium beauty analysis board
- Korean luxury editorial style
- Clean modern typography
- Highly detailed
- No clutter
- No long paragraphs
- DO NOT include any brand text, logo, or watermark
  (brand text will be overlaid via HTML after generation)
```

---

## Variant Accent Color (Q2=A)

### Maxlook MAN
- Primary accent: `#FF0000` (red)
- Secondary accent: `#ff6633` (orange)
- Icon/arrow color: red/orange
- Card border subtle red glow
- Background: warm neutral (cream/beige)

### Maxlook WOMAN
- Primary accent: `#E8639A` (rose pink)
- Secondary accent: `#D4AF37` (gold)
- Icon/arrow color: rose-gold/pink
- Card border subtle pink glow
- Background: soft pink/cream

**Inject ke prompt** dengan menambah:

```
ACCENT COLOR THEME: [variant-specific instructions]

For MAN: Use red (#FF0000) and orange (#ff6633) as accent colors for
icons, arrows, and subtle highlights. Maintain neutral cream/beige base.

For WOMAN: Use rose pink (#E8639A) and gold (#D4AF37) as accent colors.
Maintain soft cream/blush base. Feminine elegant feel.
```

---

## HTML Overlay Layer (Q5=B)

After AI generates the poster (no brand text), overlay:

**Top header** (rendered via HTML/canvas):
- "✦ MAXLOOK ✦"
- Font: Playfair Display, weight 800, letterspacing 0.2em
- Color: white (Man variant) / rose-gold (Woman variant)
- Position: top center, ~5% from top edge

**Bottom watermark** (Q12=C, no URL per user request):
- "✨ MAXLOOK GLOW UP SCANNER"
- Font: Inter, weight 700, size 11px, letterspacing 0.15em
- Color: subtle (50% opacity white)
- Position: bottom center, ~5% from bottom edge

---

## Implementation Flow

```
1. User submits scan (capture or upload)
2. AI Vision (Gemini) analyze face → return JSON scores
3. Server triggers facecard generation:
   a. Send user photo + prompt to gpt-image-1 (image edit)
   b. Get generated 1024×1536 PNG
   c. Validate face match via face-api.js (Q10 auto-retry once if fail)
   d. Apply HTML overlay (Playfair top header + watermark)
   e. Save final to Supabase Storage
   f. Save facecard reference in maxlook_facecards table
4. Return facecard URL to client
5. User sees facecard hero in result page
6. Re-scan: facecard NOT auto-regenerated (Q9: skip payment, free first scan only)
7. History: keep 2 latest (Q11=C) — old facecard deleted when 3rd generated
```

---

## Storage Strategy

- **Supabase Storage bucket**: `maxlook-facecards` (private)
- **Path**: `users/{user_id}/facecard-{timestamp}.png`
- **Format**: PNG (or WebP for size optimization)
- **Size**: ~500KB-1MB per file (4:5 portrait quality)
- **Retention**: 2 latest per user (Q11=C)
- **Access**: signed URLs (7-day expiry per request)

---

## Cost Estimate Per User (First Scan)

| Component | Cost |
|---|---|
| OpenAI gpt-image-1 low (1024×1024 fallback to 1024×1536) | $0.011-0.016 |
| Auto-retry buffer (1× max) | +$0.011 |
| Supabase Storage 1MB | ~$0.00002 |
| **TOTAL** | **~$0.022-0.033 = Rp 350-528** |

Per Rp 25,000 unlock: margin **97-99%**.
