/* ═══════════════════════════════════════════════════════
   Maxlook Score Card Renderer
   Generates Umax-style score card HTML from scan data.
   Reusable: dashboard widget + result hero
   ═══════════════════════════════════════════════════════ */

const ScoreCard = (function () {

  // Color tier from score value (0-100)
  function tier(v) {
    if (v < 40) return 'critical';
    if (v < 55) return 'low';
    if (v < 70) return 'medium';
    if (v < 85) return 'good';
    return 'excellent';
  }

  /**
   * Build score card HTML.
   * @param {Object} opts
   * @param {string} opts.photoUrl - circular avatar image URL (optional)
   * @param {string} opts.name - user display name
   * @param {string} opts.subtitle - small text below name (e.g., "Scan #1 · Hari ini")
   * @param {string} opts.gender - 'man' | 'woman'
   * @param {Object} opts.scores - { overall, potential, masculinity|femininity, skin, jawline, cheekbones }
   * @param {string} opts.ctaText - button text
   * @param {string} opts.ctaHref - button link (if present, renders as <a>)
   * @param {Function} opts.onCta - button click handler (if no href)
   * @param {boolean} opts.compact - smaller variant for dashboard widget
   * @returns {string} HTML string
   */
  function render(opts) {
    const g = (opts.gender === 'woman') ? 'woman' : 'man';
    const s = opts.scores || {};
    const overall = Math.round(s.overall || 0);
    // Frontend floor — guarantee 80 minimum + at least +15 over current
    const rawPotential = s.potential || (overall + 20);
    const potential = Math.min(98, Math.max(80, overall + 15, Math.round(rawPotential)));

    // Baseline + progression badges (from scan_context)
    const ctx = opts.scanContext || null;
    const baselineDelta = (ctx && ctx.baseline && !ctx.is_baseline)
      ? Math.round(ctx.delta_since_baseline || 0)
      : null;
    const prevDelta = (ctx && ctx.previous)
      ? Math.round(ctx.delta_since_previous || 0)
      : null;
    const scanNum = (ctx && ctx.scan_number) || 1;
    const trait = g === 'woman' ? (s.femininity || s.overall) : (s.masculinity || s.overall);
    const skin = Math.round(s.skin_quality || s.skin_glow || s.skin || s.overall);
    const jawline = Math.round(s.jawline || s.overall);
    const cheekbones = Math.round(s.cheekbones || s.harmony || s.overall);

    const traitLabel = g === 'woman' ? 'Femininity' : 'Masculinity';
    const jawLabel = g === 'woman' ? 'Soft Jawline' : 'Jawline';

    const delta = potential - overall;

    const avatarHTML = opts.photoUrl
      ? `<img class="sc-avatar" src="${escapeHtml(opts.photoUrl)}" alt="">`
      : `<div class="sc-avatar" style="background:linear-gradient(135deg,#444,#222);display:flex;align-items:center;justify-content:center;font-size:32px">👤</div>`;

    const ctaHTML = opts.ctaText
      ? (opts.ctaHref
        ? `<a href="${escapeHtml(opts.ctaHref)}" class="sc-cta">${escapeHtml(opts.ctaText)}</a>`
        : `<button class="sc-cta" onclick="${opts.onCta || ''}">${escapeHtml(opts.ctaText)}</button>`)
      : '';

    // Layout: Row1 = Overall + Femininity/Masculinity
    //         Row2 = Skin Quality + Jawline
    //         Row3 = Cheekbones + POTENTIAL (bottom-right, highlighted per Q3)
    const grid = `
      ${cell('Overall', overall)}
      ${cell(traitLabel, Math.round(trait))}
      ${cell('Skin Quality', skin)}
      ${cell(jawLabel, jawline)}
      ${cell('Cheekbones', cheekbones)}
      ${cellPotential(potential, delta)}
    `;

    // Progression badge — only show for scan #2+
    const progressionBadge = (scanNum > 1 && (baselineDelta !== null || prevDelta !== null)) ? `
      <div class="sc-progression">
        <span class="sc-scan-num">SCAN #${scanNum}</span>
        ${baselineDelta !== null ? `
          <span class="sc-delta-pill ${baselineDelta >= 0 ? 'up' : 'down'}">
            ${baselineDelta >= 0 ? '↑' : '↓'} ${Math.abs(baselineDelta)} pts vs baseline
          </span>` : ''}
        ${prevDelta !== null && prevDelta !== 0 ? `
          <span class="sc-delta-pill ${prevDelta >= 0 ? 'up' : 'down'} small">
            ${prevDelta >= 0 ? '↑' : '↓'}${Math.abs(prevDelta)} vs last scan
          </span>` : ''}
      </div>
    ` : '';

    return `
      <div class="score-card ${opts.compact ? 'compact' : ''}">
        <div class="sc-avatar-wrap">
          ${avatarHTML}
          <div class="sc-hello">${escapeHtml(opts.name || 'Your Score')}</div>
          ${opts.subtitle ? `<div class="sc-sub">${escapeHtml(opts.subtitle)}</div>` : ''}
          ${progressionBadge}
        </div>
        <div class="sc-grid">${grid}</div>
        ${ctaHTML}
      </div>
    `;
  }

  function cell(label, value) {
    return `
      <div class="sc-cell" data-tier="${tier(value)}">
        <div class="lbl">${escapeHtml(label)}</div>
        <div class="val">${value}</div>
        <div class="sc-bar"><div class="fill" style="width:0%" data-target="${value}%"></div></div>
      </div>`;
  }

  function cellPotential(value, delta) {
    const deltaText = delta > 0 ? `+${delta} pts setelah program` : '';
    return `
      <div class="sc-cell potential" data-tier="${tier(value)}">
        <div class="lbl">Potential</div>
        <div class="val">${value}</div>
        <div class="sc-bar"><div class="fill" style="width:0%" data-target="${value}%"></div></div>
        ${deltaText ? `<div class="sc-delta">${deltaText}</div>` : ''}
      </div>`;
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Animate score bars after render (call once cards are in DOM)
  function animate(root) {
    const scope = root || document;
    const fills = scope.querySelectorAll('.sc-bar .fill[data-target]');
    fills.forEach((el, i) => {
      const target = el.getAttribute('data-target') || '0%';
      setTimeout(() => { el.style.width = target; }, 80 + i * 60);
    });
  }

  // Mount: render HTML into container + run bar animation
  function mount(containerEl, opts) {
    if (!containerEl) return;
    containerEl.innerHTML = render(opts);
    // Slight defer so layout completes before width transition
    setTimeout(() => animate(containerEl), 50);
  }

  return { render, mount, animate, tier };
})();

if (typeof window !== 'undefined') {
  window.ScoreCard = ScoreCard;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ScoreCard;
}
