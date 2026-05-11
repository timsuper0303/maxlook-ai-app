/* ═══════════════════════════════════════════════════════
   Maxlook Face Detector
   Wrapper around face-api.js untuk landmark detection
   Loads models from CDN (no local hosting needed)
   ═══════════════════════════════════════════════════════ */

const FaceDetector = (() => {
  const MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
  let modelsLoaded = false;
  let loadingPromise = null;

  /** Lazy-load face-api.js script + models. Returns promise that resolves when ready. */
  async function init() {
    if (modelsLoaded) return true;
    if (loadingPromise) return loadingPromise;

    loadingPromise = (async () => {
      // Load face-api.js library
      if (!window.faceapi) {
        await loadScript('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.js');
      }

      // Load required models (tinyFaceDetector + 68-point landmarks)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL)
      ]);

      modelsLoaded = true;
      console.log('[FaceDetector] Models loaded.');
      return true;
    })();
    return loadingPromise;
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Detect facial landmarks from image.
   * @param {HTMLImageElement|HTMLCanvasElement} imageEl
   * @returns {Promise<{landmarks: Array, box: Object, dimensions: Object}|null>}
   */
  async function detectLandmarks(imageEl) {
    await init();

    const detection = await faceapi
      .detectSingleFace(imageEl, new faceapi.TinyFaceDetectorOptions({
        inputSize: 416,       // higher = more accurate, slower
        scoreThreshold: 0.5
      }))
      .withFaceLandmarks();

    if (!detection) return null;

    const positions = detection.landmarks.positions; // 68 points
    const box = detection.detection.box;

    // Normalize coordinates to [0, 1] relative to image dimensions
    const w = imageEl.naturalWidth || imageEl.width;
    const h = imageEl.naturalHeight || imageEl.height;

    return {
      landmarks: positions.map((p, i) => ({
        index: i,
        x: p.x,
        y: p.y,
        x_norm: p.x / w,
        y_norm: p.y / h
      })),
      box: {
        x: box.x, y: box.y,
        width: box.width, height: box.height,
        x_norm: box.x / w,
        y_norm: box.y / h,
        width_norm: box.width / w,
        height_norm: box.height / h
      },
      dimensions: { width: w, height: h },
      score: detection.detection.score
    };
  }

  /**
   * Get specific landmark points by anatomical name.
   * face-api.js 68-point standard:
   * 0-16 = jawline
   * 17-21 = left eyebrow
   * 22-26 = right eyebrow
   * 27-30 = nose bridge
   * 31-35 = nose bottom
   * 36-41 = left eye
   * 42-47 = right eye
   * 48-59 = outer mouth
   * 60-67 = inner mouth
   */
  const LANDMARK_GROUPS = {
    jawline:        [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16],
    left_eyebrow:   [17,18,19,20,21],
    right_eyebrow:  [22,23,24,25,26],
    nose_bridge:    [27,28,29,30],
    nose_bottom:    [31,32,33,34,35],
    left_eye:       [36,37,38,39,40,41],
    right_eye:      [42,43,44,45,46,47],
    outer_mouth:    [48,49,50,51,52,53,54,55,56,57,58,59],
    inner_mouth:    [60,61,62,63,64,65,66,67]
  };

  function getGroup(landmarks, groupName) {
    return (LANDMARK_GROUPS[groupName] || []).map(i => landmarks[i]).filter(Boolean);
  }

  function getCenter(points) {
    if (!points.length) return null;
    const x = points.reduce((s, p) => s + p.x, 0) / points.length;
    const y = points.reduce((s, p) => s + p.y, 0) / points.length;
    const x_norm = points.reduce((s, p) => s + p.x_norm, 0) / points.length;
    const y_norm = points.reduce((s, p) => s + p.y_norm, 0) / points.length;
    return { x, y, x_norm, y_norm };
  }

  /**
   * Calculate asymmetry metrics — left vs right facial features.
   * Returns: {
   *   eye_distance_diff,       // diff in distance from face center
   *   eye_height_diff,         // diff in vertical position
   *   eyebrow_height_diff,
   *   mouth_corner_height_diff,
   *   jaw_angle_diff,
   *   overall_asymmetry_score  // 0-100, higher = more symmetric
   * }
   */
  function analyzeAsymmetry(landmarks) {
    const leftEye = getCenter(getGroup(landmarks, 'left_eye'));
    const rightEye = getCenter(getGroup(landmarks, 'right_eye'));
    const leftBrow = getCenter(getGroup(landmarks, 'left_eyebrow'));
    const rightBrow = getCenter(getGroup(landmarks, 'right_eyebrow'));
    const noseBridge = getCenter(getGroup(landmarks, 'nose_bridge'));
    const mouth = getGroup(landmarks, 'outer_mouth');
    const leftMouthCorner = mouth[0] || null;
    const rightMouthCorner = mouth[6] || null;
    const jawline = getGroup(landmarks, 'jawline');

    if (!leftEye || !rightEye || !noseBridge) return null;

    // Use nose bridge as vertical axis of symmetry
    const axisX = noseBridge.x;

    // Eye distance from axis
    const leftEyeDist = Math.abs(leftEye.x - axisX);
    const rightEyeDist = Math.abs(rightEye.x - axisX);
    const eyeDistDiff = Math.abs(leftEyeDist - rightEyeDist);

    // Eye height difference
    const eyeHeightDiff = Math.abs(leftEye.y - rightEye.y);

    // Eyebrow height difference
    const browHeightDiff = leftBrow && rightBrow ? Math.abs(leftBrow.y - rightBrow.y) : 0;

    // Mouth corner height difference
    const mouthCornerDiff = leftMouthCorner && rightMouthCorner
      ? Math.abs(leftMouthCorner.y - rightMouthCorner.y) : 0;

    // Jaw angle approximation (jaw point 0 vs 16, distance from axis)
    const jawDiff = jawline.length === 17
      ? Math.abs(Math.abs(jawline[0].x - axisX) - Math.abs(jawline[16].x - axisX))
      : 0;

    // Composite score: lower diffs = more symmetric
    const eyeWidth = Math.abs(rightEye.x - leftEye.x) || 1;
    const normalize = (d) => Math.min(d / eyeWidth, 1); // normalize against eye width
    const avgNormDiff = (
      normalize(eyeDistDiff) +
      normalize(eyeHeightDiff) +
      normalize(browHeightDiff) +
      normalize(mouthCornerDiff) +
      normalize(jawDiff)
    ) / 5;
    const overallScore = Math.round((1 - avgNormDiff) * 100);

    return {
      eye_distance_diff_px: Math.round(eyeDistDiff * 100) / 100,
      eye_height_diff_px: Math.round(eyeHeightDiff * 100) / 100,
      eyebrow_height_diff_px: Math.round(browHeightDiff * 100) / 100,
      mouth_corner_height_diff_px: Math.round(mouthCornerDiff * 100) / 100,
      jaw_angle_diff_px: Math.round(jawDiff * 100) / 100,
      overall_asymmetry_score: Math.max(0, Math.min(100, overallScore)),
      axis_x: axisX,
      axis_x_norm: noseBridge.x_norm
    };
  }

  /**
   * Calculate facial thirds proportions.
   * Standard: forehead height = midface height = lower-face height
   */
  function analyzeFaceThirds(landmarks, box) {
    const browTop = Math.min(...getGroup(landmarks, 'left_eyebrow').concat(getGroup(landmarks, 'right_eyebrow')).map(p => p.y));
    const noseBottom = Math.max(...getGroup(landmarks, 'nose_bottom').map(p => p.y));
    const chin = landmarks[8]; // jaw center

    const top = box.y;
    const bottom = box.y + box.height;
    const total = bottom - top;

    const upper = (browTop - top) / total;
    const middle = (noseBottom - browTop) / total;
    const lower = (chin.y - noseBottom) / total;

    const ideal = 1 / 3;
    const tolerance = 0.05;

    return {
      upper_ratio: Math.round(upper * 1000) / 1000,
      middle_ratio: Math.round(middle * 1000) / 1000,
      lower_ratio: Math.round(lower * 1000) / 1000,
      upper_balanced: Math.abs(upper - ideal) < tolerance,
      middle_balanced: Math.abs(middle - ideal) < tolerance,
      lower_balanced: Math.abs(lower - ideal) < tolerance,
      brow_top_y: browTop,
      nose_bottom_y: noseBottom,
      chin_y: chin.y
    };
  }

  return {
    init,
    detectLandmarks,
    analyzeAsymmetry,
    analyzeFaceThirds,
    getGroup,
    getCenter,
    LANDMARK_GROUPS
  };
})();

// Auto-init on idle (warmup) — don't block page render
if (typeof window !== 'undefined') {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => FaceDetector.init().catch(e => console.warn('[FaceDetector] init deferred:', e.message)));
  } else {
    setTimeout(() => FaceDetector.init().catch(e => console.warn('[FaceDetector] init deferred:', e.message)), 2000);
  }
}
