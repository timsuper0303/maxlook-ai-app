/* ═══════════════════════════════════════════════════════
   Maxlook Result Page Renderer
   - Twibbon SVG overlay
   - Animated score gauges
   - Radar chart (Chart.js)
   - Personal color, skincare, outfit, exercises, timeline
   - Detailed Report expandable
   ═══════════════════════════════════════════════════════ */

(function () {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || localStorage.getItem('maxlook_token');
  const scanId = params.get('id');
  if (!token) { window.location.href = '/'; return; }

  const root = document.getElementById('root');
  const backLink = document.getElementById('backLink');
  if (backLink) backLink.href = '/dashboard?token=' + encodeURIComponent(token);

  const escape = s => String(s || '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

  // Severity → color mapping
  const sevColor = (sev) => ({
    severe: '#ff3344',
    moderate: '#ffb000',
    mild: '#00e060'
  })[sev] || '#888';

  const sevGlow = (sev) => ({
    severe: 'rgba(255,51,68,0.5)',
    moderate: 'rgba(255,176,0,0.5)',
    mild: 'rgba(0,224,96,0.5)'
  })[sev] || 'rgba(136,136,136,0.5)';

  // ── Load data ─────────────────────────────────────────────
  async function load() {
    try {
      const meRes = await fetch('/api/me', { headers: { 'X-Maxlook-Token': token } });
      const meData = await meRes.json();
      if (!meRes.ok) { window.location.href = '/'; return; }
      const user = meData.user;
      document.body.classList.toggle('woman', user.gender === 'woman');
      document.documentElement.setAttribute('data-variant', user.gender);

      const url = scanId ? `/api/scans/${scanId}` : '/api/scans/latest';
      const res = await fetch(url, { headers: { 'X-Maxlook-Token': token } });
      if (!res.ok) {
        root.innerHTML = '<div class="card-elevated" style="margin-top:24px"><h2>Belum ada scan</h2><p style="margin-top:8px;color:var(--m-text-muted)">Buka <a href="/scan?token=' + encodeURIComponent(token) + '">/scan</a> untuk mulai.</p></div>';
        return;
      }
      const data = await res.json();
      const scan = data.scan;
      const scanContext = data.scan_context || null;
      const result = scan.raw_result || {};
      render(user, scan, result, scanContext);
    } catch (err) {
      console.error('[result] Load error:', err);
      root.innerHTML = '<div class="card-elevated" style="margin-top:24px"><h2>Error loading scan</h2><p>' + escape(err.message) + '</p></div>';
    }
  }

  // Closure-scoped refs so MX action handlers can access latest state
  let _lastUser = null, _lastScan = null, _lastResult = null, _lastCtx = null;

  // ── MAIN RENDER ───────────────────────────────────────────
  function render(user, scan, result, scanContext) {
    _lastUser = user; _lastScan = scan; _lastResult = result; _lastCtx = scanContext;
    const isWoman = user.gender === 'woman';
    const sapaan = isWoman ? 'kamu' : 'lo';
    const variantLabel = isWoman ? 'Woman' : 'Man';
    const photoUrl = scan.image_path || result.image_path || '';
    const topConcerns = result.top_concerns || [];
    const annotationZones = result.annotation_zones || topConcerns.map(c => ({
      label: c.name,
      coords_normalized: c.coords_normalized,
      severity: c.severity,
      color: sevColor(c.severity)
    }));

    // Photo quality warning — AI flagged photo as needs-retake
    const pq = result.photo_quality || {};
    const photoWarning = pq.should_retake ? `
      <div class="photo-quality-banner anim-fade-up" style="margin:16px 0;padding:14px 18px;background:linear-gradient(135deg,rgba(255,176,0,0.12),rgba(255,176,0,0.04));border:1px solid rgba(255,176,0,0.35);border-radius:14px;display:flex;align-items:flex-start;gap:12px">
        <div style="font-size:22px">⚠️</div>
        <div style="flex:1">
          <div style="font-weight:800;font-size:13px;color:#ffb000;margin-bottom:4px;letter-spacing:0.05em">Foto kurang ideal untuk tracking</div>
          <div style="font-size:12px;color:var(--m-text-secondary);line-height:1.5;margin-bottom:8px">
            ${escape(pq.reason || pq.retake_reason || 'AI mendeteksi pencahayaan/angle kurang optimal. Untuk hasil tracking minggu ke minggu yang akurat, sebaiknya scan ulang.')}
          </div>
          <a href="/scan?token=${encodeURIComponent(token)}" style="display:inline-block;padding:6px 14px;background:#ffb000;color:#000;border-radius:999px;font-size:11px;font-weight:800;text-decoration:none;letter-spacing:0.05em">↻ Scan Ulang</a>
        </div>
      </div>` : '';

    root.innerHTML = `
      ${photoWarning}
      <!-- HERO — Score Card (visible langsung after scan) -->
      <section class="hero">
        <div id="scoreCardMount" class="anim-fade-up"></div>
        <p class="meta anim-fade-up anim-delay-2" style="text-align:center;margin-top:12px">
          Scan #${scan.scan_number} · ${new Date(scan.created_at).toLocaleString('id-ID')}
        </p>
      </section>

      <!-- Facecard Poster (Personal Style & Face Analysis) -->
      <section class="hero" style="margin-top:32px;padding:8px 0">
        <div id="facecardMount" class="anim-fade-up"></div>
        <div class="facecard-actions anim-fade-up anim-delay-2">
          <button class="btn primary" onclick="window.MX.downloadFullReport()">📄 Download Lengkap (PDF)</button>
          <button class="btn" onclick="window.MX.downloadFacecard()">🖼️ Facecard PNG</button>
          <button class="btn" onclick="window.MX.shareTwibbon()">📤 Share</button>
        </div>
      </section>

      ${result.key_insight ? `
      <div class="insight anim-fade-up">
        <div class="lbl">💡 Key Insight</div>
        <div class="text">${escape(result.key_insight)}</div>
      </div>` : ''}

      <!-- SCORE GAUGES -->
      <div class="scores-grid">
        <div class="gauge current anim-scale-in">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
            <circle id="gaugeCurrentArc" cx="50" cy="50" r="44" fill="none" stroke="url(#grad-current)" stroke-width="8" stroke-linecap="round" stroke-dasharray="276" stroke-dashoffset="276" transform="rotate(-90 50 50)"/>
            <defs>
              <linearGradient id="grad-current" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="var(--m-primary)"/>
                <stop offset="100%" stop-color="var(--m-accent)"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="gauge-num" id="gaugeCurrentNum">0</div>
          <div class="gauge-lbl">Current Score</div>
        </div>
        <div class="gauge potential anim-scale-in anim-delay-1">
          <svg class="gauge-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="8"/>
            <circle id="gaugePotentialArc" cx="50" cy="50" r="44" fill="none" stroke="url(#grad-potential)" stroke-width="8" stroke-linecap="round" stroke-dasharray="276" stroke-dashoffset="276" transform="rotate(-90 50 50)"/>
            <defs>
              <linearGradient id="grad-potential" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="var(--m-success)"/>
                <stop offset="100%" stop-color="var(--m-primary)"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="gauge-num" id="gaugePotentialNum">0</div>
          <div class="gauge-lbl">Glow Up Potential</div>
          <div class="gauge-delta" id="gaugeDelta">+0 pts</div>
        </div>
      </div>

      <!-- RADAR CHART -->
      <div class="radar-card anim-fade-up">
        <h2 class="section-h" style="margin-bottom:8px">5-Dimensi <span class="accent">Analysis</span></h2>
        <p class="desc" style="font-size:13px;color:var(--m-text-muted);margin-bottom:16px">Liat skor ${sapaan} per dimensi vs glow-up potential setelah 30-hari protokol.</p>
        <div class="radar-wrap"><canvas id="radarChart"></canvas></div>
        <div class="radar-legend">
          <div class="lg-item"><span class="lg-dot lg-current"></span> Current</div>
          <div class="lg-item"><span class="lg-dot lg-potential"></span> Potential</div>
        </div>
      </div>

      <!-- TOP 7 CONCERNS -->
      ${topConcerns.length ? `
      <section class="concerns-section anim-fade-up">
        <h2 class="section-h">Top <span class="accent">${topConcerns.length} Area Fix</span></h2>
        <p class="desc" style="font-size:13px;color:var(--m-text-muted);margin-bottom:16px">Ranked dari paling impact. Tap ke kartu untuk detail. Setiap area udah dipanah ke foto ${sapaan} di atas.</p>
        <div class="concerns-grid">
          ${topConcerns.map((c, i) => `
            <div class="concern-card anim-fade-up anim-delay-${Math.min(i, 5)}"
                 style="--card-color:${sevColor(c.severity)};--card-glow:${sevGlow(c.severity)}"
                 onclick="window.MX.highlightZone('${c.id}')">
              <div class="rank-bubble">${c.rank || i+1}</div>
              <div class="area">
                <span>${escape(c.name)}</span>
                <span class="sev-badge sev-${c.severity}">${c.severity}</span>
              </div>
              <div class="issue">${escape(c.issue || '')}</div>
              <div class="protocol">📋 ${escape(c.protocol || '')}</div>
              <div class="impact">
                <span>⏱ ${c.duration_days || 30} hari</span>
                ${c.impact_on_overall_score ? `<span style="color:var(--m-success);font-weight:700">+${c.impact_on_overall_score} pts</span>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </section>` : ''}

      <!-- DETAILED REPORT — expandable with glow hint -->
      ${(result.detailed_concerns || []).length ? `
      <button class="report-toggle glow-hint" id="reportToggle" onclick="window.MX.toggleReport()">
        <span class="label">
          <span class="ic">📊</span>
          <span>
            Detailed Report — <span style="color:var(--m-primary)">${result.detailed_concerns.length} concerns</span> dianalisis
            <div class="meta">Tap untuk liat semua kategori: skin, eye, struktur, aging, proporsi, dll</div>
          </span>
        </span>
        <span class="chevron click-arrow">›</span>
      </button>
      <div class="report-body" id="reportBody"></div>` : ''}

      <!-- PERSONAL COLOR -->
      ${(result.color_palette || []).length ? `
      <section class="section anim-fade-up">
        <h2>Personal <span class="accent">Color</span></h2>
        <p class="desc">12-warna palette + warna yang harus ${sapaan} hindari, berdasarkan undertone & season.</p>
        <span class="season-tag">${escape(result.season || '')} · ${escape((result.undertone || '').toUpperCase())}</span>
        <div class="subhead">✓ Warna yang cocok</div>
        <div class="palette">
          ${result.color_palette.map(c => `
            <div class="swatch" style="background:${escape(c.hex || '#ccc')};"
                 onclick="navigator.clipboard.writeText('${escape(c.hex)}'); window.MX.toast('Copied: ${escape(c.hex)}')">
              <div class="lbl">${escape(c.name || c.hex)}</div>
            </div>`).join('')}
        </div>
        ${(result.colors_to_avoid || []).length ? `
          <div class="subhead">✗ Hindari warna ini</div>
          <div class="avoid-list">
            ${result.colors_to_avoid.map(c => `
              <div class="avoid-row">
                <div class="dot" style="background:${escape(c.hex || '#999')}"></div>
                <div class="info">
                  <div class="name">${escape(c.name || '')} · ${escape(c.hex || '')}</div>
                  <div class="reason">${escape(c.reason || '')}</div>
                </div>
              </div>`).join('')}
          </div>` : ''}
      </section>` : ''}

      <!-- SKINCARE FLOW -->
      ${result.skincare_routine ? renderSkincare(result.skincare_routine) : ''}

      <!-- OUTFIT IDEAS -->
      ${(result.outfit_ideas || []).length ? `
      <section class="section anim-fade-up">
        <h2>Outfit <span class="accent">Ideas</span></h2>
        <p class="desc">Sesuai personal color & body type, per occasion.</p>
        <div class="outfits">
          ${result.outfit_ideas.map(o => `
            <div class="outfit">
              <div class="occ">${escape(o.occasion || '')}</div>
              <div class="vibe">${escape(o.vibe || '')}</div>
              <ul>${(o.items || []).map(i => `<li>${escape(i)}</li>`).join('')}</ul>
            </div>`).join('')}
        </div>
      </section>` : ''}

      <!-- FACE YOGA / TRAINING -->
      ${(() => {
        const ex = result.face_yoga_focus || result.face_training_focus || [];
        if (!ex.length) return '';
        return `
        <section class="section anim-fade-up">
          <h2>${isWoman ? 'Face Yoga' : 'Face Training'} <span class="accent">Focus</span></h2>
          <p class="desc">5-7 menit/hari, hasil keliatan dalam 14-21 hari konsisten.</p>
          <div class="exercises">
            ${ex.map((e, i) => `
              <div class="exercise">
                <div class="num">${i+1}</div>
                <div class="text">${escape(e)}</div>
              </div>`).join('')}
          </div>
        </section>`;
      })()}

      <!-- 30-DAY TIMELINE -->
      <section class="section anim-fade-up">
        <h2>30-Day <span class="accent">Timeline</span></h2>
        <p class="desc">Milestone per 7-hari. ${sapaan === 'kamu' ? 'Kamu' : 'Lo'} bisa re-scan tiap minggu untuk track progress.</p>
        <div class="timeline">
          <div class="timeline-track">
            ${Array.from({length: 31}, (_, d) => {
              const isMile = d === 0 || d === 7 || d === 14 || d === 21 || d === 30;
              const lbl = d === 0 ? 'Today' : d === 7 ? 'Week 1' : d === 14 ? 'Week 2' : d === 21 ? 'Week 3' : d === 30 ? 'Final' : `D${d}`;
              return `
                <div class="tl-day ${isMile ? 'milestone' : ''}">
                  <div class="dot"></div>
                  <div class="lbl">${lbl}</div>
                </div>`;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- ACTION CARDS -->
      <section class="section anim-fade-up">
        <h2>Lanjut <span class="accent">Step-by-Step</span></h2>
        <p class="desc">Resource lengkap buat ${sapaan} aplikasiin protokol harian.</p>
        <div class="actions-grid">
          <a href="/api/roadmap?token=${encodeURIComponent(token)}" target="_blank" class="action-card glow-hint">
            <span class="ic">📋</span>
            <div class="ttl">30-Day Roadmap</div>
            <div class="meta">Personalized plan</div>
          </a>
          <a href="${isWoman ? '/bible-woman' : '/bible-man'}" class="action-card">
            <span class="ic">📕</span>
            <div class="ttl">Glow Up Bible</div>
            <div class="meta">Long-form guide</div>
          </a>
          <a href="${isWoman ? '/workbook-woman' : '/workbook-man'}" class="action-card">
            <span class="ic">📝</span>
            <div class="ttl">Action Workbook</div>
            <div class="meta">Daily checklist</div>
          </a>
          <a href="/scan?token=${encodeURIComponent(token)}" class="action-card">
            <span class="ic">🔄</span>
            <div class="ttl">Re-scan</div>
            <div class="meta">Track progress</div>
          </a>
        </div>
      </section>

      ${result.encouragement ? `
      <div class="encourage anim-fade-up">
        <p>"${escape(result.encouragement)}"</p>
      </div>` : ''}

      <!-- Toast container -->
      <div id="toast" style="position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:var(--m-gradient-hero);color:#fff;padding:12px 20px;border-radius:50px;font-weight:700;font-size:13px;opacity:0;transition:all 250ms;pointer-events:none;z-index:100;"></div>
    `;

    // Post-render: mount facecard + score card + animate gauges + render charts
    setTimeout(() => {
      // ── Mount Umax-style SCORE CARD hero (FIRST — most important visible) ──
      try {
        const mountEl = document.getElementById('scoreCardMount');
        if (mountEl && typeof ScoreCard !== 'undefined') {
          const overall = scan.overall_score || result.overall || 0;
          const potential = scan.potential_score || result.potential || 0;
          const cachedPhoto = sessionStorage.getItem('maxlook_last_scan_photo')
            || localStorage.getItem('maxlook_last_scan_photo');
          ScoreCard.mount(mountEl, {
            photoUrl: cachedPhoto || photoUrl || null,
            name: user.name || 'Your Score',
            subtitle: `Hasil Scan · Skor ${overall} / 100`,
            gender: user.gender,
            scanContext: scanContext,
            scores: {
              overall: overall,
              potential: potential,
              masculinity: result.lemon8_analysis?.masculinity_score || result.scores?.harmony || overall,
              femininity: result.lemon8_analysis?.femininity_score || result.scores?.harmony || overall,
              skin_quality: scan.skin_glow || result.scores?.skin_glow || overall,
              jawline: scan.jawline || result.scores?.jawline || overall,
              cheekbones: result.bone_structure?.facial_harmony_score || result.scores?.harmony || overall
            }
          });
        } else if (typeof ScoreCard === 'undefined') {
          console.error('[result] ScoreCard global not loaded');
        }
      } catch (e) {
        console.error('[result] ScoreCard mount failed:', e);
      }

      // ── Mount FACECARD (Personal Style & Face Analysis poster) ──
      try {
        const fcMount = document.getElementById('facecardMount');
        if (fcMount && typeof FaceCard !== 'undefined') {
          const cachedPhoto = sessionStorage.getItem('maxlook_last_scan_photo')
            || localStorage.getItem('maxlook_last_scan_photo');
          FaceCard.mount(fcMount, {
            photoUrl: cachedPhoto || photoUrl || null,
            user: user,
            scan: scan,
            result: result,
            variantTone: isWoman ? 'woman' : 'man'
          });
        } else if (typeof FaceCard === 'undefined') {
          console.error('[result] FaceCard global not loaded');
        }
      } catch (e) {
        console.error('[result] FaceCard mount failed:', e);
      }

      // ── Score animations ──
      try {
        animateGauge('gaugeCurrentArc', 'gaugeCurrentNum', scan.overall_score || result.overall || 0, 1500);
        animateGauge('gaugePotentialArc', 'gaugePotentialNum', scan.potential_score || result.potential || 0, 1500, 300);
        animateScoreFooter(scan.overall_score || result.overall || 0, scan.potential_score || result.potential || 0);
        const delta = (scan.potential_score || result.potential || 0) - (scan.overall_score || result.overall || 0);
        const deltaEl = document.getElementById('gaugeDelta');
        if (deltaEl) deltaEl.textContent = `+${Math.round(delta)} pts`;
      } catch (e) {
        console.error('[result] Gauge animation failed:', e);
      }

      try { renderTwibbonOverlay(annotationZones, photoUrl); } catch (e) { console.error('[result] Twibbon:', e); }
      try { renderRadarChart(scan, result); } catch (e) { console.error('[result] Radar:', e); }
      try { renderDetailedReport(result.detailed_concerns || []); } catch (e) { console.error('[result] DetailedReport:', e); }
    }, 100);
  }

  // ── SKINCARE FLOW renderer ───────────────────────────────
  function renderSkincare(routine) {
    const am = routine.am || [];
    const pm = routine.pm || [];
    const products = routine.products || [];
    const stepIc = (txt) => {
      const t = (txt || '').toLowerCase();
      if (t.includes('cleans')) return '🧼';
      if (t.includes('toner')) return '💧';
      if (t.includes('serum')) return '💉';
      if (t.includes('moistur')) return '🧴';
      if (t.includes('spf') || t.includes('sun')) return '☀️';
      if (t.includes('eye')) return '👁';
      if (t.includes('mask')) return '😷';
      if (t.includes('exfo')) return '🧪';
      return '✨';
    };
    return `
      <section class="section anim-fade-up">
        <h2>Skincare <span class="accent">Routine</span></h2>
        <p class="desc">AM (pagi) & PM (malam) routine dengan rekomendasi produk lokal Indonesia.</p>
        <div class="routine-tabs" id="routineTabs">
          <button class="active" data-tab="am" onclick="window.MX.switchRoutineTab('am')">☀️ AM</button>
          <button data-tab="pm" onclick="window.MX.switchRoutineTab('pm')">🌙 PM</button>
        </div>
        <div class="flow" id="routineFlowAM">
          ${am.map((s, i) => `
            <div class="step" style="animation-delay:${i*80}ms" class="anim-scale-in">
              <span class="step-num">${i+1}</span>
              <div class="step-ic">${stepIc(s)}</div>
              <div class="step-name">${escape(s)}</div>
            </div>
            ${i < am.length - 1 ? '<div class="step-arr">→</div>' : ''}
          `).join('')}
        </div>
        <div class="flow" id="routineFlowPM" style="display:none">
          ${pm.map((s, i) => `
            <div class="step">
              <span class="step-num">${i+1}</span>
              <div class="step-ic">${stepIc(s)}</div>
              <div class="step-name">${escape(s)}</div>
            </div>
            ${i < pm.length - 1 ? '<div class="step-arr">→</div>' : ''}
          `).join('')}
        </div>
        ${products.length ? `
          <div class="subhead" style="margin-top:24px">🛍 Produk Rekomendasi</div>
          <div class="products">
            ${products.map(p => `
              <div class="product-row">
                <div class="left">
                  <div class="name">${escape(p.name || '')}</div>
                  <div class="brand">${escape(p.brand || '')}${p.for_step ? ' · ' + escape(p.for_step) : ''}</div>
                </div>
                <div class="price">${p.price_idr ? 'Rp' + Number(p.price_idr).toLocaleString('id-ID') : ''}</div>
              </div>`).join('')}
          </div>` : ''}
      </section>`;
  }

  // ── TWIBBON SVG OVERLAY ──────────────────────────────────
  function renderTwibbonOverlay(zones, photoUrl) {
    const overlay = document.getElementById('twibbonOverlay');
    if (!overlay || !zones.length) return;

    // Calculate label positions (push away from face center to avoid overlap)
    const cards = zones.slice(0, 7).map((z, i) => {
      const cx = z.coords_normalized?.x ?? 0.5;
      const cy = z.coords_normalized?.y ?? 0.5;
      // Distribute labels around perimeter — pick edge based on quadrant
      const isLeft = cx < 0.5;
      const isTop = cy < 0.5;
      const labelX = isLeft ? Math.max(0.02, cx - 0.30) : Math.min(0.98, cx + 0.30);
      const labelY = cy + (i % 2 === 0 ? -0.04 : 0.04);
      return { ...z, cx, cy, labelX, labelY: Math.max(0.05, Math.min(0.85, labelY)) };
    });

    overlay.innerHTML = `
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow"><feGaussianBlur stdDeviation="0.4" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        ${cards.map((c, i) => `
          <g style="animation: fadeIn 600ms ease-out ${i*150 + 800}ms both">
            <circle cx="${c.cx*100}" cy="${c.cy*100}" r="1.5" fill="${c.color}" filter="url(#glow)">
              <animate attributeName="r" values="1.5;2.5;1.5" dur="1.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="1;0.6;1" dur="1.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="${c.cx*100}" cy="${c.cy*100}" r="0.8" fill="#fff"/>
            <line x1="${c.cx*100}" y1="${c.cy*100}" x2="${c.labelX*100}" y2="${c.labelY*100}"
                  stroke="${c.color}" stroke-width="0.4" stroke-dasharray="0.8,0.4" opacity="0.85" filter="url(#glow)"/>
          </g>
        `).join('')}
      </svg>
      ${cards.map((c, i) => {
        const tX = c.labelX * 100;
        const tY = c.labelY * 100;
        const align = c.labelX < 0.5 ? 'right' : 'left';
        return `
          <div class="anno-card" style="
              position:absolute;
              ${align === 'right' ? 'right' : 'left'}: ${align === 'right' ? (100 - tX) : tX}%;
              top: ${tY}%;
              transform: translate(${align === 'right' ? '' : '0'}, -50%);
              color: ${c.color};
              animation: fadeInUp 500ms ease-out ${i*150 + 1000}ms both;
              max-width: 150px;
            ">
            <span class="anno-sev"></span>
            <span>${escape(c.label)}</span>
          </div>`;
      }).join('')}
    `;
  }

  // ── ANIMATED GAUGE ───────────────────────────────────────
  function animateGauge(arcId, numId, target, duration = 1200, delay = 0) {
    setTimeout(() => {
      const arc = document.getElementById(arcId);
      const num = document.getElementById(numId);
      if (!arc || !num) return;
      const circumference = 2 * Math.PI * 44;
      const targetOffset = circumference - (target / 100) * circumference;
      arc.style.transition = `stroke-dashoffset ${duration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      arc.style.strokeDashoffset = targetOffset;
      const startTs = performance.now();
      const tick = (ts) => {
        const elapsed = ts - startTs;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        num.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);
  }

  function animateScoreFooter(current, potential) {
    const c = document.getElementById('scoreCurrent');
    const p = document.getElementById('scorePotential');
    if (c) animateNum(c, current, 1500);
    if (p) setTimeout(() => animateNum(p, potential, 1500), 300);
  }
  function animateNum(el, target, duration) {
    const startTs = performance.now();
    const tick = (ts) => {
      const progress = Math.min((ts - startTs) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // ── RADAR CHART ──────────────────────────────────────────
  function renderRadarChart(scan, result) {
    const canvas = document.getElementById('radarChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const labels = ['Skin Glow', 'Symmetry', 'Jawline', 'Eye Area', 'Harmony'];
    const current = [
      scan.skin_glow || result.scores?.skin_glow || 0,
      scan.symmetry || result.scores?.symmetry || 0,
      scan.jawline || result.scores?.jawline || 0,
      scan.eye_area || result.scores?.eye_area || 0,
      scan.harmony || result.scores?.harmony || 0
    ].map(Number);
    const potential = current.map(s => Math.min(100, Math.round(s + 8 + Math.random() * 8)));

    const isWoman = document.body.classList.contains('woman');
    const primary = isWoman ? '#E8639A' : '#FF0000';
    const success = isWoman ? '#00A044' : '#00ff8c';
    const textColor = isWoman ? 'rgba(58,16,32,0.7)' : 'rgba(255,255,255,0.7)';
    const gridColor = isWoman ? 'rgba(232,99,154,0.15)' : 'rgba(255,255,255,0.08)';

    new Chart(canvas, {
      type: 'radar',
      data: {
        labels,
        datasets: [
          {
            label: 'Current',
            data: current,
            backgroundColor: primary + '33',
            borderColor: primary,
            borderWidth: 2,
            pointBackgroundColor: primary,
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
            pointRadius: 4
          },
          {
            label: 'Potential',
            data: potential,
            backgroundColor: success + '22',
            borderColor: success,
            borderWidth: 2,
            borderDash: [5, 4],
            pointBackgroundColor: success,
            pointBorderColor: '#fff',
            pointHoverRadius: 6,
            pointRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          r: {
            min: 0, max: 100,
            ticks: { stepSize: 25, color: textColor, backdropColor: 'transparent', font: { size: 10 } },
            grid: { color: gridColor },
            angleLines: { color: gridColor },
            pointLabels: { color: textColor, font: { size: 12, weight: 600 } }
          }
        }
      }
    });
  }

  // ── DETAILED REPORT ──────────────────────────────────────
  function renderDetailedReport(concerns) {
    const body = document.getElementById('reportBody');
    if (!body || !concerns.length) return;

    const filtered = concerns.filter(c => c.severity !== 'not_present');
    const byCategory = filtered.reduce((acc, c) => {
      const cat = c.category || 'other';
      (acc[cat] = acc[cat] || []).push(c);
      return acc;
    }, {});

    const catLabels = {
      skin: '🧴 Skin Issues',
      eye: '👁 Eye Area',
      structure: '💎 Structure & Asymmetry',
      aging: '⏳ Aging Signs',
      proportion: '📐 Proportion',
      brows_hair: '✨ Brows & Hair',
      lifestyle: '🧘 Lifestyle Indicators',
      other: '📋 Other'
    };

    body.innerHTML = Object.entries(byCategory).map(([cat, items]) => `
      <div class="report-cat">
        <h3>${catLabels[cat] || cat} <span class="count">${items.length}</span></h3>
        <div class="report-rows">
          ${items.map(c => `
            <div class="report-row">
              <span class="sev-badge sev-${c.severity}">${c.severity}</span>
              <div>
                <div class="name">${escape(c.name)}</div>
                <div class="desc">${escape(c.issue || '')}</div>
              </div>
              <div style="font-size:11px;color:var(--m-text-muted);text-align:right;">
                ${c.duration_days ? `${c.duration_days}d` : ''}
              </div>
            </div>`).join('')}
        </div>
      </div>
    `).join('') + `
      <p style="margin-top:24px;padding:16px;background:var(--m-bg-overlay);border-radius:10px;font-size:13px;color:var(--m-text-secondary);text-align:center;line-height:1.6">
        Total <strong>${filtered.length}</strong> concerns terdeteksi dari 50+ pemeriksaan.<br>
        Top 7 paling actionable udah di-display di section atas.
      </p>
    `;
  }

  // ── PUBLIC API ───────────────────────────────────────────
  window.MX = {
    toggleReport() {
      const toggle = document.getElementById('reportToggle');
      const body = document.getElementById('reportBody');
      if (!toggle || !body) return;
      toggle.classList.toggle('open');
      body.classList.toggle('open');
    },
    switchRoutineTab(tab) {
      document.querySelectorAll('#routineTabs button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
      document.getElementById('routineFlowAM').style.display = tab === 'am' ? '' : 'none';
      document.getElementById('routineFlowPM').style.display = tab === 'pm' ? '' : 'none';
    },
    highlightZone(id) {
      document.getElementById('twibbon')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.toast('Liat panah di foto untuk lokasi area ini ↑');
    },
    toast(msg) {
      const t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(0)';
      clearTimeout(this._toastT);
      this._toastT = setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(-50%) translateY(20px)';
      }, 2500);
    },
    async downloadTwibbon() {
      this.toast('Capture twibbon...');
      try {
        const twibbon = document.getElementById('twibbon');
        if (!twibbon) return;
        if (!window.html2canvas) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const canvas = await html2canvas(twibbon, { backgroundColor: null, scale: 2, useCORS: true });
        const link = document.createElement('a');
        link.download = `maxlook-scan-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.toast('✅ Twibbon downloaded');
      } catch (err) {
        this.toast('❌ Download gagal: ' + err.message);
      }
    },
    async downloadFullReport() {
      if (typeof window.MaxlookReport === 'undefined') {
        this.toast('Report module belum siap, reload page');
        return;
      }
      this.toast('Generating PDF...');
      try {
        await window.MaxlookReport.download({
          user: _lastUser || {},
          scan: _lastScan || {},
          result: _lastResult || {},
          scanContext: _lastCtx || null,
          toast: (msg) => this.toast(msg)
        });
      } catch (err) {
        console.error('[result] downloadFullReport failed:', err);
        this.toast('Gagal: ' + (err.message || 'unknown'));
      }
    },
    async downloadFacecard() {
      this.toast('Capture facecard...');
      try {
        const poster = document.getElementById('facecardPoster');
        if (!poster) { this.toast('Facecard belum siap'); return; }
        if (!window.html2canvas) {
          await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
          });
        }
        const canvas = await html2canvas(poster, {
          backgroundColor: null,
          scale: 2,
          useCORS: true,
          allowTaint: false,
          logging: false
        });
        const link = document.createElement('a');
        link.download = `maxlook-facecard-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        this.toast('Facecard downloaded');
      } catch (err) {
        console.error('[facecard] download error', err);
        this.toast('Gagal: ' + (err.message || 'unknown'));
      }
    },
    async shareTwibbon() {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Maxlook AI Scan Result',
            text: 'Just scanned my face on Maxlook AI!',
            url: window.location.href
          });
        } catch (e) { /* user cancelled */ }
      } else {
        navigator.clipboard.writeText(window.location.href);
        this.toast('Link di-copy! Paste di IG/WA story');
      }
    }
  };

  // Boot
  load();
})();
