/* ═══════════════════════════════════════════════════════
   Maxlook Facecard Renderer
   Renders a premium HTML infographic from scan data:
     · Section 1 — Face Features (vertical: portrait + 2-col stats)
     · Section 2 — Personal Color (pure swatch palette, no photo)
     · Section 3 — Hairstyle / Hijab Style (3 best + 3 avoid)
     · Section 4 — Spectacles Guide (4 best + 4 avoid)
   Brand layer (header + watermark) is part of the HTML.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const ESC_MAP = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' };
  const escape = (s) => String(s ?? '').replace(/[&<>"']/g, c => ESC_MAP[c]);

  const FACE_DESC = {
    face_shape: {
      Oval:    'Proporsi seimbang, fitur klasik universal.',
      Round:   'Garis lembut, kesan ramah dan muda.',
      Square:  'Rahang tegas, struktur kuat dan defined.',
      Heart:   'Dahi lebar, dagu meruncing — feminine harmony.',
      Diamond: 'Tulang pipi menonjol, fitur tajam.',
      Long:    'Vertikal panjang, fitur elegan.',
      Oblong:  'Wajah panjang dengan dahi tinggi.'
    },
    eye_shape: {
      Monolid:    'Single lid, fitur khas Asia, modern.',
      Hooded:     'Tutup mata sebagian, intens dan misterius.',
      Almond:     'Bentuk ideal seperti almond, ekspresif.',
      Round:      'Mata bulat besar, terlihat youthful.',
      Downturned: 'Sudut luar turun, soft & approachable.',
      Upturned:   'Sudut luar naik, mata "fox eyes".'
    },
    eyebrow_shape: {
      Arched:   'Alis melengkung, struktur kuat.',
      Straight: 'Alis lurus, modern minimalist.',
      Rounded:  'Lengkung halus, soft expression.',
      'S-shape': 'Lengkung S, glamour klasik.'
    },
    nose_size: {
      Small:  'Hidung mungil, fitur lembut.',
      Medium: 'Proporsi ideal, seimbang dengan fitur lain.',
      Large:  'Hidung tegas, fitur karakteristik kuat.'
    },
    lip_shape: {
      Thin:   'Bibir tipis, fitur halus dan defined.',
      Medium: 'Volume seimbang, ekspresif natural.',
      Full:   'Bibir penuh, fitur plush dan youthful.'
    }
  };

  const DEFAULT_BEST_COLORS = {
    'cool':    [{name:'Navy',hex:'#1B2D4F'},{name:'Emerald',hex:'#0F8A6E'},{name:'Berry',hex:'#7C2D5B'},{name:'Charcoal',hex:'#2C2C2C'}],
    'warm':    [{name:'Terakota',hex:'#C46A4F'},{name:'Mustard',hex:'#D4A547'},{name:'Olive',hex:'#6B7142'},{name:'Karamel',hex:'#9C6B3F'}],
    'neutral': [{name:'Taupe',hex:'#8C7B6E'},{name:'Camel',hex:'#B89370'},{name:'Sage',hex:'#92A488'},{name:'Soft Navy',hex:'#3E4D63'}],
    'olive':   [{name:'Bronze',hex:'#8B6635'},{name:'Forest',hex:'#3D5142'},{name:'Plum',hex:'#5E3854'},{name:'Cream',hex:'#E8DBC1'}]
  };
  const DEFAULT_WORST_COLORS = [
    {name:'Pucat',hex:'#F4E4E1',label:'Too Dull'},
    {name:'Neon',hex:'#39FF14',label:'Clashes'},
    {name:'Pink Pastel',hex:'#FFB6C1',label:'Washes Out'},
    {name:'Hitam Pekat',hex:'#000000',label:'Too Heavy'}
  ];

  const HAIRSTYLE_PLACEHOLDERS = {
    man: {
      good: [
        { name: 'Textured Crop', icon: '✂️' },
        { name: 'Side Part Mid Fade', icon: '💈' },
        { name: 'Modern Pompadour', icon: '💇‍♂️' }
      ],
      bad: [
        { name: 'Long Curtain', icon: '🙅‍♂️' },
        { name: 'Mullet', icon: '🙅‍♂️' },
        { name: 'Bowl Cut', icon: '🙅‍♂️' }
      ]
    },
    woman: {
      good: [
        { name: 'Soft Layered Lob', icon: '💇‍♀️' },
        { name: 'Wolf Cut', icon: '✨' },
        { name: 'Sleek Bun', icon: '👑' }
      ],
      bad: [
        { name: 'Heavy Blunt Bangs', icon: '🙅‍♀️' },
        { name: 'Crispy Layered', icon: '🙅‍♀️' },
        { name: 'Stiff Updo', icon: '🙅‍♀️' }
      ]
    },
    hijab: {
      good: [
        { name: 'Pashmina Loose Drape', icon: '🧕' },
        { name: 'Segi Empat Layered', icon: '✨' },
        { name: 'Modern Wrap', icon: '🌸' }
      ],
      bad: [
        { name: 'Stiff Tight Bonnet', icon: '🙅‍♀️' },
        { name: 'Heavy Multi-Layer', icon: '🙅‍♀️' },
        { name: 'Volumeless Flat', icon: '🙅‍♀️' }
      ]
    }
  };

  const GLASSES_SVG = {
    'Wayfarer':   '<svg viewBox="0 0 100 40"><path d="M5 12 Q5 5 12 5 H42 Q49 5 49 12 V25 Q49 32 42 32 H12 Q5 32 5 25 Z M51 12 Q51 5 58 5 H88 Q95 5 95 12 V25 Q95 32 88 32 H58 Q51 32 51 25 Z M49 16 H51" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
    'Aviator':    '<svg viewBox="0 0 100 40"><path d="M10 8 L42 8 Q47 20 30 32 Q15 32 10 18 Z M58 8 L90 8 Q95 18 80 32 Q63 32 58 20 Z M42 14 H58" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
    'Round':      '<svg viewBox="0 0 100 40"><circle cx="27" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/><circle cx="73" cy="20" r="14" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="41" y1="20" x2="59" y2="20" stroke="currentColor" stroke-width="2"/></svg>',
    'Square':     '<svg viewBox="0 0 100 40"><rect x="8" y="8" width="36" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><rect x="56" y="8" width="36" height="24" rx="3" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="44" y1="18" x2="56" y2="18" stroke="currentColor" stroke-width="2"/></svg>',
    'Cat-eye':    '<svg viewBox="0 0 100 40"><path d="M5 14 Q5 8 12 8 H38 Q48 8 48 18 L46 26 Q45 30 38 30 H12 Q5 30 5 22 Z M52 18 Q52 8 62 8 H88 Q95 8 95 14 V22 Q95 30 88 30 H62 Q55 30 54 26 Z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>',
    'Oversized':  '<svg viewBox="0 0 100 40"><ellipse cx="26" cy="20" rx="20" ry="14" fill="none" stroke="currentColor" stroke-width="2.5"/><ellipse cx="74" cy="20" rx="20" ry="14" fill="none" stroke="currentColor" stroke-width="2.5"/><line x1="46" y1="20" x2="54" y2="20" stroke="currentColor" stroke-width="2"/></svg>',
    'Rimless':    '<svg viewBox="0 0 100 40"><line x1="8" y1="20" x2="44" y2="20" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/><line x1="56" y1="20" x2="92" y2="20" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2"/><ellipse cx="26" cy="20" rx="18" ry="11" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/><ellipse cx="74" cy="20" rx="18" ry="11" fill="none" stroke="currentColor" stroke-width="1" opacity="0.4"/></svg>',
    'Browline':   '<svg viewBox="0 0 100 40"><path d="M5 12 L48 12 L52 12 L95 12" fill="none" stroke="currentColor" stroke-width="4"/><path d="M5 12 Q5 8 12 8 L42 8 Q48 8 48 12 V22 Q48 30 42 30 H12 Q5 30 5 22 Z M52 12 Q52 8 58 8 L88 8 Q95 8 95 12 V22 Q95 30 88 30 H58 Q52 30 52 22 Z" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>'
  };

  function render(opts = {}) {
    const {
      photoUrl,
      user = {},
      scan = {},
      result = {},
      variantTone = 'man'
    } = opts;

    const isWoman = variantTone === 'woman' || user.gender === 'woman';
    const wearsHijab = !!user.wears_hijab
      || !!result.wears_hijab
      || !!(result.user_info && result.user_info.wears_hijab)
      || !!(Array.isArray(result.hijab_styles_recommended) && result.hijab_styles_recommended.length);

    const fa = result.facecard_analysis || {};
    const faceShape   = result.face_shape || 'Oval';
    const eyeShape    = result.eye_shape || 'Almond';
    const browShape   = result.eyebrow_shape || 'Straight';
    const noseSize    = result.nose_size || 'Medium';
    const lipShape    = result.lip_shape || 'Medium';

    const cp = result.facecard_color_picks || {};
    const undertone = (result.undertone || 'neutral').toLowerCase();
    const bestColors  = (cp.best_matches  || DEFAULT_BEST_COLORS[undertone] || DEFAULT_BEST_COLORS.neutral)
      .slice(0, 4);
    const worstColors = (cp.worst_matches || DEFAULT_WORST_COLORS).slice(0, 4);

    const hairKey = wearsHijab ? 'hijab' : (isWoman ? 'woman' : 'man');
    const hairGood = wearsHijab
      ? (result.hijab_styles_recommended || HAIRSTYLE_PLACEHOLDERS.hijab.good).slice(0, 3)
      : (result.hairstyles_recommended  || HAIRSTYLE_PLACEHOLDERS[hairKey].good).slice(0, 3);
    const hairBad  = wearsHijab
      ? (result.hijab_styles_avoid       || HAIRSTYLE_PLACEHOLDERS.hijab.bad).slice(0, 3)
      : (result.hairstyles_avoid        || HAIRSTYLE_PLACEHOLDERS[hairKey].bad).slice(0, 3);

    const glassGood = (result.glasses_recommended || [
      { shape:'Wayfarer', frame_color:'Black',    reason:'Garis tegas seimbangkan wajah', label:'Best Fit' },
      { shape:'Round',    frame_color:'Tortoise', reason:'Softens sharp features',         label:'Balances Face' },
      { shape:'Aviator',  frame_color:'Silver',   reason:'Klasik universal',               label:'Sharp Frame' },
      { shape:'Browline', frame_color:'Black',    reason:'Aksen mata yang strong',         label:'Power Frame' }
    ]).slice(0, 4);

    const glassBad = (result.glasses_avoid || [
      { shape:'Oversized', reason:'Terlalu dominan',     label:'Too Heavy' },
      { shape:'Rimless',   reason:'Kurang definisi',     label:'Too Soft'   },
      { shape:'Cat-eye',   reason:'Bentuk kurang cocok', label:'Wrong Shape'},
      { shape:'Square',    reason:'Garis kaku',          label:'Too Boxy'   }
    ]).slice(0, 4);

    const variantClass = isWoman ? 'woman' : 'man';
    const variantLabel = isWoman ? 'WOMAN' : 'MAN';
    const dateStr = new Date(scan.created_at || Date.now()).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });

    const html = `
    <div class="facecard ${variantClass}" id="facecardPoster" data-variant="${variantClass}">

      <div class="fc-brand">
        <div class="fc-brand-mark">Maxlook</div>
        <div class="fc-brand-meta">${escape(variantLabel)} · ${escape(dateStr)}</div>
      </div>

      <div class="fc-title">
        <h1>Personal Style &amp; Face Analysis</h1>
        <span class="sub">${escape(user.name || 'Personal Edition')} · Glow Up Scanner</span>
      </div>

      <section class="fc-section">
        <div class="fc-section-head">
          <span class="num">1</span>
          <span class="h">Face Features Analysis</span>
          <span class="tag">${escape(faceShape)}</span>
        </div>

        <div class="fc-face-board">
          <div class="fc-face-portrait">
            ${photoUrl
              ? `<img src="${escape(photoUrl)}" alt="${escape(user.name || 'You')}" crossorigin="anonymous">`
              : `<div style="display:grid;place-items:center;height:100%;color:#666;font-size:11px">No photo</div>`
            }
            <div class="face-shape-pill">${escape(faceShape)} Face</div>
          </div>

          <div style="font-size:12px;color:var(--fc-text-soft);line-height:1.55;text-align:center;padding:0 8px">
            ${escape(fa.face_shape_desc || lookup('face_shape', faceShape))}
          </div>

          <div class="fc-face-stats">
            ${renderStat('Eyes',     eyeShape,  fa.eyes_desc      || lookup('eye_shape', eyeShape))}
            ${renderStat('Eyebrows', browShape, fa.eyebrows_desc  || lookup('eyebrow_shape', browShape))}
            ${renderStat('Nose',     noseSize,  fa.nose_desc      || lookup('nose_size', noseSize))}
            ${renderStat('Lips',     lipShape,  fa.lips_desc      || lookup('lip_shape', lipShape))}
            ${renderStat('Cheeks',   'Defined', fa.cheeks_desc    || 'Kontur seimbang dengan tulang pipi natural.')}
            ${renderStat('Jawline',  scoreLabel(scan.jawline || result.jawline), fa.jawline_desc || 'Garis rahang seimbang dengan struktur wajah.')}
          </div>
        </div>
      </section>

      <section class="fc-section">
        <div class="fc-section-head">
          <span class="num">2</span>
          <span class="h">Personal Color Analysis</span>
          <span class="tag">${escape(result.season || 'Soft Season')}</span>
        </div>

        <div class="fc-color-divider">Best Matches</div>
        <div class="fc-color-grid">
          ${bestColors.map(c => renderColorCell(c, 'good')).join('')}
        </div>

        <div class="fc-color-divider">Avoid</div>
        <div class="fc-color-grid">
          ${worstColors.map(c => renderColorCell(c, 'bad')).join('')}
        </div>

        <div class="fc-color-meta">
          <span class="pill">Undertone: <strong>${escape((result.undertone||'Neutral').toUpperCase())}</strong></span>
          <span class="pill">Season: <strong>${escape(result.season || 'Soft')}</strong></span>
        </div>
      </section>

      <section class="fc-section">
        <div class="fc-section-head">
          <span class="num">3</span>
          <span class="h">${wearsHijab ? 'Hijab Style Guide' : 'Hairstyle Analysis'}</span>
          <span class="tag">${escape(faceShape)}</span>
        </div>

        <div class="fc-color-divider">Suitable Styles</div>
        <div class="fc-style-grid">
          ${hairGood.map(s => renderStyleCard(s, 'good', hairKey)).join('')}
        </div>

        <div class="fc-color-divider">Avoid Styles</div>
        <div class="fc-style-grid">
          ${hairBad.map(s => renderStyleCard(s, 'bad', hairKey)).join('')}
        </div>
      </section>

      <section class="fc-section">
        <div class="fc-section-head">
          <span class="num">4</span>
          <span class="h">Spectacles Guide</span>
          <span class="tag">${escape(faceShape)}</span>
        </div>

        <div class="fc-color-divider">Best Frames</div>
        <div class="fc-glass-grid">
          ${glassGood.map(g => renderGlassCard(g, 'good')).join('')}
        </div>

        <div class="fc-color-divider">Avoid Frames</div>
        <div class="fc-glass-grid">
          ${glassBad.map(g => renderGlassCard(g, 'bad')).join('')}
        </div>
      </section>

      <div class="fc-watermark">
        <div class="stamp">
          <span class="sparkle">✦</span>
          Maxlook Glow Up Scanner
          <span class="sparkle">✦</span>
        </div>
        <span class="sub">maxlook.id · personal glow-up coaching</span>
      </div>
    </div>
    `;

    return html;
  }

  function mount(el, opts) {
    if (!el) return;
    el.innerHTML = render(opts);
  }

  function renderStat(label, value, desc) {
    return `
      <div class="fc-stat">
        <div class="label">${escape(label)}</div>
        <div class="value">${escape(value)}</div>
        <div class="desc">${escape(desc || '')}</div>
      </div>`;
  }

  function renderColorCell(color, kind) {
    const hex = (color.hex || '#888888').toString();
    const label = color.label || (kind === 'good' ? 'Match' : 'Avoid');
    return `
      <div class="fc-color-cell ${kind}">
        <div class="fc-color-swatch" style="background:${escape(hex)}">
          <div class="label-pill">${escape(label)}</div>
        </div>
        <div class="fc-color-foot">
          <div class="name">${escape(color.name || 'Color')}</div>
          <div class="hex">${escape(hex.toUpperCase())}</div>
        </div>
      </div>`;
  }

  function renderStyleCard(style, kind, hairKey) {
    const name = style.name || 'Style';
    const reason = style.reason || (kind === 'good'
      ? 'Cocok dengan struktur wajah.'
      : 'Kurang menonjolkan fitur.');
    const icon = style.icon || (kind === 'good' ? '✨' : '🚫');

    const thumb = style.image
      ? `<img src="${escape(style.image)}" alt="${escape(name)}" crossorigin="anonymous">`
      : `<svg viewBox="0 0 100 130" xmlns="http://www.w3.org/2000/svg">
           <defs>
             <linearGradient id="g-${hashId(name)}" x1="0" y1="0" x2="1" y2="1">
               <stop offset="0%" stop-color="${kind === 'good' ? '#FFD27A' : '#5a5a5a'}" stop-opacity="0.7"/>
               <stop offset="100%" stop-color="${kind === 'good' ? '#FF6B4A' : '#2a2a2a'}" stop-opacity="0.9"/>
             </linearGradient>
           </defs>
           <rect width="100" height="130" fill="url(#g-${hashId(name)})"/>
           <circle cx="50" cy="55" r="22" fill="rgba(255,255,255,0.18)"/>
           <text x="50" y="62" text-anchor="middle" font-size="22" fill="white">${escape(icon)}</text>
           <text x="50" y="105" text-anchor="middle" font-size="9" font-weight="700" fill="rgba(255,255,255,0.85)" font-family="Inter,sans-serif">${escape((name||'').slice(0,16).toUpperCase())}</text>
         </svg>`;

    return `
      <div class="fc-style-card ${kind}">
        <div class="fc-style-thumb">
          ${thumb}
          <div class="badge">${escape(kind === 'good' ? (style.vibe || 'Suitable') : 'Avoid')}</div>
        </div>
        <div class="fc-style-foot">
          <div class="name">${escape(name)}</div>
          <div class="reason">${escape(reason)}</div>
        </div>
      </div>`;
  }

  function renderGlassCard(g, kind) {
    const shape = g.shape || 'Wayfarer';
    const svg = GLASSES_SVG[shape] || GLASSES_SVG.Wayfarer;
    const label = g.label || (kind === 'good' ? 'Best Fit' : 'Avoid');
    const name = `${shape}${g.frame_color ? ' · ' + g.frame_color : ''}`;
    const reason = g.reason || (kind === 'good' ? 'Cocok dengan bentuk wajah.' : 'Kurang seimbang.');

    // Color the frame based on the AI-supplied frame_color (default by kind)
    const frameStroke = kind === 'good'
      ? frameColorHex(g.frame_color)
      : 'rgba(255,80,80,0.7)';
    const bgGradient = kind === 'good'
      ? 'radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), rgba(0,0,0,0.6) 70%)'
      : 'radial-gradient(circle at 50% 35%, rgba(255,80,80,0.06), rgba(0,0,0,0.6) 70%)';

    return `
      <div class="fc-glass-card ${kind}">
        <div class="fc-glass-thumb" style="background:${bgGradient}">
          <div class="frame" style="color:${frameStroke}; width:78%; height:auto;">${svg}</div>
          <div class="badge">${escape(label)}</div>
        </div>
        <div class="fc-glass-foot">
          <div class="name">${escape(name)}</div>
          <div class="reason">${escape(reason)}</div>
        </div>
      </div>`;
  }

  function frameColorHex(name) {
    const map = {
      'Black':      '#1a1a1a',
      'Tortoise':   '#6b4226',
      'Dark Brown': '#3d2817',
      'Brown':      '#6b4226',
      'Navy':       '#1B2D4F',
      'Silver':     '#bababa',
      'Gold':       '#D4AF37',
      'Clear':      'rgba(255,255,255,0.6)',
      'White':      '#f0f0f0',
      'Red':        '#c44'
    };
    return map[name] || '#e8e8e8';
  }

  window.FaceCard = { render, mount };
})();
