/**
 * camera.js — Centralized configuration for camera capture and client-side quality checks.
 */

export const CAMERA_CONFIG = {
  // Video stream constraints for getUserMedia
  CONSTRAINTS: {
    video: {
      facingMode: { ideal: 'environment' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  },

  // Max dimension on the longest side for captured JPEG output
  MAX_DIMENSION: 640,

  // Output compression quality for canvas.toBlob / toDataURL (0.0 - 1.0)
  JPEG_QUALITY: 0.85,

  // Dimension of the downscaled canvas used strictly for rapid quality analysis
  QUALITY_ANALYSIS_SIZE: 160,

  // Blur threshold: variance of Laplacian on the normalized 160x160 canvas
  // Values below this are flagged as blurry / out-of-focus
  BLUR_THRESHOLD: 25.0,

  // Brightness thresholds: mean luminance (0 - 255)
  MIN_BRIGHTNESS: 40,   // Below this is considered underexposed / dark
  MAX_BRIGHTNESS: 225,  // Above this is considered overexposed / glare

  // Non-blocking warning messages for the preview screen
  MESSAGES: {
    BLURRY: 'Photo looks blurry. Hold the camera steady and tap to focus.',
    DARK: 'Photo looks dark. Try moving to natural daylight or turn on your flash.',
    BRIGHT: 'Photo is very bright or washed out. Avoid direct sun glare on the leaf.',
    COMBINED_BLUR_DARK: 'Photo is dark and blurry. Hold steady in better light.',
    COMBINED_BLUR_BRIGHT: 'Photo is blurry and washed out. Try moving to indirect light.',
  },
};

/**
 * Analyzes a captured canvas for blur (variance of Laplacian) and brightness (luminance).
 * Returns quality metrics and non-blocking warning messages.
 *
 * @param {HTMLCanvasElement} sourceCanvas - The canvas containing the captured image
 * @param {typeof CAMERA_CONFIG} [cfg=CAMERA_CONFIG] - Configuration object
 * @returns {{
 *   blurScore: number,
 *   brightness: number,
 *   isBlurry: boolean,
 *   isDark: boolean,
 *   isBright: boolean,
 *   passed: boolean,
 *   warnings: string[],
 * }}
 */
export function analyzeCapturedFrame(sourceCanvas, cfg = CAMERA_CONFIG) {
  try {
    const analysisSize = cfg.QUALITY_ANALYSIS_SIZE || 160;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = analysisSize;
    tempCanvas.height = analysisSize;
    const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });

    if (!ctx) {
      return {
        blurScore: 100,
        brightness: 128,
        isBlurry: false,
        isDark: false,
        isBright: false,
        passed: true,
        warnings: [],
      };
    }

    // Draw source scaled down into the normalized analysis canvas
    ctx.drawImage(sourceCanvas, 0, 0, analysisSize, analysisSize);
    const imgData = ctx.getImageData(0, 0, analysisSize, analysisSize);
    const data = imgData.data;
    const totalPixels = analysisSize * analysisSize;

    // Convert to grayscale
    const gray = new Float32Array(totalPixels);
    let luminanceSum = 0;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      // Rec. 601 luma formula
      const luma = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      gray[p] = luma;
      luminanceSum += luma;
    }

    const meanBrightness = luminanceSum / totalPixels;

    // Compute 3x3 discrete Laplacian filter:
    // [ 0,  1,  0]
    // [ 1, -4,  1]
    // [ 0,  1,  0]
    let lapSum = 0;
    let lapCount = 0;
    const w = analysisSize;
    const h = analysisSize;
    const lapValues = new Float32Array((w - 2) * (h - 2));

    for (let y = 1; y < h - 1; y++) {
      const yOffset = y * w;
      const upOffset = (y - 1) * w;
      const downOffset = (y + 1) * w;

      for (let x = 1; x < w - 1; x++) {
        const lap =
          gray[upOffset + x] +
          gray[downOffset + x] +
          gray[yOffset + (x - 1)] +
          gray[yOffset + (x + 1)] -
          4 * gray[yOffset + x];

        lapValues[lapCount] = lap;
        lapSum += lap;
        lapCount++;
      }
    }

    const meanLap = lapSum / (lapCount || 1);
    let varianceSum = 0;
    for (let i = 0; i < lapCount; i++) {
      const diff = lapValues[i] - meanLap;
      varianceSum += diff * diff;
    }
    const blurScore = lapCount > 0 ? varianceSum / lapCount : 0;

    const isBlurry = blurScore < cfg.BLUR_THRESHOLD;
    const isDark = meanBrightness < cfg.MIN_BRIGHTNESS;
    const isBright = meanBrightness > cfg.MAX_BRIGHTNESS;

    const warnings = [];
    if (isBlurry && isDark) {
      warnings.push(cfg.MESSAGES.COMBINED_BLUR_DARK);
    } else if (isBlurry && isBright) {
      warnings.push(cfg.MESSAGES.COMBINED_BLUR_BRIGHT);
    } else {
      if (isBlurry) warnings.push(cfg.MESSAGES.BLURRY);
      if (isDark) warnings.push(cfg.MESSAGES.DARK);
      if (isBright) warnings.push(cfg.MESSAGES.BRIGHT);
    }

    return {
      blurScore: Math.round(blurScore * 10) / 10,
      brightness: Math.round(meanBrightness),
      isBlurry,
      isDark,
      isBright,
      passed: !isBlurry && !isDark && !isBright,
      warnings,
    };
  } catch (err) {
    console.warn('Quality check calculation failed (failing open):', err);
    return {
      blurScore: 100,
      brightness: 128,
      isBlurry: false,
      isDark: false,
      isBright: false,
      passed: true,
      warnings: [],
    };
  }
}
