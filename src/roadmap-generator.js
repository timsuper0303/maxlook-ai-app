// ═══════════════════════════════════════════════════════
// 30-Day Glow Up Roadmap Generator — output personalized HTML
// Input: user info + scan result
// Output: full HTML page printable, branded sesuai gender
// ═══════════════════════════════════════════════════════

function generateRoadmapHTML({ user, scan, result }) {
  const isWoman = user.gender === 'woman';
  const palette = isWoman
    ? { bg: '#FFF5F7', card: '#FFFFFF', accent: '#E8639A', accentDeep: '#B03070', text: '#3A1020', muted: 'rgba(58,16,32,0.6)', border: 'rgba(232,99,154,0.18)', success: '#00A044', successLight: '#00E060' }
    : { bg: '#0a0a0a', card: '#1a1a1a', accent: '#FF0000', accentDeep: '#ff6633', text: '#ffffff', muted: 'rgba(255,255,255,0.6)', border: 'rgba(255,0,0,0.18)', success: '#00ff8c', successLight: '#00ff8c' };

  const fontFamily = isWoman ? "'Playfair Display', serif" : "'Poppins', sans-serif";
  const sapaan = isWoman ? 'kamu' : 'lo';
  const greeting = isWoman ? 'Hai cantik' : 'Halo bro';

  // Generate weekly milestones (4 weeks)
  const baseScore = result.overall || 60;
  const targetScore = result.potential || (baseScore + 25);
  const w1 = Math.round(baseScore + (targetScore - baseScore) * 0.20);
  const w2 = Math.round(baseScore + (targetScore - baseScore) * 0.45);
  const w3 = Math.round(baseScore + (targetScore - baseScore) * 0.75);
  const w4 = targetScore;

  // Daily protocol generator
  const dailyAM = isWoman
    ? 'Selfie scan + skincare AM (5 step) + face yoga 10 menit (cheek lift + V-line)'
    : 'Selfie scan + skincare AM (4 step) + mewing posture awareness';
  const dailyPM = isWoman
    ? 'Skincare PM (4 step) + sleep tracker (7+ jam) + journaling 1 paragraf'
    : 'Skincare PM + jaw clench 50 reps + sleep optimization (7+ jam)';

  const weeklyTasks = isWoman
    ? [
        { week: 1, focus: 'Foundation', tasks: ['Setup skincare AM/PM dengan 5 produk lokal yang AI rekomen', 'Foundation face yoga: cheek lift + V-line jaw, 10 menit/hari', 'Sleep optimization: tidur sebelum jam 11 malam', 'Hydration: 2L air/hari, kurangi kafein', 'Re-scan day 7 untuk cek progress'] },
        { week: 2, focus: 'Eye Area + Glass Skin', tasks: ['Tambah eye area protocol: gentle massage 3 menit pagi', 'Mulai serum niacinamide AM (skin barrier repair)', 'Hindari processed sugar 7 hari (bantu skin glow)', 'Personal color test: coba 3 outfit dari palette AI', 'Re-scan day 14 — target skin_glow naik 8-12 poin'] },
        { week: 3, focus: 'V-Line + Symmetry', tasks: ['Intensify face yoga: tambah jaw clench + tongue posture', 'Postur tegak full day (cek tiap jam)', 'Mulai 1 outfit per hari sesuai personal color', 'Hairstyle/hijab match: praktekin 2 style yang AI saran', 'Re-scan day 21 — target jawline naik 15+ poin'] },
        { week: 4, focus: 'Polish + Lock In', tasks: ['Final glass skin push: serum vitamin C AM', 'Eye cream / under-eye protocol konsisten', 'Photo before-after Day 1 vs Day 30 di lighting sama', 'Outfit confidence test: pakai 7 outfit ideas selama 7 hari', 'Final re-scan Day 30 — target overall '+w4+' ✨'] }
      ]
    : [
        { week: 1, focus: 'Foundation', tasks: ['Setup skincare AM/PM dengan 4 produk lokal yang AI rekomen', 'Mewing protocol: tongue posture awareness full day', 'Sleep optimization: tidur sebelum jam 11 malam', 'Hydration: 2.5L air/hari, kurangi gula', 'Re-scan day 7 untuk cek baseline progress'] },
        { week: 2, focus: 'Jawline + Skin Glow', tasks: ['Jaw clench protocol: 50 reps × 3 set/hari', 'Tambah niacinamide serum AM (skin barrier)', 'Hindari junk food 7 hari (bantu skin clarity)', 'Personal color: coba 2-3 outfit dari palette earth tone', 'Re-scan day 14 — target jawline naik 10+ poin'] },
        { week: 3, focus: 'Symmetry + Posture', tasks: ['Postur tegak full day (cek tiap jam, foto cermin)', 'Facial symmetry exercise: chin up + neck tilt', 'Hairstyle match: praktekin gaya yg AI saran', 'Outfit per occasion: pakai 1 outfit/hari sesuai color map', 'Re-scan day 21 — target symmetry naik 12+ poin'] },
        { week: 4, focus: 'Aura + Lock In', tasks: ['Masculine aura push: posture + eye contact training', 'Final skincare push: SPF disiplin + serum vitamin C', 'Photo before-after Day 1 vs Day 30 di lighting sama', 'Outfit confidence test: 7 outfit ideas selama 7 hari', 'Final re-scan Day 30 — target overall '+w4+' 🔥'] }
      ];

  const improvements = (result.improvements || []).slice(0, 5);
  const skincareAM = (result.skincare_routine?.am || []).slice(0, 5);
  const skincarePM = (result.skincare_routine?.pm || []).slice(0, 5);
  const products = (result.skincare_routine?.products || []).slice(0, 5);
  const colors = (result.color_palette || []).slice(0, 12);
  const outfits = (result.outfit_ideas || []).slice(0, 7);
  const exercises = (isWoman ? result.face_yoga_focus : result.face_training_focus) || [];

  const generatedDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>30-Day Glow Up Roadmap — ${escape(user.name)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Poppins',sans-serif; background:${palette.bg}; color:${palette.text}; line-height:1.6; padding:20px; }
.container { max-width:920px; margin:0 auto; }
h1, h2, h3 { font-family:${fontFamily}; }
.cover { background:${palette.card}; border-radius:24px; padding:48px 32px; text-align:center; margin-bottom:24px; border:1px solid ${palette.border}; box-shadow:0 12px 48px rgba(0,0,0,0.08); }
.cover .badge { display:inline-block; padding:6px 16px; background:${palette.accent}22; color:${palette.accentDeep}; font-size:11px; font-weight:800; letter-spacing:0.15em; text-transform:uppercase; border-radius:50px; margin-bottom:16px; }
.cover h1 { font-size:38px; font-weight:800; margin-bottom:12px; line-height:1.15; }
.cover h1 .accent { background:linear-gradient(90deg, ${palette.accent}, ${palette.accentDeep}); -webkit-background-clip:text; background-clip:text; -webkit-text-fill-color:transparent; }
.cover .meta { font-size:14px; color:${palette.muted}; margin-bottom:24px; }
.cover .stats { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:14px; margin-top:24px; }
.cover .stat { background:${palette.bg}; padding:14px; border-radius:12px; }
.cover .stat .num { font-family:${fontFamily}; font-size:32px; font-weight:800; color:${palette.accent}; line-height:1; }
.cover .stat .lbl { font-size:11px; color:${palette.muted}; text-transform:uppercase; letter-spacing:0.1em; margin-top:4px; }
.section { background:${palette.card}; border-radius:20px; padding:32px 28px; margin-bottom:20px; border:1px solid ${palette.border}; box-shadow:0 6px 24px rgba(0,0,0,0.05); }
.section h2 { font-size:24px; font-weight:800; margin-bottom:8px; }
.section h2 .accent { color:${palette.accent}; }
.section .sub { font-size:13px; color:${palette.muted}; margin-bottom:20px; }
.scores-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; }
.score-card { background:${palette.bg}; padding:14px; border-radius:12px; }
.score-card .lbl { font-size:11px; color:${palette.muted}; text-transform:uppercase; letter-spacing:0.08em; }
.score-card .num { font-family:${fontFamily}; font-size:30px; font-weight:800; color:${palette.text}; }
.score-card .bar { height:5px; background:${palette.border}; border-radius:3px; overflow:hidden; margin-top:6px; }
.score-card .bar .fill { height:100%; background:linear-gradient(90deg, ${palette.accent}, ${palette.successLight}); }
.improvements { display:grid; gap:14px; }
.improvement-card { background:${palette.bg}; padding:16px; border-radius:12px; border-left:4px solid ${palette.accent}; }
.improvement-card .area { font-size:14px; font-weight:800; color:${palette.accentDeep}; margin-bottom:4px; }
.improvement-card .delta { display:inline-block; padding:2px 8px; background:${palette.accent}22; color:${palette.accentDeep}; font-size:11px; font-weight:700; border-radius:50px; margin-bottom:6px; font-family:'Poppins',monospace; }
.improvement-card .issue { font-size:13px; color:${palette.muted}; margin-bottom:6px; }
.improvement-card .protocol { font-size:13px; font-weight:600; color:${palette.text}; }
.weekly-timeline { display:grid; gap:16px; }
.week-card { background:${palette.bg}; padding:20px; border-radius:14px; border-left:4px solid ${palette.accent}; }
.week-card .week-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.week-card .week-num { font-family:${fontFamily}; font-size:18px; font-weight:800; color:${palette.accentDeep}; }
.week-card .week-target { padding:4px 10px; background:${palette.success}22; color:${palette.success}; font-size:11px; font-weight:800; border-radius:50px; font-family:'Poppins',monospace; }
.week-card .week-focus { font-size:13px; color:${palette.muted}; margin-bottom:10px; font-weight:600; }
.week-card ul { list-style:none; padding:0; }
.week-card ul li { padding:6px 0; padding-left:24px; position:relative; font-size:13px; }
.week-card ul li::before { content:'✓'; position:absolute; left:0; color:${palette.success}; font-weight:800; }
.daily-routine { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
@media(max-width:640px) { .daily-routine { grid-template-columns:1fr; } }
.routine-card { background:${palette.bg}; padding:16px; border-radius:12px; }
.routine-card h3 { font-size:14px; font-weight:800; margin-bottom:8px; color:${palette.accentDeep}; }
.routine-card ol { padding-left:20px; }
.routine-card ol li { font-size:13px; margin-bottom:4px; color:${palette.muted}; }
.product-list { display:grid; gap:8px; }
.product-row { display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:${palette.bg}; border-radius:10px; font-size:13px; }
.product-row .pname { font-weight:600; }
.product-row .pprice { color:${palette.accentDeep}; font-weight:700; font-family:'Poppins',monospace; }
.color-palette { display:grid; grid-template-columns:repeat(6,1fr); gap:8px; margin-bottom:16px; }
.color-swatch { aspect-ratio:1; border-radius:8px; position:relative; overflow:hidden; }
.color-swatch::after { content:attr(title); position:absolute; bottom:0; left:0; right:0; padding:3px; font-size:9px; background:rgba(0,0,0,0.6); color:white; text-align:center; opacity:0; transition:opacity 0.2s; }
.color-swatch:hover::after { opacity:1; }
.outfit-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
.outfit-card { background:${palette.bg}; padding:14px; border-radius:12px; }
.outfit-card .occasion { font-size:11px; font-weight:800; color:${palette.accent}; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:6px; }
.outfit-card .items { font-size:13px; margin-bottom:6px; line-height:1.5; }
.outfit-card .vibe { font-size:11px; color:${palette.muted}; font-style:italic; }
.exercise-list { display:grid; gap:10px; }
.exercise-row { padding:12px 14px; background:${palette.bg}; border-radius:10px; font-size:13px; padding-left:36px; position:relative; }
.exercise-row::before { content:'★'; position:absolute; left:14px; color:${palette.accent}; font-size:14px; }
.insight-box { background:linear-gradient(135deg, ${palette.accent}11, ${palette.accentDeep}11); border:1px solid ${palette.accent}33; padding:24px; border-radius:16px; }
.insight-box .label { font-size:11px; font-weight:800; color:${palette.accentDeep}; text-transform:uppercase; letter-spacing:0.1em; margin-bottom:8px; }
.insight-box .text { font-size:15px; line-height:1.6; }
.encourage-box { text-align:center; padding:30px 24px; background:linear-gradient(135deg, ${palette.success}11, ${palette.accent}11); border-radius:16px; margin-top:20px; }
.encourage-box p { font-size:16px; font-style:italic; font-weight:600; color:${palette.text}; }
.print-cta { text-align:center; margin:30px 0; }
.print-cta button { background:${palette.accent}; color:white; padding:14px 28px; border:none; border-radius:50px; font-size:14px; font-weight:800; cursor:pointer; }
.print-cta button:hover { background:${palette.accentDeep}; }
@media print { .print-cta { display:none; } body { padding:0; } .section, .cover { box-shadow:none; page-break-inside:avoid; } }
</style>
</head>
<body>
<div class="container">

  <!-- COVER -->
  <div class="cover">
    <div class="badge">📋 PERSONAL ROADMAP · ${user.gender === 'woman' ? 'MAXLOOK WOMAN' : 'MAXLOOK MAN'}</div>
    <h1>30-Day Glow Up<br><span class="accent">Roadmap</span></h1>
    <div class="meta">
      Untuk <strong>${escape(user.name)}</strong> · Generated ${generatedDate}<br>
      Scan #${scan.scan_number} · Auto-personalize berdasarkan AI face scan
    </div>
    <div class="stats">
      <div class="stat"><div class="num">${baseScore}</div><div class="lbl">Day 1 Skor</div></div>
      <div class="stat"><div class="num">${targetScore}</div><div class="lbl">Day 30 Target</div></div>
      <div class="stat"><div class="num">+${targetScore - baseScore}</div><div class="lbl">Projected Δ</div></div>
      <div class="stat"><div class="num">30</div><div class="lbl">Hari Program</div></div>
    </div>
  </div>

  <div class="print-cta" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
    <a href="javascript:history.back()" style="display:inline-flex;align-items:center;gap:6px;padding:12px 22px;background:transparent;border:1px solid ${palette.border};border-radius:50px;color:${palette.text};font-weight:700;font-size:13px;text-decoration:none;font-family:inherit;">← Kembali</a>
    <button onclick="window.print()" style="font-family:inherit;">🖨️ Print / Save as PDF</button>
  </div>

  <!-- SCAN RESULT -->
  <div class="section">
    <h2>Skor 5-Dimensi <span class="accent">Wajah ${sapaan}</span></h2>
    <p class="sub">Hasil AI scan detail per area. Track progress tiap minggu.</p>
    <div class="scores-grid">
      ${['skin_glow','symmetry','jawline','eye_area','harmony'].map(k => {
        const v = result.scores?.[k] || 0;
        const label = k.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
        return `<div class="score-card"><div class="lbl">${label}</div><div class="num">${v}</div><div class="bar"><div class="fill" style="width:${v}%"></div></div></div>`;
      }).join('')}
    </div>
  </div>

  ${improvements.length ? `<!-- IMPROVEMENTS -->
  <div class="section">
    <h2>Top <span class="accent">${improvements.length} Area Fix</span></h2>
    <p class="sub">Area yang AI deteksi paling impact ke overall skor ${sapaan}.</p>
    <div class="improvements">
      ${improvements.map(imp => `
        <div class="improvement-card">
          <div class="area">${escape(imp.area || '')}</div>
          <span class="delta">${imp.current || '?'} → ${imp.target || '?'} (+${(imp.target||0)-(imp.current||0)} poin)</span>
          <div class="issue">${escape(imp.issue || '')}</div>
          <div class="protocol">📋 ${escape(imp.protocol || '')}</div>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  <!-- WEEKLY TIMELINE -->
  <div class="section">
    <h2>Timeline <span class="accent">4 Minggu</span></h2>
    <p class="sub">Kerjain task tiap minggu, re-scan akhir minggu untuk track progress.</p>
    <div class="weekly-timeline">
      ${weeklyTasks.map((wk, idx) => {
        const target = [w1, w2, w3, w4][idx];
        return `
        <div class="week-card">
          <div class="week-header">
            <span class="week-num">Week ${wk.week} · ${wk.focus}</span>
            <span class="week-target">Target: ${target}/100</span>
          </div>
          <ul>
            ${wk.tasks.map(t => `<li>${escape(t)}</li>`).join('')}
          </ul>
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- DAILY ROUTINE -->
  <div class="section">
    <h2>Daily <span class="accent">Routine</span></h2>
    <p class="sub">10-15 menit/hari, konsisten 30 hari.</p>
    <div class="daily-routine">
      <div class="routine-card">
        <h3>☀️ Pagi (5-7 menit)</h3>
        <ol>
          <li>${escape(dailyAM)}</li>
          ${skincareAM.map(s => `<li>${escape(s)}</li>`).join('')}
        </ol>
      </div>
      <div class="routine-card">
        <h3>🌙 Malam (5-8 menit)</h3>
        <ol>
          <li>${escape(dailyPM)}</li>
          ${skincarePM.map(s => `<li>${escape(s)}</li>`).join('')}
        </ol>
      </div>
    </div>
  </div>

  ${products.length ? `<!-- SKINCARE PRODUCTS -->
  <div class="section">
    <h2>Skincare <span class="accent">Stack ${sapaan}</span></h2>
    <p class="sub">Produk lokal yang AI rekomen sesuai skin type ${sapaan} (${result.skin_type || 'combination'}).</p>
    <div class="product-list">
      ${products.map(p => `
        <div class="product-row">
          <span class="pname"><strong>${escape(p.name || '')}</strong> ${p.brand ? '· ' + escape(p.brand) : ''} ${p.for_step ? '<small style="color:'+palette.muted+'">('+escape(p.for_step)+')</small>' : ''}</span>
          <span class="pprice">~Rp${(p.price_idr || 0).toLocaleString('id-ID')}</span>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  ${colors.length ? `<!-- PERSONAL COLOR -->
  <div class="section">
    <h2>Personal <span class="accent">Color · ${escape(result.season || '')}</span></h2>
    <p class="sub">Undertone <strong>${escape(result.undertone || 'neutral')}</strong> · 12-warna yang paling complement skin tone ${sapaan}.</p>
    <div class="color-palette">
      ${colors.map(c => `<div class="color-swatch" style="background:${escape(c.hex || '#888')};" title="${escape(c.name || '')}"></div>`).join('')}
    </div>
    ${result.colors_to_avoid?.length ? `
      <p style="font-size:13px; color:${palette.muted}; margin-top:8px;"><strong>⚠️ Hindari:</strong> ${result.colors_to_avoid.map(c => escape(c.name)).join(', ')} — wash out undertone ${sapaan}.</p>
    ` : ''}
  </div>` : ''}

  ${outfits.length ? `<!-- OUTFIT IDEAS -->
  <div class="section">
    <h2>7 Outfit <span class="accent">Ideas Personal</span></h2>
    <p class="sub">Per occasion, auto-match sama personal color ${sapaan}.</p>
    <div class="outfit-grid">
      ${outfits.map(o => `
        <div class="outfit-card">
          <div class="occasion">${escape(o.occasion || '')}</div>
          <div class="items">${(o.items || []).map(i => escape(i)).join(' · ')}</div>
          <div class="vibe">${escape(o.vibe || '')}</div>
        </div>
      `).join('')}
    </div>
  </div>` : ''}

  ${exercises.length ? `<!-- FACE YOGA / TRAINING -->
  <div class="section">
    <h2>${isWoman ? 'Face Yoga' : 'Face Training'} <span class="accent">Focus</span></h2>
    <p class="sub">Latihan harian — 10-15 menit. Konsisten = hasil real.</p>
    <div class="exercise-list">
      ${exercises.map(e => `<div class="exercise-row">${escape(e)}</div>`).join('')}
    </div>
  </div>` : ''}

  <!-- KEY INSIGHT -->
  ${result.key_insight ? `<div class="section"><div class="insight-box"><div class="label">💡 Key Insight</div><div class="text">${escape(result.key_insight)}</div></div></div>` : ''}

  <!-- ENCOURAGEMENT -->
  ${result.encouragement ? `<div class="encourage-box"><p>${escape(result.encouragement)}</p></div>` : ''}

  <!-- NEXT STEP RESOURCES -->
  <div class="section" style="margin-top:24px;">
    <h2>Resource <span class="accent">Lanjutan</span></h2>
    <p class="sub">Akses lifetime — buka kapan aja untuk panduan lebih lengkap.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:14px;">
      <a href="/dashboard" style="display:block;padding:18px;background:rgba(${isWoman ? '232,99,154' : '255,0,0'},0.05);border:1px solid ${palette.border};border-radius:14px;text-decoration:none;color:${palette.text};text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">🏠</div>
        <div style="font-weight:800;font-size:13px;margin-bottom:2px;">Dashboard</div>
        <div style="font-size:11px;color:${palette.muted};">Liat scan history & status</div>
      </a>
      <a href="${isWoman ? '/bible-woman' : '/bible-man'}" style="display:block;padding:18px;background:rgba(${isWoman ? '232,99,154' : '255,0,0'},0.05);border:1px solid ${palette.border};border-radius:14px;text-decoration:none;color:${palette.text};text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">📕</div>
        <div style="font-weight:800;font-size:13px;margin-bottom:2px;">Glow Up Bible</div>
        <div style="font-size:11px;color:${palette.muted};">Long-form guide</div>
      </a>
      <a href="${isWoman ? '/workbook-woman' : '/workbook-man'}" style="display:block;padding:18px;background:rgba(${isWoman ? '232,99,154' : '255,0,0'},0.05);border:1px solid ${palette.border};border-radius:14px;text-decoration:none;color:${palette.text};text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">📝</div>
        <div style="font-weight:800;font-size:13px;margin-bottom:2px;">Action Workbook</div>
        <div style="font-size:11px;color:${palette.muted};">Daily checklist</div>
      </a>
      <a href="javascript:history.back()" style="display:block;padding:18px;background:rgba(${isWoman ? '232,99,154' : '255,0,0'},0.05);border:1px solid ${palette.border};border-radius:14px;text-decoration:none;color:${palette.text};text-align:center;">
        <div style="font-size:28px;margin-bottom:6px;">↩</div>
        <div style="font-weight:800;font-size:13px;margin-bottom:2px;">Kembali ke Hasil</div>
        <div style="font-size:11px;color:${palette.muted};">Liat detail scan</div>
      </a>
    </div>
  </div>

  <div class="print-cta" style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;">
    <a href="javascript:history.back()" style="display:inline-flex;align-items:center;gap:6px;padding:12px 22px;background:transparent;border:1px solid ${palette.border};border-radius:50px;color:${palette.text};font-weight:700;font-size:13px;text-decoration:none;font-family:inherit;">← Kembali ke Hasil Scan</a>
    <button onclick="window.print()" style="font-family:inherit;">🖨️ Print / Save as PDF</button>
  </div>

  <p style="text-align:center; font-size:11px; color:${palette.muted}; margin-top:30px; font-style:italic;">
    Generated ${generatedDate} · Maxlook AI Scanner · Re-scan available 7 hari lagi · Hubungi admin via WhatsApp untuk Q&amp;A.
  </p>

</div>
</body>
</html>`;
}

function escape(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

module.exports = { generateRoadmapHTML };
