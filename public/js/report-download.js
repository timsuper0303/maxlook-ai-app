/* ═══════════════════════════════════════════════════════
   Maxlook Full Scan Report — PDF Download (v2)
   Per-section capture, smart pagination, hide interactive elements
   Multi-page branded PDF: cover + sections
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CDN = {
    html2canvas: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    jspdf: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
  };

  const A4_W = 210; // mm
  const A4_H = 297; // mm
  const PAGE_PAD = 10; // mm padding on each page
  const CONTENT_W = A4_W - PAGE_PAD * 2;
  const CONTENT_H = A4_H - PAGE_PAD * 2;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (Array.from(document.scripts).some(s => s.src === src)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureLibs() {
    const tasks = [];
    if (!window.html2canvas) tasks.push(loadScript(CDN.html2canvas));
    if (!window.jspdf && !window.jsPDF) tasks.push(loadScript(CDN.jspdf));
    await Promise.all(tasks);
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  // ─── Cover page (built off-screen) ───
  function buildCoverElement({ user, scan, result, isWoman }) {
    const overall = scan.overall_score || result.overall || 0;
    const potential = scan.potential_score || result.potential || 0;
    const delta = Math.max(0, potential - overall);
    const dateStr = new Date(scan.created_at || Date.now()).toLocaleDateString('id-ID', {
      day: '2-digit', month: 'long', year: 'numeric'
    });

    const accentA = isWoman ? '#E8639A' : '#FF0000';
    const accentB = isWoman ? '#D4AF37' : '#FF6633';
    const bgGrad = isWoman
      ? 'linear-gradient(160deg, #FFF9FB 0%, #FAD3DD 100%)'
      : 'linear-gradient(160deg, #0d0d0d 0%, #1a0505 100%)';
    const textColor = isWoman ? '#3A1020' : '#ffffff';
    const subColor = isWoman ? 'rgba(58,16,32,0.55)' : 'rgba(255,255,255,0.55)';

    const el = document.createElement('div');
    el.id = '__mx_report_cover';
    el.style.cssText = `
      position: fixed; top: -10000px; left: 0;
      width: 794px; height: 1123px;
      background: ${bgGrad};
      padding: 90px 80px;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, sans-serif;
      color: ${textColor};
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      z-index: -1;
    `;
    el.innerHTML = `
      <div style="text-align:center;width:100%">
        <div style="font-family:'Playfair Display',serif;font-weight:900;font-size:18px;letter-spacing:0.4em;color:${accentA};margin-bottom:6px">
          ✦ MAXLOOK ✦
        </div>
        <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${subColor};font-weight:700">
          Personal Glow Up Coaching
        </div>
      </div>

      <div style="text-align:center;width:100%;margin:auto 0">
        <div style="font-size:11px;letter-spacing:0.4em;text-transform:uppercase;color:${subColor};font-weight:800;margin-bottom:14px">
          PERSONAL GLOW UP REPORT
        </div>
        <div style="font-family:'Playfair Display',serif;font-weight:900;font-size:64px;line-height:1.05;letter-spacing:-0.02em;margin-bottom:18px;background:linear-gradient(135deg,${accentA},${accentB});-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">
          ${escapeHtml(user.name || 'Personal Edition')}
        </div>
        <div style="font-size:13px;letter-spacing:0.18em;text-transform:uppercase;color:${textColor};opacity:0.7;font-weight:700">
          Scan #${scan.scan_number || 1} · ${escapeHtml(dateStr)}
        </div>
      </div>

      <div style="display:flex;width:100%;justify-content:center;gap:60px;margin:auto 0">
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-weight:900;font-size:96px;line-height:1;letter-spacing:-0.04em;color:${accentA}">
            ${overall}
          </div>
          <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:${subColor};font-weight:800;margin-top:6px">
            Current Score
          </div>
        </div>
        <div style="display:flex;align-items:center;font-size:40px;color:${subColor};opacity:0.4">→</div>
        <div style="text-align:center">
          <div style="font-family:'Playfair Display',serif;font-weight:900;font-size:96px;line-height:1;letter-spacing:-0.04em;background:linear-gradient(135deg,#FFD700,#FFA500);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent">
            ${potential}
          </div>
          <div style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;font-weight:800;margin-top:6px;color:#D4AF37">
            Glow Up Potential
          </div>
          ${delta > 0 ? `<div style="margin-top:6px;display:inline-block;padding:3px 10px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.35);color:#D4AF37;font-size:10px;font-weight:800;letter-spacing:0.1em;border-radius:999px">+${delta} pts after program</div>` : ''}
        </div>
      </div>

      <div style="text-align:center;width:100%">
        <div style="font-family:'Playfair Display',serif;font-style:italic;font-size:13px;color:${subColor};line-height:1.5;max-width:480px;margin:0 auto 18px">
          "${escapeHtml((result.encouragement || 'Glow up dimulai dari konsistensi. 30 hari dari sekarang, lo akan terkejut sama hasilnya.').slice(0, 140))}"
        </div>
        <div style="font-size:9px;letter-spacing:0.35em;text-transform:uppercase;color:${subColor};font-weight:700">
          maxlook.id · personal style analysis
        </div>
      </div>
    `;
    document.body.appendChild(el);
    return el;
  }

  // ─── Inject print CSS — hide non-essential elements during capture ───
  function injectPrintCSS() {
    if (document.getElementById('__mx_print_css')) return;
    const css = document.createElement('style');
    css.id = '__mx_print_css';
    css.textContent = `
      .mx-printing .head,
      .mx-printing .facecard-actions,
      .mx-printing .twibbon-ctrl,
      .mx-printing .photo-quality-banner,
      .mx-printing .action-card,
      .mx-printing .actions-grid,
      .mx-printing .report-toggle,
      .mx-printing #toast { display: none !important; }
      .mx-printing .anim-fade-up,
      .mx-printing .anim-scale-in { animation: none !important; opacity: 1 !important; transform: none !important; }
      .mx-printing .report-body { display: block !important; }
    `;
    document.head.appendChild(css);
  }

  // ─── Capture single element to canvas at fixed width ───
  async function captureElement(el, opts = {}) {
    const renderWidth = opts.width || el.scrollWidth || 720;
    return window.html2canvas(el, {
      backgroundColor: opts.bg || null,
      scale: opts.scale || 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      width: renderWidth,
      windowWidth: renderWidth
    });
  }

  // ─── Add canvas to PDF — auto-scale to fit width, paginate if taller than 1 page ───
  function addCanvasToPdf(pdf, canvas, opts = {}) {
    const newPage = opts.newPage !== false;
    if (newPage) pdf.addPage();

    const padX = opts.padX != null ? opts.padX : PAGE_PAD;
    const padY = opts.padY != null ? opts.padY : PAGE_PAD;
    const targetW = A4_W - padX * 2;
    const targetH = A4_H - padY * 2;

    const aspect = canvas.height / canvas.width;
    const drawW = targetW;
    const drawH = drawW * aspect;

    if (drawH <= targetH) {
      // Fits one page
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.93), 'JPEG', padX, padY, drawW, drawH);
      return 1;
    }

    // Multi-page: slice canvas vertically per page-height equivalent in pixels
    const pxPerMm = canvas.width / targetW;
    const pageHpx = Math.floor(targetH * pxPerMm);
    const totalPages = Math.ceil(canvas.height / pageHpx);

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) pdf.addPage();
      const sy = p * pageHpx;
      const sh = Math.min(pageHpx, canvas.height - sy);
      const slice = document.createElement('canvas');
      slice.width = canvas.width;
      slice.height = sh;
      slice.getContext('2d').drawImage(canvas, 0, sy, canvas.width, sh, 0, 0, canvas.width, sh);
      const sliceImgH = (sh / pxPerMm);
      pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', padX, padY, drawW, sliceImgH);
    }
    return totalPages;
  }

  // ─── Find sections to capture in order ───
  function getSections() {
    const sections = [];
    // 1. Score Card hero
    const scoreEl = document.getElementById('scoreCardMount');
    if (scoreEl && scoreEl.children.length) {
      sections.push({ id: 'score', el: scoreEl, label: 'Score Card' });
    }
    // 2. Facecard poster
    const fcEl = document.getElementById('facecardPoster');
    if (fcEl) {
      sections.push({ id: 'facecard', el: fcEl, label: 'Facecard' });
    }
    // 3. Top Concerns
    const concernsEl = document.querySelector('.concerns-section');
    if (concernsEl) {
      sections.push({ id: 'concerns', el: concernsEl, label: 'Top Concerns' });
    }
    // 4. Personal Color section (find the .section that has Personal Color in its h2)
    const sectionEls = document.querySelectorAll('.section');
    sectionEls.forEach(s => {
      const h2 = s.querySelector('h2');
      if (!h2) return;
      const title = h2.textContent.toLowerCase();
      if (title.includes('personal') && title.includes('color')) {
        sections.push({ id: 'color', el: s, label: 'Personal Color' });
      } else if (title.includes('skincare')) {
        sections.push({ id: 'skincare', el: s, label: 'Skincare' });
      } else if (title.includes('outfit')) {
      } else if (title.includes('outfit')) {
        sections.push({ id: 'outfit', el: s, label: 'Outfit Ideas' });
      } else if (title.includes('face yoga') || title.includes('face training')) {
        sections.push({ id: 'faceyoga', el: s, label: 'Face Yoga / Training' });
      } else if (title.includes('timeline')) {
        sections.push({ id: 'timeline', el: s, label: '30-Day Timeline' });
      } else if (title.includes('step-by-step') || title.includes('lanjut')) {
        sections.push({ id: 'steps', el: s, label: 'Next Steps' });
      }
    });
    return sections;
  }

  // ─── Main download orchestrator ───
  async function download(ctx) {
    const { user = {}, scan = {}, result = {}, scanContext = null, toast = () => {} } = ctx || {};
    const isWoman = (user.gender || '').toLowerCase().startsWith('w')
      || (user.gender || '').toLowerCase().startsWith('f')
      || (scanContext && (scanContext.gender || '').toLowerCase().startsWith('w'));

    toast('Loading libraries...');
    await ensureLibs();

    const jsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!jsPDFCtor) throw new Error('jsPDF not available');

    injectPrintCSS();
    document.body.classList.add('mx-printing');

    const pdf = new jsPDFCtor({ unit: 'mm', format: 'a4', orientation: 'portrait', compress: true });

    let coverEl = null;
    try {
      // ─── Cover ───
      toast('Rendering cover...');
      coverEl = buildCoverElement({ user, scan, result, isWoman });
      // Make cover visible for capture (off-screen but rendered)
      const coverCanvas = await captureElement(coverEl, { width: 794, scale: 2, bg: null });
      // First page: don't addPage, draw on existing first page (use newPage:false)
      addCanvasToPdf(pdf, coverCanvas, { newPage: false, padX: 0, padY: 0 });

      // ─── Sections ───
      const sections = getSections();
      for (let i = 0; i < sections.length; i++) {
        const { el, label } = sections[i];
        toast(`Capturing ${label}... (${i + 1}/${sections.length})`);
        try {
          const canvas = await captureElement(el, { scale: 2, bg: '#ffffff' });
          addCanvasToPdf(pdf, canvas, { newPage: true });
        } catch (err) {
          console.warn('[report] capture failed for', label, err);
        }
      }

      // ─── Save ───
      toast('Saving PDF...');
      const safeName = String(user.name || 'maxlook').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 40) || 'maxlook';
      const fname = `Maxlook_Report_${safeName}_${Date.now()}.pdf`;
      pdf.save(fname);
      toast('✅ PDF downloaded');
    } finally {
      document.body.classList.remove('mx-printing');
      if (coverEl && coverEl.parentNode) coverEl.parentNode.removeChild(coverEl);
    }
  }

  // ─── Public API ───
  window.MaxlookReport = {
    download,
    _internal: { captureElement, addCanvasToPdf, getSections, injectPrintCSS, buildCoverElement }
  };
})();
