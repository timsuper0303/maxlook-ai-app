/* ═══════════════════════════════════════════════════════
   Maxlook Face Mesh Overlay — MediaPipe FaceMesh
   468/478 landmarks + tesselation = ~860 triangles
   Used for: live camera tracking + scanning screen overlay
   Lazy loads MediaPipe from CDN (~1.5 MB gzipped)
   Exposes: window.MaxlookFaceMesh

   ── Alignment strategy (cross-platform, including iPhone) ──
   Canvas internal pixel buffer is sized to match VIDEO NATIVE
   dimensions (videoWidth × videoHeight). MediaPipe landmarks
   (0..1 of native frame) map directly: nx*canvas.width, etc.
   CSS object-fit:cover on BOTH <video> and <canvas> applies
   identical crop/scale to both elements → mesh always aligns
   regardless of container aspect, DPR, or iOS rotation quirks.
   ═══════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const MP_VERSION = '0.4.1633559619';
  const MP_BASE = `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@${MP_VERSION}/`;
  const DEBUG = false;

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
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6
      });
      _instance = fm;
      return fm;
    })();
    return _ready;
  }

  // ─── Smooth landmark interpolation (lerp between frames) ───
  let _prevLandmarks = null;
  function smoothLandmarks(curr, alpha = 0.55) {
    if (!_prevLandmarks || _prevLandmarks.length !== curr.length) {
      _prevLandmarks = curr.map(p => ({ x: p.x, y: p.y, z: p.z }));
      return _prevLandmarks;
    }
    for (let i = 0; i < curr.length; i++) {
      _prevLandmarks[i].x = _prevLandmarks[i].x * (1 - alpha) + curr[i].x * alpha;
      _prevLandmarks[i].y = _prevLandmarks[i].y * (1 - alpha) + curr[i].y * alpha;
      _prevLandmarks[i].z = (_prevLandmarks[i].z || 0) * (1 - alpha) + (curr[i].z || 0) * alpha;
    }
    return _prevLandmarks;
  }

  // ─── Feature group landmark indices ───
  const FEATURE_GROUPS = {
    oval: [10,338,297,332,284,251,389,356,454,323,361,288,397,365,379,378,400,377,152,148,176,149,150,136,172,58,132,93,234,127,162,21,54,103,67,109,10],
    lipsOuter: [61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185,61],
    lipsInner: [78,95,88,178,87,14,317,402,318,324,308,415,310,311,312,13,82,81,80,191,78],
    leftEye: [33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,33],
    rightEye: [362,382,381,380,374,373,390,249,263,466,388,387,386,385,384,398,362],
    leftBrow: [70,63,105,66,107,55,65,52,53,46,70],
    rightBrow: [336,296,334,293,300,276,283,282,295,285,336],
    noseBridge: [168,6,197,195,5,4,1,19,94,2],
    leftIris: [468,469,470,471,472,468],
    rightIris: [473,474,475,476,477,473]
  };

  // ─── Draw wireframe mesh + AR-style feature highlights ───
  // Landmarks are in 0..1 of VIDEO NATIVE = CANVAS INTERNAL.
  // Direct map: nx * canvas.width, ny * canvas.height. CSS object-fit:cover
  // handles all display scaling/cropping identically for video + canvas.
  function drawMesh(canvas, rawLandmarks, opts = {}) {
    if (!canvas || !rawLandmarks) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const TES = window.FACEMESH_TESSELATION || [];
    if (!TES.length) return;

    const landmarks = opts.smooth !== false
      ? smoothLandmarks(rawLandmarks, opts.smoothAlpha || 0.6)
      : rawLandmarks;

    const baseColor = opts.color || 'rgba(255,255,255,0.45)';
    const w = canvas.width;
    const h = canvas.height;

    // Scale line widths with canvas resolution for consistent look
    const scale = Math.min(w, h) / 600;
    const lineWidth = (opts.lineWidth || 0.5) * scale;

    function mapX(nx) { return nx * w; }
    function mapY(ny) { return ny * h; }

    // ─ Layer 1: Base mesh wireframe ─
    ctx.strokeStyle = baseColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    for (let i = 0; i < TES.length; i++) {
      const pair = TES[i];
      const pa = landmarks[pair[0]];
      const pb = landmarks[pair[1]];
      if (!pa || !pb) continue;
      ctx.moveTo(mapX(pa.x), mapY(pa.y));
      ctx.lineTo(mapX(pb.x), mapY(pb.y));
    }
    ctx.stroke();

    // ─ Layer 2: AR feature highlights ─
    if (opts.highlightFeatures !== false) {
      const featColor = opts.featureColor || 'rgba(255,255,255,0.95)';
      const featWidth = (opts.featureWidth || 1.5) * scale;
      ctx.strokeStyle = featColor;
      ctx.lineWidth = featWidth;
      ctx.shadowColor = opts.glowColor || 'rgba(255,255,255,0.6)';
      ctx.shadowBlur = (opts.glow !== false ? 6 : 0) * scale;

      // Default: skip 'oval' silhouette (MediaPipe's oval is tighter than
      // visible face boundary which looks wrong). Show only inner features.
      const defaultGroups = ['lipsOuter', 'leftEye', 'rightEye', 'leftBrow', 'rightBrow', 'noseBridge'];
      const groups = opts.showOval ? ['oval', ...defaultGroups] : defaultGroups;
      if (landmarks.length >= 478) groups.push('leftIris', 'rightIris');

      for (const groupName of groups) {
        const indices = FEATURE_GROUPS[groupName];
        if (!indices) continue;
        ctx.beginPath();
        for (let i = 0; i < indices.length; i++) {
          const p = landmarks[indices[i]];
          if (!p) continue;
          const x = mapX(p.x);
          const y = mapY(p.y);
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    }

    // ─ Layer 3: Landmark dots (optional) ─
    if (opts.showDots) {
      ctx.fillStyle = opts.dotColor || 'rgba(255,255,255,0.6)';
      const dotR = (opts.dotRadius || 0.7) * scale;
      for (let i = 0; i < landmarks.length; i++) {
        const p = landmarks[i];
        ctx.beginPath();
        ctx.arc(mapX(p.x), mapY(p.y), dotR, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function resetSmoothing() { _prevLandmarks = null; }

  // ─── Sync canvas internal pixel buffer to source NATIVE dimensions ───
  // Works for <video> (videoWidth/videoHeight) AND <img> (naturalWidth/naturalHeight)
  // Don't touch canvas.style — let CSS handle display via object-fit:cover.
  function syncCanvasToNative(canvas, sourceEl) {
    const vw = sourceEl.videoWidth || sourceEl.naturalWidth || 0;
    const vh = sourceEl.videoHeight || sourceEl.naturalHeight || 0;
    if (!vw || !vh) return false;
    if (canvas.width !== vw || canvas.height !== vh) {
      canvas.width = vw;
      canvas.height = vh;
      if (DEBUG) console.log('[FaceMesh] canvas sized to video native', vw, 'x', vh);
    }
    return true;
  }

  // ─── LIVE — track video in real-time ───
  async function startLive(videoEl, canvasEl, options = {}) {
    const fm = await getInstance();
    let stopped = false;
    let frameBusy = false;

    fm.onResults((results) => {
      if (stopped) return;
      // Re-sync each frame in case video resolution changes mid-stream
      syncCanvasToNative(canvasEl, videoEl);
      const hasFace = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;
      if (hasFace) {
        drawMesh(canvasEl, results.multiFaceLandmarks[0], options);
        if (options.onFace) options.onFace(results.multiFaceLandmarks[0]);
      } else {
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        resetSmoothing();
        if (options.onNoFace) options.onNoFace();
      }
    });

    async function loop() {
      if (stopped) return;
      try {
        if (!frameBusy && videoEl.readyState >= 2 && !videoEl.paused && videoEl.videoWidth > 0) {
          frameBusy = true;
          // Send video DIRECTLY to MediaPipe — no proc canvas, no aspect math
          await fm.send({ image: videoEl });
          frameBusy = false;
        }
      } catch (e) {
        frameBusy = false;
        console.warn('[FaceMesh] send error', e);
      }
      requestAnimationFrame(loop);
    }
    loop();

    return {
      stop: () => {
        stopped = true;
        const ctx = canvasEl.getContext('2d');
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      }
    };
  }

  // ─── STATIC — single detection on image ───
  async function drawStatic(imageEl, canvasEl, options = {}) {
    const fm = await getInstance();

    return new Promise((resolve) => {
      fm.onResults((results) => {
        syncCanvasToNative(canvasEl, imageEl);
        const landmarks = (results.multiFaceLandmarks || [])[0] || null;
        if (landmarks) drawMesh(canvasEl, landmarks, options);
        resolve(landmarks);
      });
      fm.send({ image: imageEl });
    });
  }

  window.MaxlookFaceMesh = { startLive, drawStatic, drawMesh, getInstance, resetSmoothing };
})();
