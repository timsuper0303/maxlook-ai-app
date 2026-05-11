/* ═══════════════════════════════════════════════════════
   Maxlook Face Measurements
   Calculate facial proportions from face-api.js 68 landmarks
   No cm/mm output (per Q3 = visual bars only) — returns ratios.
   ═══════════════════════════════════════════════════════ */

const FaceMeasurements = (function () {

  /**
   * Distance between two points.
   */
  function dist(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Midpoint between two points.
   */
  function mid(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  /**
   * Angle at point B in triangle A-B-C (in degrees).
   */
  function angleAt(a, b, c) {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const mag = Math.sqrt(ab.x * ab.x + ab.y * ab.y) * Math.sqrt(cb.x * cb.x + cb.y * cb.y);
    return mag > 0 ? Math.acos(Math.max(-1, Math.min(1, dot / mag))) * 180 / Math.PI : 0;
  }

  /**
   * Calculate all measurements from 68 landmarks.
   * Returns ratios + visual bars (0-100% scale) for animation reveals.
   */
  function calculate(landmarks) {
    if (!landmarks || landmarks.length < 68) return null;
    const lm = landmarks;

    // ── KEY POINTS ──
    const jawLeft   = lm[2];   // upper-right jaw (viewer's left)
    const jawRight  = lm[14];  // upper-left jaw (viewer's right)
    const cheekLeft = lm[1];   // far-left jaw
    const cheekRight = lm[15]; // far-right jaw
    const chinTip   = lm[8];

    const browInnerL = lm[21]; // inner brow tip (viewer's right side)
    const browInnerR = lm[22]; // inner brow tip (viewer's left side)
    const browOuterL = lm[17]; // outer brow tip (viewer's right)
    const browOuterR = lm[26]; // outer brow tip (viewer's left)
    const browPeakL  = lm[19]; // peak of left brow
    const browPeakR  = lm[24]; // peak of right brow

    const eyeLeftOuter  = lm[36]; const eyeLeftInner = lm[39];
    const eyeLeftTop    = mid(lm[37], lm[38]);
    const eyeLeftBot    = mid(lm[40], lm[41]);
    const eyeRightInner = lm[42]; const eyeRightOuter = lm[45];
    const eyeRightTop   = mid(lm[43], lm[44]);
    const eyeRightBot   = mid(lm[46], lm[47]);

    const noseTop  = lm[27];   // top of nose bridge
    const noseTip  = lm[33];   // nose tip
    const noseLeft = lm[31];   // left nostril
    const noseRight = lm[35];  // right nostril

    const lipUpperOuter = lm[51]; // top of upper lip
    const lipLowerOuter = lm[57]; // bottom of lower lip
    const lipLeft       = lm[48]; // left mouth corner
    const lipRight      = lm[54]; // right mouth corner
    const lipUpperInner = lm[62]; // bottom of upper lip (where lips meet upper)
    const lipLowerInner = lm[66]; // top of lower lip

    // ── HORIZONTAL MEASUREMENTS (widths) ──
    const foreheadWidth  = dist(browOuterL, browOuterR) * 1.15; // approximate (face-api doesn't capture forehead — extrapolate from outer brow distance)
    const cheekboneWidth = dist(cheekLeft, cheekRight);
    const jawlineWidth   = dist(jawLeft, jawRight);
    const mouthWidth     = dist(lipLeft, lipRight);
    const noseWidth      = dist(noseLeft, noseRight);
    const eyeLeftWidth   = dist(eyeLeftOuter, eyeLeftInner);
    const eyeRightWidth  = dist(eyeRightInner, eyeRightOuter);
    const eyeWidth       = (eyeLeftWidth + eyeRightWidth) / 2;
    const interPupilDist = dist(mid(eyeLeftTop, eyeLeftBot), mid(eyeRightTop, eyeRightBot));
    const eyebrowLength  = (dist(browInnerL, browOuterL) + dist(browInnerR, browOuterR)) / 2;

    // ── VERTICAL MEASUREMENTS (heights) ──
    const browTop       = mid(browPeakL, browPeakR);
    const noseLength    = dist(noseTop, noseTip);
    const upperFaceH    = dist(browTop, mid(eyeLeftTop, eyeRightTop)); // brow to eye level
    const midfaceH      = dist(mid(eyeLeftTop, eyeRightTop), noseTip); // eye to nose tip
    const lowerFaceH    = dist(noseTip, chinTip);                       // nose tip to chin
    const philtrumH     = dist(noseTip, lipUpperOuter);                 // nose tip to upper lip
    const chinH         = dist(lipLowerOuter, chinTip);                 // lower lip to chin
    const eyeLeftHeight = dist(eyeLeftTop, eyeLeftBot);
    const eyeRightHeight = dist(eyeRightTop, eyeRightBot);
    const eyeHeight     = (eyeLeftHeight + eyeRightHeight) / 2;
    const lipUpperThick = dist(lipUpperOuter, lipUpperInner);
    const lipLowerThick = dist(lipLowerInner, lipLowerOuter);
    const lipsThickness = lipUpperThick + lipLowerThick;

    // ── ANGLES ──
    const goldenAngle = angleAt(
      mid(eyeLeftTop, eyeLeftBot),
      noseTip,
      mid(eyeRightTop, eyeRightBot)
    );

    // Eyebrow arch: angle at brow peak (between inner-to-peak and peak-to-outer segments)
    const browArchAngleL = 180 - angleAt(browInnerL, browPeakL, browOuterL);
    const browArchAngleR = 180 - angleAt(browInnerR, browPeakR, browOuterR);
    const eyebrowArchAngle = Math.round((browArchAngleL + browArchAngleR) / 2);

    // Eye corner angle: angle at outer corner relative to horizontal
    const eyeCornerAngleL = Math.atan2(
      eyeLeftInner.y - eyeLeftOuter.y,
      eyeLeftInner.x - eyeLeftOuter.x
    ) * 180 / Math.PI;
    const eyeCornerAngleR = Math.atan2(
      eyeRightInner.y - eyeRightOuter.y,
      eyeRightOuter.x - eyeRightInner.x
    ) * 180 / Math.PI;
    const eyeCornerAngle = Math.round((Math.abs(eyeCornerAngleL) + Math.abs(eyeCornerAngleR)) / 2);

    // ── RATIOS (for bar visualization, 0-100 percentile of typical face) ──
    // Reference: cheekbone width is the standard unit for proportions
    const ref = cheekboneWidth;

    function asPct(value, idealMin, idealMax) {
      const r = value / ref;
      // map ratio relative to ideal range to 0-100% bar
      const norm = (r - idealMin) / (idealMax - idealMin);
      return Math.max(0, Math.min(100, norm * 100));
    }

    return {
      // Raw pixel measurements (for internal use)
      raw: {
        forehead_width: foreheadWidth,
        cheekbone_width: cheekboneWidth,
        jawline_width: jawlineWidth,
        mouth_width: mouthWidth,
        nose_width: noseWidth,
        nose_length: noseLength,
        eye_width: eyeWidth,
        eye_height: eyeHeight,
        eyebrow_length: eyebrowLength,
        upper_face: upperFaceH,
        midface: midfaceH,
        lower_face: lowerFaceH,
        philtrum: philtrumH,
        chin: chinH,
        lips_thickness: lipsThickness,
        inter_pupil: interPupilDist
      },

      // Ratios relative to cheekbone width (the reference unit)
      ratios: {
        forehead_to_cheek: foreheadWidth / cheekboneWidth,
        jaw_to_cheek: jawlineWidth / cheekboneWidth,
        nose_to_cheek: noseWidth / cheekboneWidth,
        mouth_to_cheek: mouthWidth / cheekboneWidth,
        eye_to_cheek: eyeWidth / cheekboneWidth,
        nose_length_to_cheek: noseLength / cheekboneWidth,
        upper_face_ratio: upperFaceH / (upperFaceH + midfaceH + lowerFaceH),
        midface_ratio: midfaceH / (upperFaceH + midfaceH + lowerFaceH),
        lower_face_ratio: lowerFaceH / (upperFaceH + midfaceH + lowerFaceH),
        philtrum_to_chin: philtrumH / chinH,
        eye_height_to_width: eyeHeight / eyeWidth,
        lip_to_face: lipsThickness / (upperFaceH + midfaceH + lowerFaceH)
      },

      // Visual bar percentages (for animation reveal — 0-100%)
      bars: {
        forehead_width: asPct(foreheadWidth, 0.85, 1.15),    // ideal range vs cheekbone
        cheekbone_width: 100,                                  // always 100% (reference)
        jawline_width: asPct(jawlineWidth, 0.55, 0.85),       // jaw narrower than cheek
        nose_width: asPct(noseWidth, 0.20, 0.35),             // nose vs cheek
        nose_length: asPct(noseLength, 0.30, 0.45),
        mouth_width: asPct(mouthWidth, 0.30, 0.45),
        eye_width: asPct(eyeWidth, 0.18, 0.25),
        eye_height: asPct(eyeHeight, 0.06, 0.10),
        philtrum_height: asPct(philtrumH, 0.10, 0.18),
        chin_height: asPct(chinH, 0.18, 0.30),
        upper_face: asPct(upperFaceH, 0.20, 0.40),
        midface: asPct(midfaceH, 0.25, 0.40),
        eyebrow_length: asPct(eyebrowLength, 0.30, 0.45),
        lip_thickness: asPct(lipsThickness, 0.06, 0.14)
      },

      // Angles (degrees)
      angles: {
        golden_angle: Math.round(goldenAngle),
        eyebrow_arch: eyebrowArchAngle,
        eye_corner: eyeCornerAngle
      },

      // Display points (for SVG overlays — face-api landmark positions for drawing measurement lines)
      points: {
        forehead_left: { x: browOuterL.x - foreheadWidth * 0.08, y: browOuterL.y - midfaceH * 0.4 },
        forehead_right: { x: browOuterR.x + foreheadWidth * 0.08, y: browOuterR.y - midfaceH * 0.4 },
        cheek_left: cheekLeft,
        cheek_right: cheekRight,
        jaw_left: jawLeft,
        jaw_right: jawRight,
        chin_tip: chinTip,
        nose_top: noseTop,
        nose_tip: noseTip,
        nose_left: noseLeft,
        nose_right: noseRight,
        eye_left_outer: eyeLeftOuter,
        eye_left_inner: eyeLeftInner,
        eye_right_outer: eyeRightOuter,
        eye_right_inner: eyeRightInner,
        eye_left_top: eyeLeftTop,
        eye_left_bot: eyeLeftBot,
        eye_right_top: eyeRightTop,
        eye_right_bot: eyeRightBot,
        brow_outer_l: browOuterL,
        brow_outer_r: browOuterR,
        brow_peak_l: browPeakL,
        brow_peak_r: browPeakR,
        lip_upper: lipUpperOuter,
        lip_lower: lipLowerOuter,
        lip_left: lipLeft,
        lip_right: lipRight
      }
    };
  }

  /**
   * Classify face shape from measurements (fallback if AI doesn't provide).
   */
  function classifyFaceShape(measurements) {
    if (!measurements) return 'Oval';
    const r = measurements.ratios;
    const fc = r.forehead_to_cheek;  // forehead vs cheek
    const jc = r.jaw_to_cheek;        // jaw vs cheek
    const totalFaceH = measurements.raw.upper_face + measurements.raw.midface + measurements.raw.lower_face;
    const heightToWidth = totalFaceH / measurements.raw.cheekbone_width;

    if (heightToWidth > 1.55) return 'Long';
    if (Math.abs(fc - 1) < 0.10 && Math.abs(jc - 0.95) < 0.15 && heightToWidth < 1.15) return 'Round';
    if (Math.abs(fc - 1) < 0.10 && Math.abs(jc - 1) < 0.10 && heightToWidth < 1.30) return 'Square';
    if (fc > 1.05 && jc < 0.75) return 'Heart';
    if (fc < 0.90 && jc < 0.80) return 'Diamond';
    if (fc < 0.85 && jc > 0.95) return 'Triangle';
    if (heightToWidth > 1.40 && Math.abs(fc - jc) < 0.15) return 'Oblong';
    return 'Oval';
  }

  /**
   * Classify eye shape from measurements + landmarks.
   */
  function classifyEyeShape(measurements) {
    if (!measurements) return 'Almond';
    const heightWidth = measurements.ratios.eye_height_to_width;
    const cornerAngle = measurements.angles.eye_corner;

    if (heightWidth < 0.30) return 'Monolid';
    if (heightWidth > 0.55) return 'Round';
    if (cornerAngle > 12) return 'Upturned';
    if (cornerAngle < -3) return 'Downturned';
    if (heightWidth < 0.40) return 'Hooded';
    return 'Almond';
  }

  /**
   * Classify nose size.
   */
  function classifyNoseSize(measurements) {
    if (!measurements) return 'Medium';
    const r = measurements.ratios.nose_to_cheek;
    if (r < 0.24) return 'Small';
    if (r > 0.32) return 'Large';
    return 'Medium';
  }

  /**
   * Classify lip shape.
   */
  function classifyLipShape(measurements) {
    if (!measurements) return 'Medium';
    const r = measurements.ratios.lip_to_face;
    if (r < 0.075) return 'Thin';
    if (r > 0.115) return 'Full';
    return 'Medium';
  }

  /**
   * Classify eyebrow shape.
   */
  function classifyBrowShape(measurements) {
    if (!measurements) return 'Straight';
    const arch = measurements.angles.eyebrow_arch;
    if (arch < 8) return 'Straight';
    if (arch > 22) return 'Arched';
    if (arch >= 8 && arch <= 14) return 'Rounded';
    return 'S-shape';
  }

  /**
   * Classify facial proportion.
   */
  function classifyProportion(measurements) {
    if (!measurements) return 'Standard';
    const r = measurements.ratios;
    const dev = Math.max(
      Math.abs(r.upper_face_ratio - 0.33),
      Math.abs(r.midface_ratio - 0.33),
      Math.abs(r.lower_face_ratio - 0.34)
    );
    if (dev < 0.04) return 'Standard';
    if (r.midface_ratio > 0.40) return 'Long';
    if (r.upper_face_ratio < 0.27) return 'Short';
    return 'Wide';
  }

  /**
   * One-shot: compute everything from landmarks.
   */
  function analyze(landmarks) {
    const m = calculate(landmarks);
    if (!m) return null;
    return {
      ...m,
      classifications: {
        face_shape: classifyFaceShape(m),
        eye_shape: classifyEyeShape(m),
        nose_size: classifyNoseSize(m),
        lip_shape: classifyLipShape(m),
        brow_shape: classifyBrowShape(m),
        proportion: classifyProportion(m)
      }
    };
  }

  return {
    calculate,
    classifyFaceShape,
    classifyEyeShape,
    classifyNoseSize,
    classifyLipShape,
    classifyBrowShape,
    classifyProportion,
    analyze,
    dist,
    mid,
    angleAt
  };
})();

if (typeof window !== 'undefined') window.FaceMeasurements = FaceMeasurements;
if (typeof module !== 'undefined' && module.exports) module.exports = FaceMeasurements;
