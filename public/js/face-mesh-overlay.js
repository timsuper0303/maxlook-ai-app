/* ═══════════════════════════════════════════════════════
   Maxlook Face Mesh Overlay — MediaPipe FaceMesh
   468 landmarks + tesselation = ~860 triangles
   Used for: live camera tracking + scanning screen overlay
   Lazy loads MediaPipe from CDN (~1.5 MB gzipped)
   Exposes: window.MaxlookFaceMesh
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MP_VERSION = '0.4.1633559619';
  const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${MP_VERSION}/`;

  let _instance = null;
  let _ready = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (Array.from(document.scripts).some(s => s.src === src)) return resolve();
      const s = document.createElement('script');
      s.src = src;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load ' + src));
      document.head.appendChild(s);
    });
  }

  async function ensureLib() {
    if (window.FaceMesh) return;
    await loadScript(MP_BASE + 'face_mesh.js');
  }

  async function getInstance() {
    if (_instance) return _instance;
    if (_ready) return _ready;

    _ready = (async () => {
      await ensureLib();
      const fm = new window.FaceMesh({
        locateFile: (file) => MP_BASE + file
      });
      fm.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      _instance = fm;
      return fm;
    })();
    return _ready;
  }

  // ─── Draw wireframe mesh on canvas ───
  function drawMesh(canvas, landmarks, opts = {}) {
    if (!canvas || !landmarks) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const TES = window.FACEMESH_TESSELATION || [];
    if (!TES.length) return;

    const color = opts.color || 'rgba(255,255,255,0.55)';
    const lineWidth = opts.lineWidth || 0.6;
    const w = canvas.width;
    const h = canvas.height;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let i = 0; i < TES.length; i++) {
      const pair = TES[i];
      const pa = landmarks[pair[0]];
      const pb = landmarks[pair[1]];
      if (!pa || !pb) continue;
      const x1 = pa.x * w;
      const y1 = pa.y * h;
      const x2 = pb.x * w;
      const y2 = pb.y * h;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    // Optional: brighter dots at each landmark
    if (opts.showDots !== false) {
      ctx.fillStyle = opts.dotColor || 'rgba(255,255,255,0.6)';
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        ctx.beginPath();
        ctx.arc(p.x * w, p.y * h, opts.dotRadius || 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ─── Resize canvas to match host element size ───
  function syncCanvasSize(canvas, refEl) {
    const rect = refEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round(rect.width * dpr);
    const h = Math.round(rect.height * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
    }
  }

  // ─── LIVE — track video in real-time ───
  async function startLive(videoEl, canvasEl, options = {}) {
    const fm = await getInstance();
    let stopped = false;

    fm.onResults((results) => {
      if (stopped) return;
      syncCanvasSize(canvasEl, videoEl);
      const hasFace = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
      if (hasFace) {
        drawMesh(canvasEl, results.multiFaceLandmarks[0], options);
        if (options.onFace) options.onFace(results.multiFaceLandmarks[0]);
      } else {
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        if (options.onNoFace) options.onNoFace();
      }
    });

    async function loop() {
      if (stopped) return;
      try {
        if (videoEl.readyState >= 2 && !videoEl.paused) {
          await fm.send({ image: videoEl });
        }
      } catch (e) {
        console.warn('[FaceMesh] send error', e);
      }
      requestAnimationFrame(loop);
    }
    loop();

    return {
      stop: () => { stopped = true; const ctx = canvasEl.getContext('2d'); ctx.clearRect(0, 0, canvasEl.width, canvasEl.height); }
    };
  }

  // ─── STATIC — single detection on image, returns landmarks ───
  async function drawStatic(imageEl, canvasEl, options = {}) {
    const fm = await getInstance();

    return new Promise((resolve) => {
      fm.onResults((results) => {
        syncCanvasSize(canvasEl, imageEl);
        const landmarks = (results.multiFaceLandmarks || [])[0] || null;
        if (landmarks) drawMesh(canvasEl, landmarks, options);
        resolve(landmarks);
      });
      fm.send({ image: imageEl });
    });
  }

  window.MaxlookFaceMesh = { startLive, drawStatic, drawMesh, getInstance };
})();
