import type { ParticleData, ParticleConfig } from '../types';

const MAX_DIMENSION = 2000;
const ALPHA_THRESHOLD = 30;

// Seeded PRNG for deterministic dithering (same image = same pattern)
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Check if a point is inside a rounded rectangle
function isInsideRoundedRect(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): boolean {
  // Clamp radius
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0) return px >= x && px <= x + w && py >= y && py <= y + h;

  // Check corners
  const left = x + r;
  const right = x + w - r;
  const top = y + r;
  const bottom = y + h - r;

  // Inside the cross-shaped inner region
  if (px >= x && px <= x + w && py >= top && py <= bottom) return true;
  if (py >= y && py <= y + h && px >= left && px <= right) return true;

  // Check corner circles
  const corners = [
    [left, top],
    [right, top],
    [left, bottom],
    [right, bottom],
  ];
  for (const [cx, cy] of corners) {
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy <= r * r) return true;
  }

  return false;
}

// Distance from edge of rounded rect (negative = inside, positive = outside)
function distFromRoundedRectEdge(
  px: number,
  py: number,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): number {
  r = Math.min(r, w / 2, h / 2);
  // Transform to center-relative coords
  const cx = x + w / 2;
  const cy = y + h / 2;
  const hw = w / 2;
  const hh = h / 2;

  const dx = Math.abs(px - cx) - (hw - r);
  const dy = Math.abs(py - cy) - (hh - r);

  if (dx <= 0 && dy <= 0) {
    // Inside the inner rect
    return -Math.min(-dx + r, -dy + r);
  }
  if (dx > 0 && dy > 0) {
    // Corner region
    return Math.sqrt(dx * dx + dy * dy) - r;
  }
  if (dx > 0) return dx - r;
  return dy - r;
}

export function sampleImage(
  image: HTMLImageElement,
  gap: number,
  canvasWidth: number,
  canvasHeight: number,
  objectScale: number = 0.7,
  config?: Partial<ParticleConfig>
): ParticleData {
  const offscreen = document.createElement('canvas');
  const ctx = offscreen.getContext('2d')!;

  let imgW = image.naturalWidth;
  let imgH = image.naturalHeight;

  if (imgW > MAX_DIMENSION || imgH > MAX_DIMENSION) {
    const scale = MAX_DIMENSION / Math.max(imgW, imgH);
    imgW = Math.floor(imgW * scale);
    imgH = Math.floor(imgH * scale);
  }

  const scaleX = canvasWidth / imgW;
  const scaleY = canvasHeight / imgH;
  const fitScale = Math.min(scaleX, scaleY) * objectScale;

  const drawW = Math.floor(imgW * fitScale);
  const drawH = Math.floor(imgH * fitScale);

  offscreen.width = drawW;
  offscreen.height = drawH;

  ctx.drawImage(image, 0, 0, drawW, drawH);
  const imageData = ctx.getImageData(0, 0, drawW, drawH);
  const pixels = imageData.data;

  const ditherEffect = config?.ditherEffect ?? false;
  const ditherStrength = config?.ditherStrength ?? 0.7;
  const invertColors = config?.invertColors ?? false;
  const cornerRadius = config?.cornerRadius ?? 0;
  const edgeScatter = config?.edgeScatter ?? 0;

  // Corner radius in pixel space (% of smaller dimension)
  const crPx = (cornerRadius / 100) * Math.min(drawW, drawH) * 0.5;

  const rng = mulberry32(42);

  // First pass: count particles
  let count = 0;
  for (let py = 0; py < drawH; py += gap) {
    for (let px = 0; px < drawW; px += gap) {
      const idx = (py * drawW + px) * 4;
      if (pixels[idx + 3] <= ALPHA_THRESHOLD) continue;

      // Corner radius mask
      if (crPx > 0 && !isInsideRoundedRect(px, py, 0, 0, drawW, drawH, crPx)) {
        continue;
      }

      // Edge scatter: randomly skip particles near the edge
      if (edgeScatter > 0 && crPx >= 0) {
        const edgeDist = crPx > 0
          ? -distFromRoundedRectEdge(px, py, 0, 0, drawW, drawH, crPx)
          : Math.min(px, py, drawW - px, drawH - py);
        const edgeZone = gap * 6 * edgeScatter;
        if (edgeDist < edgeZone && edgeDist >= 0) {
          const keepProb = edgeDist / edgeZone;
          if (rng() > keepProb * keepProb) continue;
        }
      }

      // Dither: brightness-weighted probability
      if (ditherEffect) {
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        // Darker = denser. Invert brightness for probability
        const prob = invertColors
          ? brightness * ditherStrength + (1 - ditherStrength)
          : (1 - brightness) * ditherStrength + (1 - ditherStrength);
        if (rng() > prob) continue;
      }

      count++;
    }
  }

  const data: ParticleData = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    homeX: new Float32Array(count),
    homeY: new Float32Array(count),
    r: new Float32Array(count),
    g: new Float32Array(count),
    b: new Float32Array(count),
    a: new Float32Array(count),
  };

  const offsetX = (canvasWidth - drawW) / 2;
  const offsetY = (canvasHeight - drawH) / 2;

  // Reset RNG for second pass (must match first pass)
  const rng2 = mulberry32(42);

  let i = 0;
  for (let py = 0; py < drawH; py += gap) {
    for (let px = 0; px < drawW; px += gap) {
      const idx = (py * drawW + px) * 4;
      if (pixels[idx + 3] <= ALPHA_THRESHOLD) continue;

      if (crPx > 0 && !isInsideRoundedRect(px, py, 0, 0, drawW, drawH, crPx)) {
        continue;
      }

      // Edge scatter (same logic, same rng sequence)
      if (edgeScatter > 0 && crPx >= 0) {
        const edgeDist = crPx > 0
          ? -distFromRoundedRectEdge(px, py, 0, 0, drawW, drawH, crPx)
          : Math.min(px, py, drawW - px, drawH - py);
        const edgeZone = gap * 6 * edgeScatter;
        if (edgeDist < edgeZone && edgeDist >= 0) {
          const keepProb = edgeDist / edgeZone;
          if (rng2() > keepProb * keepProb) continue;
        }
      }

      if (ditherEffect) {
        const r = pixels[idx];
        const g = pixels[idx + 1];
        const b = pixels[idx + 2];
        const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
        const prob = invertColors
          ? brightness * ditherStrength + (1 - ditherStrength)
          : (1 - brightness) * ditherStrength + (1 - ditherStrength);
        if (rng2() > prob) continue;
      }

      // Add jitter for natural edge feel
      const jitterAmount = edgeScatter * gap * 0.4;
      const jx = jitterAmount > 0 ? (rng2() - 0.5) * jitterAmount : 0;
      const jy = jitterAmount > 0 ? (rng2() - 0.5) * jitterAmount : 0;

      const worldX = px + offsetX + jx;
      const worldY = py + offsetY + jy;
      data.x[i] = worldX;
      data.y[i] = worldY;
      data.homeX[i] = worldX;
      data.homeY[i] = worldY;

      let pr = pixels[idx] / 255;
      let pg = pixels[idx + 1] / 255;
      let pb = pixels[idx + 2] / 255;

      if (invertColors) {
        pr = 1 - pr;
        pg = 1 - pg;
        pb = 1 - pb;
      }

      data.r[i] = pr;
      data.g[i] = pg;
      data.b[i] = pb;
      data.a[i] = pixels[idx + 3] / 255;
      i++;
    }
  }

  return data;
}
