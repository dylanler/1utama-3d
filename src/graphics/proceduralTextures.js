import * as THREE from 'three';

let maxAniso = 8;
export function setTextureAnisotropy(renderer) {
  maxAniso = Math.min(16, renderer.capabilities.getMaxAnisotropy() || 8);
}

function finalizeTexture(canvas, { srgb = true, repeatX = 1, repeatY = 1 } = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = maxAniso;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

// Helper to draw text auto-scaled with bespoke brand font family, italic, and custom tracking (letter-spacing)!
function measureTrackedText(ctx, text, tracking = 0) {
  if (!tracking || text.length <= 1) return ctx.measureText(text).width;
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += ctx.measureText(text[i]).width + (i < text.length - 1 ? tracking : 0);
  }
  return total;
}

function drawTrackedText(ctx, text, x, y, tracking = 0) {
  if (!tracking || text.length <= 1) {
    ctx.fillText(text, x, y);
    return;
  }
  const totalW = measureTrackedText(ctx, text, tracking);
  const align = ctx.textAlign;
  let curX = x;
  if (align === 'center') curX = x - totalW * 0.5;
  else if (align === 'right') curX = x - totalW;
  ctx.save();
  ctx.textAlign = 'left';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    ctx.fillText(ch, curX, y);
    curX += ctx.measureText(ch).width + tracking;
  }
  ctx.restore();
}

function isHexLight(hex) {
  if (!hex || typeof hex !== 'string') return false;
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 0.52;
}

function fitTextMetrics(
  ctx,
  text,
  maxW,
  maxFontPx,
  weight = '800',
  fontFamily = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif',
  tracking = 0,
  italic = false
) {
  let size = maxFontPx;
  const stylePrefix = italic ? 'italic ' : '';
  ctx.font = `${stylePrefix}${weight} ${size}px ${fontFamily}`;
  while (size > 11 && measureTrackedText(ctx, text, tracking * (size / maxFontPx)) > maxW) {
    size -= 1;
    ctx.font = `${stylePrefix}${weight} ${size}px ${fontFamily}`;
  }
  const scaledTracking = tracking * (size / maxFontPx);
  const width = measureTrackedText(ctx, text, scaledTracking);
  return { size, width, tracking: scaledTracking };
}

function fillAutoFitText(
  ctx,
  text,
  x,
  y,
  maxW,
  maxFontPx,
  weight = '800',
  fontFamily = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif',
  tracking = 0,
  italic = false
) {
  const { size, tracking: scaledTracking } = fitTextMetrics(ctx, text, maxW, maxFontPx, weight, fontFamily, tracking, italic);
  drawTrackedText(ctx, text, x, y, scaledTracking);
  return size;
}

function drawMarbleVeins(ctx, size, veinColor, alpha = 0.08, count = 18) {
  // Soft organic feathered Crema Marfil mineral wisps (smooth curved clouds — ZERO harsh straight diagonal vector scratches!)
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let i = 0; i < count; i++) {
    let x = hash2(i, 1.3) * size;
    let y = hash2(i, 7.9) * size;
    const angleBase = hash2(i, 3.7) * Math.PI * 2;
    const pts = [{ x, y }];
    for (let s = 0; s < 8; s++) {
      const a = angleBase + Math.sin(i * 2.1 + s * 0.85) * 0.75 + (hash2(i * 13 + s, 5.1) - 0.5) * 0.65;
      x += Math.cos(a) * (size / 14);
      y += Math.sin(a) * (size / 14);
      pts.push({ x, y });
    }
    // Wide feathered translucent mineral cloud underlay
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let s = 1; s < pts.length - 1; s++) {
      const mx = (pts[s].x + pts[s + 1].x) * 0.5;
      const my = (pts[s].y + pts[s + 1].y) * 0.5;
      ctx.quadraticCurveTo(pts[s].x, pts[s].y, mx, my);
    }
    ctx.strokeStyle = veinColor;
    ctx.globalAlpha = alpha * 0.24 * (0.5 + hash2(i, 9.2) * 0.6);
    ctx.lineWidth = 10 + hash2(i, 2.4) * 18;
    ctx.stroke();

    // Delicate soft hairline mineral filament core
    ctx.globalAlpha = alpha * 0.38 * (0.45 + hash2(i, 4.8) * 0.55);
    ctx.lineWidth = 1.2 + hash2(i, 6.1) * 2.0;
    ctx.stroke();
  }
  ctx.restore();
}

export function createMarbleFloorMaps({
  baseHex = '#dcd3c3',
  altHex = '#d0c4b0',
  veinColor = '#8c7252',
  groutColor = '#8d806e',
  tiles = 4,
  baseRoughness = 34, // High-polish UE5 luxury mall marble (0.12-0.26 mottled roughness!)
  repeatX = 0.13,
  repeatY = 0.13
} = {}) {
  const size = 1024;
  const step = size / tiles;

  const cAlbedo = document.createElement('canvas');
  cAlbedo.width = cAlbedo.height = size;
  const ctxA = cAlbedo.getContext('2d');
  ctxA.fillStyle = baseHex;
  ctxA.fillRect(0, 0, size, size);

  for (let gx = 0; gx < tiles; gx++) {
    for (let gy = 0; gy < tiles; gy++) {
      const v = hash2(gx + 3, gy + 11);
      const x0 = gx * step;
      const y0 = gy * step;
      const grad = ctxA.createLinearGradient(x0, y0, x0 + step, y0 + step);
      grad.addColorStop(0, v > 0.5 ? baseHex : altHex);
      grad.addColorStop(1, v > 0.5 ? altHex : baseHex);
      ctxA.fillStyle = grad;
      ctxA.fillRect(x0 + 3, y0 + 3, step - 6, step - 6);
      // Subtle warm/cool mineral clouding per slab
      const cx = x0 + step * (0.3 + 0.4 * hash2(gx * 7, gy * 3));
      const cy = y0 + step * (0.3 + 0.4 * hash2(gx * 3, gy * 9));
      const radG = ctxA.createRadialGradient(cx, cy, 12, cx, cy, step * 0.65);
      radG.addColorStop(0, 'rgba(255,250,242,0.16)');
      radG.addColorStop(1, 'rgba(255,250,242,0.0)');
      ctxA.fillStyle = radG;
      ctxA.fillRect(x0 + 3, y0 + 3, step - 6, step - 6);
      ctxA.strokeStyle = 'rgba(15, 23, 42, 0.08)';
      ctxA.lineWidth = 3;
      ctxA.strokeRect(x0 + 4, y0 + 4, step - 8, step - 8);
    }
  }
  drawMarbleVeins(ctxA, size, veinColor, 0.24, 48);
  drawMarbleVeins(ctxA, size, 'rgba(255,255,255,0.72)', 0.14, 24);
  drawMarbleVeins(ctxA, size, 'rgba(40,32,24,0.12)', 0.15, 20);

  ctxA.strokeStyle = groutColor;
  ctxA.lineWidth = 5;
  for (let i = 0; i <= tiles; i++) {
    const p = i * step;
    ctxA.beginPath();
    ctxA.moveTo(p, 0);
    ctxA.lineTo(p, size);
    ctxA.moveTo(0, p);
    ctxA.lineTo(size, p);
    ctxA.stroke();
  }

  const cRough = document.createElement('canvas');
  cRough.width = cRough.height = size;
  const ctxR = cRough.getContext('2d');
  const safeBase = Math.max(28, Math.min(145, baseRoughness));
  ctxR.fillStyle = `rgb(${safeBase},${safeBase},${safeBase})`;
  ctxR.fillRect(0, 0, size, size);
  for (let gx = 0; gx < tiles; gx++) {
    for (let gy = 0; gy < tiles; gy++) {
      const r = Math.min(158, Math.max(24, safeBase + Math.floor((hash2(gx, gy) - 0.5) * 28)));
      ctxR.fillStyle = `rgb(${r},${r},${r})`;
      ctxR.fillRect(gx * step + 3, gy * step + 3, step - 6, step - 6);
      // Organic glossy polish variation across stone face
      const sc = Math.min(180, r + 26);
      const cx = gx * step + step * hash2(gx + 9, gy + 2);
      const cy = gy * step + step * hash2(gx + 5, gy + 8);
      const mg = ctxR.createRadialGradient(cx, cy, 10, cx, cy, step * 0.55);
      mg.addColorStop(0, `rgba(${sc},${sc},${sc},0.42)`);
      mg.addColorStop(1, `rgba(${r},${r},${r},0.0)`);
      ctxR.fillStyle = mg;
      ctxR.fillRect(gx * step + 3, gy * step + 3, step - 6, step - 6);
    }
  }
  drawMarbleVeins(ctxR, size, 'rgb(118,118,118)', 0.35, 34);
  ctxR.strokeStyle = 'rgb(225,225,225)';
  ctxR.lineWidth = 6;
  for (let i = 0; i <= tiles; i++) {
    const p = i * step;
    ctxR.beginPath();
    ctxR.moveTo(p, 0);
    ctxR.lineTo(p, size);
    ctxR.moveTo(0, p);
    ctxR.lineTo(size, p);
    ctxR.stroke();
  }

  const cNorm = document.createElement('canvas');
  cNorm.width = cNorm.height = size;
  const ctxN = cNorm.getContext('2d');
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, size, size);
  for (let i = 0; i < tiles; i++) {
    const p = i * step;
    ctxN.fillStyle = 'rgb(86,128,242)';
    ctxN.fillRect(p, 0, 4, size);
    ctxN.fillStyle = 'rgb(170,128,242)';
    ctxN.fillRect(p + step - 4, 0, 4, size);
    ctxN.fillStyle = 'rgb(128,86,242)';
    ctxN.fillRect(0, p, size, 4);
    ctxN.fillStyle = 'rgb(128,170,242)';
    ctxN.fillRect(0, p + step - 4, size, 4);
  }
  drawMarbleVeins(ctxN, size, 'rgb(138,118,248)', 0.16, 26);

  return {
    map: finalizeTexture(cAlbedo, { srgb: true, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cRough, { srgb: false, repeatX, repeatY }),
    normalMap: finalizeTexture(cNorm, { srgb: false, repeatX, repeatY })
  };
}

/**
 * Authentic 1 Utama District K (1UE) Glossy Cream-White Stone Floor Dotted with Vivid Red, Orange & Cobalt-Blue Square Accent Tiles!
 */
export function createDistrictKFloorMaps(repeatX = 0.14, repeatY = 0.14) {
  const size = 1024;
  const tiles = 8;
  const step = size / tiles;
  const cA = document.createElement('canvas');
  cA.width = cA.height = size;
  const ctxA = cA.getContext('2d');
  ctxA.fillStyle = '#f0ece4';
  ctxA.fillRect(0, 0, size, size);

  const accents = ['#d63636', '#e06224', '#2658c8', '#228be6'];
  for (let gx = 0; gx < tiles; gx++) {
    for (let gy = 0; gy < tiles; gy++) {
      const x0 = gx * step;
      const y0 = gy * step;
      const h = hash2(gx + 5, gy + 17);
      if (h > 0.91) {
        ctxA.fillStyle = accents[(gx * 3 + gy * 5) % accents.length];
      } else {
        ctxA.fillStyle = (gx + gy) % 2 === 0 ? '#f3efe8' : '#eae4da';
      }
      ctxA.fillRect(x0 + 2, y0 + 2, step - 4, step - 4);
      ctxA.strokeStyle = 'rgba(130, 122, 110, 0.24)';
      ctxA.lineWidth = 3;
      ctxA.strokeRect(x0 + 2, y0 + 2, step - 4, step - 4);
    }
  }
  const cR = document.createElement('canvas');
  cR.width = cR.height = size;
  const ctxR = cR.getContext('2d');
  ctxR.fillStyle = 'rgb(44,44,44)';
  ctxR.fillRect(0, 0, size, size);
  ctxR.strokeStyle = 'rgb(215,215,215)';
  ctxR.lineWidth = 5;
  for (let i = 0; i <= tiles; i++) {
    const p = i * step;
    ctxR.beginPath();
    ctxR.moveTo(p, 0);
    ctxR.lineTo(p, size);
    ctxR.moveTo(0, p);
    ctxR.lineTo(size, p);
    ctxR.stroke();
  }
  return {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX, repeatY })
  };
}

export function createCeilingSoffitMaps({
  baseHex = '#d5dce4',
  lightHex = '#ffebc0',
  baffleWood = false,
  repeatX = 0.06,
  repeatY = 0.06
} = {}) {
  const size = 1024;
  const cA = document.createElement('canvas');
  cA.width = cA.height = size;
  const ctx = cA.getContext('2d');

  const cE = document.createElement('canvas');
  cE.width = cE.height = size;
  const ctxE = cE.getContext('2d');
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, size, size);

  const cN = document.createElement('canvas');
  cN.width = cN.height = size;
  const ctxN = cN.getContext('2d');
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, size, size);

  const cR = document.createElement('canvas');
  cR.width = cR.height = size;
  const ctxR = cR.getContext('2d');
  ctxR.fillStyle = 'rgb(176,176,176)';
  ctxR.fillRect(0, 0, size, size);

  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, size, size);

  if (baffleWood) {
    // Authentic 1 Utama New Wing linear warm oak acoustic timber baffles with clean recessed linear light troughs!
    for (let y = 0; y < size; y += 32) {
      const shade = 0.90 + hash2(y, 3.1) * 0.20;
      ctx.fillStyle = `rgb(${Math.floor(156 * shade)},${Math.floor(108 * shade)},${Math.floor(66 * shade)})`;
      ctx.fillRect(0, y, size, 18);
      ctx.fillStyle = `rgb(${Math.floor(188 * shade)},${Math.floor(136 * shade)},${Math.floor(88 * shade)})`;
      ctx.fillRect(0, y + 2, size, 3);
      ctx.fillStyle = '#221811';
      ctx.fillRect(0, y + 18, size, 14);
      ctxN.fillStyle = 'rgb(128,88,238)';
      ctxN.fillRect(0, y, size, 4);
      ctxN.fillStyle = 'rgb(128,168,238)';
      ctxN.fillRect(0, y + 15, size, 4);
      ctxR.fillStyle = 'rgb(128,128,128)';
      ctxR.fillRect(0, y, size, 18);
      ctxR.fillStyle = 'rgb(235,235,235)';
      ctxR.fillRect(0, y + 18, size, 14);
    }
    for (const ly of [256, 768]) {
      ctx.fillStyle = '#fff8e6';
      ctx.fillRect(0, ly - 6, size, 12);
      const lg = ctxE.createLinearGradient(0, ly - 32, 0, ly + 32);
      lg.addColorStop(0, 'rgba(0,0,0,0)');
      lg.addColorStop(0.5, lightHex);
      lg.addColorStop(1, 'rgba(0,0,0,0)');
      ctxE.fillStyle = lg;
      ctxE.fillRect(0, ly - 32, size, 64);
    }
  } else {
    // Authentic Real 1 Utama Luxury Bright Architectural Plaster Coffered Soffit + Continuous Recessed Indirect Cove Channels (ZERO casino polka-dots!)
    const coffer = 512;
    for (let gx = 0; gx < 2; gx++) {
      for (let gy = 0; gy < 2; gy++) {
        const x0 = gx * coffer;
        const y0 = gy * coffer;
        // Subtle recessed brushed aluminum shadow-gap border
        ctx.fillStyle = 'rgba(28, 36, 48, 0.22)';
        ctx.fillRect(x0, y0, coffer, coffer);
        ctx.fillStyle = baseHex;
        ctx.fillRect(x0 + 10, y0 + 10, coffer - 20, coffer - 20);
        // Clean recessed inner architectural coffer tray with soft warm indirect perimeter glow!
        ctx.fillStyle = 'rgba(255, 250, 240, 0.28)';
        ctx.fillRect(x0 + 48, y0 + 48, coffer - 96, coffer - 96);
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.16)';
        ctx.lineWidth = 4;
        ctx.strokeRect(x0 + 48, y0 + 48, coffer - 96, coffer - 96);

        // Soft recessed warm linear cove lip along inner coffer edges
        ctxE.strokeStyle = 'rgba(255, 236, 198, 0.52)';
        ctxE.lineWidth = 10;
        ctxE.strokeRect(x0 + 54, y0 + 54, coffer - 108, coffer - 108);

        ctxN.fillStyle = 'rgb(96,128,242)';
        ctxN.fillRect(x0 + 48, y0 + 48, 6, coffer - 96);
        ctxN.fillStyle = 'rgb(160,128,242)';
        ctxN.fillRect(x0 + coffer - 54, y0 + 48, 6, coffer - 96);
        ctxN.fillStyle = 'rgb(128,96,242)';
        ctxN.fillRect(x0 + 48, y0 + 48, coffer - 96, 6);
        ctxN.fillStyle = 'rgb(128,160,242)';
        ctxN.fillRect(x0 + 48, y0 + coffer - 54, coffer - 96, 6);
      }
    }

    // Sleek continuous linear recessed architectural light channel + black HVAC shadow slot
    ctx.fillStyle = '#333b48';
    ctx.fillRect(0, 502, size, 20);
    ctx.fillStyle = '#fff9eb';
    ctx.fillRect(0, 508, size, 8);
    const stripG = ctxE.createLinearGradient(0, 490, 0, 534);
    stripG.addColorStop(0, 'rgba(0,0,0,0)');
    stripG.addColorStop(0.5, lightHex);
    stripG.addColorStop(1, 'rgba(0,0,0,0)');
    ctxE.fillStyle = stripG;
    ctxE.fillRect(0, 490, size, 44);

    // Luminous architectural recessed LED downlights (warm champagne bezel + blazing warm-white emissive core — ZERO dark gray rings!)
    const spots = [
      [256, 256], [768, 256],
      [256, 768], [768, 768]
    ];
    for (const [sx, sy] of spots) {
      ctx.fillStyle = '#aba193';
      ctx.beginPath();
      ctx.arc(sx, sy, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 10, 0, Math.PI * 2);
      ctx.fill();

      const g = ctxE.createRadialGradient(sx, sy, 2, sx, sy, 44);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.28, '#fff2cc');
      g.addColorStop(0.62, 'rgba(255, 224, 162, 0.42)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctxE.fillStyle = g;
      ctxE.beginPath();
      ctxE.arc(sx, sy, 44, 0, Math.PI * 2);
      ctxE.fill();
    }
  }

  return {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    emissiveMap: finalizeTexture(cE, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX, repeatY })
  };
}

/**
 * Architectural Fluted Travertine & Champagne-Granite Column Maps (Kills flat smooth white cylinder tubes!)
 */
let cachedFlutedColMaps = null;
export function createFlutedColumnMaps() {
  if (cachedFlutedColMaps) return cachedFlutedColMaps;
  const size = 512;
  const cA = document.createElement('canvas');
  cA.width = cA.height = size;
  const ctxA = cA.getContext('2d');

  const cN = document.createElement('canvas');
  cN.width = cN.height = size;
  const ctxN = cN.getContext('2d');

  const cR = document.createElement('canvas');
  cR.width = cR.height = size;
  const ctxR = cR.getContext('2d');

  const flutes = 24;
  const fw = size / flutes;
  for (let i = 0; i < flutes; i++) {
    const x0 = i * fw;
    // Subtle travertine champagne-ivory fluted shading
    const gA = ctxA.createLinearGradient(x0, 0, x0 + fw, 0);
    gA.addColorStop(0.0, '#b8afa2');
    gA.addColorStop(0.22, '#e2dad0');
    gA.addColorStop(0.50, '#ece5dc');
    gA.addColorStop(0.78, '#dcd3c7');
    gA.addColorStop(1.0, '#ada395');
    ctxA.fillStyle = gA;
    ctxA.fillRect(x0, 0, fw + 0.5, size);

    // Fluted cylindrical groove normal map
    const gN = ctxN.createLinearGradient(x0, 0, x0 + fw, 0);
    gN.addColorStop(0.0, 'rgb(64,128,232)');
    gN.addColorStop(0.5, 'rgb(128,128,255)');
    gN.addColorStop(1.0, 'rgb(192,128,232)');
    ctxN.fillStyle = gN;
    ctxN.fillRect(x0, 0, fw + 0.5, size);

    // Satin ridges, slightly rougher recessed flutes
    const gR = ctxR.createLinearGradient(x0, 0, x0 + fw, 0);
    gR.addColorStop(0.0, 'rgb(155,155,155)');
    gR.addColorStop(0.5, 'rgb(76,76,76)');
    gR.addColorStop(1.0, 'rgb(155,155,155)');
    ctxR.fillStyle = gR;
    ctxR.fillRect(x0, 0, fw + 0.5, size);
  }

  // Horizontal architectural stone cladding reveal seams (clean travertine flutes — ZERO conflicting diagonal scratches!)
  for (let y = 0; y < size; y += 128) {
    ctxA.fillStyle = 'rgba(28, 24, 20, 0.32)';
    ctxA.fillRect(0, y, size, 3);
    ctxN.fillStyle = 'rgb(128,72,235)';
    ctxN.fillRect(0, y, size, 3);
    ctxN.fillStyle = 'rgb(128,184,235)';
    ctxN.fillRect(0, y + 3, size, 3);
    ctxR.fillStyle = 'rgb(210,210,210)';
    ctxR.fillRect(0, y, size, 4);
  }

  cachedFlutedColMaps = {
    map: finalizeTexture(cA, { srgb: true, repeatX: 1, repeatY: 6 }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX: 1, repeatY: 6 }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX: 1, repeatY: 6 })
  };
  return cachedFlutedColMaps;
}

let cachedShadowTex = null;
export function createContactShadowTexture() {
  if (cachedShadowTex) return cachedShadowTex;
  const size = 128;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(4, 7, 14, 0.90)');
  g.addColorStop(0.45, 'rgba(5, 8, 15, 0.50)');
  g.addColorStop(1, 'rgba(6, 9, 16, 0.0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  cachedShadowTex = new THREE.CanvasTexture(c);
  cachedShadowTex.needsUpdate = true;
  return cachedShadowTex;
}

export function createTeakBoardwalkMaps(repeatX = 0.28, repeatY = 0.28) {
  const size = 512;
  const planks = 8;
  const step = size / planks;

  const cA = document.createElement('canvas');
  cA.width = cA.height = size;
  const ctx = cA.getContext('2d');

  const cN = document.createElement('canvas');
  cN.width = cN.height = size;
  const ctxN = cN.getContext('2d');
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, size, size);

  const cR = document.createElement('canvas');
  cR.width = cR.height = size;
  const ctxR = cR.getContext('2d');
  ctxR.fillStyle = 'rgb(112,112,112)';
  ctxR.fillRect(0, 0, size, size);

  for (let i = 0; i < planks; i++) {
    const shade = 0.84 + hash2(i, 4.1) * 0.28;
    const y0 = i * step;
    const g = ctx.createLinearGradient(0, y0, size, y0 + step);
    g.addColorStop(0, `rgb(${Math.floor(162 * shade)},${Math.floor(110 * shade)},${Math.floor(66 * shade)})`);
    g.addColorStop(0.5, `rgb(${Math.floor(182 * shade)},${Math.floor(126 * shade)},${Math.floor(76 * shade)})`);
    g.addColorStop(1, `rgb(${Math.floor(148 * shade)},${Math.floor(98 * shade)},${Math.floor(58 * shade)})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, y0, size, step - 4);

    // Rich organic merbau hardwood grain fibers & specular oil variation
    for (let s = 0; s < 26; s++) {
      const gy = y0 + (s / 26) * (step - 5);
      ctx.fillStyle = s % 2 === 0 ? 'rgba(42,20,8,0.18)' : 'rgba(205,148,88,0.11)';
      ctx.fillRect(0, gy, size, 2);
      ctxN.fillStyle = s % 2 === 0 ? 'rgb(128,118,250)' : 'rgb(128,138,250)';
      ctxN.fillRect(0, gy, size, 2);
      const rv = Math.floor(82 + hash2(i * 19 + s, 7.2) * 58);
      ctxR.fillStyle = `rgb(${rv},${rv},${rv})`;
      ctxR.fillRect(0, gy, size, 2.5);
    }
    // Deep recessed plank bevel joint + vertical butt joint
    ctx.fillStyle = '#180d06';
    ctx.fillRect(0, (i + 1) * step - 4, size, 4);
    ctxN.fillStyle = 'rgb(128,72,235)';
    ctxN.fillRect(0, y0, size, 3);
    ctxN.fillStyle = 'rgb(128,184,235)';
    ctxN.fillRect(0, (i + 1) * step - 6, size, 3);
    ctxR.fillStyle = 'rgb(230,230,230)';
    ctxR.fillRect(0, (i + 1) * step - 4, size, 4);

    const buttX = Math.floor(hash2(i, 9.7) * size);
    ctx.fillStyle = '#1c1008';
    ctx.fillRect(buttX, y0, 3, step - 4);
  }
  return {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX, repeatY })
  };
}

export function createRoadAsphaltTexture() {
  const w = 512;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1e2229';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(hash2(i, 1.1) * w, hash2(i, 2.7) * h, 2, 2);
  }
  ctx.fillStyle = '#334155';
  ctx.fillRect(w * 0.47, 0, w * 0.06, h);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(w * 0.465, 0, 4, h);
  ctx.fillRect(w * 0.53, 0, 4, h);
  ctx.fillStyle = '#eab308';
  ctx.fillRect(22, 0, 5, h);
  ctx.fillRect(w - 27, 0, 5, h);

  ctx.fillStyle = '#e2e8f0';
  for (const lx of [w * 0.17, w * 0.32, w * 0.68, w * 0.83]) {
    for (let y = 16; y < h; y += 64) ctx.fillRect(lx - 2, y, 4, 34);
  }
  return finalizeTexture(canvas, { srgb: true, repeatX: 1, repeatY: 14 });
}

/**
 * Procedural Petaling Jaya / Damansara / KL Urban Landscape Ground Texture
 */
export function createUrbanGroundTexture() {
  const size = 512;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // Lush Klang Valley greenery base
  ctx.fillStyle = '#162d20';
  ctx.fillRect(0, 0, size, size);

  // Urban blocks, terrace rooftops & tree canopies
  for (let gx = 0; gx < 8; gx++) {
    for (let gy = 0; gy < 8; gy++) {
      const bx = gx * 64 + 8;
      const by = gy * 64 + 8;
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#1e3528' : '#24303c';
      ctx.fillRect(bx, by, 48, 48);
      // Terrace roof rows & warm street lights
      for (let r = 0; r < 3; r++) {
        ctx.fillStyle = (gx + r) % 2 === 0 ? '#475569' : '#6b4226';
        ctx.fillRect(bx + 6, by + 6 + r * 14, 36, 9);
      }
    }
  }

  // Arterial PJ highways (LDP / Sprint) with warm amber light streaks
  ctx.fillStyle = '#0f172a';
  for (let p = 0; p < size; p += 64) {
    ctx.fillRect(p, 0, 7, size);
    ctx.fillRect(0, p, size, 7);
    ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
    ctx.fillRect(p + 2, 0, 2, size);
    ctx.fillRect(0, p + 2, size, 2);
    ctx.fillStyle = '#0f172a';
  }

  return finalizeTexture(c, { srgb: true, repeatX: 28, repeatY: 28 });
}

/**
 * Procedural Glass Skyscraper Curtain-Wall Mullion & Day/Night Window Textures
 */
export function createSkyscraperCurtainTexture(tintHex = '#4b7fa1', warmHex = '#fde68a') {
  const w = 512;
  const h = 1024;

  // Daytime sleek architectural glass curtain wall
  const cDay = document.createElement('canvas');
  cDay.width = w;
  cDay.height = h;
  const ctxD = cDay.getContext('2d');

  const dGrad = ctxD.createLinearGradient(0, 0, 0, h);
  dGrad.addColorStop(0, '#7ea5c4');
  dGrad.addColorStop(0.5, tintHex);
  dGrad.addColorStop(1, '#334155');
  ctxD.fillStyle = dGrad;
  ctxD.fillRect(0, 0, w, h);

  // Sunset / Night refined high-rise facade (fine realistic office bays — ZERO chunky SimCity pixel blocks!)
  const cNight = document.createElement('canvas');
  cNight.width = w;
  cNight.height = h;
  const ctxN = cNight.getContext('2d');
  const nGrad = ctxN.createLinearGradient(0, 0, 0, h);
  nGrad.addColorStop(0, '#364154');
  nGrad.addColorStop(0.55, '#252f40');
  nGrad.addColorStop(1, '#1a2230');
  ctxN.fillStyle = nGrad;
  ctxN.fillRect(0, 0, w, h);

  const cE = document.createElement('canvas');
  cE.width = w;
  cE.height = h;
  const ctxE = cE.getContext('2d');
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, w, h);

  for (let row = 0; row < 64; row++) {
    const floorLitBias = hash2(row, 11.3) > 0.35 ? 0.62 : 0.85;
    for (let col = 0; col < 16; col++) {
      const hVal = hash2(col + 3, row + 7);
      const lit = hVal > floorLitBias;
      const wx = col * 32 + 3;
      const wy = row * 16 + 4;
      const skyRef = hash2(col * 5 + 1, row * 3 + 2);
      ctxD.fillStyle = skyRef > 0.55 ? 'rgba(205, 225, 245, 0.55)' : 'rgba(110, 152, 185, 0.52)';
      ctxD.fillRect(wx, wy, 26, 8);

      ctxN.fillStyle = lit
        ? (hVal > 0.86 ? '#fff2cc' : warmHex)
        : 'rgba(148, 174, 204, 0.16)';
      ctxN.fillRect(wx, wy, 26, 7);
      if (lit) {
        ctxE.fillStyle = hVal > 0.86 ? 'rgba(255, 232, 175, 0.42)' : 'rgba(250, 210, 130, 0.28)';
        ctxE.fillRect(wx, wy, 26, 7);
      }
    }
    ctxD.fillStyle = '#475569';
    ctxD.fillRect(0, row * 16, w, 4);
    ctxN.fillStyle = '#18202c';
    ctxN.fillRect(0, row * 16, w, 5);
  }
  for (let col = 0; col <= 16; col++) {
    ctxD.fillStyle = '#64748b';
    ctxD.fillRect(col * 32, 0, 3, h);
    ctxN.fillStyle = '#141a24';
    ctxN.fillRect(col * 32, 0, 3, h);
  }

  return {
    dayMap: finalizeTexture(cDay, { srgb: true, repeatX: 1, repeatY: 1 }),
    nightMap: finalizeTexture(cNight, { srgb: true, repeatX: 1, repeatY: 1 }),
    map: finalizeTexture(cDay, { srgb: true, repeatX: 1, repeatY: 1 }),
    emissiveMap: finalizeTexture(cE, { srgb: true, repeatX: 1, repeatY: 1 })
  };
}

/**
 * One World Hotel Bandar Utama Authentic Sandstone / Champagne Stepped Resort Facade
 */
export function createOneWorldHotelTexture() {
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  const cE = document.createElement('canvas');
  cE.width = w;
  cE.height = h;
  const ctxE = cE.getContext('2d');
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, w, h);

  // Warm limestone/champagne resort concrete body
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#e5d5bc');
  bg.addColorStop(1, '#c8b290');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Architectural horizontal floor bands + warm hotel room windows
  for (let row = 0; row < 20; row++) {
    const wy = 24 + row * 24;
    ctx.fillStyle = '#a8906c';
    ctx.fillRect(0, wy - 4, w, 4);
    for (let col = 0; col < 12; col++) {
      const wx = 12 + col * 41;
      const lit = hash2(col + 1, row + 5) > 0.45;
      ctx.fillStyle = lit ? '#fef08a' : '#334155';
      ctx.fillRect(wx, wy, 30, 14);
      if (lit) {
        ctxE.fillStyle = 'rgba(254, 240, 138, 0.58)';
        ctxE.fillRect(wx, wy, 30, 14);
      }
    }
  }

  return {
    map: finalizeTexture(c, { srgb: true, repeatX: 1, repeatY: 1 }),
    emissiveMap: finalizeTexture(cE, { srgb: true, repeatX: 1, repeatY: 1 })
  };
}

/**
 * Bright Warm Off-White Kiosk Canopy Soffit with 4 Recessed LED Downlights (Fixes pitch-black undersides!)
 */
let cachedKioskSoffit = null;
export function createKioskSoffitTexture() {
  if (cachedKioskSoffit) return cachedKioskSoffit;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ebe6dc';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 4;
  ctx.strokeRect(4, 4, s - 8, s - 8);
  for (const [lx, ly] of [[68, 68], [188, 68], [68, 188], [188, 188]]) {
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(lx, ly, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.arc(lx, ly, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  cachedKioskSoffit = finalizeTexture(c, { srgb: true });
  return cachedKioskSoffit;
}

/**
 * Crisp Branded Signboard Texture (Supports custom aspect width so wide portal banners NEVER stretch!)
 */
export function createSignBoardTexture(title, sub = '', bgHex = '#0f172a', fgHex = '#ffffff', accentHex = '#fbbf24', w = 512, h = 144) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, w - 8, h - 8);
  ctx.fillStyle = fgHex;
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, title, w * 0.5, sub ? h * 0.46 : h * 0.60, w - 44, 42, '800');
  if (sub) {
    ctx.fillStyle = accentHex;
    fillAutoFitText(ctx, sub, w * 0.5, h * 0.78, w - 44, 24, '700');
  }
  return finalizeTexture(c, { srgb: true });
}

/**
 * maimai DX PRiSM Vibrant Circular Rhythm Beatmap Screen Texture
 */
let cachedMaimaiTex = null;
export function createMaimaiScreenTexture() {
  if (cachedMaimaiTex) return cachedMaimaiTex;
  const s = 256;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const bg = ctx.createRadialGradient(128, 128, 14, 128, 128, 126);
  bg.addColorStop(0, '#312e81');
  bg.addColorStop(0.6, '#0c4a6e');
  bg.addColorStop(1, '#09090b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, s, s);
  // Outer judgment ring + 8 touch sectors
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(128, 128, 108, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#fde047';
    ctx.beginPath();
    ctx.arc(128 + Math.cos(a) * 92, 128 + Math.sin(a) * 92, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  // Curved slide track + score center
  ctx.strokeStyle = '#22d3ee';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 66, -0.6, 1.9);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, '100.84%', 128, 124, 120, 26, '800');
  ctx.fillStyle = '#fde047';
  fillAutoFitText(ctx, 'ALL PERFECT', 128, 152, 120, 16, '800');
  cachedMaimaiTex = finalizeTexture(c, { srgb: true });
  return cachedMaimaiTex;
}

/**
 * Cosmic Bowling Overhead Digital Scoreboard Texture (Wangsa Bowl EZ401)
 */
export function createBowlingScoreTexture(laneNum = 1) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#1d4ed8';
  ctx.fillRect(0, 0, 256, 34);
  ctx.fillStyle = '#fde047';
  ctx.textAlign = 'left';
  fillAutoFitText(ctx, `LANE 0${laneNum} • WANGSA BOWL`, 12, 24, 230, 16, '800');
  // Frame grid with X strikes
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  for (let f = 0; f < 5; f++) {
    ctx.strokeRect(10 + f * 48, 44, 44, 38);
    ctx.fillStyle = f % 2 === 0 ? '#f472b6' : '#34d399';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, f % 2 === 0 ? 'X' : '9 /', 32 + f * 48, 69, 36, 18, '800');
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'right';
  fillAutoFitText(ctx, `TOTAL: ${184 + laneNum * 17}`, 244, 114, 220, 20, '800');
  return finalizeTexture(c, { srgb: true });
}

/**
 * Baseball Batting Cage Strike-Zone Target Texture (UR603 Baseball Cage)
 */
let cachedStrikeTex = null;
export function createStrikeZoneTexture() {
  if (cachedStrikeTex) return cachedStrikeTex;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 8;
  ctx.strokeRect(24, 24, 208, 208);
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(128, 128, 72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(128, 128, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, '110 KM/H • STRIKE ZONE', 128, 220, 200, 16, '800');
  cachedStrikeTex = finalizeTexture(c, { srgb: true });
  return cachedStrikeTex;
}

/**
 * Perforated Sports / Padel / Futsal Net Texture (Zero Pitch-Black Blocks!)
 */
export function createPerforatedNetTexture(tapeColor = '#ffffff') {
  const s = 128;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);

  // Top white net tape
  ctx.fillStyle = tapeColor;
  ctx.fillRect(0, 0, s, 14);

  ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
  ctx.lineWidth = 2;
  for (let i = 0; i <= s; i += 12) {
    ctx.beginPath();
    ctx.moveTo(i, 14);
    ctx.lineTo(i, s);
    ctx.moveTo(0, i + 14);
    ctx.lineTo(s, i + 14);
    ctx.stroke();
  }
  return finalizeTexture(c, { srgb: true, repeatX: 8, repeatY: 1 });
}

export function createEscalatorStepTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  // High-contrast machined brushed silver-aluminum grooved Hitachi step cleats!
  ctx.fillStyle = '#5c6674';
  ctx.fillRect(0, 0, 512, 512);
  for (let x = 0; x < 512; x += 8) {
    ctx.fillStyle = '#dce4ee';
    ctx.fillRect(x, 0, 3.5, 512);
    ctx.fillStyle = '#8b96a6';
    ctx.fillRect(x + 3.5, 0, 1.5, 512);
    ctx.fillStyle = '#1f2530';
    ctx.fillRect(x + 5, 0, 3, 512);
  }
  // Subtle metallic wear gleam across center foot traffic band
  const sheen = ctx.createLinearGradient(0, 0, 512, 0);
  sheen.addColorStop(0, 'rgba(0,0,0,0.18)');
  sheen.addColorStop(0.5, 'rgba(255,255,255,0.16)');
  sheen.addColorStop(1, 'rgba(0,0,0,0.18)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, 512, 512);

  // Crisp 3-sided safety yellow demarcation cleats
  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, 22, 512);
  ctx.fillRect(490, 0, 22, 512);
  ctx.fillRect(0, 0, 512, 22);
  ctx.fillRect(0, 490, 512, 22);
  return finalizeTexture(canvas, { srgb: true, repeatX: 1, repeatY: 1 });
}

export function createEscalatorStepNormalMap() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgb(128,128,255)';
  ctx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 4) {
    ctx.fillStyle = 'rgb(52,128,235)';
    ctx.fillRect(x, 0, 1, 256);
    ctx.fillStyle = 'rgb(128,128,255)';
    ctx.fillRect(x + 1, 0, 1, 256);
    ctx.fillStyle = 'rgb(204,128,235)';
    ctx.fillRect(x + 2, 0, 1, 256);
    ctx.fillStyle = 'rgb(128,128,210)';
    ctx.fillRect(x + 3, 0, 1, 256);
  }
  return finalizeTexture(canvas, { srgb: false, repeatX: 1, repeatY: 1 });
}

/**
 * High-Resolution Readable 1 Utama Standing Digital Touch Directory Screen Texture
 */
let cachedDigitalDirTex = null;
export function createDigitalDirectoryTexture() {
  if (cachedDigitalDirTex) return cachedDigitalDirTex;
  const w = 512;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#0b1426');
  bg.addColorStop(1, '#152238');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Header bar
  ctx.fillStyle = '#0ea5e9';
  ctx.fillRect(0, 0, w, 124);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, '1 UTAMA DIRECTORY', w * 0.5, 62, w - 48, 38, '700', '"Jost", sans-serif', 6);
  ctx.fillStyle = '#e0f2fe';
  fillAutoFitText(ctx, 'PETALING JAYA  •  7 LEVELS', w * 0.5, 102, w - 48, 20, '600', '"Montserrat", sans-serif', 4);

  // Stylized Interactive 4-Wing Floorplan Diagram
  ctx.fillStyle = '#0f1c33';
  ctx.fillRect(28, 152, w - 56, 286);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 152, w - 56, 286);
  // 1UE, Old Wing, Rainforest, Oval color-coded blocks
  ctx.fillStyle = '#ec4899';
  ctx.fillRect(46, 224, 62, 146);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(118, 206, 118, 182);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(262, 212, 74, 170);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(344, 206, 122, 182);
  ctx.fillStyle = '#0b1426';
  ctx.beginPath();
  ctx.ellipse(408, 297, 36, 52, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7dd3fc';
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  fillAutoFitText(ctx, 'YOU ARE HERE  •  THE OVAL', w * 0.5, 420, w - 80, 18, '700', '"Montserrat", sans-serif', 3);

  // Readable floor level guide rows
  const rows = [
    ['UR', 'Secret Garden • ASCARO Padel', '#34d399'],
    ['4F', 'GSC 15-Hall • Camp5 • Wangsa Bowl', '#f472b6'],
    ['3F', 'TGV IMAX • The Ledge Gallery', '#c084fc'],
    ['2F', 'Rainbow Bridge • Food District • Nike', '#38bdf8'],
    ['1F', 'Rollerwa • Decathlon • Dyson', '#60a5fa'],
    ['G', 'Sephora • Zara • Come True • Parkson', '#fbbf24'],
    ['LG', 'Rainforest Koi • Ippudo • Jaya Grocer', '#2dd4bf']
  ];
  rows.forEach(([code, label, col], idx) => {
    const ry = 468 + idx * 72;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(28, ry, w - 56, 58);
    ctx.fillStyle = col;
    ctx.fillRect(28, ry, 72, 58);
    ctx.fillStyle = '#090d16';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, code, 64, ry + 39, 60, 26, '800', '"Jost", sans-serif', 2);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'left';
    fillAutoFitText(ctx, label, 114, ry + 37, w - 156, 20, '600', '"Montserrat", sans-serif', 1);
  });

  cachedDigitalDirTex = finalizeTexture(c, { srgb: true });
  return cachedDigitalDirTex;
}

/**
 * Category-Specific Interior Bay Illustration Helper (20+ Authentic Real2Sim Archetypes!)
 */
function drawCategoryVignette(ctx, ctxE, store, bay, backX, backY, backW, backH, bayIdx = 0) {
  const st = store.style || 'fashion';
  const cx = bay.x + bay.w * 0.5;
  const lotKey = (store.lot || '').toUpperCase();
  const nameKey = (store.name || '').toUpperCase();

  if (st === 'surau') {
    // Rich Emerald & Cedar Islamic Geometric Mashrabiya Lattice + Hanging Brass Star Lanterns!
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(backX, backY, backW, backH);
    // Patterned marble wainscoting
    ctx.fillStyle = '#d6d3d1';
    ctx.fillRect(backX, backY + backH - 42, backW, 42);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(backX, backY + backH - 46, backW, 4);
    // Pointed Moorish Mashrabiya Arch
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(cx, backY + 72, 52, Math.PI, 0);
    ctx.lineTo(cx + 52, backY + backH);
    ctx.lineTo(cx - 52, backY + backH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.arc(cx, backY + 75, 42, Math.PI, 0);
    ctx.lineTo(cx + 42, backY + backH);
    ctx.lineTo(cx - 42, backY + backH);
    ctx.closePath();
    ctx.fill();
    // Geometric diamond mashrabiya lattice
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.2;
    for (let lx = -36; lx <= 36; lx += 18) {
      ctx.beginPath();
      ctx.moveTo(cx + lx, backY + 42);
      ctx.lineTo(cx + lx, backY + backH - 22);
      ctx.stroke();
    }
    for (let ly = backY + 52; ly < backY + backH - 22; ly += 18) {
      ctx.beginPath();
      ctx.moveTo(cx - 42, ly);
      ctx.lineTo(cx + 42, ly);
      ctx.stroke();
    }
    // Glowing hanging brass lantern inside arch
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(cx, backY + 62, 11, 0, Math.PI * 2);
    ctx.fill();
    ctxE.fillStyle = '#fde047';
    ctxE.beginPath();
    ctxE.arc(cx, backY + 62, 11, 0, Math.PI * 2);
    ctxE.fill();
    // Cedar shoe bench
    ctx.fillStyle = '#78350f';
    ctx.fillRect(bay.x + 28, 336, bay.w - 56, 26);
    return;
  }

  if (st === 'herbal') {
    // Traditional Chinese Wellness Apothecary (Lo Hong Ka / Eu Yan Sang): Mahogany TCM Drawers & Golden Bird's Nest Vitrines!
    ctx.fillStyle = '#451a03';
    ctx.fillRect(backX, backY, backW, backH);
    // Mahogany TCM medicine cabinet grid
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(backX + 12 + c * 36, backY + 14 + r * 24, 30, 18);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(backX + 24 + c * 36, backY + 21 + r * 24, 6, 4);
      }
    }
    // Illuminated Glass Bird's Nest Vitrine + Red & Gold Festive Hampers!
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - 84, 286, 168, 64);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.strokeRect(cx - 84, 286, 168, 64);
    for (let h = -1; h <= 1; h++) {
      ctx.fillStyle = h === 0 ? '#b91c1c' : '#d97706';
      ctx.fillRect(cx + h * 50 - 16, 302, 32, 36);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx + h * 50 - 18, 298, 36, 6);
    }
    return;
  }

  if (st === 'korean') {
    // Korean Hanok Wood Slats, Paper Lanterns & Ttukbaegi Stone-Pot Dining Tables (MODU, Bongchu, BHC)!
    ctx.fillStyle = '#292524';
    ctx.fillRect(backX, backY, backW, backH);
    // Vertical Korean oak slat partition + glowing hanji paper screen
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(backX + 18, backY + 16, backW - 36, 98);
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    for (let sx = backX + 18; sx <= backX + backW - 18; sx += 24) {
      ctx.beginPath();
      ctx.moveTo(sx, backY + 16);
      ctx.lineTo(sx, backY + 114);
      ctx.stroke();
    }
    for (let sy = backY + 16; sy <= backY + 114; sy += 24) {
      ctx.beginPath();
      ctx.moveTo(backX + 18, sy);
      ctx.lineTo(backX + backW - 18, sy);
      ctx.stroke();
    }
    // Warm timber tables with black stone samgyetang soup bowls
    for (const tx of [cx - 60, cx + 60]) {
      ctx.fillStyle = '#b45309';
      ctx.fillRect(tx - 34, 314, 68, 12);
      ctx.fillRect(tx - 6, 326, 12, 34);
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(tx, 308, 14, 0, Math.PI, false);
      ctx.fill();
    }
    return;
  }

  if (st === 'japanese') {
    // Authentic Japanese Cypress Counter, Indigo/Red Noren Curtains & Glowing Chochin Lanterns!
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(backX, backY, backW, backH);
    // Hanging Japanese Noren fabric panels
    const norenCol = nameKey.includes('SUSHI') || nameKey.includes('ZANMAI') ? '#1e3a8a' : '#991b1b';
    for (let n = 0; n < 4; n++) {
      ctx.fillStyle = norenCol;
      ctx.fillRect(backX + 12 + n * 56, backY + 8, 48, 56);
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(backX + 36 + n * 56, backY + 36, 13, 0, Math.PI * 2);
      ctx.stroke();
    }
    // Hanging glowing Chochin lanterns
    for (const lx of [cx - 72, cx + 72]) {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(lx, backY + 78, 14, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctxE.fillStyle = '#fbbf24';
      ctxE.beginPath();
      ctxE.ellipse(lx, backY + 78, 12, 18, 0, 0, Math.PI * 2);
      ctxE.fill();
    }
    // Hinoki cypress ramen/sushi bar counter
    ctx.fillStyle = '#d97706';
    ctx.fillRect(cx - 98, 298, 196, 16);
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 92, 314, 184, 48);
    return;
  }

  if (st === 'wok') {
    // Modern Open-Kitchen Takeaway Wok Counter (Wok Hey): Black Subway Tile, Stainless Hood & Digital Menu!
    ctx.fillStyle = '#18181b';
    ctx.fillRect(backX, backY, backW, backH);
    // Stainless steel kitchen hood
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(backX + 18, backY + 12, backW - 36, 46);
    // Glowing digital menu screens
    for (let m = 0; m < 3; m++) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(backX + 18 + m * 72, backY + 66, 62, 38);
      ctx.fillStyle = '#fb923c';
      ctx.fillRect(backX + 22 + m * 72, backY + 72, 54, 8);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(backX + 22 + m * 72, backY + 86, 42, 6);
    }
    // Orange & charcoal takeaway pickup counter
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(cx - 96, 294, 192, 66);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(cx - 100, 286, 200, 10);
    return;
  }

  if (st === 'skydiving') {
    // WINDLAB Indoor Skydiving Lobby: Aerospace Blue Flight-Suit Lockers, Tunnel Gallery & Telemetry Screen!
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(backX, backY, backW, backH);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(backX + 16, backY + 14, backW - 32, 66);
    ctxE.fillStyle = '#38bdf8';
    ctxE.globalAlpha = 0.45;
    ctxE.fillRect(backX + 20, backY + 18, backW - 40, 58);
    ctxE.globalAlpha = 1.0;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, bayIdx === 1 ? 'FLIGHT BRIEFING • 250 KM/H' : 'WINDLAB FLIGHT DECK', cx, backY + 54, backW - 44, 16, '800');
    // Red & cyan skydiving flight suits on gear rack
    for (let f = -2; f <= 2; f++) {
      ctx.fillStyle = f % 2 === 0 ? '#ef4444' : '#38bdf8';
      ctx.fillRect(cx + f * 34 - 11, 252, 22, 64);
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(cx + f * 34, 240, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (st === 'lovelock') {
    // Saranghae Bridge Korean Love-Lock Wall & Neon Heart Photo-Booth!
    ctx.fillStyle = '#4c0519';
    ctx.fillRect(backX, backY, backW, backH);
    // Mesh trellis grid with colorful heart padlocks
    ctx.strokeStyle = '#f9a8d4';
    ctx.lineWidth = 2;
    for (let x = backX + 16; x < backX + backW - 16; x += 22) {
      ctx.beginPath();
      ctx.moveTo(x, backY + 18);
      ctx.lineTo(x, backY + backH - 18);
      ctx.stroke();
    }
    const pCols = ['#f472b6', '#fde047', '#38bdf8', '#fb7185', '#c084fc'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        ctx.fillStyle = pCols[(r + c) % pCols.length];
        ctx.fillRect(backX + 20 + c * 28, backY + 26 + r * 30, 14, 18);
      }
    }
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, backY + 78, 36, 0, Math.PI * 2);
    ctx.stroke();
    ctxE.strokeStyle = '#f472b6';
    ctxE.lineWidth = 5;
    ctxE.beginPath();
    ctxE.arc(cx, backY + 78, 36, 0, Math.PI * 2);
    ctxE.stroke();
    return;
  }

  if (st === 'arcade') {
    // Game On / Cross Fire / Wangsa Bowl / Diva Karaoke / NextGen VR: Vibrant Neon Entertainment Interior!
    ctx.fillStyle = '#09090b';
    ctx.fillRect(backX, backY, backW, backH);
    // Glowing neon horizon grid & ceiling strips
    const nCol1 = store.accent || '#22d3ee';
    const nCol2 = nameKey.includes('DIVA') ? '#e879f9' : nameKey.includes('BOWL') ? '#38bdf8' : '#f472b6';
    ctx.strokeStyle = nCol1;
    ctx.lineWidth = 3;
    ctx.strokeRect(backX + 10, backY + 10, backW - 20, backH - 20);
    ctxE.strokeStyle = nCol1;
    ctxE.lineWidth = 3;
    ctxE.strokeRect(backX + 10, backY + 10, backW - 20, backH - 20);

    if (nameKey.includes('BOWL')) {
      // Bowling lanes + glowing pins inside glazing
      for (let l = -1; l <= 1; l++) {
        ctx.fillStyle = '#b45309';
        ctx.fillRect(cx + l * 64 - 22, backY + 70, 44, backH - 72);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(cx + l * 64 - 24, backY + 34, 48, 26);
      }
    } else if (nameKey.includes('DIVA')) {
      // Velvet VIP Karaoke corridor with glowing neon arches & golden spotlights
      for (let a = 0; a < 3; a++) {
        ctx.strokeStyle = a % 2 === 0 ? '#e879f9' : '#fbbf24';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, backY + 104, 72 - a * 18, Math.PI, 0);
        ctx.stroke();
      }
      ctx.fillStyle = '#7c3aed';
      ctx.fillRect(cx - 72, 306, 144, 46);
    } else {
      // Arcade cabinets / Esports pods / Mini-golf glow!
      for (let a = -1; a <= 1; a++) {
        const ax = cx + a * 68;
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(ax - 24, backY + 34, 48, 120);
        ctx.fillStyle = a === 0 ? nCol1 : nCol2;
        ctx.fillRect(ax - 18, backY + 46, 36, 44);
        ctxE.fillStyle = a === 0 ? nCol1 : nCol2;
        ctxE.globalAlpha = 0.55;
        ctxE.fillRect(ax - 18, backY + 46, 36, 44);
        ctxE.globalAlpha = 1.0;
        ctx.fillStyle = '#fde047';
        ctx.fillRect(ax - 16, backY + 100, 32, 10);
      }
    }
    return;
  }

  if (st === 'furniture') {
    // Distinct Designer Furniture Showrooms per Brand & Bay!
    const isCellini = nameKey.includes('CELLINI');
    const isStanzo = nameKey.includes('STANZO');
    const isLight = nameKey.includes('MUJI') || nameKey.includes('NITORI') || nameKey.includes('HOOGA');
    ctx.fillStyle = isLight ? '#d6d3d1' : isStanzo ? '#1e293b' : '#3f3f46';
    ctx.fillRect(backX, backY, backW, backH);
    for (let x = backX + 8; x < backX + backW; x += 18) {
      ctx.fillStyle = isLight ? '#b08968' : isCellini ? '#451a03' : '#78350f';
      ctx.fillRect(x, backY + 10, 9, backH - 20);
    }
    if (bayIdx === 2 || isStanzo) {
      // Sculptural Italian marble dining table + 4 designer chairs + chandelier
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx - 72, 294, 144, 14);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx - 18, 308, 36, 46);
      for (const chX of [cx - 86, cx + 64]) {
        ctx.fillStyle = isStanzo ? '#f59e0b' : '#b45309';
        ctx.fillRect(chX, 276, 22, 68);
      }
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 46, backY + 34, 92, 10);
    } else {
      // Modern L-sofa (distinct upholstery per showroom!)
      ctx.fillStyle = isCellini ? '#9a3412' : isLight ? '#f5f5f4' : '#e7e5e4';
      ctx.fillRect(cx - 82, 278, 164, 42);
      ctx.fillRect(cx - 88, 256, 176, 26);
      ctx.fillStyle = store.accent || '#f59e0b';
      ctx.fillRect(cx - 65, 260, 24, 20);
      ctx.fillRect(cx + 40, 260, 24, 20);
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx - 44, 334, 88, 16);
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx + 50, 250, 52, Math.PI, Math.PI * 1.55);
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cx + 8, 206, 12, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (st === 'gym') {
    // Deep Multi-Layer Fitness Studio (Celebrity Fitness): Illuminated Mirrors, Red Star Logo, Spin Bikes & Treadmills!
    ctx.fillStyle = '#09090b';
    ctx.fillRect(backX, backY, backW, backH);
    // Frosted studio glass mirror backwall with horizontal light strips
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(backX + 12, backY + 14, backW - 24, backH - 30);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(backX + 12, backY + 14, backW - 24, 8);
    ctxE.fillStyle = '#ef4444';
    ctxE.fillRect(backX + 12, backY + 14, backW - 24, 6);
    // Dumbbell rack + spin bikes / treadmills varied per bay
    for (let t = -1; t <= 1; t++) {
      const tx = cx + t * 66;
      ctx.fillStyle = '#475569';
      ctx.fillRect(tx - 24, 326, 48, 18);
      ctx.fillRect(tx + 10, 266, 8, 62);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(tx + 2, 254, 24, 16);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(tx - 10, 314, 14, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (st === 'scuba') {
    // Sealantis 4m Illuminated Turquoise Scuba Dive Pool Window!
    const poolGrad = ctx.createLinearGradient(bay.x, 125, bay.x, 372);
    poolGrad.addColorStop(0, '#22d3ee');
    poolGrad.addColorStop(0.55, '#0284c7');
    poolGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = poolGrad;
    ctx.fillRect(bay.x + 8, 125, bay.w - 16, 248);
    ctxE.fillStyle = 'rgba(34, 211, 238, 0.35)';
    ctxE.fillRect(bay.x + 12, 130, bay.w - 24, 238);
    // Underwater caustic ribbons + stainless steel pool ladder + rising air bubbles
    ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
    ctx.lineWidth = 3;
    for (let w = 0; w < 5; w++) {
      ctx.beginPath();
      ctx.moveTo(bay.x + 18, 155 + w * 40);
      ctx.quadraticCurveTo(cx, 138 + w * 40, bay.x + bay.w - 18, 155 + w * 40);
      ctx.stroke();
    }
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(bay.x + 28, 140, 6, 200);
    ctx.fillRect(bay.x + 58, 140, 6, 200);
    for (let r = 0; r < 6; r++) ctx.fillRect(bay.x + 28, 165 + r * 30, 36, 4);
    return;
  }

  if (st === 'transit') {
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(backX, backY, backW, backH);
    for (const ox of [-52, 52]) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(cx + ox - 32, backY + 26, 64, backH - 26);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx + ox - 26, backY + 34, 52, backH - 34);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(cx + ox - 2, backY + 34, 4, backH - 34);
    }
    ctx.fillStyle = store.accent || '#facc15';
    ctx.fillRect(cx - 65, backY + 8, 130, 12);
    return;
  }

  if (st === 'concierge') {
    ctx.fillStyle = '#500724';
    ctx.fillRect(backX, backY, backW, backH);
    ctx.fillStyle = '#fde68a';
    fillAutoFitText(ctx, 'ONECARD • 1PAY CONCIERGE', cx, backY + 48, backW - 24, 20, '800');
    ctx.fillStyle = '#831843';
    ctx.fillRect(cx - 88, 292, 176, 58);
    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(cx - 94, 284, 188, 10);
    return;
  }

  if (st === 'gallery') {
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(backX, backY, backW, backH);
    const colors = [['#0284c7', '#fbbf24'], ['#e11d48', '#10b981'], ['#7c3aed', '#f472b6']];
    for (let a = 0; a < 2; a++) {
      const pal = colors[(a + bayIdx) % colors.length];
      const ax = backX + 24 + a * (backW * 0.48);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(ax, backY + 28, 76, 98);
      ctx.fillStyle = pal[0];
      ctx.fillRect(ax + 6, backY + 34, 64, 86);
      ctx.fillStyle = pal[1];
      ctx.beginPath();
      ctx.arc(ax + 38, backY + 76, 22, 0, Math.PI * 2);
      ctx.fill();
    }
    return;
  }

  if (st === 'dining' || st === 'kopitiam' || st === 'bakery') {
    // Brand-Differentiated Café / Kopitiam / Bakery / Restaurant Interior!
    const wallCol = st === 'bakery' ? '#713f12' : st === 'kopitiam' ? '#3b2414' : '#451a03';
    ctx.fillStyle = wallCol;
    ctx.fillRect(backX, backY, backW, backH);
    for (let p = -1; p <= 1; p++) {
      const px = cx + p * 66;
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, backY);
      ctx.lineTo(px, backY + 38);
      ctx.stroke();
      ctx.fillStyle = store.accent || '#fde047';
      ctx.beginPath();
      ctx.arc(px, backY + 44, 13, Math.PI, 0);
      ctx.fill();
      ctxE.fillStyle = '#fde68a';
      ctxE.beginPath();
      ctxE.arc(px, backY + 44, 10, 0, Math.PI * 2);
      ctxE.fill();
    }
    if (st === 'bakery') {
      // Tiered glass pastry display cases filled with golden croissants & cakes!
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(cx - 94, 276, 188, 74);
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 4;
      ctx.strokeRect(cx - 94, 276, 188, 74);
      for (let b = 0; b < 5; b++) {
        ctx.fillStyle = b % 2 === 0 ? '#d97706' : '#f472b6';
        ctx.beginPath();
        ctx.arc(cx - 68 + b * 34, 304, 11, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(backX + 22, backY + 66, backW - 44, 38);
      for (const tx of [cx - 64, cx + 64]) {
        ctx.fillStyle = st === 'kopitiam' ? '#f8fafc' : '#d97706';
        ctx.fillRect(tx - 28, 314, 56, 8);
        ctx.fillRect(tx - 4, 322, 8, 36);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(tx - 44, 304, 14, 52);
        ctx.fillRect(tx + 30, 304, 14, 52);
      }
    }
    return;
  }

  if (st === 'tech') {
    const isDyson = nameKey.includes('DYSON');
    ctx.fillStyle = isDyson ? '#18181b' : '#f1f5f9';
    ctx.fillRect(backX, backY, backW, backH);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(backX + 22, backY + 20, backW - 44, 72);
    ctxE.fillStyle = isDyson ? '#ec4899' : '#38bdf8';
    ctxE.globalAlpha = 0.45;
    ctxE.fillRect(backX + 26, backY + 24, backW - 52, 64);
    ctxE.globalAlpha = 1.0;
    ctx.fillStyle = isDyson ? '#52525b' : '#d97706';
    ctx.fillRect(cx - 86, 306, 172, 12);
    ctx.fillRect(cx - 76, 318, 10, 42);
    ctx.fillRect(cx + 66, 318, 10, 42);
    for (let d = -2; d <= 2; d++) {
      ctx.fillStyle = isDyson ? '#ec4899' : '#cbd5e1';
      ctx.fillRect(cx + d * 32 - 10, 286, 20, 20);
    }
    return;
  }

  if (st === 'toys') {
    // Bay-Varied Collectible Blind-Box / Pop Mart / Toys"R"Us Display (NO 3x identical repetition!)
    const isPopMart = nameKey.includes('POP MART');
    const isTopToy = nameKey.includes('TOP TOY');
    ctx.fillStyle = isPopMart ? '#fee2e2' : isTopToy ? '#fce7f3' : '#fef9c3';
    ctx.fillRect(backX, backY, backW, backH);
    const toyCols = isPopMart
      ? ['#dc2626', '#facc15', '#18181b', '#f472b6', '#38bdf8']
      : ['#ef4444', '#3b82f6', '#ec4899', '#10b981', '#a855f7'];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 6; c++) {
        ctx.fillStyle = toyCols[(r + c + bayIdx * 2) % toyCols.length];
        ctx.fillRect(backX + 16 + c * 36, backY + 22 + r * 42, 28, 32);
      }
    }
    if (bayIdx === 0) {
      // Hero art-toy / Labubu / Molly display plinth
      ctx.fillStyle = isPopMart ? '#dc2626' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx, 256, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 22, 280, 44, 54);
    } else if (bayIdx === 1) {
      // Glowing glass blind-box vitrine tower
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(cx - 48, 224, 96, 128);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx - 40, 236, 80, 28);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(cx - 40, 274, 80, 28);
    } else {
      // Tiered LEGO / Gunpla / Plush showcase counter
      ctx.fillStyle = '#1d4ed8';
      ctx.fillRect(cx - 72, 286, 144, 64);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(cx - 60, 260, 44, 26);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cx + 12, 260, 48, 26);
    }
    return;
  }

  if (st === 'rollerwa') {
    // District K Seoul Street & Rollerwa Neon Roller-Skating Interior (Skate Racks, Neon Hangul & K-Pop Photo Booths!)
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(backX, backY, backW, backH);
    // Neon magenta & cyan archway bands
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 5;
    ctx.strokeRect(backX + 10, backY + 10, backW - 20, backH - 20);
    ctxE.strokeStyle = '#ec4899';
    ctxE.lineWidth = 4;
    ctxE.strokeRect(backX + 10, backY + 10, backW - 20, backH - 20);
    // Illuminated Seoul Street / Rollerwa neon header inside window
    ctx.fillStyle = '#09090b';
    ctx.fillRect(backX + 20, backY + 20, backW - 40, 38);
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, bayIdx === 1 ? 'ROLLERWA SKATE RENTAL' : 'SEOUL STREET • K-WAVE', cx, backY + 45, backW - 52, 15, '800');
    // Colorful backlit roller-skate cubby shelves!
    const skCols = ['#f472b6', '#38bdf8', '#fde047', '#a855f7'];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 5; c++) {
        ctx.fillStyle = '#312e81';
        ctx.fillRect(backX + 18 + c * 42, backY + 68 + r * 30, 34, 24);
        ctx.fillStyle = skCols[(r + c + bayIdx) % skCols.length];
        ctx.fillRect(backX + 23 + c * 42, backY + 75 + r * 30, 24, 12);
      }
    }
    return;
  }

  if (st === 'kitchenware') {
    // Le Creuset France: White Marble Culinary Shelves with Iconic Volcanic-Orange, Cerise & Marseille Cast-Iron Dutch Ovens!
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(backX, backY, backW, backH);
    const potCols = ['#ea580c', '#dc2626', '#0284c7', '#eab308', '#10b981'];
    for (let r = 0; r < 3; r++) {
      const sy = backY + 44 + r * 44;
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(backX + 14, sy, backW - 28, 6);
      for (let c = 0; c < 5; c++) {
        const px = backX + 28 + c * 42;
        ctx.fillStyle = potCols[(c + r + bayIdx) % potCols.length];
        ctx.fillRect(px, sy - 22, 28, 22);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(px + 10, sy - 26, 8, 4);
      }
    }
    // Marble culinary island table in front
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - 82, 314, 164, 46);
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx - 26, 294, 52, 20);
    return;
  }

  if (st === 'sephora') {
    // Sephora Monochrome Cosmetics Gondolas, Backlit Skincare Wall & Fragrance Tester Island (ZERO fashion mannequins!)
    ctx.fillStyle = '#18181b';
    ctx.fillRect(backX, backY, backW, backH);
    // White vertical backlit beauty pillars
    for (let s = 0; s < 4; s++) {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(backX + 16 + s * 58, backY + 14, 42, 128);
      for (let r = 0; r < 4; r++) {
        ctx.fillStyle = r % 2 === 0 ? '#f43f5e' : '#eab308';
        ctx.fillRect(backX + 20 + s * 58, backY + 24 + r * 28, 34, 14);
      }
    }
    // Sleek black & mirror beauty tester island
    ctx.fillStyle = '#09090b';
    ctx.fillRect(cx - 86, 304, 172, 54);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 90, 296, 180, 8);
    for (let b = -2; b <= 2; b++) {
      ctx.fillStyle = b % 2 === 0 ? '#fda4af' : '#fde68a';
      ctx.fillRect(cx + b * 30 - 6, 276, 12, 20);
    }
    return;
  }

  if (st === 'cinema') {
    // Rich Illustrated Blockbuster Movie Poster Lightboxes (Authentic TGV vs GSC Format Badges!)
    ctx.fillStyle = '#09090b';
    ctx.fillRect(backX, backY, backW, backH);
    const isGSC = nameKey.includes('GSC');
    const posters = [
      { bg1: '#0c4a6e', bg2: '#0284c7', orb: '#fde047', title: isGSC ? 'GSC BIG 4K' : 'IMAX LASER' },
      { bg1: '#4c0519', bg2: '#be123c', orb: '#fb923c', title: isGSC ? 'SCREENX 4DX' : 'TGV INDULGE' },
      { bg1: '#1e1b4b', bg2: '#7c3aed', orb: '#38bdf8', title: isGSC ? 'DOLBY ATMOS' : 'TGV BEANIE' }
    ];
    for (let p = 0; p < 3; p++) {
      const cfg = posters[(p + bayIdx) % posters.length];
      const px = backX + 14 + p * 75;
      const py = backY + 16;
      const pg = ctx.createLinearGradient(px, py, px, py + 114);
      pg.addColorStop(0, cfg.bg1);
      pg.addColorStop(1, cfg.bg2);
      ctx.fillStyle = pg;
      ctx.fillRect(px, py, 64, 114);
      // Illustrated multi-layered sci-fi/action movie poster horizon + spotlight + city skyline!
      ctx.fillStyle = cfg.orb;
      ctx.beginPath();
      ctx.arc(px + 32, py + 38, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
      ctx.fillRect(px + 8, py + 58, 12, 24);
      ctx.fillRect(px + 24, py + 48, 16, 34);
      ctx.fillRect(px + 44, py + 54, 12, 28);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(px + 4, py + 82, 56, 28);
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, cfg.title, px + 32, py + 101, 52, 10, '800');
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, py, 64, 114);
      ctxE.fillStyle = cfg.bg2;
      ctxE.globalAlpha = 0.36;
      ctxE.fillRect(px + 4, py + 4, 56, 106);
      ctxE.globalAlpha = 1.0;
    }
    return;
  }

  if (st === 'supermarket' || st === 'beauty' || st === 'books') {
    // Gourmet Supermarket / Produce Crates / Beauty / Bookstore Lit Gondola Aisles!
    if (st === 'supermarket') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(backX, backY, backW, backH);
      // Illuminated refrigerated produce/chiller bays + colorful fruit/grocery tiers
      const aisleCols = ['#22c55e', '#f97316', '#ef4444', '#facc15', '#38bdf8'];
      for (let sy = 186; sy <= 310; sy += 38) {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(backX + 10, sy, backW - 20, 7);
        for (let ix = backX + 14; ix < backX + backW - 20; ix += 22) {
          ctx.fillStyle = aisleCols[(ix + sy) % aisleCols.length];
          ctx.fillRect(ix, sy - 20, 16, 20);
        }
      }
      return;
    }
    for (let sy = 190; sy <= 312; sy += 40) {
      ctx.fillStyle = '#27272a';
      ctx.fillRect(backX + 10, sy, backW - 20, 7);
      for (let ix = backX + 16; ix < backX + backW - 22; ix += 24) {
        ctx.fillStyle = (ix + sy) % 48 === 0 ? store.accent : store.brandBg;
        ctx.fillRect(ix, sy - 20, 16, 20);
      }
    }
    return;
  }

  // Fashion / Luxury / Sports / Sephora / Anchor: Tailored Garment Rails & Boutique Display!
  ctx.strokeStyle = '#52525b';
  ctx.lineWidth = 4;
  ctx.strokeRect(backX + 18, backY + 42, 74, 96);
  ctx.strokeRect(backX + backW - 92, backY + 42, 74, 96);
  for (let g = 0; g < 4; g++) {
    ctx.fillStyle = (g + bayIdx) % 2 === 0 ? store.brandBg : store.accent;
    ctx.fillRect(backX + 26 + g * 15, backY + 50, 11, 56);
    ctx.fillRect(backX + backW - 84 + g * 15, backY + 50, 11, 56);
  }
  ctx.fillStyle = '#27272a';
  ctx.fillRect(cx - 28, 332, 56, 28);
  ctx.fillStyle = store.brandBg === '#09090b' ? '#d4d4d8' : store.brandBg;
  ctx.beginPath();
  ctx.arc(cx, 214, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 17, 230, 34, 64);
  ctx.fillRect(cx - 10, 294, 8, 38);
  ctx.fillRect(cx + 2, 294, 8, 38);
}

const storefrontCache = new Map();

export function createStorefrontTextures(store) {
  if (storefrontCache.has(store.id)) return storefrontCache.get(store.id);

  const W = 1024;
  const H = 384;
  const cAlbedo = document.createElement('canvas');
  cAlbedo.width = W;
  cAlbedo.height = H;
  const ctx = cAlbedo.getContext('2d');

  const cEmissive = document.createElement('canvas');
  cEmissive.width = W;
  cEmissive.height = H;
  const ctxE = cEmissive.getContext('2d');
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, W, H);

  ctx.fillStyle = '#14161c';
  ctx.fillRect(0, 0, W, H);

  // Top fascia signboard header (y: 6..106)
  if (store.style === 'sephora') {
    for (let sx = 0; sx < W; sx += 44) {
      const white = (sx / 44) % 2 === 0;
      ctx.fillStyle = white ? '#f8fafc' : '#09090b';
      ctx.fillRect(sx, 0, 44, 106);
    }
    ctx.fillStyle = '#09090b';
    ctx.fillRect(W * 0.24, 10, W * 0.52, 86);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, 106);
    grad.addColorStop(0, store.brandBg);
    grad.addColorStop(0.6, store.brandBg);
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(6, 6, W - 12, 100);
  }

  // LED trim strip under fascia (y: 105..109) — well above window transom y=118!
  ctx.fillStyle = store.accent || '#fbbf24';
  ctx.fillRect(6, 105, W - 12, 4);
  ctxE.fillStyle = store.accent || '#fbbf24';
  ctxE.fillRect(6, 105, W - 12, 4);

  // Official 1 Utama Lot Plaque (left side x: 20..156, y: 18..54)
  ctx.fillStyle = 'rgba(9, 13, 22, 0.85)';
  ctx.fillRect(18, 16, 136, 36);
  ctx.strokeStyle = store.accent || '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(18, 16, 136, 36);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, store.lot || 'G100', 86, 40, 124, 18, '800');

  // Backlit 3D Brand Typography (auto-fitted to 810px width so ZERO cropping!)
  ctx.textAlign = 'center';
  ctx.fillStyle = store.brandFg || '#ffffff';
  const fitPx = fillAutoFitText(ctx, store.name, 568, 54, 815, 42, '800');

  ctxE.textAlign = 'center';
  ctxE.fillStyle = store.brandFg || '#ffffff';
  ctxE.font = `800 ${fitPx}px "Inter", "Segoe UI", Arial, sans-serif`;
  ctxE.fillText(store.name, 568, 54);

  // Subtitle raised cleanly to y = 84 (21px above fascia bottom, NEVER sliced by transom!)
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  fillAutoFitText(ctx, store.subtitle || '', 568, 84, 815, 16, '600');

  // 3 Interior Perspective Window Bays + Central Portal
  const bayConfigs = [
    { x: 16, w: 314, isDoor: false },
    { x: 344, w: 336, isDoor: true },
    { x: 694, w: 314, isDoor: false }
  ];

  for (let bayIdx = 0; bayIdx < bayConfigs.length; bayIdx++) {
    const bay = bayConfigs[bayIdx];
    const backX = bay.x + 34;
    const backW = bay.w - 68;
    const backY = 148;
    const backH = 166;

    // Perspective ceiling, floor & side walls
    ctx.fillStyle = store.style === 'cinema' || store.style === 'gym' || store.style === 'arcade' ? '#1e293b' : '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(bay.x, 120);
    ctx.lineTo(bay.x + bay.w, 120);
    ctx.lineTo(backX + backW, backY);
    ctx.lineTo(backX, backY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = store.style === 'cinema' || store.style === 'gym' || store.style === 'arcade' ? '#0f172a' : '#a8a29e';
    ctx.beginPath();
    ctx.moveTo(bay.x, 376);
    ctx.lineTo(bay.x + bay.w, 376);
    ctx.lineTo(backX + backW, backY + backH);
    ctx.lineTo(backX, backY + backH);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = store.style === 'cinema' || store.style === 'arcade' ? '#334155' : '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(bay.x, 120);
    ctx.lineTo(backX, backY);
    ctx.lineTo(backX, backY + backH);
    ctx.lineTo(bay.x, 376);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(bay.x + bay.w, 120);
    ctx.lineTo(backX + backW, backY);
    ctx.lineTo(backX + backW, backY + backH);
    ctx.lineTo(bay.x + bay.w, 376);
    ctx.closePath();
    ctx.fill();

    const bgWall = ctx.createLinearGradient(backX, backY, backX, backY + backH);
    bgWall.addColorStop(0, '#f5f5f4');
    bgWall.addColorStop(1, '#a8a29e');
    ctx.fillStyle = bgWall;
    ctx.fillRect(backX, backY, backW, backH);

    // Controlled warm interior glow (clamped alpha 0.19 so windows NEVER blow out white!)
    ctxE.save();
    ctxE.globalAlpha = 0.19;
    ctxE.fillStyle = store.style === 'cinema' || store.style === 'arcade' ? store.accent : '#fde68a';
    ctxE.fillRect(bay.x + 6, 122, bay.w - 12, 250);
    ctxE.restore();

    for (let lx = bay.x + 56; lx < bay.x + bay.w - 40; lx += 76) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(lx, 134, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!bay.isDoor) {
      drawCategoryVignette(ctx, ctxE, store, bay, backX, backY, backW, backH, bayIdx);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath();
      ctx.moveTo(bay.x + 18, 376);
      ctx.lineTo(bay.x + 108, 120);
      ctx.lineTo(bay.x + 144, 120);
      ctx.lineTo(bay.x + 54, 376);
      ctx.closePath();
      ctx.fill();
    } else {
      // Open Central Entrance Portal — clean framed glass doors showing rich interior without floating duplicate signboxes!
      drawCategoryVignette(ctx, ctxE, store, bay, backX, backY, backW, backH, bayIdx);
      ctx.strokeStyle = 'rgba(255,255,255,0.52)';
      ctx.lineWidth = 3;
      ctx.strokeRect(bay.x + 6, 122, 46, 252);
      ctx.strokeRect(bay.x + bay.w - 52, 122, 46, 252);
    }

    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 6;
    ctx.strokeRect(bay.x, 120, bay.w, 256);
  }

  const out = {
    map: finalizeTexture(cAlbedo, { srgb: true, repeatX: 1, repeatY: 1 }),
    emissiveMap: finalizeTexture(cEmissive, { srgb: true, repeatX: 1, repeatY: 1 })
  };
  storefrontCache.set(store.id, out);
  return out;
}

/**
 * Branded Projecting 3D Blade-Sign Texture (Replaces raw flat solid-color tabs!)
 */
const bladeCache = new Map();
export function createBladeSignTexture(store) {
  if (bladeCache.has(store.id)) return bladeCache.get(store.id);
  const prof = getStoreBrandProfile(store);
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  const safeDarkBg =
    prof.brandKey === 'heytea'
      ? '#2d333d'
      : prof.brandKey === 'zus-coffee'
        ? '#0A2240'
        : prof.facadeType === 'japanese-machiya'
          ? '#2c1e14'
          : store.brandBg && !isHexLight(store.brandBg)
            ? store.brandBg
            : '#181c24';

  const bg = prof.isLight ? '#d4cec2' : safeDarkBg;
  const border = prof.isLight
    ? '#1c1917'
    : prof.facadeType === 'sports-industrial'
      ? '#94a3b8'
      : store.accent || '#c9a66b';
  const fg = prof.isLight ? '#0a0c10' : '#f8fafc';
  const sub = prof.isLight ? '#1c1917' : border;

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 256);

  // Subtle brushed-stone / brushed-metal horizontal sheen for light blades
  if (prof.isLight) {
    for (let y = 0; y < 256; y += 6) {
      ctx.fillStyle = y % 12 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(20,16,12,0.04)';
      ctx.fillRect(0, y, 512, 3);
    }
  }

  ctx.strokeStyle = border;
  ctx.lineWidth = prof.isLight ? 10 : 8;
  ctx.strokeRect(10, 10, 492, 236);

  ctx.fillStyle = sub;
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, store.lot || '1U', 256, 86, 404, 34, '800', '"Montserrat", sans-serif', 3);

  ctx.fillStyle = fg;
  const rawShort = (prof.displayTitle || store.name).split('•')[0].split('&')[0].trim();
  const shortBrand = prof.brandKey === 'come-true' ? 'COME TRUE CAFE' : rawShort;
  const bladeTracking = shortBrand.length > 10 ? 1 : Math.min(prof.tracking, 3);
  const bladeWeight = prof.isLight ? '800' : prof.weight;
  fillAutoFitText(ctx, shortBrand, 256, 174, 404, 46, bladeWeight, prof.fontFamily, bladeTracking, prof.italic);

  const tex = finalizeTexture(c, { srgb: true });
  bladeCache.set(store.id, tex);
  return tex;
}

/**
 * Printed 1 Utama Hanging Atrium Banner Texture
 */
export function createAtriumBannerTexture(title, sub, bgHex = '#0f172a', accentHex = '#fbbf24') {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 768;
  const ctx = c.getContext('2d');

  const g = ctx.createLinearGradient(0, 0, 0, 768);
  g.addColorStop(0, bgHex);
  g.addColorStop(0.5, '#1e293b');
  g.addColorStop(1, bgHex);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 768);

  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, 236, 748);

  ctx.fillStyle = accentHex;
  ctx.beginPath();
  ctx.arc(128, 150, 56, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#09090b';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, '1U', 128, 166, 90, 44, '800');

  ctx.fillStyle = '#ffffff';
  fillAutoFitText(ctx, title, 128, 340, 210, 34, '800');
  ctx.fillStyle = accentHex;
  fillAutoFitText(ctx, sub, 128, 410, 210, 22, '700');
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  fillAutoFitText(ctx, 'IT’S ALL IN ONE', 128, 660, 210, 20, '800');

  return finalizeTexture(c, { srgb: true });
}

function drawRoundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

export function createKioskSignTexture(kiosk) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const kid = (kiosk.id || '').toLowerCase();
  const kName = (kiosk.name || '').toUpperCase();

  if (kid === 'k-garrett' || kName.includes('GARRETT')) {
    // Garrett Popcorn Shops: Navy & royal-blue striped backdrop + navy/gold oval Garrett popcorn shops SINCE 1949
    const stripeW = 32;
    for (let x = 0; x < 512; x += stripeW) {
      ctx.fillStyle = Math.round(x / stripeW) % 2 === 0 ? '#0f1e47' : '#1d4ed8';
      ctx.fillRect(x, 0, stripeW, 128);
    }
    ctx.fillStyle = '#0f1e47';
    ctx.beginPath();
    ctx.ellipse(256, 64, 178, 54, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(256, 64, 171, 47, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#fde047';
    fillAutoFitText(ctx, 'SINCE 1949', 256, 30, 160, 11, '700', '"Jost", sans-serif', 2);
    ctx.fillStyle = '#ffffff';
    fillAutoFitText(ctx, 'Garrett', 256, 74, 240, 44, '700', '"Cormorant Garamond", "Georgia", serif', 1, true);
    ctx.fillStyle = '#fde68a';
    fillAutoFitText(ctx, 'popcorn shops', 256, 98, 220, 17, '600', '"Cormorant Garamond", "Georgia", serif', 1, true);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-auntie' || kName.includes('AUNTIE ANNE')) {
    // Auntie Anne's: Crisp white/light-silver header + glowing cyan Auntie Anne's + pretzel with golden halo
    const bg = ctx.createLinearGradient(0, 0, 0, 128);
    bg.addColorStop(0, '#f8fafc');
    bg.addColorStop(1, '#e6edf5');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(0, 120, 512, 8);

    // Pretzel + golden halo icon on left
    ctx.save();
    ctx.translate(64, 70);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(0, -30, 18, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-9, -4, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(9, -4, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, 6, 20, 0.15, Math.PI - 0.15);
    ctx.stroke();
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.save();
    ctx.shadowColor = 'rgba(14, 165, 233, 0.45)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#0ea5e9';
    fillAutoFitText(ctx, "Auntie Anne's", 294, 80, 365, 50, '700', '"Playfair Display", "Georgia", serif', 1, false);
    ctx.restore();
    ctx.fillStyle = '#334155';
    ctx.font = '700 11px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KEDAI ROTI • LOT LGK3', 18, 22);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-kenangan' || kName.includes('KENANGAN')) {
    // Kenangan Coffee: Blonde oak fascia + crisp white Kenangan COFFEE
    const bg = ctx.createLinearGradient(0, 0, 512, 0);
    bg.addColorStop(0, '#ceb084');
    bg.addColorStop(0.5, '#dfc49c');
    bg.addColorStop(1, '#c9a97c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    for (let y = 0; y < 128; y += 5) {
      ctx.fillStyle = y % 10 === 0 ? 'rgba(120, 78, 36, 0.08)' : 'rgba(255, 248, 235, 0.08)';
      ctx.fillRect(0, y, 512, 2);
    }
    ctx.fillStyle = 'rgba(64, 42, 20, 0.72)';
    ctx.font = '700 12px "Jost", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('LGK 101B', 494, 24);

    ctx.save();
    ctx.shadowColor = 'rgba(28, 18, 10, 0.55)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    fillAutoFitText(ctx, 'Kenangan', 268, 82, 240, 46, '700', '"Playfair Display", "Georgia", serif', 0, true);
    ctx.textAlign = 'left';
    fillAutoFitText(ctx, 'COFFEE', 280, 82, 200, 38, '800', '"Jost", sans-serif', 2, false);
    ctx.restore();
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-bungkus' || kName.includes('BUNGKUS')) {
    // Bungkus Kaw Kaw: Deep forest-green kopitiam louvers + bold white BUNGKUS KAW KAW
    ctx.fillStyle = '#144a32';
    ctx.fillRect(0, 0, 512, 128);
    for (let y = 0; y < 128; y += 16) {
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(0, y, 512, 3);
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, y + 3, 512, 2);
    }
    ctx.strokeStyle = '#0c3322';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 506, 122);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = '700 13px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KAFE', 18, 28);
    ctx.textAlign = 'right';
    ctx.fillText('LGK105', 494, 28);

    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.45)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'BUNGKUS', 256, 66, 360, 50, '800', '"Oswald", sans-serif', 3);
    fillAutoFitText(ctx, 'KAW KAW', 256, 108, 280, 34, '800', '"Playfair Display", serif', 2, true);
    ctx.fillRect(92, 92, 54, 5);
    ctx.fillRect(366, 92, 54, 5);
    ctx.restore();
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-nadeje' || kName.includes('NADEJE')) {
    // Nadeje: Deep navy pill + gold rim + starburst heart + white script Nadeje
    ctx.fillStyle = '#091228';
    ctx.fillRect(0, 0, 512, 128);
    drawRoundRectPath(ctx, 14, 10, 484, 108, 54);
    ctx.fillStyle = '#0f1c3f';
    ctx.fill();
    ctx.strokeStyle = '#d4af5e';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Starburst square emblem with red heart on left
    ctx.save();
    ctx.translate(106, 64);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-30, -30, 60, 60);
    ctx.strokeStyle = '#1d4ed8';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 10, Math.sin(a) * 10);
      ctx.lineTo(Math.cos(a) * 28, Math.sin(a) * 28);
      ctx.stroke();
    }
    // Red heart center
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.bezierCurveTo(-14, 0, -14, -12, -5, -12);
    ctx.bezierCurveTo(-1, -12, 0, -7, 0, -7);
    ctx.bezierCurveTo(0, -7, 1, -12, 5, -12);
    ctx.bezierCurveTo(14, -12, 14, 0, 0, 10);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'Nadeje', 302, 84, 290, 62, '700', '"Cormorant Garamond", "Georgia", serif', 1, true);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-beutea' || kName.includes('BEUTEA')) {
    // Beutea: Dark-wood pill + gold rim + red octagonal lady emblem + 茶仙子 BEUTEA
    ctx.fillStyle = '#26180f';
    ctx.fillRect(0, 0, 512, 128);
    drawRoundRectPath(ctx, 14, 10, 484, 108, 54);
    const wg = ctx.createLinearGradient(0, 10, 0, 118);
    wg.addColorStop(0, '#5a3d28');
    wg.addColorStop(0.5, '#48301e');
    wg.addColorStop(1, '#362214');
    ctx.fillStyle = wg;
    ctx.fill();
    ctx.strokeStyle = '#d4af5e';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    // Red octagonal lady emblem
    ctx.save();
    ctx.translate(92, 64);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const px = Math.cos(a) * 38;
      const py = Math.sin(a) * 38;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#b91c1c';
    ctx.fill();
    ctx.strokeStyle = '#fde68a';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Stylized lady hair & face silhouette
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.arc(-4, -14, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(2, -2, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(4, 0, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(-8, -14, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, '茶仙子', 298, 62, 260, 44, '800', '"Noto Serif JP", serif', 8);
    fillAutoFitText(ctx, 'BEUTEA', 298, 102, 260, 28, '700', '"Jost", sans-serif', 8);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-boost' || kName.includes('BOOST')) {
    // Boost Juice Bars: Lime-green + colorful outline BOOST
    const bg = ctx.createLinearGradient(0, 0, 0, 128);
    bg.addColorStop(0, '#6db91f');
    bg.addColorStop(1, '#4f8f12');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = 'rgba(20, 40, 8, 0.8)';
    ctx.font = '700 12px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KEDAI MINUMAN', 16, 26);

    const letters = [
      ['B', '#ef4444', -132, -0.08],
      ['O', '#f97316', -66, 0.05],
      ['O', '#eab308', 2, -0.05],
      ['S', '#06b6d4', 70, 0.06],
      ['T', '#8b5cf6', 134, -0.06]
    ];
    ctx.textAlign = 'center';
    ctx.font = '900 78px "Jost", "Arial Black", sans-serif';
    ctx.lineJoin = 'round';
    for (const [ch, col, dx, rot] of letters) {
      ctx.save();
      ctx.translate(274 + dx, 88);
      ctx.rotate(rot);
      ctx.strokeStyle = col;
      ctx.lineWidth = 11;
      ctx.strokeText(ch, 0, 0);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ch, 0, 0);
      ctx.restore();
    }
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-baskin' || kName.includes('BASKIN')) {
    // Baskin Robbins: White + magenta/navy BASKIN BR ROBBINS
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(0, 120, 512, 8);

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 11px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KEDAI AISKRIM', 18, 22);
    ctx.textAlign = 'right';
    ctx.fillText('LOT NO : FK-8', 494, 22);

    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.font = '800 32px "Jost", sans-serif';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 5;
    ctx.strokeText('BASKIN', 100, 84);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('BASKIN', 100, 84);

    // Iconic B-R (with pink 31 accents)
    ctx.font = '900 70px "Georgia", serif';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 5;
    ctx.strokeText('B', 228, 92);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('B', 228, 92);
    ctx.fillStyle = '#db2777';
    ctx.fillRect(228, 44, 18, 46);
    ctx.strokeText('R', 274, 92);
    ctx.fillStyle = '#db2777';
    ctx.fillText('R', 274, 92);

    ctx.font = '800 32px "Jost", sans-serif';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 5;
    ctx.strokeText('ROBBINS', 404, 84);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('ROBBINS', 404, 84);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-owala' || kName.includes('OWALA')) {
    // Owala: Deep navy + glowing white lowercase owala®
    ctx.fillStyle = '#162a5c';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 122, 512, 6);
    ctx.fillStyle = 'rgba(226, 232, 240, 0.78)';
    ctx.font = '600 10px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KEDAI BOTOL MINUMAN', 16, 22);
    ctx.textAlign = 'right';
    ctx.fillText('LOT: FK2', 496, 22);

    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.65)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'owala®', 256, 86, 250, 56, '800', '"Jost", sans-serif', 2);
    ctx.restore();
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-tealive' || kName.includes('TEALIVE')) {
    // Tealive Plus: Deep royal-blue pill + glowing white tealive plus
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 128);
    drawRoundRectPath(ctx, 14, 10, 484, 108, 22);
    ctx.fillStyle = '#14358c';
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.save();
    ctx.shadowColor = 'rgba(255,255,255,0.55)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'tealive plus', 256, 84, 420, 62, '700', '"Jost", sans-serif', 2);
    // Golden tea-leaf accent on the p cross-bar
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(304, 68, 12, 5, -0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-llaollao' || kName.includes('LLAOLLAO')) {
    // llaollao: Crisp white + lime-green llaollao.
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#84cc16';
    ctx.fillRect(0, 120, 512, 8);
    ctx.fillStyle = '#475569';
    ctx.font = '700 10px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('KEDAI AIS KRIM', 18, 22);

    ctx.fillStyle = '#76b82a';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'llaollao.', 256, 86, 400, 74, '800', '"Jost", sans-serif', 1);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-samsung' || kName.includes('SAMSUNG')) {
    // Samsung: Silver gantry + glowing white SAMSUNG
    const bg = ctx.createLinearGradient(0, 0, 512, 0);
    bg.addColorStop(0, '#c8cfd8');
    bg.addColorStop(0.5, '#e5e9ef');
    bg.addColorStop(1, '#c5ccd6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);
    ctx.fillStyle = '#1e293b';
    ctx.font = '700 11px "Jost", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SK 2A KEDAI ALAT TELEKOMUNIKASI', 16, 22);

    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.25)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#0f2557';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'SAMSUNG', 256, 90, 340, 58, '800', '"Jost", sans-serif', 8);
    ctx.restore();
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-photoism' || kName.includes('PHOTOISM')) {
    // Photoism: Matte black + white serif Photoism
    ctx.fillStyle = '#111215';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 124);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'Photoism', 256, 88, 420, 68, '700', '"Playfair Display", "Georgia", serif', 2);
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-memori' || kName.includes('MEMORI')) {
    // Memori: Circular white/magenta MEMORI 추억 camera icon
    ctx.fillStyle = '#22182b';
    ctx.fillRect(0, 0, 512, 128);
    ctx.save();
    ctx.translate(256, 64);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#c026d3';
    ctx.textAlign = 'center';
    ctx.font = '800 16px "Jost", sans-serif';
    ctx.fillText('MEMORI', 0, -24);
    // Magenta camera icon
    drawRoundRectPath(ctx, -20, -14, 40, 26, 5);
    ctx.fill();
    ctx.fillRect(-9, -19, 18, 6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -1, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c026d3';
    ctx.font = '700 15px "Jost", sans-serif';
    ctx.fillText('추억', 0, 34);
    ctx.restore();
    return finalizeTexture(canvas, { srgb: true });
  }

  if (kid === 'k-zus2f' || kName.includes('ZUS')) {
    // ZUS Coffee kiosk: Deep navy #0A2240 + white Zeus cup medallion + ZUS COFFEE
    ctx.fillStyle = '#0A2240';
    ctx.fillRect(0, 0, 512, 128);
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, 508, 124);
    ctx.save();
    ctx.translate(92, 64);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-10, -5);
    ctx.lineTo(10, -5);
    ctx.lineTo(7, 14);
    ctx.lineTo(-7, 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(-12, -9, 24, 3);
    ctx.restore();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'ZUS COFFEE', 298, 80, 310, 44, '800', '"Jost", sans-serif', 5);
    return finalizeTexture(canvas, { srgb: true });
  }

  ctx.fillStyle = kiosk.color || '#18181b';
  ctx.fillRect(0, 0, 512, 128);
  ctx.strokeStyle = kiosk.accent || '#fbbf24';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, 504, 120);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, kiosk.name, 256, 56, 470, 30, '800');

  ctx.fillStyle = kiosk.accent || '#fde68a';
  fillAutoFitText(ctx, `${kiosk.lot} • ${kiosk.sub}`, 256, 96, 470, 19, '700');

  return finalizeTexture(canvas, { srgb: true });
}

export function createGalleryArtworkTexture(seed = 1) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');

  const palettes = [
    ['#0f172a', '#0284c7', '#38bdf8', '#fbbf24'],
    ['#4c0519', '#e11d48', '#fb7185', '#fef08a'],
    ['#064e3b', '#10b981', '#6ee7b7', '#f59e0b'],
    ['#2e1065', '#7c3aed', '#f472b6', '#fde68a']
  ];
  const pal = palettes[seed % palettes.length];
  ctx.fillStyle = pal[0];
  ctx.fillRect(0, 0, 256, 320);

  for (let i = 0; i < 9; i++) {
    ctx.fillStyle = pal[(i % 3) + 1];
    ctx.globalAlpha = 0.78;
    const rx = hash2(seed * 11 + i, 2.3) * 200 + 28;
    const ry = hash2(seed * 17 + i, 5.7) * 240 + 40;
    const rr = 22 + hash2(seed + i, 8.1) * 58;
    ctx.beginPath();
    ctx.arc(rx, ry, rr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 14;
  ctx.strokeRect(7, 7, 242, 306);

  return finalizeTexture(canvas, { srgb: true });
}

export function createWayfindingTexture(leftText, centerBadge, rightText, accent = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 1024, 160);
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, 1024, 8);
  ctx.fillRect(0, 152, 1024, 8);

  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  fillAutoFitText(ctx, leftText, 28, 90, 350, 24, '700');

  ctx.textAlign = 'right';
  fillAutoFitText(ctx, rightText, 996, 90, 350, 24, '700');

  ctx.fillStyle = accent;
  ctx.fillRect(392, 32, 240, 96);
  ctx.fillStyle = '#09090b';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, centerBadge, 512, 90, 224, 24, '800');

  return finalizeTexture(canvas, { srgb: true });
}

/**
 * 100% Real 1 Utama Shopping Centre Brand Architectural Profile Classifier
 * Assigns each of the 168 real 1U tenants its genuine facade architecture, bespoke brand font family,
 * tracking, variable architectural fascia height, material finish, and vector emblem!
 */
export function getStoreBrandProfile(store) {
  const uName = (store.name || '').toUpperCase();
  const st = store.style || 'fashion';

  // Authentic real-world retail & luxury brand typography families (ZERO cheesy sci-fi or random hipster fonts!)
  const FONTS = {
    didone: '"Bodoni Moda", "Playfair Display", "Georgia", serif',
    classicSerif: '"Cormorant Garamond", "Playfair Display", "Georgia", serif',
    geometric: '"Jost", "Montserrat", "Century Gothic", sans-serif',
    condensed: '"Oswald", "Arial Narrow", sans-serif',
    cleanSans: '"Montserrat", "Plus Jakarta Sans", sans-serif',
    cjkSerif: '"Noto Serif JP", "Yu Mincho", "Georgia", serif'
  };

  if (uName.includes('MR. D.I.Y') || uName.includes('MR.D.I.Y') || uName.includes('MR DIY')) {
    return { facadeType: 'open-market', fasciaH: 1.42, materialStyle: 'mrdiy-black-yellow', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 4, displayTitle: 'MR.D.I.Y.', brandKey: 'mr-diy', isLight: false };
  }
  if (uName.includes('TOP TOY')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.44, materialStyle: 'toptoy-pastel-claw', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 6, displayTitle: 'TOP TOY', brandKey: 'top-toy', isLight: true };
  }
  if (uName.includes('JAYA GROCER')) {
    return { facadeType: 'open-market', fasciaH: 1.48, materialStyle: 'jaya-woodblock-silver', fontFamily: FONTS.classicSerif, weight: '700', italic: true, tracking: 2, displayTitle: 'Jaya GROCER', brandKey: 'jaya-grocer', isLight: false };
  }
  if (uName.includes('IPPUDO')) {
    return { facadeType: 'japanese-machiya', fasciaH: 1.38, materialStyle: 'obsidian-stone', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 14, displayTitle: 'IPPUDO', brandKey: 'ippudo', isLight: false };
  }
  if (uName.includes('SEPHORA') || st === 'sephora') {
    return { facadeType: 'luxury-fashion', fasciaH: 1.18, materialStyle: 'sephora-pitch-black', fontFamily: FONTS.geometric, weight: '500', italic: false, tracking: 22, displayTitle: 'SEPHORA', brandKey: 'sephora', isLight: false, isSephora: true };
  }
  if (uName.includes('UNIQLO')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.24, materialStyle: 'pure-white-red', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 6, displayTitle: 'UNIQLO', brandKey: 'uniqlo', isLight: true, isUniqlo: true };
  }
  if (uName.includes('PARKSON')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.54, materialStyle: 'parkson-iceblue-chrome', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 16, displayTitle: 'PARKSON Elite', brandKey: 'parkson', isLight: true };
  }
  if (uName.includes('TOMMY HILFIGER')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.18, materialStyle: 'ivory-limestone', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 14, displayTitle: 'TOMMY HILFIGER', brandKey: 'tommy', isLight: true };
  }
  if (uName.includes('COME TRUE')) {
    return { facadeType: 'cafe-patisserie', fasciaH: 1.26, materialStyle: 'cometrue-grey-oak', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 4, displayTitle: 'Come True CAFE', brandKey: 'come-true', isLight: true };
  }
  if (uName.includes('HEYTEA')) {
    return { facadeType: 'cafe-patisserie', fasciaH: 1.28, materialStyle: 'heytea-corrugated-silver', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 10, displayTitle: 'HEYTEA', brandKey: 'heytea', isLight: true };
  }
  if (uName.includes('ZUS') || uName.includes('COFFEE MEETS PASTRY')) {
    const isPastry = uName.includes('PASTRY');
    return {
      facadeType: 'cafe-patisserie',
      fasciaH: 1.30,
      materialStyle: isPastry ? 'zus-cream-plaster' : 'zus-navy',
      fontFamily: FONTS.geometric,
      weight: '700',
      italic: false,
      tracking: 6,
      displayTitle: isPastry ? 'COFFEE MEETS PASTRY BY ZUS' : 'ZUS COFFEE',
      brandKey: isPastry ? 'zus-pastry' : 'zus-coffee',
      isLight: isPastry
    };
  }
  if (uName.includes('KYOCHON')) {
    return { facadeType: 'modern-bistro', fasciaH: 1.38, materialStyle: 'walnut-terracotta', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 3, displayTitle: 'KyoChon 1991', brandKey: 'kyochon', isLight: false };
  }
  if (uName.includes('FOOD DISTRICT')) {
    return { facadeType: 'modern-bistro', fasciaH: 1.46, materialStyle: 'food-district-subway', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 10, displayTitle: 'FOOD DISTRICT', brandKey: 'food-district', isLight: true };
  }
  if (uName.includes('HAIDILAO')) {
    return { facadeType: 'modern-bistro', fasciaH: 1.40, materialStyle: 'crimson-lacquer', fontFamily: FONTS.cjkSerif, weight: '800', italic: false, tracking: 6, displayTitle: '海底捞 HAIDILAO', brandKey: 'haidilao', isLight: false };
  }
  if (uName.includes('STARBUCKS')) {
    return { facadeType: 'cafe-patisserie', fasciaH: 1.32, materialStyle: 'starbucks-charcoal-stone', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 14, displayTitle: 'STARBUCKS RESERVE', brandKey: 'starbucks-reserve', isLight: false };
  }
  if (uName.includes('UNDER ARMOUR')) {
    return { facadeType: 'sports-industrial', fasciaH: 1.32, materialStyle: 'ua-black-red', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 10, displayTitle: 'UNDER ARMOUR', brandKey: 'under-armour', isLight: false };
  }
  if (uName.includes('PUMA')) {
    return { facadeType: 'sports-industrial', fasciaH: 1.32, materialStyle: 'puma-black-red', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 8, displayTitle: 'PUMA', brandKey: 'puma', isLight: false };
  }
  if (uName.includes('OUTSIDE')) {
    return { facadeType: 'sports-industrial', fasciaH: 1.32, materialStyle: 'outside-birch-plywood', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 6, displayTitle: 'outside', brandKey: 'outside', isLight: true };
  }
  if (uName.includes('NIKE')) {
    return { facadeType: 'sports-industrial', fasciaH: 1.30, materialStyle: 'obsidian-stone', fontFamily: FONTS.condensed, weight: '700', italic: true, tracking: 6, displayTitle: 'NIKE', brandKey: 'nike', isLight: false };
  }
  if (uName.includes('ADIDAS')) {
    return { facadeType: 'sports-industrial', fasciaH: 1.34, materialStyle: 'adidas-frosted-cyan', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 4, displayTitle: 'adidas', brandKey: 'adidas', isLight: true };
  }
  if (uName.includes('MINISO')) {
    return { facadeType: 'open-market', fasciaH: 1.32, materialStyle: 'miniso-coral-charcoal', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 10, displayTitle: 'MINISO', brandKey: 'miniso', isLight: false };
  }
  if (uName.includes('NEXT GEN') || uName.includes('NEXTGEN')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.48, materialStyle: 'nextgen-white-rainbow', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 6, displayTitle: 'NEXT GEN', brandKey: 'nextgen', isLight: true };
  }
  if (uName.includes('ROLLERWA')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.48, materialStyle: 'rollerwa-neon-navy', fontFamily: FONTS.classicSerif, weight: '700', italic: true, tracking: 4, displayTitle: 'RollerWa', brandKey: 'rollerwa', isLight: false };
  }
  if (uName.includes('GAME ON')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.48, materialStyle: 'gameon-steel-grid', fontFamily: FONTS.condensed, weight: '800', italic: false, tracking: 8, displayTitle: 'GAMEON', brandKey: 'game-on', isLight: false };
  }
  if (uName.includes('BHC')) {
    return { facadeType: 'modern-bistro', fasciaH: 1.38, materialStyle: 'bhc-yellow-mosaic', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 4, displayTitle: 'bhc CHICKEN', brandKey: 'bhc', isLight: true };
  }
  if (uName.includes('MODU')) {
    return { facadeType: 'korean-hanok', fasciaH: 1.38, materialStyle: 'modu-hanok-cream', fontFamily: FONTS.classicSerif, weight: '700', italic: false, tracking: 8, displayTitle: 'MODU 모두', brandKey: 'modu', isLight: true };
  }
  if (uName.includes('TEH TARIK')) {
    return { facadeType: 'modern-bistro', fasciaH: 1.36, materialStyle: 'emerald-gold-heritage', fontFamily: FONTS.classicSerif, weight: '700', italic: false, tracking: 6, displayTitle: 'TEH TARIK CLUB', brandKey: 'teh-tarik', isLight: false };
  }
  if (uName.includes('WINDLAB')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.44, materialStyle: 'windlab-perforated-silver', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 12, displayTitle: 'WINDLAB', brandKey: 'windlab', isLight: true };
  }
  if (uName.includes('PJPAC')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.54, materialStyle: 'pjpac-canary-yellow', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 14, displayTitle: 'PJPAC', brandKey: 'pjpac', isLight: true };
  }
  if (uName.includes('WANGSA BOWL')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.48, materialStyle: 'velvet-navy', fontFamily: FONTS.condensed, weight: '700', italic: false, tracking: 10, displayTitle: 'WANGSA BOWL', brandKey: 'wangsa-bowl', isLight: false };
  }
  if (uName.includes('AEON')) {
    return { facadeType: 'open-market', fasciaH: 1.44, materialStyle: 'pure-white-magenta', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 14, displayTitle: 'AEON', brandKey: 'aeon', isLight: true };
  }
  if (uName.includes('ZARA')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.22, materialStyle: 'ivory-limestone', fontFamily: FONTS.didone, weight: '700', italic: false, tracking: 4, displayTitle: 'ZARA', brandKey: 'zara', isLight: true };
  }
  if (uName.includes('CHANEL')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.18, materialStyle: 'chanel-backlit-white', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 20, displayTitle: 'CHANEL', brandKey: 'chanel', isLight: true };
  }
  if (uName.includes('COACH')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.22, materialStyle: 'coach-charcoal-amber', fontFamily: FONTS.classicSerif, weight: '700', italic: false, tracking: 16, displayTitle: 'COACH', brandKey: 'coach', isLight: false };
  }
  if (uName.includes('DIOR')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.16, materialStyle: 'ivory-limestone', fontFamily: FONTS.didone, weight: '600', italic: false, tracking: 14, displayTitle: 'DIOR', brandKey: 'dior', isLight: true };
  }
  if (uName.includes('MUJI')) {
    return { facadeType: 'minimalist-tech', fasciaH: 1.24, materialStyle: 'warm-cream-plaster', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 8, displayTitle: 'MUJI 無印良品', brandKey: 'muji', isLight: true };
  }
  if (uName.includes('GSC')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.54, materialStyle: 'obsidian-stone', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 8, displayTitle: 'GSC', brandKey: 'gsc', isLight: false };
  }
  if (uName.includes('TGV')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.54, materialStyle: 'obsidian-stone', fontFamily: FONTS.geometric, weight: '800', italic: false, tracking: 8, displayTitle: 'TGV CINEMAS', brandKey: 'tgv', isLight: false };
  }
  if (uName.includes('POP MART')) {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.44, materialStyle: 'popmart-lime-crown', fontFamily: FONTS.condensed, weight: '800', italic: false, tracking: 6, displayTitle: 'POP MART', brandKey: 'pop-mart', isLight: true };
  }
  if (uName.includes('MACHINES')) {
    return { facadeType: 'minimalist-tech', fasciaH: 1.16, materialStyle: 'brushed-silver', fontFamily: FONTS.geometric, weight: '500', italic: false, tracking: 4, displayTitle: 'machines', brandKey: 'machines', isLight: true };
  }
  if (uName.includes('DYSON')) {
    return { facadeType: 'minimalist-tech', fasciaH: 1.16, materialStyle: 'obsidian-stone', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 6, displayTitle: 'dyson', brandKey: 'dyson', isLight: false };
  }
  if (uName.includes('CHÂTERAISÉ') || uName.includes('CHATERAISE')) {
    return { facadeType: 'cafe-patisserie', fasciaH: 1.26, materialStyle: 'warm-cream-plaster', fontFamily: FONTS.classicSerif, weight: '600', italic: true, tracking: 4, displayTitle: 'Châteraisé', brandKey: 'chateraise', isLight: true };
  }

  // Clean brand-name normalization for multi-tenant slots (strip ugly parenthetical directory tags!)
  const cleanTitle = (store.name || '').replace(/\s*\([^)]*\)/g, '').trim();

  if (st === 'japanese' || uName.includes('SUSHI') || uName.includes('SHABU') || uName.includes('MENYA')) {
    return { facadeType: 'japanese-machiya', fasciaH: 1.36, materialStyle: 'hinoki-oak', fontFamily: FONTS.cjkSerif, weight: '800', italic: false, tracking: 6, displayTitle: cleanTitle, brandKey: 'japanese', isLight: false };
  }
  if (uName.includes('DIN TAI FUNG') || uName.includes('PUTIEN') || uName.includes('FWF')) {
    return { facadeType: 'modern-bistro', fasciaH: 1.38, materialStyle: 'crimson-lacquer', fontFamily: FONTS.cjkSerif, weight: '800', italic: false, tracking: 6, displayTitle: cleanTitle, brandKey: 'asian-fine', isLight: false };
  }
  if (uName.includes('MINISO')) {
    return { facadeType: 'open-market', fasciaH: 1.24, materialStyle: 'pure-white-red', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 10, displayTitle: 'MINISO', brandKey: 'miniso', isLight: true };
  }
  if (uName.includes('ORIENTAL KOPI')) {
    return { facadeType: 'cafe-patisserie', fasciaH: 1.32, materialStyle: 'emerald-gold-heritage', fontFamily: FONTS.classicSerif, weight: '700', italic: false, tracking: 6, displayTitle: 'ORIENTAL KOPI  华阳', brandKey: 'oriental-kopi', isLight: false };
  }
  if (uName.includes('LULULEMON')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.20, materialStyle: 'obsidian-stone', fontFamily: FONTS.geometric, weight: '500', italic: false, tracking: 8, displayTitle: 'lululemon', brandKey: 'lululemon', isLight: false };
  }
  if (uName === 'ZARA' || uName.startsWith('ZARA ')) {
    return { facadeType: 'luxury-fashion', fasciaH: 1.22, materialStyle: 'ivory-limestone', fontFamily: FONTS.didone, weight: '700', italic: false, tracking: 4, displayTitle: 'ZARA', brandKey: 'zara', isLight: true };
  }
  if (
    uName.includes('LAVENDER') ||
    uName.includes('CHAGEE') ||
    uName.includes('BEUTEA') ||
    uName.includes('FAMOUS AMOS') ||
    uName.includes('RICH KOPITIAM') ||
    st === 'bakery' ||
    st === 'kopitiam'
  ) {
    return { facadeType: 'cafe-patisserie', fasciaH: 1.28, materialStyle: 'warm-cream-plaster', fontFamily: FONTS.classicSerif, weight: '700', italic: false, tracking: 6, displayTitle: cleanTitle, brandKey: 'cafe', isLight: true };
  }
  if (
    uName.includes('SALOMON') ||
    uName.includes('PUMA') ||
    uName.includes('SPORTS DIRECT') ||
    uName.includes('DECATHLON') ||
    st === 'sports' ||
    st === 'gym'
  ) {
    return { facadeType: 'sports-industrial', fasciaH: 1.30, materialStyle: 'raw-concrete', fontFamily: FONTS.condensed, weight: '700', italic: false, tracking: 8, displayTitle: cleanTitle, brandKey: 'sports', isLight: false };
  }
  if (
    uName.includes('BONIA') ||
    uName.includes('COACH') ||
    uName.includes('LANCÔME') ||
    uName.includes('H&M') ||
    uName.includes('BRANDS OUTLET') ||
    uName.includes('PADINI') ||
    st === 'luxury' ||
    st === 'beauty'
  ) {
    const isDarkLux = uName.includes('BRANDS OUTLET') || uName.includes('PADINI') || uName.includes('COACH');
    return { facadeType: 'luxury-fashion', fasciaH: 1.16, materialStyle: isDarkLux ? 'obsidian-stone' : 'ivory-limestone', fontFamily: isDarkLux ? FONTS.geometric : FONTS.didone, weight: '600', italic: false, tracking: 14, displayTitle: cleanTitle, brandKey: 'luxury', isLight: !isDarkLux };
  }
  if (st === 'cinema' || st === 'arcade' || st === 'rollerwa' || st === 'skydiving' || st === 'toys') {
    return { facadeType: 'entertainment-marquee', fasciaH: 1.48, materialStyle: 'velvet-navy', fontFamily: FONTS.condensed, weight: '700', italic: false, tracking: 8, displayTitle: cleanTitle, brandKey: 'entertainment', isLight: false };
  }
  if (st === 'tech' || st === 'furniture' || st === 'kitchenware') {
    const isLightTech = uName.includes('NITORI') || st === 'kitchenware';
    return { facadeType: 'minimalist-tech', fasciaH: 1.18, materialStyle: isLightTech ? 'brushed-silver' : 'obsidian-stone', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 10, displayTitle: cleanTitle, brandKey: 'tech', isLight: isLightTech };
  }
  if (st === 'supermarket') {
    return { facadeType: 'open-market', fasciaH: 1.42, materialStyle: 'satin-white-emerald', fontFamily: FONTS.geometric, weight: '700', italic: false, tracking: 6, displayTitle: cleanTitle, brandKey: 'market', isLight: true };
  }
  if (st === 'dining' || st === 'korean' || st === 'wok' || st === 'herbal') {
    return { facadeType: 'modern-bistro', fasciaH: 1.36, materialStyle: 'walnut-terracotta', fontFamily: FONTS.geometric, weight: '600', italic: false, tracking: 7, displayTitle: cleanTitle, brandKey: 'bistro', isLight: false };
  }
  return { facadeType: 'luxury-fashion', fasciaH: 1.20, materialStyle: 'ivory-limestone', fontFamily: FONTS.didone, weight: '600', italic: false, tracking: 10, displayTitle: cleanTitle, brandKey: 'default', isLight: true };
}

/**
 * 100% REAL 1 UTAMA SHOPPING CENTRE AUTHENTIC BRAND LOGOTYPE & ARCHITECTURAL FASCIA RENDERER
 * Draws exact bespoke vector brand emblems & real-world typographic logotypes (ZERO random fonts, ZERO fake directory subtitles!)
 */
const fasciaCache = new Map();
export function createStorefrontFasciaTexture(store, fasciaHeight = 1.48) {
  if (fasciaCache.has(store.id)) return fasciaCache.get(store.id);

  const prof = getStoreBrandProfile(store);
  const realAspect = Math.max(3.2, (store.width || 16) / fasciaHeight);
  const h = 192;
  const w = Math.min(2048, Math.max(768, Math.round((h * realAspect) / 64) * 64));
  const texAspect = w / h;
  const corrX = texAspect / realAspect;

  const cA = document.createElement('canvas');
  cA.width = w;
  cA.height = h;
  const ctx = cA.getContext('2d');

  const cE = document.createElement('canvas');
  cE.width = w;
  cE.height = h;
  const ctxE = cE.getContext('2d');
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, w, h);

  let fgCol = '#f8fafc';
  let emissiveTextCol = '#ffffff';
  let drawEmissive = true;

  // 1. REAL ARCHITECTURAL FACADE MATERIAL FINISH PER BRAND
  switch (prof.materialStyle) {
    case 'mrdiy-black-yellow': {
      // Photo-matched 1 Utama S319 MR. D.I.Y.: Crisp matte jet-black fascia w/ subtle panel seam & bright yellow bottom hairline
      ctx.fillStyle = '#14161a';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, h - 8, w, 8);
      ctxE.fillStyle = '#eab308';
      ctxE.fillRect(0, h - 8, w, 8);
      fgCol = '#facc15';
      emissiveTextCol = '#fde047';
      break;
    }
    case 'popmart-lime-crown': {
      // Photo-matched 1 Utama S333 POP MART: Luminous backlit lime-yellow (#d4e426) surround w/ subtle crown pattern!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#d9eb2a');
      bg.addColorStop(0.5, '#cde01f');
      bg.addColorStop(1, '#bfd218');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(218, 236, 46, 0.72)';
      ctxE.fillRect(0, 0, w, h);
      // Repeating subtle lime-olive POP MART crown silhouette watermark!
      ctx.fillStyle = 'rgba(130, 150, 12, 0.22)';
      for (let cx = 42; cx < w; cx += 92) {
        for (let cy = 36; cy < h; cy += 74) {
          ctx.beginPath();
          ctx.moveTo(cx - 18, cy + 12);
          ctx.lineTo(cx - 22, cy - 8);
          ctx.lineTo(cx - 9, cy + 2);
          ctx.lineTo(cx, cy - 14);
          ctx.lineTo(cx + 9, cy + 2);
          ctx.lineTo(cx + 22, cy - 8);
          ctx.lineTo(cx + 18, cy + 12);
          ctx.closePath();
          ctx.fill();
        }
      }
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'toptoy-pastel-claw': {
      // Photo-matched 1 Utama S330 TOP TOY: Pastel cyan-lavender scalloped claw-machine graphic marquee!
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#9be7f5');
      bg.addColorStop(0.35, '#c8b8f8');
      bg.addColorStop(0.68, '#f6b8d8');
      bg.addColorStop(1, '#9be7f5');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(215, 235, 255, 0.62)';
      ctxE.fillRect(0, 0, w, h);
      // Playful scalloped pastel wave border along bottom
      ctx.fillStyle = '#ffffff';
      for (let sx = 0; sx <= w; sx += 44) {
        ctx.beginPath();
        ctx.arc(sx, h - 4, 22, Math.PI, 0);
        ctx.fill();
      }
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'jaya-woodblock-silver': {
      // Photo-matched 1 Utama LG309 Jaya Grocer: Stacked multi-tone brown wood-block mosaic fascia + brushed-silver center box + thick bright-red bottom portal band!
      const woodPalette = ['#6b4226', '#8a5832', '#52311a', '#9e6b3f', '#784c2b', '#442815'];
      const bw = 42;
      const bh = 28;
      for (let ry = 0; ry < h - 20; ry += bh) {
        const off = (Math.floor(ry / bh) % 2) * 21;
        for (let rx = -bw; rx < w + bw; rx += bw) {
          const idx = Math.abs(Math.floor(rx * 13 + ry * 7)) % woodPalette.length;
          ctx.fillStyle = woodPalette[idx];
          ctx.fillRect(rx + off + 1, ry + 1, bw - 2, bh - 2);
        }
      }
      // Protruding brushed-silver central signage plaque box
      const boxW = Math.min(w * 0.56, 680);
      const bx = (w - boxW) * 0.5;
      const sg = ctx.createLinearGradient(bx, 18, bx, h - 34);
      sg.addColorStop(0, '#eef2f6');
      sg.addColorStop(0.5, '#dce3eb');
      sg.addColorStop(1, '#c3ccd8');
      ctx.fillStyle = sg;
      ctx.fillRect(bx, 16, boxW, h - 44);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, 16, boxW, h - 44);
      ctxE.fillStyle = 'rgba(220, 228, 238, 0.35)';
      ctxE.fillRect(bx, 16, boxW, h - 44);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, h - 22, w, 22);
      fgCol = '#146c32';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'miniso-coral-charcoal': {
      // Photo-matched 1 Utama LG308C MINISO: Two-band stepped charcoal-black top + warm coral-pink (#f2748b) backlit portal + white LED lines!
      ctx.fillStyle = '#1b1d22';
      ctx.fillRect(0, 0, w, 46);
      const bg = ctx.createLinearGradient(0, 46, 0, h);
      bg.addColorStop(0, '#f47b92');
      bg.addColorStop(0.55, '#f26c84');
      bg.addColorStop(1, '#e85b74');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 46, w, h - 46);
      ctxE.fillStyle = 'rgba(244, 128, 150, 0.65)';
      ctxE.fillRect(0, 46, w, h - 46);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 44, w, 4);
      ctx.fillRect(0, h - 8, w, 8);
      ctxE.fillStyle = '#ffffff';
      ctxE.fillRect(0, h - 8, w, 8);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'adidas-frosted-cyan': {
      // Photo-matched 1 Utama LG307-LG307A ADIDAS: 3D beveled off-white square-grid blocks + electric CYAN-BLUE bottom LED edge (replaces magenta!)
      ctx.fillStyle = '#f4f7fa';
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(240, 248, 255, 0.72)';
      ctxE.fillRect(0, 0, w, h - 10);
      const cell = 44;
      for (let gx = 0; gx < w; gx += cell) {
        for (let gy = 0; gy < h; gy += cell) {
          const sh = 240 + Math.floor(hash2(gx, gy) * 14);
          ctx.fillStyle = `rgb(${sh},${sh + 2},${sh + 4})`;
          ctx.fillRect(gx + 3, gy + 3, cell - 6, cell - 6);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.42)';
          ctx.lineWidth = 2;
          ctx.strokeRect(gx + 3, gy + 3, cell - 6, cell - 6);
        }
      }
      ctx.fillStyle = '#00b4ff';
      ctx.fillRect(0, h - 9, w, 9);
      ctxE.fillStyle = '#38d2ff';
      ctxE.fillRect(0, h - 9, w, 9);
      fgCol = '#0f172a';
      drawEmissive = false;
      break;
    }
    case 'food-district-subway': {
      // Photo-matched 1 Utama S346-S347 FOOD DISTRICT: Glossy white subway-tile fascia!
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, w, h);
      const tw = 56;
      const th = 28;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.34)';
      ctx.lineWidth = 2;
      for (let ty = 0; ty < h; ty += th) {
        const off = (Math.floor(ty / th) % 2) * 28;
        for (let tx = -tw; tx < w + tw; tx += tw) {
          ctx.strokeRect(tx + off, ty, tw, th);
        }
      }
      ctxE.fillStyle = 'rgba(248, 250, 252, 0.55)';
      ctxE.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, h - 5, w, 5);
      fgCol = '#1e293b';
      drawEmissive = false;
      break;
    }
    case 'puma-black-red':
    case 'ua-black-red': {
      // Photo-matched 1 Utama S345 PUMA & S347A-S348 Under Armour: Matte dark charcoal fascia + bold glossy PUMA/UA crimson bottom portal bar!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#181b22');
      bg.addColorStop(0.5, '#222630');
      bg.addColorStop(1, '#14171d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(32, 36, 44, 0.34)';
      ctxE.fillRect(0, 0, w, h - 16);
      ctx.fillStyle = '#dc1424';
      ctx.fillRect(0, h - 16, w, 16);
      ctxE.fillStyle = '#e01626';
      ctxE.fillRect(0, h - 16, w, 16);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'parkson-iceblue-chrome': {
      // Photo-matched 1 Utama G320 & S320 PARKSON ELITE: Full-width luminous backlit cool ice-blue/white frosted lightbox fascia w/ brushed steel seams & champagne bottom trim!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#dff0fc');
      bg.addColorStop(0.5, '#f4fafe');
      bg.addColorStop(1, '#d4e8f8');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(220, 240, 255, 0.56)';
      ctxE.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(w * 0.22, 0); ctx.lineTo(w * 0.22, h);
      ctx.moveTo(w * 0.78, 0); ctx.lineTo(w * 0.78, h);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, 0, w, 6);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, h - 7, w, 7);
      fgCol = '#1e293b';
      emissiveTextCol = '#000000';
      break;
    }
    case 'cometrue-grey-oak': {
      // Photo-matched 1 Utama G315A Come True Cafe: Matte architectural cool-grey plaster framed in warm light-oak trim!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#c8ccd0');
      bg.addColorStop(0.5, '#d4d7db');
      bg.addColorStop(1, '#bcc1c7');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#c49a6c';
      ctx.fillRect(0, 0, w, 10);
      ctx.fillRect(0, h - 10, w, 10);
      fgCol = '#2a2e33';
      drawEmissive = false;
      break;
    }
    case 'heytea-corrugated-silver': {
      // Photo-matched 1 Utama LG313 HEYTEA: Horizontally corrugated brushed silver-gray metal fascia!
      ctx.fillStyle = '#b4bcc6';
      ctx.fillRect(0, 0, w, h);
      for (let ry = 0; ry < h; ry += 12) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.24)';
        ctx.fillRect(0, ry, w, 4);
        ctx.fillStyle = 'rgba(42, 48, 56, 0.22)';
        ctx.fillRect(0, ry + 6, w, 4);
      }
      ctxE.fillStyle = 'rgba(200, 210, 220, 0.28)';
      ctxE.fillRect(0, 0, w, h);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'zus-cream-plaster': {
      // Photo-matched 1 Utama G601A COFFEE MEETS PASTRY BY ZUS: Smooth warm cream architectural plaster!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#f3ece0');
      bg.addColorStop(0.5, '#f8f2e8');
      bg.addColorStop(1, '#e8dfd0');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#0f2e78';
      ctx.fillRect(0, h - 6, w, 6);
      fgCol = '#0f2e78';
      drawEmissive = false;
      break;
    }
    case 'zus-navy': {
      // Authentic 1 Utama ZUS COFFEE: Signature deep royal-navy blue (#0A2240) fascia!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0c274a');
      bg.addColorStop(0.5, '#0A2240');
      bg.addColorStop(1, '#071930');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(10, 34, 64, 0.45)';
      ctxE.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, h - 6, w, 6);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'sephora-pitch-black': {
      // Photo-matched 1 Utama G139C SEPHORA: Sleek monolithic pitch-black overhead fascia (horizontal B&W stripes go on the 3D piers!)
      ctx.fillStyle = '#0a0b0e';
      ctx.fillRect(0, 0, w, h);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'starbucks-charcoal-stone': {
      // Photo-matched 1 Utama G139B-G139D STARBUCKS RESERVE: Clean dark charcoal-slate stone panel fascia!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#2a2e33');
      bg.addColorStop(0.5, '#343940');
      bg.addColorStop(1, '#23272c');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b48a5a';
      ctx.fillRect(0, h - 5, w, 5);
      fgCol = '#f8f3ea';
      emissiveTextCol = '#fff6e4';
      break;
    }
    case 'outside-birch-plywood': {
      // Photo-matched 1 Utama S343 outside: Light blonde birch/plywood timber fascia framed in matte black metal!
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#d8be98');
      bg.addColorStop(0.5, '#e4cca8');
      bg.addColorStop(1, '#d2b68e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (let py = 0; py < h; py += 8) {
        ctx.fillStyle = py % 16 === 0 ? 'rgba(130, 92, 46, 0.08)' : 'rgba(255, 245, 224, 0.08)';
        ctx.fillRect(0, py, w, 3);
      }
      ctx.strokeStyle = '#181a1f';
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, w - 10, h - 10);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'chanel-backlit-white': {
      // Photo-matched 1 Utama G330 CHANEL: Matte warm-ivory fascia framed in glossy black metal perimeter w/ crisp right-of-center jet-black CHANEL!
      ctx.fillStyle = '#f8f6f0';
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(248, 246, 240, 0.52)';
      ctxE.fillRect(10, 10, w - 20, h - 20);
      ctx.fillStyle = '#08080a';
      ctx.fillRect(0, 0, w, 10);
      ctx.fillRect(0, h - 10, w, 10);
      fgCol = '#08080a';
      emissiveTextCol = '#000000';
      drawEmissive = true;
      break;
    }
    case 'coach-charcoal-amber': {
      // Photo-matched 1 Utama G309 COACH: Matte dark charcoal fascia + 2 horizontal rows of glowing warm-amber square glass blocks on right!
      ctx.fillStyle = '#1d1f24';
      ctx.fillRect(0, 0, w, h);
      const gxStart = w * 0.58;
      const cell = 42;
      for (let gx = gxStart; gx < w - 18; gx += cell + 6) {
        for (let row = 0; row < 2; row++) {
          const gy = 36 + row * (cell + 8);
          const ag = ctx.createRadialGradient(gx + cell * 0.5, gy + cell * 0.5, 4, gx + cell * 0.5, gy + cell * 0.5, cell * 0.65);
          ag.addColorStop(0, '#ffe69a');
          ag.addColorStop(0.65, '#e89b2d');
          ag.addColorStop(1, '#9c5a12');
          ctx.fillStyle = ag;
          ctx.fillRect(gx, gy, cell, cell);
          ctxE.fillStyle = '#e89c2e';
          ctxE.fillRect(gx + 3, gy + 3, cell - 6, cell - 6);
        }
      }
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'nextgen-white-rainbow': {
      // Photo-matched 1 Utama F602-F603 Next Gen: Crisp matte white facade + subtle bottom rainbow trim!
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctxE.fillStyle = 'rgba(255, 255, 255, 0.72)';
      ctxE.fillRect(0, 0, w, h - 14);
      const rbCols = ['#ec4899', '#ef4444', '#f97316', '#facc15', '#84cc16', '#8b5cf6'];
      const sw = w / rbCols.length;
      rbCols.forEach((col, i) => {
        ctx.fillStyle = col;
        ctx.fillRect(i * sw, h - 10, sw + 2, 10);
      });
      fgCol = '#1e1b4b';
      drawEmissive = false;
      break;
    }
    case 'rollerwa-neon-navy': {
      // Photo-matched 1 Utama F603A-F613 RollerWa: Deep matte navy-blue fascia + subtle electric-pink accent!
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#101d48');
      bg.addColorStop(0.5, '#172a66');
      bg.addColorStop(1, '#101d48');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#ff2a9d';
      ctx.fillRect(0, h - 8, w, 8);
      ctxE.fillStyle = '#ff2a9d';
      ctxE.fillRect(0, h - 8, w, 8);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'gameon-steel-grid': {
      // Photo-matched 1 Utama F601 GAME ON: Exposed charcoal-steel grid over textured off-white plaster!
      ctx.fillStyle = '#eae5dc';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#252932';
      ctx.lineWidth = 5;
      for (let gx = 0; gx < w; gx += 64) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let gy = 0; gy < h; gy += 64) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }
      // Dark steel center plaque holding crisp glowing GAMEON + orange joystick O
      const pw = Math.min(w * 0.62, 720);
      ctx.fillStyle = '#1b1f27';
      ctx.fillRect((w - pw) * 0.5, 16, pw, h - 32);
      ctx.fillStyle = '#ea580c';
      ctx.fillRect(0, h - 10, w, 10);
      ctxE.fillStyle = '#ea580c';
      ctxE.fillRect(0, h - 10, w, 10);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'bhc-yellow-mosaic': {
      // Photo-matched 1 Utama G601 BHC CHICKEN: Golden-yellow small square mosaic-tile top fascia over dark walnut edge!
      const cell = 24;
      const yPal = ['#f4b400', '#fcc419', '#e5a300', '#ffd43b', '#eab308'];
      for (let gx = 0; gx < w; gx += cell) {
        for (let gy = 0; gy < h - 16; gy += cell) {
          ctx.fillStyle = yPal[Math.abs(Math.floor(gx * 7 + gy * 11)) % yPal.length];
          ctx.fillRect(gx + 1, gy + 1, cell - 2, cell - 2);
        }
      }
      ctx.fillStyle = '#3b2414';
      ctx.fillRect(0, h - 16, w, 16);
      fgCol = '#1b1714';
      drawEmissive = false;
      break;
    }
    case 'modu-hanok-cream': {
      // Photo-matched 1 Utama LG602 MODU: Smooth matte cream-white fascia in thin timber border!
      ctx.fillStyle = '#f8f4ea';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#78502b';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      fgCol = '#4a2e16';
      drawEmissive = false;
      break;
    }
    case 'windlab-perforated-silver': {
      // Photo-matched 1 Utama S601 WINDLAB: Light silver-grey perforated metal upper fascia w/ orange bottom accent!
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#cfd5de');
      bg.addColorStop(0.5, '#e2e7ee');
      bg.addColorStop(1, '#c6cdd6');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = 'rgba(40, 48, 58, 0.22)';
      for (let px = 12; px < w; px += 16) {
        for (let py = 12; py < h - 14; py += 16) {
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.fillStyle = '#f97316';
      ctx.fillRect(0, h - 10, w, 10);
      fgCol = '#14181f';
      drawEmissive = false;
      break;
    }
    case 'pjpac-canary-yellow': {
      // Authentic 1 Utama PJPAC (S611): Sculptural bright canary-yellow/amber arched fascia!
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#fbbf24');
      bg.addColorStop(1, '#f59e0b');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'satin-white-emerald': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#f3f5f3');
      bg.addColorStop(0.5, '#fcfdfc');
      bg.addColorStop(1, '#e4eae6');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, h - 8, w, 8);
      fgCol = '#146c32';
      emissiveTextCol = '#1ea84c';
      drawEmissive = false;
      break;
    }
    case 'pure-white-magenta': {
      ctx.fillStyle = '#f8f9fa';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b81d77';
      ctx.fillRect(0, h - 7, w, 7);
      fgCol = '#b81d77';
      drawEmissive = false;
      break;
    }
    case 'hinoki-oak': {
      for (let x = 0; x < w; x += 18) {
        const sh = 0.88 + hash2(x, 4.1) * 0.22;
        ctx.fillStyle = `rgb(${Math.floor(196 * sh)},${Math.floor(156 * sh)},${Math.floor(108 * sh)})`;
        ctx.fillRect(x, 0, 14, h);
        ctx.fillStyle = '#4a2f1a';
        ctx.fillRect(x + 14, 0, 4, h);
      }
      ctx.fillStyle = 'rgba(20, 17, 15, 0.88)';
      ctx.fillRect(w * 0.20, 20, w * 0.60, h - 40);
      fgCol = '#ffffff';
      emissiveTextCol = '#fff8ec';
      break;
    }
    case 'sephora-stripe': {
      const stripeW = Math.max(24, Math.round(w / 28));
      for (let sx = 0; sx < w; sx += stripeW) {
        ctx.fillStyle = Math.round(sx / stripeW) % 2 === 0 ? '#f7f7f8' : '#08080a';
        ctx.fillRect(sx, 0, stripeW, h);
      }
      ctx.fillStyle = '#08080a';
      ctx.fillRect(w * 0.24, 0, w * 0.52, h);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
    case 'pure-white-red': {
      ctx.fillStyle = '#fafbfc';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#e11d48';
      ctx.fillRect(0, h - 7, w, 7);
      fgCol = '#e11d48';
      drawEmissive = false;
      break;
    }
    case 'emerald-gold-heritage': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#0f3d2e');
      bg.addColorStop(0.5, '#14533e');
      bg.addColorStop(1, '#0b2d22');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#d4af5e';
      ctx.lineWidth = 4;
      ctx.strokeRect(12, 12, w - 24, h - 24);
      fgCol = '#f8e6ba';
      emissiveTextCol = '#ffe8b0';
      break;
    }
    case 'champagne-limestone':
    case 'ivory-limestone': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#ede7dc');
      bg.addColorStop(0.5, '#f7f3eb');
      bg.addColorStop(1, '#e0d7c7');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      drawMarbleVeins(ctx, Math.min(w, h), '#bfb09a', 0.08, 10);
      ctx.fillStyle = '#b4944e';
      ctx.fillRect(0, h - 5, w, 5);
      fgCol = '#1c1814';
      drawEmissive = false;
      break;
    }
    case 'travertine-cream':
    case 'warm-cream-plaster': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#f0eae0');
      bg.addColorStop(0.55, '#f8f4ed');
      bg.addColorStop(1, '#e3dacd');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      fgCol = '#1f1914';
      drawEmissive = false;
      break;
    }
    case 'smoked-oak-brass':
    case 'walnut-terracotta': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1e1713');
      bg.addColorStop(0.5, '#2b2019');
      bg.addColorStop(1, '#16110e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (let x = 0; x < w; x += 22) {
        ctx.fillStyle = 'rgba(186, 132, 78, 0.12)';
        ctx.fillRect(x, 0, 7, h);
      }
      ctx.fillStyle = '#c4964c';
      ctx.fillRect(0, h - 4, w, 4);
      fgCol = '#fcf7ee';
      emissiveTextCol = '#ffecd0';
      break;
    }
    case 'crimson-lacquer': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1c1214');
      bg.addColorStop(0.5, '#2a1618');
      bg.addColorStop(1, '#140c0d');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, h - 6, w, 6);
      fgCol = '#ffffff';
      emissiveTextCol = '#fff6e8';
      break;
    }
    case 'raw-concrete': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#2a3039');
      bg.addColorStop(0.5, '#353c47');
      bg.addColorStop(1, '#22272f');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 280; i++) {
        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
        ctx.fillRect(hash2(i, 1.3) * w, hash2(i, 4.7) * h, 18, 6);
      }
      fgCol = '#f8fafc';
      emissiveTextCol = '#f8fafc';
      break;
    }
    case 'brushed-silver': {
      const bg = ctx.createLinearGradient(0, 0, w, 0);
      bg.addColorStop(0, '#dadfe7');
      bg.addColorStop(0.5, '#eef1f5');
      bg.addColorStop(1, '#d2d8e0');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      fgCol = '#111827';
      drawEmissive = false;
      break;
    }
    case 'velvet-navy': {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#11182b');
      bg.addColorStop(0.5, '#1a2540');
      bg.addColorStop(1, '#0d1322');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(0, h - 5, w, 5);
      fgCol = '#ffffff';
      emissiveTextCol = '#e6f4ff';
      break;
    }
    default: {
      const bg = ctx.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#12151c');
      bg.addColorStop(0.5, '#1a1e28');
      bg.addColorStop(1, '#0d0f14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
      fgCol = '#ffffff';
      emissiveTextCol = '#ffffff';
      break;
    }
  }

  // Subtle architectural stone/panel cladding vertical seam lines
  if (prof.materialStyle !== 'parkson-bronze-dark') {
    const isChanel = prof.materialStyle === 'chanel-backlit-white';
    ctx.strokeStyle = isChanel ? 'rgba(8,8,10,0.09)' : prof.isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 2;
    const panelStep = w / Math.max(4, Math.round((store.width || 16) / 4.2));
    for (let px = panelStep; px < w - 10; px += panelStep) {
      ctx.beginPath();
      ctx.moveTo(px, 6);
      ctx.lineTo(px, h - 8);
      ctx.stroke();
      if (isChanel) {
        ctxE.strokeStyle = 'rgba(0,0,0,0.22)';
        ctxE.lineWidth = 2;
        ctxE.beginPath();
        ctxE.moveTo(px, 7);
        ctxE.lineTo(px, h - 7);
        ctxE.stroke();
      }
    }
  }

  // Subtle authentic real-mall tiny lot plaque tucked cleanly in the bottom-right corner ONLY (NEVER a fake subtitle!)
  if (store.lot) {
    ctx.save();
    ctx.fillStyle = prof.isLight ? 'rgba(40, 34, 28, 0.45)' : 'rgba(255, 255, 255, 0.42)';
    ctx.font = '600 16px "Jost", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(store.lot, w - 22, h - 18);
    ctx.restore();
  }

  // 2. BESPOKE 100% AUTHENTIC REAL 1 UTAMA BRAND LOGOTYPE & EMBLEM RENDERER
  const drawAuthenticBrand = (targetCtx, isEmissive) => {
    if (isEmissive && !drawEmissive) return;
    targetCtx.save();
    targetCtx.translate(w * 0.5, 0);
    targetCtx.scale(corrX, 1.0);
    const maxW = (w / corrX) * 0.84;
    targetCtx.textAlign = 'center';

    switch (prof.brandKey) {
      case 'mr-diy': {
        // Photo-matched 1 Utama S319 MR. D.I.Y.: Bold red MR.D.I.Y. with crisp bright-yellow outline on jet-black fascia!
        targetCtx.lineJoin = 'round';
        targetCtx.font = '900 84px "Montserrat", "Jost", sans-serif';
        targetCtx.strokeStyle = '#facc15';
        targetCtx.lineWidth = 14;
        targetCtx.strokeText('MR.D.I.Y.', 0, 122);
        targetCtx.fillStyle = isEmissive ? '#ef4444' : '#dc2626';
        targetCtx.fillText('MR.D.I.Y.', 0, 122);
        break;
      }

      case 'top-toy': {
        // Photo-matched 1 Utama S330 TOP TOY: Bold glowing pure-white rounded TOP TOY + playful sparkle stars!
        targetCtx.fillStyle = isEmissive ? '#ffffff' : 'rgba(56, 40, 120, 0.28)';
        fillAutoFitText(targetCtx, 'TOP TOY', 4, 120, maxW * 0.66, 84, '900', '"Montserrat", "Jost", sans-serif', 8);
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'TOP TOY', 0, 116, maxW * 0.66, 84, '900', '"Montserrat", "Jost", sans-serif', 8);
        break;
      }

      case 'zus-pastry': {
        // Photo-matched 1 Utama G601A COFFEE MEETS PASTRY BY ZUS: Royal-blue typography on warm cream plaster!
        targetCtx.fillStyle = '#0f2e78';
        fillAutoFitText(targetCtx, 'COFFEE MEETS PASTRY', 0, 94, maxW * 0.72, 46, '800', '"Jost", sans-serif', 8);
        targetCtx.fillStyle = '#1e40af';
        fillAutoFitText(targetCtx, 'BY ZUS', 0, 142, maxW * 0.42, 34, '700', '"Jost", sans-serif', 12);
        break;
      }

      case 'sephora': {
        // Photo-matched 1 Utama G139C SEPHORA: Crisp minimalist glowing white S E P H O R A across pitch-black fascia!
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'SEPHORA', 0, 118, maxW * 0.68, 72, '500', '"Jost", sans-serif', 22);
        break;
      }

      case 'miniso': {
        // Authentic 1 Utama MINISO (LG308C) All-Pink IP Flagship: Iconic crimson shopping-bag wink emblem + bold white MINISO on pink!
        const lx = -Math.min(maxW * 0.28, 175);
        targetCtx.fillStyle = '#dc2626';
        targetCtx.fillRect(lx - 38, 52, 76, 86);
        targetCtx.strokeStyle = '#dc2626';
        targetCtx.lineWidth = 6;
        targetCtx.beginPath();
        targetCtx.arc(lx, 52, 20, Math.PI, 0);
        targetCtx.stroke();
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 4;
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, 18, 0.2, Math.PI - 0.2);
        targetCtx.stroke();
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'MINISO', 46, 118, maxW * 0.62, 68, '700', '"Jost", sans-serif', 10);
        break;
      }

      case 'oriental-kopi': {
        // Authentic ORIENTAL KOPI 华阳: Gold medallion crest + refined heritage serif & Chinese calligraphy!
        const lx = -Math.min(maxW * 0.36, 265);
        targetCtx.strokeStyle = '#d4af5e';
        targetCtx.lineWidth = 4;
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, 34, 0, Math.PI * 2);
        targetCtx.stroke();
        targetCtx.fillStyle = '#f8e6ba';
        targetCtx.font = '800 32px "Noto Serif JP", serif';
        targetCtx.fillText('阳', lx, 108);
        targetCtx.fillStyle = isEmissive ? '#ffe8b0' : '#f8e6ba';
        fillAutoFitText(targetCtx, 'ORIENTAL KOPI  华阳', 36, 114, maxW * 0.72, 54, '700', '"Playfair Display", "Noto Serif JP", serif', 5);
        break;
      }

      case 'lululemon': {
        // Authentic lululemon: Crimson circular omega emblem + crisp lowercase white wordmark!
        const lx = -Math.min(maxW * 0.32, 210);
        targetCtx.fillStyle = '#c8102e';
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, 30, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 5;
        targetCtx.beginPath();
        targetCtx.arc(lx, 92, 14, Math.PI * 0.85, Math.PI * 2.15);
        targetCtx.stroke();
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'lululemon', 42, 114, maxW * 0.64, 60, '500', '"Jost", sans-serif', 6);
        break;
      }

      case 'zara': {
        // Bold unbroken high-contrast Playfair editorial ZARA wordmark (ZERO dropped thin hairlines!)
        targetCtx.fillStyle = '#111111';
        fillAutoFitText(targetCtx, 'ZARA', 0, 126, maxW * 0.56, 92, '800', '"Playfair Display", "Georgia", serif', -3);
        break;
      }

      case 'tommy': {
        // Exact iconic TOMMY [White|Crimson Flag framed by Navy Stripes] HILFIGER!
        const flagW = 72;
        const flagH = 44;
        const fy = 74;
        // Navy top & bottom bands
        targetCtx.fillStyle = '#0c2340';
        targetCtx.fillRect(-flagW * 0.5, fy, flagW, 8);
        targetCtx.fillRect(-flagW * 0.5, fy + flagH - 8, flagW, 8);
        // White left & Crimson right center squares
        targetCtx.fillStyle = '#ffffff';
        targetCtx.fillRect(-flagW * 0.5, fy + 8, flagW * 0.5, flagH - 16);
        targetCtx.fillStyle = '#cc0c2f';
        targetCtx.fillRect(0, fy + 8, flagW * 0.5, flagH - 16);
        // Clean TOMMY on left, HILFIGER on right!
        targetCtx.fillStyle = '#0c2340';
        targetCtx.textAlign = 'right';
        fillAutoFitText(targetCtx, 'TOMMY', -flagW * 0.5 - 22, 112, maxW * 0.36, 48, '600', '"Jost", sans-serif', 12);
        targetCtx.textAlign = 'left';
        fillAutoFitText(targetCtx, 'HILFIGER', flagW * 0.5 + 22, 112, maxW * 0.42, 48, '600', '"Jost", sans-serif', 12);
        break;
      }

      case 'parkson': {
        // Photo-matched 1 Utama PARKSON Elite 百盛: Crisp silver/white 3D-outlined PARKSON + script Elite + 百盛 across backlit ice-blue header!
        if (!isEmissive) {
          targetCtx.strokeStyle = '#1e293b';
          targetCtx.lineWidth = 6;
          targetCtx.font = '700 72px "Jost", sans-serif';
          targetCtx.textAlign = 'center';
          targetCtx.textBaseline = 'middle';
          targetCtx.strokeText('PARKSON', -160, 100);
          targetCtx.fillStyle = '#ffffff';
          targetCtx.fillText('PARKSON', -160, 100);
          targetCtx.font = 'italic 600 62px "Playfair Display", "Cormorant Garamond", serif';
          targetCtx.strokeText('Elite', 142, 100);
          targetCtx.fillStyle = '#ffffff';
          targetCtx.fillText('Elite', 142, 100);
          targetCtx.font = '700 66px "Noto Serif JP", serif';
          targetCtx.strokeText('百盛', 300, 100);
          targetCtx.fillStyle = '#ffffff';
          targetCtx.fillText('百盛', 300, 100);
        }
        break;
      }

      case 'come-true': {
        // Authentic 1 Utama Come True CAFE 成真咖啡 (G315A): Dark forest-charcoal concentric swirl emblem cleanly >= 54px left of COME TRUE CAFE 成真咖啡!
        const ctLabel = 'COME TRUE CAFE  成真咖啡';
        const ctFont = '"Jost", "Noto Serif JP", sans-serif';
        const ctM = fitTextMetrics(targetCtx, ctLabel, maxW - 124, 46, '700', ctFont, 3, false);
        const emblemR = 30;
        const gap = 56;
        const totalW = emblemR * 2 + gap + ctM.width;
        const lx = -totalW * 0.5 + emblemR;
        const tx = lx + emblemR + gap;
        const ink = isEmissive ? '#000000' : '#113834';

        targetCtx.strokeStyle = ink;
        targetCtx.lineWidth = 4.5;
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, emblemR, 0, Math.PI * 2);
        targetCtx.stroke();
        targetCtx.lineWidth = 3;
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, 20, 0.25, Math.PI * 1.85);
        targetCtx.stroke();
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, 10, 0, Math.PI * 2);
        targetCtx.stroke();

        targetCtx.fillStyle = ink;
        targetCtx.textAlign = 'left';
        targetCtx.font = `700 ${ctM.size}px ${ctFont}`;
        drawTrackedText(targetCtx, ctLabel, tx, 113, ctM.tracking);
        targetCtx.textAlign = 'center';
        break;
      }

      case 'jaya-grocer': {
        // Authentic 1 Utama Jaya Grocer (LG309): Bright red italic Jaya + fresh green uppercase GROCER + shopping trolley produce icon!
        const lx = -Math.min(maxW * 0.34, 240);
        // Stylized red shopping basket/trolley icon with green leaf sprouts
        targetCtx.strokeStyle = '#ef4444';
        targetCtx.lineWidth = 5;
        targetCtx.beginPath();
        targetCtx.moveTo(lx - 32, 68);
        targetCtx.lineTo(lx - 20, 112);
        targetCtx.lineTo(lx + 24, 112);
        targetCtx.lineTo(lx + 34, 78);
        targetCtx.closePath();
        targetCtx.stroke();
        targetCtx.fillStyle = '#22c55e';
        targetCtx.beginPath();
        targetCtx.ellipse(lx - 4, 70, 16, 8, -0.5, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#ef4444';
        targetCtx.textAlign = 'right';
        fillAutoFitText(targetCtx, 'Jaya', -14, 118, maxW * 0.36, 76, '700', '"Cormorant Garamond", "Georgia", serif', 1, true);
        targetCtx.fillStyle = '#22c55e';
        targetCtx.textAlign = 'left';
        fillAutoFitText(targetCtx, 'GROCER', 2, 118, maxW * 0.44, 62, '800', '"Jost", sans-serif', 5);
        break;
      }

      case 'ippudo': {
        // Photo-matched 1 Utama LG352 IPPUDO: Crisp WHITE circular wave + clean white IPPUDO on matte black!
        const ipMain = 'IPPUDO';
        const mEn = fitTextMetrics(targetCtx, ipMain, maxW * 0.56, 66, '600', '"Jost", sans-serif', 14, false);
        const spiralR = 32;
        const gap1 = 44;
        const totalW = spiralR * 2 + gap1 + mEn.width;
        const lx = -totalW * 0.5 + spiralR;
        const txEn = lx + spiralR + gap1;

        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 5.5;
        targetCtx.lineCap = 'round';
        targetCtx.beginPath();
        for (let step = 0; step <= 64; step++) {
          const t = (step / 64) * Math.PI * 4.5;
          const r = 3.0 + (step / 64) * (spiralR - 3.0);
          const sx = lx + Math.cos(t) * r;
          const sy = 96 + Math.sin(t) * r;
          if (step === 0) targetCtx.moveTo(sx, sy);
          else targetCtx.lineTo(sx, sy);
        }
        targetCtx.stroke();
        targetCtx.lineCap = 'butt';

        targetCtx.fillStyle = '#ffffff';
        targetCtx.textAlign = 'left';
        targetCtx.font = `600 ${mEn.size}px "Jost", sans-serif`;
        drawTrackedText(targetCtx, ipMain, txEn, 116, mEn.tracking);
        targetCtx.textAlign = 'center';
        break;
      }

      case 'kyochon': {
        // Authentic 1 Utama KyoChon 1991: Clean refined warm white KyoChon + champagne-gold 1991
        targetCtx.fillStyle = isEmissive ? '#ffecd0' : '#fcf8f2';
        fillAutoFitText(targetCtx, 'KyoChon', -56, 114, maxW * 0.56, 68, '600', '"Jost", sans-serif', 2);
        targetCtx.fillStyle = '#d4a656';
        fillAutoFitText(targetCtx, '1991', 168, 114, maxW * 0.24, 48, '500', '"Jost", sans-serif', 6);
        break;
      }

      case 'heytea': {
        // Authentic 1 Utama HEYTEA 喜茶 (LG313): Crisp circular emblem with unmistakable side-profile sipping boy + HEYTEA 喜茶!
        const htLabel = 'HEYTEA  喜茶';
        const htFont = '"Jost", "Noto Serif JP", sans-serif';
        const htM = fitTextMetrics(targetCtx, htLabel, maxW - 124, 54, '700', htFont, 8, false);
        const badgeR = 35;
        const gap = 46;
        const totalW = badgeR * 2 + gap + htM.width;
        const lx = -totalW * 0.5 + badgeR;
        const tx = lx + badgeR + gap;

        targetCtx.save();
        targetCtx.translate(lx, 96);
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 3.5;
        targetCtx.beginPath();
        targetCtx.arc(0, 0, badgeR, 0, Math.PI * 2);
        targetCtx.stroke();

        // Crisp side-profile silhouette of the sipping boy (clean hair, forehead, nose, lips, chin, neck, shoulder)
        targetCtx.fillStyle = '#ffffff';
        targetCtx.beginPath();
        targetCtx.moveTo(-22, 24);
        targetCtx.lineTo(-22, 12);
        targetCtx.quadraticCurveTo(-24, -4, -18, -15); // back of head
        targetCtx.quadraticCurveTo(-10, -25, 3, -22); // crown & swept hair top
        targetCtx.quadraticCurveTo(9, -19, 10, -14); // front hair lock / bangs
        targetCtx.lineTo(4, -13); // brow indent
        targetCtx.lineTo(5, -8); // forehead
        targetCtx.lineTo(10, -3); // nose tip
        targetCtx.lineTo(5, -1); // philtrum
        targetCtx.lineTo(7, 2); // upper lip
        targetCtx.lineTo(4, 5); // mouth sipping gap
        targetCtx.lineTo(6, 7); // lower lip
        targetCtx.lineTo(4, 12); // chin
        targetCtx.quadraticCurveTo(-2, 14, -4, 18); // jaw to throat
        targetCtx.lineTo(-4, 24); // front neck
        targetCtx.closePath();
        targetCtx.fill();

        // Tilted tea cup + hand gripping base + crisp diagonal straw entering lips!
        targetCtx.save();
        targetCtx.translate(16, 10);
        targetCtx.rotate(-0.42);
        // Tapered cup body
        targetCtx.beginPath();
        targetCtx.moveTo(-8, -9);
        targetCtx.lineTo(8, -9);
        targetCtx.lineTo(6, 11);
        targetCtx.lineTo(-6, 11);
        targetCtx.closePath();
        targetCtx.fill();
        // Cup lid rim
        targetCtx.fillRect(-9.5, -12, 19, 2.5);
        // Hand / fingers silhouette cradling cup bottom
        targetCtx.beginPath();
        targetCtx.arc(2, 10, 4.5, -0.4, Math.PI + 0.6);
        targetCtx.fill();
        targetCtx.restore();

        // Crisp straw from tilted cup lid to lips
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 2.4;
        targetCtx.lineCap = 'round';
        targetCtx.beginPath();
        targetCtx.moveTo(12, 1);
        targetCtx.lineTo(5, 3);
        targetCtx.stroke();
        targetCtx.restore();

        targetCtx.fillStyle = '#ffffff';
        targetCtx.textAlign = 'left';
        targetCtx.font = `700 ${htM.size}px ${htFont}`;
        drawTrackedText(targetCtx, htLabel, tx, 114, htM.tracking);
        targetCtx.textAlign = 'center';
        break;
      }

      case 'zus-coffee': {
        // Authentic 1 Utama ZUS COFFEE & PASTRY (G601A): Stylized white Zeus/coffee cup emblem + bright white ZUS COFFEE & PASTRY on deep navy!
        const zusLabel = prof.displayTitle || 'ZUS COFFEE & PASTRY';
        const zusFont = '"Jost", sans-serif';
        const zusM = fitTextMetrics(targetCtx, zusLabel, maxW - 120, 48, '700', zusFont, 5, false);
        const badgeR = 33;
        const gap = 44;
        const totalW = badgeR * 2 + gap + zusM.width;
        const lx = -totalW * 0.5 + badgeR;
        const tx = lx + badgeR + gap;

        targetCtx.save();
        targetCtx.translate(lx, 96);
        targetCtx.strokeStyle = '#ffffff';
        targetCtx.lineWidth = 3.5;
        targetCtx.beginPath();
        targetCtx.arc(0, 0, badgeR, 0, Math.PI * 2);
        targetCtx.stroke();
        // Stylized white coffee cup + Zeus lightning/crown emblem inside
        targetCtx.fillStyle = '#ffffff';
        targetCtx.beginPath();
        targetCtx.moveTo(-13, -6);
        targetCtx.lineTo(13, -6);
        targetCtx.lineTo(9, 17);
        targetCtx.lineTo(-9, 17);
        targetCtx.closePath();
        targetCtx.fill();
        // Cup lid + Zeus crown/lightning crest above cup
        targetCtx.fillRect(-15, -11, 30, 3.5);
        targetCtx.beginPath();
        targetCtx.moveTo(-9, -14);
        targetCtx.lineTo(-4, -22);
        targetCtx.lineTo(0, -16);
        targetCtx.lineTo(4, -23);
        targetCtx.lineTo(9, -14);
        targetCtx.closePath();
        targetCtx.fill();
        // Lightning bolt cutout inside cup
        targetCtx.fillStyle = '#0A2240';
        targetCtx.beginPath();
        targetCtx.moveTo(2, -3);
        targetCtx.lineTo(-4, 6);
        targetCtx.lineTo(0, 6);
        targetCtx.lineTo(-2, 14);
        targetCtx.lineTo(5, 4);
        targetCtx.lineTo(1, 4);
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.restore();

        targetCtx.fillStyle = '#ffffff';
        targetCtx.textAlign = 'left';
        targetCtx.font = `700 ${zusM.size}px ${zusFont}`;
        drawTrackedText(targetCtx, zusLabel, tx, 113, zusM.tracking);
        targetCtx.textAlign = 'center';
        break;
      }

      case 'uniqlo': {
        // Authentic 1 Utama UNIQLO: Twin crisp crimson squares (UNI/QLO & ユニ/クロ) — ZERO subtitle!
        for (const [ox, l1, l2] of [[-68, 'UNI', 'QLO'], [68, 'ユニ', 'クロ']]) {
          targetCtx.fillStyle = '#dc2626';
          targetCtx.fillRect(ox - 54, 42, 108, 108);
          targetCtx.fillStyle = '#ffffff';
          targetCtx.font = '700 35px "Jost", sans-serif';
          targetCtx.fillText(l1, ox, 87);
          targetCtx.fillText(l2, ox, 132);
        }
        break;
      }

      case 'food-district': {
        // Authentic 1 Utama FOOD DISTRICT (S346-S347): Razor-crisp F [O][O] D  DISTRICT with vibrant Bauhaus circular OO icons (ZERO missing D!)
        targetCtx.fillStyle = '#0f294a';
        targetCtx.font = '800 66px "Jost", sans-serif';
        targetCtx.fillText('F', -290, 118);
        // Vibrant Bauhaus geometric O-circle emblems cleanly between F and D!
        targetCtx.fillStyle = '#0284c7';
        targetCtx.beginPath();
        targetCtx.arc(-236, 94, 24, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#d95d2b';
        targetCtx.beginPath();
        targetCtx.arc(-182, 94, 24, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#0d9488';
        targetCtx.beginPath();
        targetCtx.arc(-182, 94, 10, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#0f294a';
        targetCtx.font = '800 66px "Jost", sans-serif';
        targetCtx.fillText('D', -126, 118);
        fillAutoFitText(targetCtx, 'DISTRICT', 112, 118, maxW * 0.48, 64, '800', '"Jost", sans-serif', 9);
        break;
      }

      case 'haidilao': {
        // Authentic 1 Utama HAIDILAO: Iconic crimson rounded-square Hi badge + 海底捞 HAIDILAO
        const lx = -Math.min(maxW * 0.34, 240);
        targetCtx.fillStyle = '#dc2626';
        targetCtx.fillRect(lx - 40, 54, 80, 80);
        targetCtx.fillStyle = '#ffffff';
        targetCtx.font = '800 44px "Jost", sans-serif';
        targetCtx.fillText('Hi', lx, 110);
        targetCtx.fillStyle = isEmissive ? '#fff6e8' : '#ffffff';
        fillAutoFitText(targetCtx, '海底捞  HAIDILAO', 36, 114, maxW * 0.72, 60, '700', '"Noto Serif JP", "Jost", sans-serif', 6);
        break;
      }

      case 'starbucks-reserve': {
        // Authentic STARBUCKS RESERVE: Gold ★ / — / R emblem cleanly left of STARBUCKS RESERVE (ZERO T overlap!)
        const lx = -Math.min(maxW * 0.44, 375);
        targetCtx.fillStyle = '#d4af5e';
        targetCtx.font = '700 28px "Jost", sans-serif';
        targetCtx.fillText('★', lx, 74);
        targetCtx.fillRect(lx - 20, 84, 40, 3);
        targetCtx.font = '600 40px "Jost", sans-serif';
        targetCtx.fillText('R', lx, 128);
        targetCtx.fillStyle = isEmissive ? '#ffecd0' : '#f3e5c8';
        fillAutoFitText(targetCtx, 'STARBUCKS RESERVE', 62, 112, maxW * 0.68, 48, '600', '"Jost", sans-serif', 10);
        break;
      }

      case 'under-armour': {
        // Authentic UNDER ARMOUR interlocking top-U & bottom-inverted-A curved crest + crisp athletic wordmark!
        const uaLabel = 'UNDER ARMOUR';
        const uaFont = '"Jost", sans-serif';
        const uaM = fitTextMetrics(targetCtx, uaLabel, maxW - 124, 54, '800', uaFont, 7, false);
        const crestHalfW = 35;
        const gap = 46;
        const totalW = crestHalfW * 2 + gap + uaM.width;
        const lx = -totalW * 0.5 + crestHalfW;
        const tx = lx + crestHalfW + gap;

        targetCtx.save();
        targetCtx.translate(lx, 96);
        const bgCut = isEmissive ? '#000000' : '#262b36';

        // Helper for bottom inverted-A arch (opens downward)
        const traceBottomA = () => {
          targetCtx.beginPath();
          targetCtx.moveTo(-34, 34);
          targetCtx.bezierCurveTo(-33, 2, -18, -18, 0, -18);
          targetCtx.bezierCurveTo(18, -18, 33, 2, 34, 34);
          targetCtx.lineTo(20, 34);
          targetCtx.bezierCurveTo(19, 10, 11, -5, 0, -5);
          targetCtx.bezierCurveTo(-11, -5, -19, 10, -20, 34);
          targetCtx.closePath();
        };

        // Helper for top U arch (opens upward)
        const traceTopU = () => {
          targetCtx.beginPath();
          targetCtx.moveTo(-34, -34);
          targetCtx.bezierCurveTo(-33, -2, -18, 18, 0, 18);
          targetCtx.bezierCurveTo(18, 18, 33, -2, 34, -34);
          targetCtx.lineTo(20, -34);
          targetCtx.bezierCurveTo(19, -10, 11, 5, 0, 5);
          targetCtx.bezierCurveTo(-11, 5, -19, -10, -20, -34);
          targetCtx.closePath();
        };

        targetCtx.fillStyle = '#ffffff';
        traceBottomA();
        targetCtx.fill();

        // Crisp dark weave separation around top U before filling top U
        targetCtx.strokeStyle = bgCut;
        targetCtx.lineWidth = 4;
        targetCtx.lineJoin = 'round';
        traceTopU();
        targetCtx.stroke();

        targetCtx.fillStyle = '#ffffff';
        traceTopU();
        targetCtx.fill();
        targetCtx.restore();

        targetCtx.fillStyle = '#ffffff';
        targetCtx.textAlign = 'left';
        targetCtx.font = `800 ${uaM.size}px ${uaFont}`;
        drawTrackedText(targetCtx, uaLabel, tx, 114, uaM.tracking);
        targetCtx.textAlign = 'center';
        break;
      }

      case 'outside': {
        // Photo-matched 1 Utama S343 outside: Bold crisp white lowercase `outside` + bright YELLOW triangle dot over the `i`!
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'outsıde', 0, 118, maxW * 0.68, 76, '700', '"Jost", sans-serif', 4);
        // Signature yellow triangle dot above the `i`
        targetCtx.fillStyle = '#facc15';
        targetCtx.beginPath();
        targetCtx.moveTo(42, 62);
        targetCtx.lineTo(54, 42);
        targetCtx.lineTo(66, 62);
        targetCtx.closePath();
        targetCtx.fill();
        break;
      }

      case 'puma': {
        // Authentic 1 Utama PUMA (S345): Bold white PUMA + clean non-self-intersecting leaping PUMA cat silhouette!
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'PUMA', -42, 124, maxW * 0.50, 78, '800', '"Jost", sans-serif', 8);
        targetCtx.save();
        targetCtx.translate(154, 86);
        targetCtx.beginPath();
        targetCtx.moveTo(-48, 28); // hind paw tip
        targetCtx.quadraticCurveTo(-24, 14, -8, 6); // hind thigh & belly
        targetCtx.quadraticCurveTo(10, 2, 26, -6); // ribcage
        targetCtx.lineTo(44, -2); // outstretched forepaw
        targetCtx.lineTo(47, -8); // paw tip
        targetCtx.lineTo(31, -13); // wrist back to chest
        targetCtx.lineTo(42, -23); // muzzle
        targetCtx.lineTo(38, -29); // forehead
        targetCtx.lineTo(32, -32); // ear
        targetCtx.lineTo(25, -24); // nape
        targetCtx.quadraticCurveTo(4, -20, -16, -12); // arched muscular spine
        targetCtx.quadraticCurveTo(-36, -10, -54, -24); // sweeping upward tail top
        targetCtx.quadraticCurveTo(-56, -20, -52, -16); // tail tip
        targetCtx.quadraticCurveTo(-36, -4, -22, 0); // tail base
        targetCtx.quadraticCurveTo(-34, 10, -48, 28); // back of hind leg
        targetCtx.closePath();
        targetCtx.fill();
        targetCtx.restore();
        break;
      }

      case 'nike': {
        // Authentic NIKE Swoosh vector + condensed italic NIKE
        const lx = -135;
        targetCtx.fillStyle = '#ffffff';
        targetCtx.beginPath();
        targetCtx.moveTo(lx - 35, 84);
        targetCtx.quadraticCurveTo(lx - 48, 122, lx - 12, 116);
        targetCtx.lineTo(lx + 68, 78);
        targetCtx.lineTo(lx - 8, 102);
        targetCtx.quadraticCurveTo(lx - 26, 104, lx - 35, 84);
        targetCtx.closePath();
        targetCtx.fill();
        fillAutoFitText(targetCtx, 'NIKE', 64, 120, 260, 78, '700', '"Oswald", sans-serif', 6, true);
        break;
      }

      case 'adidas': {
        // Authentic 1 Utama adidas (LG307): Sharp dark 3-stripes mountain + crisp lowercase adidas on frosted white cube-block!
        const lx = -135;
        targetCtx.fillStyle = '#111827';
        for (let i = 0; i < 3; i++) {
          targetCtx.save();
          targetCtx.translate(lx - 24 + i * 24, 116);
          targetCtx.rotate(-0.50);
          targetCtx.fillRect(-7, -(26 + i * 16), 14, 26 + i * 16);
          targetCtx.restore();
        }
        fillAutoFitText(targetCtx, 'adidas', 58, 118, 280, 74, '700', '"Jost", sans-serif', 3);
        break;
      }

      case 'nextgen': {
        // Photo-matched 1 Utama F602-F603 NEXT GEN: Bold two-tone deep-navy/purple tubular NEXT GEN + gear accent + HAPPY MEMORIES FACTORY pill!
        targetCtx.fillStyle = '#312e81';
        fillAutoFitText(targetCtx, 'NEXT', -126, 98, 220, 74, '900', '"Montserrat", "Jost", sans-serif', 4);
        targetCtx.fillStyle = '#7c3aed';
        fillAutoFitText(targetCtx, 'GEN', 112, 98, 200, 74, '900', '"Montserrat", "Jost", sans-serif', 4);
        // Colorful tubular gear icon between NEXT and GEN
        targetCtx.strokeStyle = '#ec4899';
        targetCtx.lineWidth = 5;
        targetCtx.beginPath();
        targetCtx.arc(-4, 74, 16, 0, Math.PI * 2);
        targetCtx.stroke();
        // Rounded magenta/indigo pill for HAPPY MEMORIES FACTORY
        drawRoundRectPath(targetCtx, -195, 114, 390, 38, 19);
        targetCtx.fillStyle = '#4c1d95';
        targetCtx.fill();
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'HAPPY MEMORIES FACTORY', 0, 141, 350, 20, '700', '"Jost", sans-serif', 4);
        break;
      }

      case 'rollerwa': {
        // Photo-matched 1 Utama F603A-F613 RollerWa: Crisp pure-white cursive RollerWa on deep navy!
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'RollerWa', 0, 118, 380, 82, '700', '"Playfair Display", "Cormorant Garamond", serif', 2, true);
        break;
      }

      case 'game-on': {
        // Photo-matched 1 Utama F601 GAME ON: Bold white GAMEON with glowing orange-red joystick `O` + SPORTS HUB!
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'GAME', -110, 102, 260, 86, '900', '"Oswald", sans-serif', 6);
        // Signature orange-red circular joystick `O`
        targetCtx.fillStyle = '#ea580c';
        targetCtx.beginPath();
        targetCtx.arc(54, 72, 34, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#1b1f27';
        targetCtx.beginPath();
        targetCtx.arc(54, 72, 16, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#ffffff';
        targetCtx.beginPath();
        targetCtx.arc(54, 72, 7, 0, Math.PI * 2);
        targetCtx.fill();
        fillAutoFitText(targetCtx, 'N', 124, 102, 80, 86, '900', '"Oswald", sans-serif', 4);
        targetCtx.fillStyle = '#fb923c';
        fillAutoFitText(targetCtx, 'SPORTS HUB', 0, 146, maxW * 0.50, 26, '800', '"Jost", sans-serif', 10);
        break;
      }

      case 'bhc': {
        // Photo-matched 1 Utama G601 BHC CHICKEN: Bold dark-espresso/white `bhc CHICKEN` framed on golden-yellow mosaic fascia!
        drawRoundRectPath(targetCtx, -235, 36, 470, 112, 18);
        targetCtx.fillStyle = '#241c18';
        targetCtx.fill();
        targetCtx.fillStyle = '#facc15';
        fillAutoFitText(targetCtx, 'bhc', -112, 118, 190, 84, '900', '"Montserrat", "Jost", sans-serif', 2);
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'CHICKEN', 102, 116, 230, 56, '800', '"Jost", sans-serif', 6);
        break;
      }

      case 'modu': {
        // Photo-matched 1 Utama LG602 MODU: Refined dark-bronze MODU SAMGYETANG on smooth matte cream fascia!
        targetCtx.fillStyle = '#4a2e16';
        fillAutoFitText(targetCtx, 'MODU', 0, 92, maxW * 0.56, 72, '700', '"Cormorant Garamond", serif', 16);
        targetCtx.fillStyle = '#78502b';
        fillAutoFitText(targetCtx, 'SAMGYETANG  •  모두', 0, 136, maxW * 0.56, 24, '700', '"Jost", sans-serif', 8);
        break;
      }

      case 'windlab': {
        // Photo-matched 1 Utama S601 WINDLAB: Bold dark-charcoal WINDLAB + glowing orange turbofan ring on perforated silver!
        const lx = -196;
        targetCtx.strokeStyle = '#ea580c';
        targetCtx.lineWidth = 7;
        targetCtx.beginPath();
        targetCtx.arc(lx, 94, 30, 0, Math.PI * 2);
        targetCtx.stroke();
        targetCtx.beginPath();
        targetCtx.arc(lx, 94, 15, 0.5, Math.PI * 1.9);
        targetCtx.stroke();
        targetCtx.fillStyle = '#14181f';
        fillAutoFitText(targetCtx, 'WINDLAB', 40, 114, maxW * 0.64, 72, '800', '"Jost", sans-serif', 12);
        break;
      }

      case 'pjpac': {
        // Photo-matched 1 Utama S611 PJPAC: Giant white-faced/yellow-extruded PJPAC on golden-marigold portal arch!
        targetCtx.fillStyle = 'rgba(146, 64, 14, 0.42)';
        fillAutoFitText(targetCtx, 'PJPAC', 6, 102, maxW * 0.58, 96, '800', '"Jost", sans-serif', 16);
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'PJPAC', 0, 96, maxW * 0.58, 96, '800', '"Jost", sans-serif', 16);
        targetCtx.fillStyle = '#78350f';
        fillAutoFitText(targetCtx, 'PETALING JAYA PERFORMING ARTS CENTRE', 0, 140, maxW * 0.72, 22, '800', '"Jost", sans-serif', 6);
        break;
      }

      case 'coach': {
        // Photo-matched 1 Utama G309 COACH: Clean bold white COACH positioned left-of-center beside amber glass blocks!
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'COACH', -160, 110, maxW * 0.44, 74, '700', '"Cormorant Garamond", serif', 16);
        targetCtx.fillStyle = '#d4a656';
        fillAutoFitText(targetCtx, 'NEW YORK', -160, 146, maxW * 0.28, 22, '600', '"Jost", sans-serif', 10);
        break;
      }

      case 'wangsa-bowl': {
        // Authentic 1 Utama WANGSA BOWL: Clean modern bowling-ball crest (well clear of W!) + bold athletic condensed WANGSA BOWL!
        const lx = -Math.min(maxW * 0.40, 290);
        targetCtx.fillStyle = '#38bdf8';
        targetCtx.beginPath();
        targetCtx.arc(lx, 96, 28, 0, Math.PI * 2);
        targetCtx.fill();
        targetCtx.fillStyle = '#11182b';
        for (const [dx, dy] of [[-7, -7], [6, -9], [0, 4]]) {
          targetCtx.beginPath();
          targetCtx.arc(lx + dx, 96 + dy, 4.2, 0, Math.PI * 2);
          targetCtx.fill();
        }
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'WANGSA BOWL', 46, 116, maxW * 0.66, 62, '700', '"Oswald", sans-serif', 9);
        break;
      }

      case 'aeon': {
        // Authentic Malaysian AEON magenta logotype
        targetCtx.fillStyle = '#b81d77';
        fillAutoFitText(targetCtx, 'AEON', 0, 122, maxW * 0.56, 84, '700', '"Jost", sans-serif', 20);
        break;
      }

      case 'muji': {
        // Authentic MUJI burgundy square + 無印良品
        const lx = -175;
        targetCtx.fillStyle = '#7f1d1d';
        targetCtx.fillRect(lx - 42, 54, 84, 84);
        targetCtx.fillStyle = '#ffffff';
        targetCtx.font = '700 26px "Jost", sans-serif';
        targetCtx.fillText('MUJI', lx, 105);
        targetCtx.fillStyle = '#7f1d1d';
        fillAutoFitText(targetCtx, '無印良品', 48, 114, 340, 56, '600', '"Noto Serif JP", serif', 10);
        break;
      }

      case 'gsc': {
        targetCtx.fillStyle = '#facc15';
        fillAutoFitText(targetCtx, 'GSC', -130, 124, 220, 88, '800', '"Jost", sans-serif', 8);
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'GOLDEN SCREEN CINEMAS', 120, 114, 380, 34, '500', '"Jost", sans-serif', 8);
        break;
      }

      case 'tgv': {
        targetCtx.fillStyle = '#e11d48';
        fillAutoFitText(targetCtx, 'TGV', -120, 124, 220, 88, '800', '"Jost", sans-serif', 8);
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'IMAX  •  CINEMAS', 120, 114, 340, 36, '500', '"Jost", sans-serif', 10);
        break;
      }

      case 'pop-mart': {
        // Photo-matched 1 Utama S333 POP MART: Bold crisp white POP MART glowing on vibrant lime-yellow crown surround!
        targetCtx.fillStyle = isEmissive ? '#ffffff' : 'rgba(92, 108, 8, 0.32)';
        fillAutoFitText(targetCtx, 'POP MART', 4, 122, 420, 86, '900', '"Oswald", sans-serif', 10);
        targetCtx.fillStyle = '#ffffff';
        fillAutoFitText(targetCtx, 'POP MART', 0, 118, 420, 86, '900', '"Oswald", sans-serif', 10);
        break;
      }

      case 'chanel': {
        // Photo-matched 1 Utama G330 CHANEL: Crisp jet-black CHANEL shifted right-of-center on warm ivory (glowing CC plaque goes on left black frame!)
        const ink = isEmissive ? '#000000' : '#08080a';
        targetCtx.fillStyle = ink;
        fillAutoFitText(targetCtx, 'CHANEL', 96, 118, 360, 68, '600', '"Jost", sans-serif', 24);
        break;
      }

      default: {
        // Pure clean real-mall architectural signage — ONLY the crisp brand wordmark, ZERO fake subtitles!
        if (!isEmissive && !prof.isLight) {
          targetCtx.shadowColor = 'rgba(0,0,0,0.55)';
          targetCtx.shadowBlur = 8;
          targetCtx.shadowOffsetY = 3;
        }
        targetCtx.fillStyle = isEmissive ? emissiveTextCol : fgCol;
        fillAutoFitText(
          targetCtx,
          prof.displayTitle,
          0,
          116,
          maxW * 0.86,
          prof.facadeType === 'luxury-fashion' ? 60 : 66,
          prof.weight,
          prof.fontFamily,
          prof.tracking,
          prof.italic
        );
        targetCtx.shadowBlur = 0;
        targetCtx.shadowOffsetY = 0;
        break;
      }
    }
    targetCtx.restore();
  };

  drawAuthenticBrand(ctx, false);
  drawAuthenticBrand(ctxE, true);

  const out = {
    map: finalizeTexture(cA, { srgb: true }),
    emissiveMap: finalizeTexture(cE, { srgb: true })
  };
  fasciaCache.set(store.id, out);
  return out;
}

/**
 * Photorealistic Architectural Real 1 Utama Store Interior Panorama Texture (1024x512)
 * Projected cleanly onto ALL 3 interior walls (back, left, right) of a wide-open continuous 3D store room!
 * ZERO flat neon MS-Paint color blocks — real recessed shelf lighting, muted luxury/editorial palettes & depth!
 */
const interiorBackCache = new Map();
export function createStoreInteriorBackwallTexture(store) {
  const uName = (store.name || '').toUpperCase();
  const prof = getStoreBrandProfile(store);
  const st = store.style || 'fashion';

  let key = `int-${prof.facadeType}-${prof.isLight ? 'L' : 'D'}`;
  if (uName.includes('JAYA GROCER')) key = 'int-jaya-grocer';
  else if (uName.includes('MINISO')) key = 'int-miniso';
  else if (uName.includes('TEH TARIK') || uName.includes('ORIENTAL KOPI')) key = 'int-teh-tarik';
  else if (uName.includes('IPPUDO')) key = 'int-ippudo';
  else if (uName.includes('MODU')) key = 'int-modu';
  else if (uName.includes('BHC')) key = 'int-bhc';
  else if (uName.includes('STARBUCKS')) key = 'int-starbucks';
  else if (uName.includes('HEYTEA')) key = 'int-heytea';
  else if (uName.includes('CHANEL')) key = 'int-chanel';
  else if (uName.includes('COACH')) key = 'int-coach';
  else if (uName.includes('ZARA')) key = 'int-zara';
  else if (uName.includes('ROLLERWA')) key = 'int-rollerwa';
  else if (uName.includes('NEXT GEN') || uName.includes('NEXTGEN')) key = 'int-nextgen';
  else if (uName.includes('GAME ON')) key = 'int-gameon';
  else if (uName.includes('PJPAC')) key = 'int-pjpac';
  else if (uName.includes('OUTSIDE') || uName.includes('NORTH FACE')) key = 'int-outside';
  else if (uName.includes('PUMA')) key = 'int-puma';
  else if (uName.includes('UNDER ARMOUR')) key = 'int-under-armour';
  else if (uName.includes('ADIDAS')) key = 'int-adidas';
  else if (uName.includes('DIN TAI FUNG')) key = 'int-dintaifung';
  else if (uName.includes('MADAM KWAN')) key = 'int-madamkwans';
  else if (uName.includes('CHILI')) key = 'int-chilis';
  else if (uName.includes('CELLINI') || uName.includes('STANZO') || uName.includes('XZQT')) key = 'int-cellini';
  else if (uName.includes('TAISHI') || uName.includes('TOY CATCHER')) key = 'int-taishi';
  else if (uName.includes('FOOD DISTRICT')) key = 'int-food-district';
  else if (uName.includes('KYOCHON')) key = 'int-kyochon';
  else if (uName.includes('SEPHORA') || st === 'sephora') key = 'int-sephora';
  else if (uName.includes('MR. D.I.Y') || uName.includes('MR DIY')) key = 'int-mrdiy';
  else if (uName.includes('POP MART')) key = 'int-popmart';
  else if (uName.includes('TOP TOY')) key = 'int-toptoy';
  else if (uName.includes('UNIQLO')) key = 'int-uniqlo';
  else if (uName.includes('PARKSON')) key = 'int-parkson';
  else if (uName.includes('TOMMY')) key = 'int-tommy';
  else if (uName.includes('NIKE') || st === 'sports') key = 'int-sports';
  else if (st === 'tech') key = 'int-tech';
  else if (st === 'furniture') key = 'int-furniture';
  else if (st === 'toys') key = 'int-toys-bright';
  else if (prof.facadeType === 'cafe-patisserie') key = 'int-cafe';
  else if (st === 'cinema' || st === 'arcade') key = 'int-cinema';

  if (interiorBackCache.has(key)) return interiorBackCache.get(key);

  const W = 1024;
  const H = 512;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  const fillWall = (topCol, botCol) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, topCol);
    g.addColorStop(1, botCol);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };

  // Helper: photorealistic illuminated recessed architectural niche with soft cast shelf shadows & muted curated items
  const drawLitNiche = (nx, ny, nw, nh, wallCol, shelfCol, itemPal, rows = 4) => {
    // Deep recessed niche shadow
    ctx.fillStyle = 'rgba(10, 12, 16, 0.42)';
    ctx.fillRect(nx - 6, ny - 6, nw + 12, nh + 12);
    const ng = ctx.createLinearGradient(nx, ny, nx, ny + nh);
    ng.addColorStop(0, '#fff7e6');
    ng.addColorStop(0.14, wallCol);
    ng.addColorStop(1, '#1b1d22');
    ctx.fillStyle = ng;
    ctx.fillRect(nx, ny, nw, nh);

    const rowH = nh / (rows + 0.5);
    for (let r = 1; r <= rows; r++) {
      const sy = ny + r * rowH;
      // Warm under-shelf indirect LED glow
      const lg = ctx.createLinearGradient(nx, sy, nx, sy + 22);
      lg.addColorStop(0, 'rgba(255, 234, 194, 0.36)');
      lg.addColorStop(1, 'rgba(255, 234, 194, 0.0)');
      ctx.fillStyle = lg;
      ctx.fillRect(nx + 4, sy + 5, nw - 8, 20);

      // Sleek architectural shelf ledge
      ctx.fillStyle = shelfCol;
      ctx.fillRect(nx + 4, sy, nw - 8, 6);

      // Subtle curated products / folded garments / amber skincare bottles (muted real tones, ZERO neon squares!)
      const cols = Math.max(3, Math.floor((nw - 24) / 26));
      for (let i = 0; i < cols; i++) {
        if (hash2(nx + i * 7, r * 13) < 0.22) continue;
        const ix = nx + 14 + i * ((nw - 28) / cols);
        const iw = 10 + hash2(i, r + nx) * 10;
        const ih = 14 + hash2(r, i + ny) * Math.min(24, rowH * 0.48);
        ctx.fillStyle = itemPal[(i + r + Math.floor(nx)) % itemPal.length];
        ctx.fillRect(ix, sy - ih, iw, ih);
        // Subtle specular highlight on bottle/box edge
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(ix + 1, sy - ih + 1, 2, ih - 2);
      }
    }
  };

  if (key === 'int-miniso') {
    // AUTHENTIC 1 UTAMA MINISO "ALL-PINK" IP FLAGSHIP INTERIOR (Soft pastel pink & glossy white shelving packed with plushies!)
    fillWall('#fdf2f8', '#fce7f3');
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(0, 0, W, 62);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'MINISO  •  ALL-PINK IP FLAGSHIP  •  SANRIO  •  DISNEY  •  PLUSHIES', W * 0.5, 42, W - 80, 20, '700', '"Jost", sans-serif', 4);
    const minisoPal = ['#f472b6', '#93c5fd', '#fde047', '#86efac', '#d8b4fe', '#fda4af', '#ffffff'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(22 + b * 250, 78, 224, 316, '#fff1f7', '#f9a8d4', minisoPal, 5);
    }
    ctx.fillStyle = '#fbcfe8';
    ctx.fillRect(0, 412, W, 100);
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(0, 408, W, 6);
  } else if (key === 'int-teh-tarik') {
    // AUTHENTIC TEH TARIK CLUB MALAYSIAN KOPITIAM: Heritage emerald metro tiles, warm teak, brass menu boards & golden pastries!
    fillWall('#144a38', '#0d3226');
    for (let row = 0; row < 12; row++) {
      for (let col = 0; col < 24; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(34, 128, 92, 0.34)' : 'rgba(20, 96, 70, 0.34)';
        ctx.fillRect(col * 43 + (row % 2) * 20, 220 + row * 24, 40, 21);
      }
    }
    const okMenus = ['SIGNATURE TEH TARIK', 'NASI LEMAK AYAM', 'ROTI BAKAR KAYA', 'IPOH WHITE COFFEE'];
    for (let m = 0; m < 4; m++) {
      const mx = 18 + m * 250;
      ctx.fillStyle = '#241811';
      ctx.fillRect(mx, 44, 226, 152);
      ctx.strokeStyle = '#d4af5e';
      ctx.lineWidth = 3;
      ctx.strokeRect(mx, 44, 226, 152);
      ctx.fillStyle = '#fce8be';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, okMenus[m], mx + 113, 104, 198, 19, '700', '"Playfair Display", serif', 2);
      const glowD = ctx.createRadialGradient(mx + 113, 152, 4, mx + 113, 152, 42);
      glowD.addColorStop(0, 'rgba(245, 185, 78, 0.72)');
      glowD.addColorStop(1, 'rgba(36, 24, 17, 0.0)');
      ctx.fillStyle = glowD;
      ctx.fillRect(mx + 16, 118, 194, 72);
    }
    ctx.fillStyle = '#5c3820';
    ctx.fillRect(0, 356, W, 156);
    ctx.fillStyle = '#e8dfd0';
    ctx.fillRect(0, 344, W, 14);
  } else if (key === 'int-starbucks') {
    // AUTHENTIC 1 UTAMA STARBUCKS RESERVE (G139B-D): Dark smoked-walnut & brushed-brass Reserve Roastery origin menu boards (ZERO Come True Cafe clone!)
    fillWall('#2b221c', '#1c1510');
    for (let x = 0; x < W; x += 18) {
      ctx.fillStyle = x % 36 === 0 ? 'rgba(92, 66, 44, 0.35)' : 'rgba(24, 16, 12, 0.25)';
      ctx.fillRect(x, 0, 10, H);
    }
    const sbOrigins = [
      { title: '★ R  SUMATRA KERINCI', sub: 'Herbal Spice • Dark Cacao • Pour-Over' },
      { title: '★ R  ETHIOPIA YIRGACHEFFE', sub: 'Jasmine Blossom • Bergamot • Chemex' },
      { title: '★ R  COLD BREW MALT', sub: 'Small-Lot Nitro • Madagascar Vanilla' },
      { title: '★ R  ESPRESSO FLIGHT', sub: 'Black Eagle Pull • Micro-Lot Roast' }
    ];
    for (let m = 0; m < 4; m++) {
      const mx = 20 + m * 248;
      ctx.fillStyle = '#181412';
      ctx.fillRect(mx, 44, 224, 178);
      ctx.strokeStyle = '#c89e54';
      ctx.lineWidth = 3;
      ctx.strokeRect(mx, 44, 224, 178);
      ctx.fillStyle = '#e8c47a';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, sbOrigins[m].title, mx + 112, 98, 200, 17, '700', '"Jost", sans-serif', 2);
      ctx.fillStyle = '#d6cfc4';
      fillAutoFitText(ctx, sbOrigins[m].sub, mx + 112, 138, 198, 13, '500', '"Montserrat", sans-serif', 1);
      // Warm copper roaster highlight band
      const cg = ctx.createLinearGradient(mx + 24, 168, mx + 200, 168);
      cg.addColorStop(0, '#5c3416');
      cg.addColorStop(0.5, '#d49a52');
      cg.addColorStop(1, '#5c3416');
      ctx.fillStyle = cg;
      ctx.fillRect(mx + 28, 172, 168, 6);
    }
    // Lower sage-green fluted dado & warm oak retail bean shelf
    ctx.fillStyle = '#4e685a';
    ctx.fillRect(0, 268, W, 118);
    for (let sx = 0; sx < W; sx += 16) {
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(sx, 268, 5, 118);
    }
    ctx.fillStyle = '#5c3d26';
    ctx.fillRect(0, 386, W, 126);
  } else if (key === 'int-bhc') {
    // AUTHENTIC 1 UTAMA BHC CHICKEN KOREAN BISTRO: Glossy yellow/white subway tiles + appetizing illustrated crispy chimaek menu boards!
    fillWall('#fffaf0', '#f4ebd0');
    for (let r = 0; r < 14; r++) {
      for (let c = 0; c < 20; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? 'rgba(244, 180, 0, 0.16)' : 'rgba(255, 255, 255, 0.45)';
        ctx.fillRect(c * 52, r * 36, 48, 32);
      }
    }
    const bhcMenus = [
      { t: 'BBURINKLE 치킨', p: 'RM 36.90 • Cheese Dust Crispy' },
      { t: 'MACHO KING', p: 'RM 35.90 • Aged Soy & Honey' },
      { t: 'GOLD KING', p: 'RM 34.90 • Garlic Soy Glaze' },
      { t: 'CHEESE BALLS', p: 'RM 16.90 • Melted Mozzarella' }
    ];
    for (let m = 0; m < 4; m++) {
      const mx = 18 + m * 250;
      ctx.fillStyle = '#1b1d22';
      ctx.fillRect(mx, 36, 226, 210);
      ctx.strokeStyle = '#f4b400';
      ctx.lineWidth = 4;
      ctx.strokeRect(mx, 36, 226, 210);
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, bhcMenus[m].t, mx + 113, 74, 200, 20, '800', '"Jost", sans-serif', 2);
      ctx.fillStyle = '#e5e7eb';
      fillAutoFitText(ctx, bhcMenus[m].p, mx + 113, 98, 200, 12, '600', '"Montserrat", sans-serif', 1);
      // Warm culinary lighting tray + layered crispy golden drumsticks/cheese balls with highlights & herbs (ZERO flat single orange circle!)
      const plG = ctx.createRadialGradient(mx + 113, 174, 10, mx + 113, 174, 68);
      plG.addColorStop(0, 'rgba(255, 214, 128, 0.48)');
      plG.addColorStop(1, 'rgba(27, 29, 34, 0)');
      ctx.fillStyle = plG;
      ctx.fillRect(mx + 14, 112, 198, 120);
      // Dark ceramic platter oval
      ctx.fillStyle = '#2d2926';
      ctx.beginPath();
      ctx.ellipse(mx + 113, 184, 72, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      // 7 overlapping golden-brown crispy chicken pieces with warm glaze highlights & parsley flecks
      for (let cp = 0; cp < 7; cp++) {
        const ox = (cp - 3) * 16 + ((cp % 2) * 5 - 2);
        const oy = -8 + (cp % 3) * 8;
        ctx.fillStyle = cp % 2 === 0 ? '#c86c16' : '#df8922';
        ctx.beginPath();
        ctx.ellipse(mx + 113 + ox, 178 + oy, 18, 12, (cp - 3) * 0.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde68a';
        ctx.beginPath();
        ctx.ellipse(mx + 110 + ox, 174 + oy, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#22c55e';
      for (let g = -2; g <= 2; g++) ctx.fillRect(mx + 113 + g * 18, 172 + (g % 2) * 8, 5, 3);
    }
    ctx.fillStyle = '#a8703c';
    ctx.fillRect(0, 348, W, 164);
  } else if (key === 'int-modu') {
    // AUTHENTIC SERENE KOREAN HANOK MODU SAMGYETANG DINING ROOM: Warm backlit translucent hanji shoji screens + stoneware ttukbaegi display shelves!
    fillWall('#f6efe2', '#e4d6be');
    for (let s = 0; s < 3; s++) {
      const sx = 46 + s * 326;
      const hanjiG = ctx.createRadialGradient(sx + 138, 175, 18, sx + 138, 175, 165);
      hanjiG.addColorStop(0, '#fffbf0');
      hanjiG.addColorStop(1, '#ede1ca');
      ctx.fillStyle = hanjiG;
      ctx.fillRect(sx, 44, 276, 250);
      ctx.strokeStyle = '#9b6e3e';
      ctx.lineWidth = 4;
      ctx.strokeRect(sx, 44, 276, 250);
      ctx.lineWidth = 2.5;
      for (let gx = sx + 34; gx < sx + 276; gx += 34) {
        ctx.beginPath();
        ctx.moveTo(gx, 44);
        ctx.lineTo(gx, 294);
        ctx.stroke();
      }
      for (let gy = 94; gy < 294; gy += 50) {
        ctx.beginPath();
        ctx.moveTo(sx, gy);
        ctx.lineTo(sx + 276, gy);
        ctx.stroke();
      }
      // Subtle ceramic celadon & dark ttukbaegi pot niche below screen
      ctx.fillStyle = '#5c4028';
      ctx.fillRect(sx + 16, 308, 244, 8);
      for (let p = 0; p < 3; p++) {
        ctx.fillStyle = p === 1 ? '#292524' : '#7b8c7c';
        ctx.beginPath();
        ctx.ellipse(sx + 68 + p * 70, 332, 22, 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#5c3a1c';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, s === 0 ? '모두 삼계탕' : s === 1 ? 'PERILLA SAMGYETANG' : 'GINSENG HERBAL BROTH', sx + 138, 368, 250, 18, '700', '"Cormorant Garamond", serif', 2);
    }
    ctx.fillStyle = '#b48a56';
    ctx.fillRect(0, 392, W, 120);
  } else if (key === 'int-heytea') {
    // AUTHENTIC 1 UTAMA HEYTEA MINIMALIST ZEN TEA BAR (ZERO coffee/croissant menu!)
    fillWall('#eceef2', '#d4d8df');
    const htItems = ['SUCCULENT GRAPE CHEEZO 多肉葡萄', 'ROASTED BROWN BOBO MILK 烤黑糖波波', 'CRISP GRAPE BOOM', 'CLOUD MATCHA LATTE'];
    ctx.fillStyle = '#1d2026';
    ctx.fillRect(42, 48, 430, 210);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(42, 48, 430, 210);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    for (let i = 0; i < 4; i++) {
      fillAutoFitText(ctx, htItems[i], 64, 96 + i * 42, 386, 16, '700', '"Jost", sans-serif', 2);
    }
    drawLitNiche(516, 48, 464, 210, '#f4f6f9', '#64748b', ['#7c3aed', '#16a34a', '#b45309', '#f472b6', '#e2e8f0'], 2);
    ctx.fillStyle = '#d8dde6';
    ctx.fillRect(0, 314, W, 198);
  } else if (key === 'int-chanel') {
    // AUTHENTIC 1 UTAMA CHANEL G330 MONOCHROME FRAGRANCE & BEAUTY BOUTIQUE (White backlit niches + golden N°5 flacons!)
    fillWall('#f6f7f9', '#e5e7eb');
    for (let b = 0; b < 4; b++) {
      const bx = 24 + b * 248;
      ctx.fillStyle = '#111215';
      ctx.fillRect(bx, 40, 224, 344);
      drawLitNiche(bx + 14, 56, 196, 312, '#ffffff', '#111215', ['#e5be67', '#f0d89a', '#18181b', '#d4af37', '#f5e8c8'], 4);
    }
    ctx.fillStyle = '#121317';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-coach') {
    // AUTHENTIC 1 UTAMA COACH G309 WARM WALNUT & CREAM LEATHER GALLERY (Curated saddle-tan, espresso & chalk leather bags!)
    fillWall('#efe6d8', '#d8cab6');
    const coachPal = ['#8b4e24', '#3b2416', '#f2ece4', '#6b1d22', '#1c1917', '#b8864b'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(24 + b * 248, 44, 224, 344, '#e6dac8', '#5c3c22', coachPal, 4);
    }
    ctx.fillStyle = '#785436';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-zara') {
    // AUTHENTIC 1 UTAMA ZARA G319 MINIMALIST TRAVERTINE & MONOCHROME FASHION GALLERY!
    fillWall('#ece6dc', '#d4ccbe');
    const zaraPal = ['#1c1b1a', '#f5f2ec', '#9e8f7b', '#3d3935', '#cfc7ba'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(24 + b * 248, 44, 224, 344, '#e4ddd2', '#262422', zaraPal, 3);
    }
    ctx.fillStyle = '#cdc5b8';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-rollerwa') {
    // AUTHENTIC 1 UTAMA ROLLERWA RETRO K-POP NEON QUAD-SKATE BAY & ILLUMINATED SKATING RINK!
    fillWall('#161f4a', '#0c1028');
    // Disco spotlight cones sweeping across interior rink
    for (let sc = 0; sc < 4; sc++) {
      const sg = ctx.createRadialGradient(140 + sc * 250, 40, 10, 140 + sc * 250, 260, 220);
      sg.addColorStop(0, sc % 2 === 0 ? 'rgba(255, 77, 166, 0.42)' : 'rgba(56, 189, 248, 0.38)');
      sg.addColorStop(1, 'rgba(12, 16, 40, 0)');
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, 380);
    }
    ctx.fillStyle = '#ff4da6';
    ctx.fillRect(36, 36, W - 72, 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(36, 380, W - 72, 8);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, '롤러와  •  ROLLERWA K-POP NEON SKATING RINK', W * 0.5, 86, W - 120, 30, '800', '"Jost", sans-serif', 4);
    // Backlit quad-skate cubby shelves with sculpted skate silhouettes (ZERO tiny Atari dots!)
    const skateCols = ['#ff4da6', '#38bdf8', '#facc15', '#ffffff'];
    for (let b = 0; b < 4; b++) {
      const bx = 36 + b * 244;
      ctx.fillStyle = 'rgba(20, 30, 68, 0.88)';
      ctx.fillRect(bx, 114, 214, 242);
      ctx.strokeStyle = b % 2 === 0 ? '#ff4da6' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, 114, 214, 242);
      for (let r = 0; r < 3; r++) {
        const sy = 178 + r * 72;
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(bx + 12, sy, 190, 4);
        for (let k = 0; k < 3; k++) {
          const kx = bx + 42 + k * 64;
          // Recognizable retro quad skate boot + glowing wheels!
          ctx.fillStyle = skateCols[(b + r + k) % skateCols.length];
          ctx.fillRect(kx - 14, sy - 34, 16, 26);
          ctx.fillRect(kx - 14, sy - 16, 30, 10);
          ctx.fillStyle = '#ff4da6';
          ctx.beginPath();
          ctx.arc(kx - 8, sy - 3, 4.5, 0, Math.PI * 2);
          ctx.arc(kx + 10, sy - 3, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    ctx.fillStyle = '#241e58';
    ctx.fillRect(0, 392, W, 120);
  } else if (key === 'int-nextgen') {
    // AUTHENTIC 1 UTAMA NEXT GEN HAPPY MEMORIES FACTORY: Vibrant climbing wall panels, indoor slide tubes & playful glowing zone graphics!
    fillWall('#fdf9f5', '#efeaf8');
    const ngCols = ['#ec4899', '#f97316', '#facc15', '#22c55e', '#38bdf8', '#8b5cf6'];
    // Left climbing wall with colorful polygonal holds!
    ctx.fillStyle = '#f4f0e8';
    ctx.fillRect(28, 96, 290, 286);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 5;
    ctx.strokeRect(28, 96, 290, 286);
    for (let h = 0; h < 28; h++) {
      ctx.fillStyle = ngCols[h % ngCols.length];
      ctx.beginPath();
      ctx.arc(58 + (h % 6) * 44, 126 + Math.floor(h / 6) * 52 + (h % 2) * 14, 9, 0, Math.PI * 2);
      ctx.fill();
    }
    // Center rainbow play-park gateway + glowing slide tube!
    for (let r = 0; r < 5; r++) {
      ctx.strokeStyle = ngCols[r];
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(512, 340, 152 - r * 18, Math.PI, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#fff9f0';
    ctx.beginPath();
    ctx.arc(512, 340, 62, Math.PI, 0);
    ctx.fill();
    // Right neon arcade & ninja course zone!
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(706, 96, 290, 286);
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 5;
    ctx.strokeRect(706, 96, 290, 286);
    for (let c = 0; c < 3; c++) {
      ctx.fillStyle = ngCols[(c + 2) % ngCols.length];
      ctx.fillRect(732 + c * 84, 146, 64, 118);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(740 + c * 84, 158, 48, 52);
    }
    ctx.fillStyle = '#1e1b4b';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'NEXT GEN  •  CLIMBING  •  SLIDES  •  NINJA  •  FAMILY PLAY', W * 0.5, 64, W - 80, 26, '800', '"Jost", sans-serif', 4);
    ctx.fillStyle = '#f4f0e8';
    ctx.fillRect(0, 396, W, 116);
  } else if (key === 'int-gameon') {
    // AUTHENTIC 1 UTAMA GAME ON SPORTS HUB: Vivid neon PS5 pods, mini-golf neon arches, ninja trusses & electric-orange interior floor!
    fillWall('#181c2c', '#0e111b');
    const zones = [
      { label: 'MINI GOLF', c: '#facc15', bg: '#163626' },
      { label: 'PS5 ARENA', c: '#38bdf8', bg: '#14244a' },
      { label: 'KARAOKE PODS', c: '#f472b6', bg: '#38163a' },
      { label: 'NINJA ZONE', c: '#f97316', bg: '#3b1d12' }
    ];
    for (let b = 0; b < 4; b++) {
      const bx = 28 + b * 246;
      const z = zones[b];
      const zg = ctx.createLinearGradient(bx, 50, bx, 366);
      zg.addColorStop(0, z.bg);
      zg.addColorStop(1, '#10141f');
      ctx.fillStyle = zg;
      ctx.fillRect(bx, 50, 218, 316);
      ctx.strokeStyle = z.c;
      ctx.lineWidth = 6;
      ctx.strokeRect(bx, 50, 218, 316);
      // Dynamic sports/arcade backlit graphics inside each zone bay (ZERO empty gray outline boxes!)
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 3;
      for (let l = 0; l < 5; l++) {
        ctx.beginPath();
        ctx.moveTo(bx + 18, 168 + l * 36);
        ctx.lineTo(bx + 200, 148 + l * 36);
        ctx.stroke();
      }
      ctx.fillStyle = z.c;
      ctx.globalAlpha = 0.24;
      ctx.beginPath();
      ctx.arc(bx + 109, 240, 56, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, z.label, bx + 109, 114, 192, 24, '800', '"Oswald", sans-serif', 4);
      ctx.fillStyle = z.c;
      fillAutoFitText(ctx, 'NOW OPEN • LEVEL 1F', bx + 109, 342, 180, 13, '700', '"Jost", sans-serif', 2);
    }
    ctx.fillStyle = '#dc5214';
    ctx.fillRect(0, 396, W, 116);
  } else if (key === 'int-pjpac') {
    // AUTHENTIC 1 UTAMA PJPAC WARM FLUTED-OAK & GOLD PERFORMING ARTS THEATRE FOYER + ILLUSTRATED LIVE SHOW POSTERS!
    fillWall('#4a3222', '#261810');
    for (let x = 0; x < W; x += 20) {
      ctx.fillStyle = 'rgba(218, 174, 96, 0.20)';
      ctx.fillRect(x, 0, 8, H);
    }
    const shows = [
      { t: 'STAGE 1 THEATRE', s: 'BROADWAY MUSICALS', c1: '#7f1d1d', c2: '#fbbf24' },
      { t: 'SYMPHONY GALA', s: 'PHILHARMONIC LIVE', c1: '#1e1b4b', c2: '#38bdf8' },
      { t: 'NERO EVENT SPACE', s: 'CONTEMPORARY ARTS', c1: '#3b0764', c2: '#f472b6' },
      { t: 'ONE TIX LIVE', s: 'BOOK SHOWS NOW', c1: '#14532d', c2: '#fde047' }
    ];
    for (let p = 0; p < 4; p++) {
      const px = 32 + p * 246;
      const sh = shows[p];
      const pg = ctx.createLinearGradient(px, 50, px, 358);
      pg.addColorStop(0, sh.c1);
      pg.addColorStop(1, '#111014');
      ctx.fillStyle = pg;
      ctx.fillRect(px, 50, 210, 308);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.strokeRect(px, 50, 210, 308);
      // Theatrical spotlight beam & stage curtain motif inside each musical poster!
      const beam = ctx.createRadialGradient(px + 105, 165, 6, px + 105, 165, 92);
      beam.addColorStop(0, sh.c2);
      beam.addColorStop(0.4, 'rgba(255,255,255,0.18)');
      beam.addColorStop(1, 'rgba(17,16,20,0)');
      ctx.fillStyle = beam;
      ctx.fillRect(px + 6, 56, 198, 220);
      // Velvet theatre arch silhouette
      ctx.strokeStyle = sh.c2;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px + 105, 224, 62, Math.PI, 0);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, sh.t, px + 105, 298, 188, 19, '800', '"Jost", sans-serif', 2);
      ctx.fillStyle = sh.c2;
      fillAutoFitText(ctx, sh.s, px + 105, 330, 188, 13, '700', '"Montserrat", sans-serif', 2);
    }
    ctx.fillStyle = '#6c492d';
    ctx.fillRect(0, 392, W, 120);
  } else if (key === 'int-outside') {
    // AUTHENTIC 1 UTAMA outside (S343) OUTDOOR EXPEDITION GEAR FLAGSHIP: Natural birch slatwall, pitched camp-tent display, hanging jackets & backpacks (ZERO library bookshelves!)
    fillWall('#decbb0', '#bfa888');
    for (let x = 0; x < W; x += 24) {
      ctx.fillStyle = 'rgba(104, 78, 52, 0.14)';
      ctx.fillRect(x, 0, 4, H);
    }
    // Mountain contour expedition header mural
    ctx.fillStyle = '#2d4a3a';
    ctx.beginPath();
    ctx.moveTo(0, 170);
    ctx.lineTo(180, 62);
    ctx.lineTo(360, 152);
    ctx.lineTo(580, 48);
    ctx.lineTo(800, 148);
    ctx.lineTo(1024, 74);
    ctx.lineTo(1024, 190);
    ctx.lineTo(0, 190);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'outside  •  PATAGONIA  •  KEEN  •  SNOW PEAK  •  CAMPING', W * 0.5, 134, W - 90, 26, '700', '"Jost", sans-serif', 4);
    // 3 Curated Outdoor Gear Apparel & Backpack Display Bays
    const gearCols = ['#2d5a3c', '#c27824', '#1e3a5f', '#9a3412', '#d6c8b2'];
    for (let b = 0; b < 3; b++) {
      const bx = 42 + b * 324;
      ctx.fillStyle = '#cbb798';
      ctx.fillRect(bx, 208, 290, 178);
      ctx.strokeStyle = '#3b3f44';
      ctx.lineWidth = 4;
      ctx.strokeRect(bx, 208, 290, 178);
      // Hanging outdoor shell jackets & hiking packs silhouettes
      for (let k = 0; k < 4; k++) {
        ctx.fillStyle = gearCols[(b + k) % gearCols.length];
        ctx.fillRect(bx + 24 + k * 64, 240, 46, 94);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fillRect(bx + 44 + k * 64, 240, 4, 94);
      }
    }
    ctx.fillStyle = '#9a7852';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-puma' || key === 'int-under-armour' || key === 'int-adidas') {
    // BRAND-DISTINCT ATHLETIC FLAGSHIP INTERIORS (ZERO cloned "ENGINEERED FOR MOTION" sticker!)
    const isAd = key === 'int-adidas';
    const isPumaKey = key === 'int-puma';
    fillWall(isAd ? '#eceef2' : '#242934', isAd ? '#d6dce4' : '#161a22');
    const brandTag = isAd ? 'ORIGINALS  •  RUNNING  •  FOOTBALL' : isPumaKey ? 'FOREVER FASTER  •  NITRO  •  MOTORSPORT' : 'PROTECT THIS HOUSE  •  UA FLOW  •  TRAINING';
    ctx.fillStyle = isAd ? '#111827' : '#dc2626';
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, brandTag, W * 0.5, 38, W - 80, 20, '800', '"Jost", sans-serif', 5);
    const pal = isAd ? ['#111827', '#ffffff', '#3b82f6', '#d946ef', '#cbd5e1'] : isPumaKey ? ['#dc2626', '#ffffff', '#18181b', '#facc15', '#94a3b8'] : ['#18181b', '#dc2626', '#cbd5e1', '#334155', '#ffffff'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(24 + b * 248, 72, 224, 314, isAd ? '#f4f6f9' : '#1c212c', isAd ? '#94a3b8' : '#475569', pal, 4);
    }
    ctx.fillStyle = isAd ? '#c69e6b' : '#1b2029';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-dintaifung' || key === 'int-madamkwans' || key === 'int-chilis') {
    // DISTINCT RESTAURANT INTERIORS (Din Tai Fung glass Xiao Long Bao kitchen / Madam Kwan's Malaysian dining / Chili's Tex-Mex!)
    const isDTF = key === 'int-dintaifung';
    const isChilis = key === 'int-chilis';
    fillWall(isDTF ? '#f2e8d8' : isChilis ? '#3d1616' : '#3a2418', isDTF ? '#d8c8b0' : '#1c110d');
    const titles = isDTF
      ? ['XIAO LONG BAO 小籠包', 'STEAMING BAMBOO BASKETS', 'HAND-FOLDED 18 PLEATS', 'TAIWANESE DINING']
      : isChilis
        ? ['SIZZLING FAJITAS', 'BABY BACK RIBS', 'BIG MOUTH BURGERS', 'TEX-MEX GRILL']
        : ['NASI BOJARI', 'MALAYSIAN NASI LEMAK', 'CHAR KWAY TEOW', 'HERITAGE CURRY'];
    for (let m = 0; m < 4; m++) {
      const mx = 18 + m * 250;
      ctx.fillStyle = isDTF ? '#fff8eb' : '#1e1612';
      ctx.fillRect(mx, 56, 226, 166);
      ctx.strokeStyle = isChilis ? '#ef4444' : '#c9a056';
      ctx.lineWidth = 4;
      ctx.strokeRect(mx, 56, 226, 166);
      ctx.fillStyle = isDTF ? '#7f1d1d' : '#fde68a';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, titles[m], mx + 113, 146, 198, 20, '700', '"Playfair Display", serif', 2);
    }
    ctx.fillStyle = isDTF ? '#c89b66' : '#523422';
    ctx.fillRect(0, 344, W, 168);
  } else if (key === 'int-cellini') {
    // WARM ITALIAN LEATHER SOFA LIVING ROOM (Cellini / Stanzo / XZQT — ZERO bookshelf wallpaper!)
    fillWall('#e8dfd2', '#cbbba6');
    for (let b = 0; b < 3; b++) {
      const bx = 36 + b * 326;
      ctx.fillStyle = '#382a20';
      ctx.fillRect(bx, 68, 286, 160);
      ctx.strokeStyle = '#c49a52';
      ctx.lineWidth = 3;
      ctx.strokeRect(bx, 68, 286, 160);
      // Warm designer leather sofa silhouette
      ctx.fillStyle = b === 1 ? '#8c4428' : '#d8cfc2';
      ctx.fillRect(bx + 24, 286, 238, 72);
      ctx.fillRect(bx + 18, 256, 250, 36);
    }
    ctx.fillStyle = '#8b6848';
    ctx.fillRect(0, 384, W, 128);
  } else if (key === 'int-taishi') {
    // VIBRANT PASTEL CLAW-MACHINE ARCADE (Taishi Planet / Toy Catcher!)
    fillWall('#241848', '#140c2c');
    const clawCols = ['#f472b6', '#38bdf8', '#facc15', '#34d399'];
    for (let m = 0; m < 6; m++) {
      const mx = 22 + m * 165;
      ctx.fillStyle = clawCols[m % clawCols.length];
      ctx.fillRect(mx, 48, 142, 348);
      ctx.fillStyle = '#fef9ff';
      ctx.fillRect(mx + 12, 92, 118, 178);
      for (let p = 0; p < 4; p++) {
        ctx.fillStyle = clawCols[(m + p + 1) % clawCols.length];
        ctx.beginPath();
        ctx.arc(mx + 34 + p * 24, 246, 15, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = '#312e81';
    ctx.fillRect(0, 412, W, 100);
  } else if (key === 'int-parkson') {
    // GRAND PARKSON ELITE LUXURY DEPARTMENT STORE MODULAR ARCHITECTURAL BAYS (Zero horizontal text stretch!)
    fillWall('#efe7da', '#d6c8b2');
    ctx.fillStyle = '#1b1613';
    ctx.fillRect(0, 0, W, 56);
    ctx.fillStyle = '#cfa958';
    ctx.fillRect(0, 52, W, 5);
    const pPal = ['#d4af5e', '#e8ddd0', '#2b282c', '#b88472', '#c4a678', '#f5f0e6'];
    for (let b = 0; b < 4; b++) {
      // Sleek architectural stone pilaster framing each luxury boutique alcove
      ctx.fillStyle = '#dfd4c3';
      ctx.fillRect(b * 256, 57, 18, 354);
      drawLitNiche(22 + b * 256, 78, 214, 316, '#ebe3d6', '#b8944a', pPal, 4);
      // Warm recessed vertical gallery downlight cone
      const wg = ctx.createRadialGradient(b * 256 + 128, 72, 6, b * 256 + 128, 175, 115);
      wg.addColorStop(0, 'rgba(255, 236, 194, 0.42)');
      wg.addColorStop(1, 'rgba(255, 236, 194, 0.0)');
      ctx.fillStyle = wg;
      ctx.fillRect(22 + b * 256, 62, 214, 240);
    }
    ctx.fillStyle = '#c8baa4';
    ctx.fillRect(0, 408, W, 104);
  } else if (key === 'int-tommy') {
    // AUTHENTIC TOMMY HILFIGER HERITAGE AMERICAN BOUTIQUE (Crisp white shiplap, deep navy framing, crimson stripes!)
    fillWall('#f4f2ee', '#dcd8d0');
    ctx.fillStyle = '#0c2340';
    ctx.fillRect(0, 0, W, 54);
    ctx.fillStyle = '#cc0c2f';
    ctx.fillRect(0, 54, W, 10);
    const tPal = ['#0c2340', '#cc0c2f', '#f8fafc', '#2b4568', '#c8b89e', '#334155'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(24 + b * 248, 84, 222, 308, '#e8e6e2', '#0c2340', tPal, 4);
    }
    ctx.fillStyle = '#6c4e36';
    ctx.fillRect(0, 408, W, 104);
  } else if (key === 'int-jaya-grocer') {
    fillWall('#e7e5de', '#c4bfb4');
    // Subtle sage-emerald overhead gourmet market signage band
    ctx.fillStyle = '#1b4332';
    ctx.fillRect(0, 0, W, 74);
    const depts = ['FRESH PRODUCE', 'ARTISAN BAKERY', 'ORGANIC PANTRY', 'FINE DELI & CHEESE'];
    for (let d = 0; d < 4; d++) {
      ctx.fillStyle = '#f0fdf4';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, depts[d], d * 256 + 128, 48, 224, 19, '700', '"Montserrat", sans-serif', 3);
      drawLitNiche(d * 256 + 16, 94, 224, 232, '#d8d4c8', '#374151', ['#5c7c48', '#b86832', '#9c3c36', '#c29838', '#4e6c78', '#d6c8b2'], 4);
      // Warm oak fresh produce islands along lower third
      ctx.fillStyle = '#6c4426';
      ctx.fillRect(d * 256 + 12, 352, 232, 160);
      ctx.fillStyle = '#4a2c16';
      ctx.fillRect(d * 256 + 12, 352, 232, 12);
      const pCols = d === 0 ? ['#3d6b35', '#4f8540', '#2d5228'] : d === 1 ? ['#c47028', '#d88838', '#9e541c'] : d === 2 ? ['#9c2c2c', '#b83c36', '#782222'] : ['#c49a34', '#9e7c2a', '#d8b44e'];
      for (let f = 0; f < 22; f++) {
        ctx.fillStyle = pCols[f % 3];
        ctx.beginPath();
        ctx.arc(d * 256 + 32 + (f % 8) * 26, 384 + Math.floor(f / 8) * 18, 10, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (key === 'int-ippudo' || prof.facadeType === 'japanese-machiya') {
    // Warm natural Kyoto Hinoki timber interior, backlit shoji menu lattice, hanging warm lanterns & cypress ramen bar
    fillWall('#4a3220', '#22160e');
    for (let x = 0; x < W; x += 20) {
      const sh = 0.86 + hash2(x, 2.2) * 0.24;
      ctx.fillStyle = `rgb(${Math.floor(156 * sh)},${Math.floor(114 * sh)},${Math.floor(74 * sh)})`;
      ctx.fillRect(x, 0, 14, H);
    }
    for (let s = 0; s < 3; s++) {
      const sx = 54 + s * 326;
      const sg = ctx.createLinearGradient(sx, 118, sx, 290);
      sg.addColorStop(0, '#fff5df');
      sg.addColorStop(1, '#e6cf9e');
      ctx.fillStyle = sg;
      ctx.fillRect(sx, 118, 268, 166);
      ctx.strokeStyle = '#3d2414';
      ctx.lineWidth = 6;
      ctx.strokeRect(sx, 118, 268, 166);
      for (let gx = sx + 67; gx < sx + 268; gx += 67) {
        ctx.beginPath();
        ctx.moveTo(gx, 118);
        ctx.lineTo(gx, 284);
        ctx.stroke();
      }
      ctx.fillStyle = '#5c1818';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, s === 0 ? '白丸元味  SHIROMARU' : s === 1 ? '赤丸新味  AKAMARU' : 'からか麺  KARAKA', sx + 134, 210, 232, 22, '800', '"Noto Serif JP", serif', 2);
    }
    // Natural pale hinoki timber ramen counter & ceramic bowls
    ctx.fillStyle = '#cfa06c';
    ctx.fillRect(0, 336, W, 24);
    ctx.fillStyle = '#3a2214';
    ctx.fillRect(0, 360, W, 152);
  } else if (key === 'int-food-district' || key === 'int-kyochon' || prof.facadeType === 'modern-bistro') {
    // Warm modern upscale Malaysian food hall & bistro: exposed warm brick, oak slats, subtle backlit chalkboard menus & pendant glow
    fillWall('#2d221b', '#16110e');
    for (let row = 0; row < 18; row++) {
      for (let col = 0; col < 16; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? 'rgba(128, 76, 52, 0.22)' : 'rgba(90, 52, 36, 0.18)';
        ctx.fillRect(col * 64 + (row % 2) * 32, row * 28, 60, 24);
      }
    }
    const labels = key === 'int-kyochon'
      ? ['SOY GARLIC', 'RED PEPPER', 'HONEY GLAZE', 'SOONDUBU']
      : ['NASI LEMAK', 'TEPPANYAKI', 'DIM SUM', 'WOK NOODLES'];
    for (let s = 0; s < 4; s++) {
      const sx = s * 256 + 16;
      // Sleek matte charcoal framed backlit menu board
      ctx.fillStyle = '#181412';
      ctx.fillRect(sx, 72, 224, 156);
      ctx.strokeStyle = '#b48a4e';
      ctx.lineWidth = 3;
      ctx.strokeRect(sx, 72, 224, 156);
      ctx.fillStyle = '#f5e8d0';
      ctx.textAlign = 'center';
      fillAutoFitText(ctx, labels[s], sx + 112, 114, 198, 20, '700', '"Fraunces", serif', 2);
      // Soft realistic plated dish silhouette under warm spot
      const dg = ctx.createRadialGradient(sx + 112, 174, 4, sx + 112, 174, 48);
      dg.addColorStop(0, 'rgba(220, 155, 85, 0.65)');
      dg.addColorStop(1, 'rgba(24, 20, 18, 0.0)');
      ctx.fillStyle = dg;
      ctx.fillRect(sx + 20, 128, 184, 90);
      // Warm culinary counter & oak paneling
      ctx.fillStyle = '#c4baa8';
      ctx.fillRect(sx - 6, 336, 236, 16);
      ctx.fillStyle = '#473022';
      ctx.fillRect(sx - 6, 352, 236, 160);
    }
  } else if (key === 'int-sephora') {
    // PHOTOREALISTIC SEPHORA INTERIOR: Glossy obsidian walls, warm backlit alabaster beauty bays & muted luxury rose/gold/ivory perfume & cosmetics (ZERO bright rainbow LEGO blocks!)
    fillWall('#141418', '#09090c');
    const luxBeautyPal = ['#d6c5b3', '#b89468', '#8f3a44', '#e8ddd0', '#2b282c', '#c48f82', '#a8967c'];
    for (let p = 0; p < 4; p++) {
      drawLitNiche(28 + p * 246, 48, 212, 326, '#e2dcd4', '#1a1a20', luxBeautyPal, 5);
    }
    // Sleek black lacquered beauty tester counter along bottom
    ctx.fillStyle = '#15161a';
    ctx.fillRect(0, 396, W, 116);
    ctx.fillStyle = '#d4d0c8';
    ctx.fillRect(0, 392, W, 6);
  } else if (key === 'int-sports') {
    // PHOTOREALISTIC ATHLETIC FLAGSHIP: Architectural concrete walls, moody editorial monochrome campaign poster, sleek sneaker display wall & dark apparel racks!
    fillWall('#262c36', '#14171e');
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    for (let x = 256; x < W; x += 256) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    // Moody desaturated photographic athletic editorial lightbox (left)
    const pg = ctx.createLinearGradient(36, 46, 290, 370);
    pg.addColorStop(0, '#1e293b');
    pg.addColorStop(0.55, '#334155');
    pg.addColorStop(1, '#0f172a');
    ctx.fillStyle = pg;
    ctx.fillRect(36, 46, 258, 336);
    const rim = ctx.createRadialGradient(165, 190, 12, 165, 190, 130);
    rim.addColorStop(0, 'rgba(226, 232, 240, 0.30)');
    rim.addColorStop(1, 'rgba(15, 23, 42, 0.0)');
    ctx.fillStyle = rim;
    ctx.fillRect(36, 46, 258, 336);
    ctx.fillStyle = 'rgba(248, 250, 252, 0.85)';
    ctx.textAlign = 'center';
    fillAutoFitText(ctx, 'ENGINEERED FOR MOTION', 165, 344, 224, 16, '700', '"Montserrat", sans-serif', 4);

    // Architectural backlit sneaker wall (center)
    drawLitNiche(330, 48, 340, 332, '#1f2530', '#cbd5e1', ['#e2e8f0', '#64748b', '#991b1b', '#1e3a5f', '#3f4a56', '#cbd5e1'], 4);
    // Matte-black technical apparel shelving & racks (right)
    drawLitNiche(706, 48, 282, 332, '#242a34', '#475569', ['#1e293b', '#475569', '#3f4f42', '#7c2d12', '#94a3b8'], 3);
    ctx.fillStyle = '#1b2029';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-cafe') {
    // PHOTOREALISTIC LUXURY CAFÉ / PATISSERIE: Warm plaster walls, backlit oak shelving, ceramic espresso bar & glass cake showcase!
    fillWall('#ede6da', '#d4c9b8');
    // Minimalist framed dark-walnut menu board
    ctx.fillStyle = '#251e19';
    ctx.fillRect(46, 58, 316, 178);
    ctx.strokeStyle = '#b89668';
    ctx.lineWidth = 3;
    ctx.strokeRect(46, 58, 316, 178);
    ctx.fillStyle = '#f5ece0';
    ctx.textAlign = 'left';
    const items = ['SINGLE ORIGIN POUR-OVER', 'HOKKAIDO CREAM SHORTCAKE', 'ROASTED OOLONG LATTE', 'ARTISAN BUTTER CROISSANT'];
    for (let i = 0; i < 4; i++) {
      fillAutoFitText(ctx, items[i], 68, 100 + i * 36, 274, 15, '600', '"Montserrat", sans-serif', 2);
    }
    drawLitNiche(404, 54, 574, 192, '#dfd6c8', '#7c5334', ['#d6c5b3', '#526150', '#8b5e3c', '#e8dfd0', '#3d352e'], 2);
    // Travertine marble counter & warm backlit glass patisserie case
    ctx.fillStyle = '#dfd8cd';
    ctx.fillRect(0, 318, W, 194);
    ctx.fillStyle = 'rgba(255, 248, 236, 0.88)';
    ctx.fillRect(420, 266, 540, 128);
    ctx.strokeStyle = '#9c7c58';
    ctx.lineWidth = 4;
    ctx.strokeRect(420, 266, 540, 128);
    const pastryCols = ['#c88e56', '#d8a49c', '#e6d2a4', '#7a5036', '#c49664', '#e0c6b2'];
    for (let k = 0; k < 6; k++) {
      ctx.fillStyle = pastryCols[k];
      ctx.fillRect(444 + k * 84, 326, 56, 30);
      ctx.fillStyle = '#f8f5f0';
      ctx.fillRect(440 + k * 84, 356, 64, 5);
    }
  } else if (key === 'int-uniqlo') {
    // PHOTOREALISTIC UNIQLO: Crisp gallery white walls + realistic folded muted knitwear stacks (subtle shading, zero flat neon!)
    fillWall('#f2f3f5', '#dcdfe4');
    const uPal = ['#b83232', '#2b3a4f', '#526150', '#c4a684', '#383d46', '#d6d2c8', '#783c3c', '#455a64'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(22 + b * 250, 44, 224, 356, '#ebedf0', '#94a3b8', uPal, 5);
    }
    ctx.fillStyle = '#d4d8df';
    ctx.fillRect(0, 418, W, 94);
  } else if (key === 'int-cinema') {
    fillWall('#0e121b', '#07090e');
    for (let p = 0; p < 4; p++) {
      const px = 38 + p * 244;
      const pg = ctx.createLinearGradient(px, 52, px, 352);
      pg.addColorStop(0, p % 2 === 0 ? '#1b2b48' : '#3d1522');
      pg.addColorStop(1, '#090c14');
      ctx.fillStyle = pg;
      ctx.fillRect(px, 52, 200, 300);
      ctx.strokeStyle = '#c49a45';
      ctx.lineWidth = 3;
      ctx.strokeRect(px, 52, 200, 300);
      const og = ctx.createRadialGradient(px + 100, 160, 8, px + 100, 160, 82);
      og.addColorStop(0, p % 2 === 0 ? 'rgba(125, 211, 252, 0.52)' : 'rgba(251, 191, 36, 0.52)');
      og.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = og;
      ctx.fillRect(px, 52, 200, 220);
    }
  } else if (key === 'int-mrdiy') {
    // Photo-matched S319 MR. D.I.Y.: Bright white illuminated retail warehouse aisles packed with hardware, household & yellow PRICE LOCK tags!
    fillWall('#f4f4f0', '#deded8');
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(0, 0, W, 38);
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 38, W, 8);
    const diyPal = ['#dc2626', '#facc15', '#2563eb', '#16a34a', '#f97316', '#e2e8f0', '#334155'];
    for (let b = 0; b < 4; b++) {
      drawLitNiche(22 + b * 250, 62, 224, 330, '#eef0f2', '#475569', diyPal, 5);
      // Signature yellow MR. D.I.Y. hanging aisle price-lock signage!
      ctx.fillStyle = '#facc15';
      ctx.fillRect(88 + b * 250, 66, 92, 26);
      ctx.fillStyle = '#b91c1c';
      ctx.font = '800 13px "Jost", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PRICE LOCK', 134 + b * 250, 84);
    }
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(0, 408, W, 104);
  } else if (key === 'int-popmart' || key === 'int-toptoy' || key === 'int-toys-bright') {
    // Photo-matched POP MART / TOP TOY: Bright gallery-lit collectible blind-box walls + CASHIER / SPACE backlit signage!
    fillWall(key === 'int-toptoy' ? '#f3f0ff' : '#f1f5f9', key === 'int-toptoy' ? '#e0e7ff' : '#dde3ea');
    const toyPal = ['#f472b6', '#38bdf8', '#facc15', '#a78bfa', '#34d399', '#fb7185', '#fb923c'];
    drawLitNiche(24, 62, 300, 330, '#ffffff', '#94a3b8', toyPal, 5);
    // Center bright CASHIER / SPACE focal wall (replaces dark grey silhouette!)
    ctx.fillStyle = key === 'int-toptoy' ? '#1e1b4b' : '#18181b';
    ctx.fillRect(348, 62, 328, 330);
    ctx.strokeStyle = key === 'int-toptoy' ? '#38bdf8' : '#d4e426';
    ctx.lineWidth = 6;
    ctx.strokeRect(352, 66, 320, 322);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = '800 34px "Jost", sans-serif';
    ctx.fillText(key === 'int-toptoy' ? 'SPACE • TOP TOY' : key === 'int-popmart' ? 'CASHIER • POP MART' : 'COLLECTIBLES', 512, 128);
    drawLitNiche(372, 160, 280, 212, '#1e293b', '#e2e8f0', toyPal, 3);
    drawLitNiche(700, 62, 300, 330, '#ffffff', '#94a3b8', toyPal, 5);
    ctx.fillStyle = '#d8dee6';
    ctx.fillRect(0, 406, W, 106);
  } else if (key === 'int-tech') {
    // Sleek modern consumer tech showroom (Harvey Norman, Dreame, IT One, Machines) — illuminated OLED TV wall & device shelves!
    fillWall('#1c2028', '#101318');
    const techPal = ['#cbd5e1', '#38bdf8', '#94a3b8', '#e2e8f0', '#475569'];
    drawLitNiche(24, 54, 286, 334, '#242a34', '#64748b', techPal, 4);
    // Center illuminated OLED display wall
    const oledG = ctx.createLinearGradient(344, 54, 680, 330);
    oledG.addColorStop(0, '#0f172a');
    oledG.addColorStop(0.5, '#0284c7');
    oledG.addColorStop(1, '#312e81');
    ctx.fillStyle = oledG;
    ctx.fillRect(344, 64, 336, 206);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(344, 64, 336, 206);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = '700 24px "Jost", sans-serif';
    ctx.fillText('ULTRA HD • SMART LIVING', 512, 174);
    drawLitNiche(714, 54, 286, 334, '#242a34', '#64748b', techPal, 4);
    ctx.fillStyle = '#181c24';
    ctx.fillRect(0, 404, W, 108);
  } else if (key === 'int-furniture') {
    // Warm modern home living / kitchen cabinetry showroom (Signature Kitchen, Nitori, MUJI)
    fillWall('#eae3d7', '#d2c8b8');
    const furnPal = ['#d6c5b3', '#8b6848', '#526150', '#c4a684', '#f5f0e6', '#3d352e'];
    for (let b = 0; b < 3; b++) {
      drawLitNiche(26 + b * 332, 54, 304, 334, '#dfd7ca', '#8c6a4a', furnPal, 4);
    }
    ctx.fillStyle = '#bfa98e';
    ctx.fillRect(0, 404, W, 108);
  } else {
    // PHOTOREALISTIC LUXURY FASHION / DEPARTMENT STORE: 3 balanced illuminated architectural display niches (ZERO robotic trapezoid silhouettes!)
    fillWall(prof.isLight ? '#e4ddd2' : '#242730', prof.isLight ? '#c2b8a8' : '#12141a');
    const luxPal = ['#d6cdc0', '#383d46', '#8a6c50', '#243042', '#6b3b3e', '#525c50', '#c4b6a2'];
    drawLitNiche(28, 48, 290, 336, prof.isLight ? '#d8d0c4' : '#2c303a', '#7c6852', luxPal, 4);
    drawLitNiche(354, 48, 316, 336, prof.isLight ? '#e2dad0' : '#282c36', '#b89b62', luxPal, 4);
    drawLitNiche(706, 48, 290, 336, prof.isLight ? '#d8d0c4' : '#2c303a', '#7c6852', luxPal, 4);
    ctx.fillStyle = prof.isLight ? '#b8afa0' : '#181a20';
    ctx.fillRect(0, 404, W, 108);
  }

  // Soft overhead architectural wall-washer spotlight scallops across every interior!
  for (let s = 0; s < 4; s++) {
    const sx = 128 + s * 256;
    const sg = ctx.createRadialGradient(sx, 16, 8, sx, 76, 195);
    sg.addColorStop(0, 'rgba(255, 244, 218, 0.24)');
    sg.addColorStop(1, 'rgba(255, 244, 218, 0.0)');
    ctx.fillStyle = sg;
    ctx.fillRect(sx - 195, 0, 390, 260);
  }

  const tex = finalizeTexture(c, { srgb: true });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  interiorBackCache.set(key, tex);
  return tex;
}

/**
 * Authentic Real 1 Utama Upper Roof Secret Garden Cedar & Aged-Bronze Botanical Archway Plaque
 * (Replaces neon-green striped black banner!)
 */
let cachedSecretGardenSign = null;
export function createSecretGardenArchTexture() {
  if (cachedSecretGardenSign) return cachedSecretGardenSign;
  const w = 1024;
  const h = 192;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Rich weathered warm cedar-timber architectural sign backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#3a271b');
  bg.addColorStop(0.5, '#4c3424');
  bg.addColorStop(1, '#2b1d14');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? 'rgba(255,220,175,0.04)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(0, y, w, 3);
  }

  // Refined double brushed antique-brass architectural border
  ctx.strokeStyle = '#c9a66b';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.strokeStyle = 'rgba(201, 166, 107, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(20, 20, w - 40, h - 40);

  // Refined antique-brass Art-Deco geometric botanical flourishes (ZERO flat 2D green clipart blobs — 3D brass leaves are mounted physically!)
  for (const side of [-1, 1]) {
    const cx = w * 0.5 + side * 384;
    ctx.strokeStyle = '#d4b47c';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(cx - side * 42, 96);
    ctx.lineTo(cx + side * 42, 96);
    ctx.stroke();
    ctx.fillStyle = '#d4b47c';
    ctx.beginPath();
    ctx.moveTo(cx, 84);
    ctx.lineTo(cx + 10, 96);
    ctx.lineTo(cx, 108);
    ctx.lineTo(cx - 10, 96);
    ctx.closePath();
    ctx.fill();
  }

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8f2e4';
  fillAutoFitText(ctx, 'THE SECRET GARDEN', w * 0.5, 98, 680, 56, '700', '"Playfair Display", "Georgia", serif', 6);
  ctx.fillStyle = '#d4b47c';
  fillAutoFitText(ctx, '1 UTAMA UPPER ROOF  •  UR603A  •  500+ EXOTIC BOTANICAL SPECIES', w * 0.5, 146, 740, 21, '600', '"Montserrat", sans-serif', 3);

  cachedSecretGardenSign = finalizeTexture(c, { srgb: true });
  return cachedSecretGardenSign;
}

/**
 * Refined Real 1 Utama Creamy Travertine & Brushed Champagne-Brass Floor Inlay Medallion
 * (Replaces loud flat yellow MS-Paint rings!)
 */
let cachedMedallionTex = null;
export function createOvalMedallionTexture() {
  if (cachedMedallionTex) return cachedMedallionTex;
  const s = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);

  const cx = s * 0.5;
  const cy = s * 0.5;
  // Subtle concentric pale travertine / warm stone & ultra-refined antique champagne-brass hairlines!
  const rings = [
    { r: 492, col: 'rgba(130, 118, 102, 0.22)', w: 18 },
    { r: 472, col: 'rgba(176, 148, 92, 0.42)', w: 3 },
    { r: 422, col: 'rgba(155, 142, 122, 0.16)', w: 10 },
    { r: 340, col: 'rgba(176, 148, 92, 0.36)', w: 2.5 },
    { r: 245, col: 'rgba(110, 102, 92, 0.18)', w: 12 }
  ];
  for (const rg of rings) {
    ctx.strokeStyle = rg.col;
    ctx.lineWidth = rg.w;
    ctx.beginPath();
    ctx.arc(cx, cy, rg.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(176, 148, 92, 0.24)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 250, cy + Math.sin(a) * 250);
    ctx.lineTo(cx + Math.cos(a) * 470, cy + Math.sin(a) * 470);
    ctx.stroke();
  }
  cachedMedallionTex = finalizeTexture(c, { srgb: true });
  return cachedMedallionTex;
}

/**
 * Alpha-Cutout Pinnate Tropical Royal-Palm Feathered Frond Texture (Kills origami 6-triangle palms!)
 */
let cachedPalmFrondTex = null;
export function createPalmFrondTexture() {
  if (cachedPalmFrondTex) return cachedPalmFrondTex;
  const w = 256;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // Central woody fibrous rachis stem
  const stemG = ctx.createLinearGradient(w * 0.5, h, w * 0.5, 0);
  stemG.addColorStop(0, '#3e5c24');
  stemG.addColorStop(0.6, '#4d7c2c');
  stemG.addColorStop(1, '#65a336');
  ctx.strokeStyle = stemG;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(w * 0.5, h);
  ctx.lineTo(w * 0.5, 16);
  ctx.stroke();

  // 28 pairs of individual tapered serrated feathered palm leaflets!
  for (let i = 0; i < 28; i++) {
    const t = i / 27; // 0 = base, 1 = tip
    const y = h - 22 - t * (h - 46);
    const env = Math.sin(Math.pow(t, 0.72) * Math.PI * 0.94);
    const len = (24 + env * 94) * (0.92 + hash2(i, 2.1) * 0.16);
    const lw = 7.5 + env * 5.0;
    const sweep = 18 + t * 34;

    for (const side of [-1, 1]) {
      const shade = 0.76 + hash2(i * 3 + side, 5.7) * 0.34;
      const g = ctx.createLinearGradient(w * 0.5, y, w * 0.5 + side * len, y - sweep);
      g.addColorStop(0, `rgb(${Math.floor(22 * shade)},${Math.floor(84 * shade)},${Math.floor(34 * shade)})`);
      g.addColorStop(0.55, `rgb(${Math.floor(34 * shade)},${Math.floor(118 * shade)},${Math.floor(42 * shade)})`);
      g.addColorStop(1, `rgb(${Math.floor(58 * shade)},${Math.floor(144 * shade)},${Math.floor(48 * shade)})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(w * 0.5, y + lw * 0.35);
      ctx.quadraticCurveTo(w * 0.5 + side * len * 0.55, y - sweep * 0.45 - lw * 0.4, w * 0.5 + side * len, y - sweep);
      ctx.quadraticCurveTo(w * 0.5 + side * len * 0.52, y - sweep * 0.35 + lw * 0.55, w * 0.5, y - lw * 0.35);
      ctx.closePath();
      ctx.fill();
    }
  }

  cachedPalmFrondTex = finalizeTexture(c, { srgb: true });
  cachedPalmFrondTex.wrapS = THREE.ClampToEdgeWrapping;
  cachedPalmFrondTex.wrapT = THREE.ClampToEdgeWrapping;
  return cachedPalmFrondTex;
}

/**
 * Alpha-Cutout Cascading Tropical Rainforest Ivy / Pothos Hanging Vine Garland Texture
 * (Completely eliminates flat solid green rectangular ribbons!)
 */
let cachedHangingVineTex = null;
export function createHangingVineTexture(withFlowers = false) {
  if (!withFlowers && cachedHangingVineTex) return cachedHangingVineTex;
  const w = 256;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  const strandX = [56, 128, 196];
  const leafCols = ['#14532d', '#166534', '#15803d', '#1e7a3b', '#3f7d20', '#2b5926'];
  const flowerCols = ['#db2777', '#e11d48', '#f472b6', '#fb7185', '#fef3c7'];

  for (let s = 0; s < strandX.length; s++) {
    const baseX = strandX[s];
    const maxLen = h * (0.72 + hash2(s, 3.3) * 0.25);

    // Delicate winding organic woody vine tendril
    ctx.strokeStyle = '#3b2c1d';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(baseX, 0);
    for (let y = 0; y <= maxLen; y += 16) {
      const wx = baseX + Math.sin(y * 0.032 + s * 2.1) * 14;
      ctx.lineTo(wx, y);
    }
    ctx.stroke();

    // Dense clustered overlapping heart-shaped tropical pothos / ivy leaves along each tendril
    for (let y = 8; y < maxLen - 10; y += 14) {
      const wx = baseX + Math.sin(y * 0.032 + s * 2.1) * 14;
      const side = (Math.floor(y / 14) + s) % 2 === 0 ? 1 : -1;
      const taper = 1.0 - (y / maxLen) * 0.42;
      const lr = (16 + hash2(y, s * 7.1) * 11) * taper;

      ctx.save();
      ctx.translate(wx + side * (6 + lr * 0.45), y);
      ctx.rotate(side * (0.35 + hash2(y * 2, s) * 0.55));
      ctx.fillStyle = leafCols[Math.floor(hash2(y + s * 13, 4.9) * leafCols.length)];
      ctx.beginPath();
      ctx.moveTo(0, -lr * 0.55);
      ctx.bezierCurveTo(lr * 0.85, -lr * 0.35, lr * 0.72, lr * 0.65, 0, lr);
      ctx.bezierCurveTo(-lr * 0.72, lr * 0.65, -lr * 0.85, -lr * 0.35, 0, -lr * 0.55);
      ctx.fill();
      // Subtle leaf midrib highlight
      ctx.strokeStyle = 'rgba(180, 235, 145, 0.26)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -lr * 0.4);
      ctx.lineTo(0, lr * 0.85);
      ctx.stroke();
      ctx.restore();

      // Bougainvillea & orchid blossom clusters for Upper Roof Secret Garden pergola!
      if (withFlowers && hash2(y * 3, s + 9.2) > 0.66) {
        const fc = flowerCols[Math.floor(hash2(y, s * 19) * flowerCols.length)];
        for (let b = 0; b < 3; b++) {
          ctx.fillStyle = fc;
          ctx.beginPath();
          ctx.arc(
            wx + side * 12 + (hash2(y + b, 1.3) - 0.5) * 18,
            y + (hash2(y + b, 6.7) - 0.5) * 16,
            6 + hash2(b, y) * 5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
    }
  }

  const tex = finalizeTexture(c, { srgb: true });
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  if (!withFlowers) cachedHangingVineTex = tex;
  return tex;
}

/**
 * Procedural Wet Mossy Malaysian Karst Limestone Rock Maps (Albedo + Normal + Roughness)
 * Kills PS1 flat-shaded gray icosahedron rocks!
 */
let cachedMossyRockMaps = null;
export function createMossyRockMaps() {
  if (cachedMossyRockMaps) return cachedMossyRockMaps;
  const s = 512;
  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');

  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, s, s);

  const cR = document.createElement('canvas');
  cR.width = cR.height = s;
  const ctxR = cR.getContext('2d');
  ctxR.fillStyle = 'rgb(148,148,148)';
  ctxR.fillRect(0, 0, s, s);

  // Natural weathered Malaysian karst limestone with bright moss crown & damp splash gradient (NEVER pitch-black blobs!)
  const baseG = ctxA.createLinearGradient(0, 0, 0, s);
  baseG.addColorStop(0.0, '#4e6b3e'); // lush mossy crown
  baseG.addColorStop(0.32, '#7d7a70'); // weathered warm limestone
  baseG.addColorStop(0.72, '#62615a'); // damp stone
  baseG.addColorStop(1.0, '#424542'); // wet splash waterline
  ctxA.fillStyle = baseG;
  ctxA.fillRect(0, 0, s, s);

  // Horizontal geological strata crevices & organic mottled mineral patches
  for (let i = 0; i < 420; i++) {
    const x = hash2(i, 1.7) * s;
    const y = hash2(i, 5.3) * s;
    const rw = 18 + hash2(i, 8.1) * 72;
    const rh = 6 + hash2(i, 3.9) * 24;
    const isMoss = y < s * 0.45 && hash2(i, 9.4) > 0.42;
    ctxA.fillStyle = isMoss
      ? `rgba(${34 + Math.floor(hash2(i, 2.2) * 24)},${78 + Math.floor(hash2(i, 4.4) * 32)},32,0.52)`
      : `rgba(${38 + Math.floor(hash2(i, 2.2) * 42)},${38 + Math.floor(hash2(i, 2.2) * 38)},${36 + Math.floor(hash2(i, 2.2) * 34)},0.45)`;
    ctxA.fillRect(x - rw * 0.5, y - rh * 0.5, rw, rh);

    // Craggy rock relief normal map
    const nx = Math.floor(96 + hash2(i, 6.1) * 64);
    const ny = Math.floor(86 + hash2(i, 7.2) * 84);
    ctxN.fillStyle = `rgba(${nx},${ny},235,0.65)`;
    ctxN.fillRect(x - rw * 0.5, y - rh * 0.5, rw, rh * 0.5);

    // Wet low roughness near bottom (0.14), velvety moss roughness near top (0.85)
    const rv = y > s * 0.65 ? 36 + Math.floor(hash2(i, 3.1) * 35) : isMoss ? 215 : 145 + Math.floor(hash2(i, 3.1) * 45);
    ctxR.fillStyle = `rgb(${rv},${rv},${rv})`;
    ctxR.fillRect(x - rw * 0.5, y - rh * 0.5, rw, rh);
  }

  cachedMossyRockMaps = {
    map: finalizeTexture(cA, { srgb: true, repeatX: 2, repeatY: 2 }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX: 2, repeatY: 2 }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX: 2, repeatY: 2 })
  };
  return cachedMossyRockMaps;
}

/**
 * Submerged River Pebble Bed Texture for Translucent LG Rainforest Koi Pond
 */
let cachedRiverPebbleTex = null;
export function createRiverPebbleTexture() {
  if (cachedRiverPebbleTex) return cachedRiverPebbleTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#182420';
  ctx.fillRect(0, 0, s, s);

  const stoneCols = ['#3d4a44', '#524b3f', '#2d3b38', '#685e4e', '#35403a', '#485249'];
  for (let i = 0; i < 650; i++) {
    const px = hash2(i, 2.3) * s;
    const py = hash2(i, 8.9) * s;
    const rx = 5 + hash2(i, 4.1) * 14;
    const ry = 4 + hash2(i, 6.7) * 10;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(hash2(i, 1.1) * Math.PI);
    ctx.fillStyle = stoneCols[i % stoneCols.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(10,16,14,0.45)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
  }
  cachedRiverPebbleTex = finalizeTexture(c, { srgb: true, repeatX: 6, repeatY: 4 });
  return cachedRiverPebbleTex;
}

/**
 * Dedicated Authentic 1 Utama IPPUDO (LG352) Vertical Stacked Kanji Lightbox Texture (一 / 風 / 堂 + Red Hanko Seal!)
 */
let cachedIppudoSignTex = null;
export function createIppudoVerticalSignTexture() {
  if (cachedIppudoSignTex) return cachedIppudoSignTex;
  const w = 256;
  const h = 768;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#14161a';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#3a3f4a';
  ctx.lineWidth = 8;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = '800 128px "Noto Serif JP", serif';
  ctx.fillText('一', w * 0.5, 165);
  ctx.fillText('風', w * 0.5, 345);
  ctx.fillText('堂', w * 0.5, 525);

  // Authentic crimson Japanese square hanko seal at bottom!
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(w * 0.5 - 48, 590, 96, 96);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(w * 0.5 - 40, 598, 80, 80);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px "Jost", sans-serif';
  ctx.fillText('IPPUDO', w * 0.5, 648);

  cachedIppudoSignTex = finalizeTexture(c, { srgb: true });
  return cachedIppudoSignTex;
}

/**
 * Architectural Industrial Ceiling Plenum Texture for 1UE / District K (Steel Trusses, Matte HVAC Ducts & Warm Recessed Downlight Cans — ZERO #000000 void!)
 */
let cachedPlenumMaps = null;
export function createIndustrialPlenumTexture() {
  if (cachedPlenumMaps) return cachedPlenumMaps;
  const s = 512;
  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctx = cA.getContext('2d');
  const cE = document.createElement('canvas');
  cE.width = cE.height = s;
  const ctxE = cE.getContext('2d');
  ctxE.fillStyle = '#000000';
  ctxE.fillRect(0, 0, s, s);

  ctx.fillStyle = '#242934';
  ctx.fillRect(0, 0, s, s);
  // Matte steel structural trusses & acoustic deck ribs
  for (let i = 0; i < s; i += 32) {
    ctx.fillStyle = i % 64 === 0 ? '#2f3644' : '#1e232d';
    ctx.fillRect(0, i, s, 14);
  }
  // Cylindrical galvanized HVAC duct runs
  ctx.fillStyle = '#384152';
  ctx.fillRect(88, 0, 62, s);
  ctx.fillStyle = '#475569';
  ctx.fillRect(108, 0, 18, s);
  ctx.fillStyle = '#384152';
  ctx.fillRect(356, 0, 52, s);
  ctx.fillStyle = '#475569';
  ctx.fillRect(374, 0, 14, s);

  // Glowing warm architectural recessed downlight cans
  for (const [lx, ly] of [[256, 128], [256, 384], [48, 256], [464, 256]]) {
    ctx.fillStyle = '#fff5dc';
    ctx.beginPath();
    ctx.arc(lx, ly, 14, 0, Math.PI * 2);
    ctx.fill();
    const g = ctxE.createRadialGradient(lx, ly, 2, lx, ly, 36);
    g.addColorStop(0, '#fff7e0');
    g.addColorStop(0.5, 'rgba(255, 224, 165, 0.55)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctxE.fillStyle = g;
    ctxE.beginPath();
    ctxE.arc(lx, ly, 36, 0, Math.PI * 2);
    ctxE.fill();
  }
  cachedPlenumMaps = {
    map: finalizeTexture(cA, { srgb: true, repeatX: 0.08, repeatY: 0.08 }),
    emissiveMap: finalizeTexture(cE, { srgb: true, repeatX: 0.08, repeatY: 0.08 })
  };
  return cachedPlenumMaps;
}

/**
 * Signature 1 Utama Garrett Popcorn Wide Navy-Blue & Turquoise/White Vertical Stripe Texture (Wraps ALL 4 counter sides + arched canopy!)
 */
let cachedGarrettStripeTex = null;
export function createGarrettStripeTexture() {
  if (cachedGarrettStripeTex) return cachedGarrettStripeTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  const w = 64;
  for (let x = 0; x < s; x += w) {
    const idx = Math.round(x / w);
    ctx.fillStyle = idx % 2 === 0 ? '#172554' : '#06b6d4';
    ctx.fillRect(x, 0, w, s);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, 0, 4, s);
  }
  cachedGarrettStripeTex = finalizeTexture(c, { srgb: true, repeatX: 3, repeatY: 1 });
  return cachedGarrettStripeTex;
}

/**
 * Procedural Glazed Small Square Ceramic Mosaic Tile PBR Maps (Jaya Grocer Terracotta, BHC Mustard-Yellow, RollerWa White Mosaic!)
 */
export function createMosaicTileMaps(baseHex = '#8a4b2a', altHex = '#a65c36', groutHex = '#382a24', repeatX = 2, repeatY = 4) {
  const s = 512;
  const tiles = 16;
  const step = s / tiles;
  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');
  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');
  const cR = document.createElement('canvas');
  cR.width = cR.height = s;
  const ctxR = cR.getContext('2d');

  ctxA.fillStyle = groutHex;
  ctxA.fillRect(0, 0, s, s);
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, s, s);
  ctxR.fillStyle = 'rgb(220,220,220)';
  ctxR.fillRect(0, 0, s, s);

  const colA = new THREE.Color(baseHex);
  const colB = new THREE.Color(altHex);
  const tmp = new THREE.Color();

  for (let gx = 0; gx < tiles; gx++) {
    for (let gy = 0; gy < tiles; gy++) {
      const h = hash2(gx * 7 + 3, gy * 11 + 5);
      tmp.copy(colA).lerp(colB, h);
      const x0 = gx * step;
      const y0 = gy * step;
      ctxA.fillStyle = `#${tmp.getHexString()}`;
      ctxA.fillRect(x0 + 2, y0 + 2, step - 4, step - 4);
      ctxA.fillStyle = 'rgba(255,255,255,0.14)';
      ctxA.fillRect(x0 + 3, y0 + 3, step - 6, 3);

      ctxN.fillStyle = 'rgb(88,128,240)';
      ctxN.fillRect(x0 + 1, y0 + 1, 2, step - 2);
      ctxN.fillStyle = 'rgb(168,128,240)';
      ctxN.fillRect(x0 + step - 3, y0 + 1, 2, step - 2);
      ctxN.fillStyle = 'rgb(128,88,240)';
      ctxN.fillRect(x0 + 1, y0 + 1, step - 2, 2);
      ctxN.fillStyle = 'rgb(128,168,240)';
      ctxN.fillRect(x0 + 1, y0 + step - 3, step - 2, 2);

      const rv = Math.floor(42 + h * 26);
      ctxR.fillStyle = `rgb(${rv},${rv},${rv})`;
      ctxR.fillRect(x0 + 2, y0 + 2, step - 4, step - 4);
    }
  }
  return {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX, repeatY })
  };
}

/**
 * Sparkling Faceted Silver Mirror-Mosaic Tile Maps for Outdoor Saranghae Finger-Heart Hand Statue!
 */
let cachedSilverMosaic = null;
export function createSilverMosaicMaps() {
  if (cachedSilverMosaic) return cachedSilverMosaic;
  const s = 512;
  const tiles = 24;
  const step = s / tiles;
  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');
  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');

  ctxA.fillStyle = '#8b95a2';
  ctxA.fillRect(0, 0, s, s);
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, s, s);

  for (let gx = 0; gx < tiles; gx++) {
    for (let gy = 0; gy < tiles; gy++) {
      const h = hash2(gx * 13, gy * 17);
      const lum = Math.floor(178 + h * 77);
      ctxA.fillStyle = `rgb(${lum},${lum + 2},${Math.min(255, lum + 6)})`;
      ctxA.fillRect(gx * step + 1.5, gy * step + 1.5, step - 3, step - 3);
      const nx = Math.floor(96 + hash2(gx + 5, gy) * 64);
      const ny = Math.floor(96 + hash2(gx, gy + 9) * 64);
      ctxN.fillStyle = `rgb(${nx},${ny},240)`;
      ctxN.fillRect(gx * step + 1.5, gy * step + 1.5, step - 3, step - 3);
    }
  }
  cachedSilverMosaic = {
    map: finalizeTexture(cA, { srgb: true, repeatX: 3, repeatY: 4 }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX: 3, repeatY: 4 })
  };
  return cachedSilverMosaic;
}

/**
 * Vibrant Backlit Food-Stall Menu Lightbox Textures (Replaces blank beige rectangles inside Food District & Bistros!)
 */
const foodMenuCache = new Map();
export function createFoodStallMenuTexture(idx = 0) {
  const k = idx % 6;
  if (foodMenuCache.has(k)) return foodMenuCache.get(k);
  const stalls = [
    { name: 'NASI LEMAK ROYALE', sub: 'Ayam Berempah • Sambal Sotong', accent: '#dc2626', dish: '#ea580c' },
    { name: 'TEPPANYAKI GRILL', sub: 'Sizzling Beef • Salmon Teriyaki', accent: '#f59e0b', dish: '#b45309' },
    { name: 'DIM SUM PAVILION', sub: 'Har Gow • Siu Mai • Egg Tarts', accent: '#0d9488', dish: '#d97706' },
    { name: 'WOK & NOODLE BAR', sub: 'Char Kway Teow • Curry Laksa', accent: '#ea580c', dish: '#c2410c' },
    { name: 'HAINANESE CHICKEN RICE', sub: 'Roasted & Poached Chicken', accent: '#16a34a', dish: '#ca8a04' },
    { name: 'SEOUL K-STREET BOWLS', sub: 'Bibimbap • Tteokbokki • Kimchi', accent: '#db2777', dish: '#e11d48' }
  ];
  const st = stalls[k];
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1b1815';
  ctx.fillRect(0, 0, 512, 256);
  ctx.fillStyle = st.accent;
  ctx.fillRect(0, 0, 512, 54);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, st.name, 256, 38, 460, 28, '800', '"Jost", sans-serif', 4);
  ctx.fillStyle = '#fde68a';
  fillAutoFitText(ctx, st.sub, 256, 92, 460, 18, '600', '"Montserrat", sans-serif', 2);
  // Rich illuminated culinary plating photography-style cards with ceramic bowls, layered protein, garnish & prices (ZERO cartoon bullseye dots!)
  const prices = ['RM 18.90', 'RM 22.90', 'RM 16.50'];
  for (let d = 0; d < 3; d++) {
    const cx = 96 + d * 160;
    const cardX = cx - 68;
    // Warm spotlighted food frame
    const fg = ctx.createRadialGradient(cx, 166, 6, cx, 166, 64);
    fg.addColorStop(0, 'rgba(255, 224, 160, 0.38)');
    fg.addColorStop(1, 'rgba(27, 24, 21, 0.95)');
    ctx.fillStyle = fg;
    ctx.fillRect(cardX, 114, 136, 122);
    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, 114, 136, 122);
    // Ceramic bowl shadow + sculpted ceramic plate
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.beginPath();
    ctx.ellipse(cx, 184, 52, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = d === 1 ? '#292524' : '#f4efe6';
    ctx.beginPath();
    ctx.ellipse(cx, 178, 48, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    // Layered textured protein / rice / noodle garnish strips
    for (let s = -2; s <= 2; s++) {
      ctx.fillStyle = s % 2 === 0 ? st.dish : '#b45309';
      ctx.beginPath();
      ctx.ellipse(cx + s * 11, 174 + (s % 2) * 3, 12, 7, 0.25, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(cx - 16, 166, 8, 4);
    ctx.fillRect(cx + 8, 170, 7, 4);
    ctx.fillStyle = '#fde68a';
    ctx.font = '700 13px "Montserrat", sans-serif';
    ctx.fillText(prices[d], cx, 224);
  }
  const tex = finalizeTexture(c, { srgb: true });
  foodMenuCache.set(k, tex);
  return tex;
}

/**
 * Brand-Specific Illuminated Storefront Campaign Posters & Ticketing Kiosk Screens (Replaces duplicate "1 UTAMA DIRECTORY" maps!)
 */
const storePosterCache = new Map();
export function createStorePosterTexture(brandKey = 'default') {
  if (storePosterCache.has(brandKey)) return storePosterCache.get(brandKey);
  const presets = {
    rollerwa: { bg1: '#0a206e', bg2: '#3b0764', acc: '#ff4da6', k: 'ROLLERWA 1UE', t: 'SKATE PASSES', l1: '2 HOURS  •  RM 45', l2: 'ALL DAY  •  RM 65', l3: 'SCAN QR TO RENT SKATES' },
    gameon: { bg1: '#1c1917', bg2: '#7c2d12', acc: '#f97316', k: 'GAME ON SPORTS HUB', t: 'ALL-ACCESS PASS', l1: 'NINJA • MINI GOLF • PS5', l2: 'KARAOKE • KUNG FU', l3: 'BOOK AT RECEPTION' },
    nextgen: { bg1: '#1e1b4b', bg2: '#312e81', acc: '#facc15', k: 'NEXT GEN 1 UTAMA', t: 'HAPPY MEMORIES', l1: 'CLIMBING • SLIDES • VR', l2: 'FAMILY DAY PASSES', l3: 'LEVEL 1F & 2F 1UE' },
    pjpac: { bg1: '#181412', bg2: '#451a03', acc: '#f59e0b', k: 'PJPAC • ONETIX', t: 'NOW SHOWING', l1: 'STAGE 1 PROSCENIUM', l2: 'SYMPHONY & MUSICALS', l3: 'TICKETS AT BOX OFFICE' },
    sephora: { bg1: '#18141c', bg2: '#5c2440', acc: '#f8fafc', k: 'SEPHORA', t: 'BEAUTY PASS', l1: 'SKINCARE • MAKEUP', l2: 'FRAGRANCE • HAIR', l3: 'THE POWER OF BEAUTY' },
    puma: { bg1: '#2e0854', bg2: '#db2777', acc: '#ffffff', k: 'PUMA  •  S345', t: 'FOREVER FASTER', l1: 'FUTURE RIDER • NITRO', l2: 'SPEEDCAT • MOTORSPORT', l3: 'SHOP 24/7 AT PUMA.COM' },
    toptoy: { bg1: '#f8fafc', bg2: '#e0f2fe', acc: '#0284c7', k: 'TOP TOY', t: 'DREAM TOY LAND', l1: 'BLIND BOXES • SANRIO', l2: 'DISNEY • BUILDING SETS', l3: 'LOT S330 • 2F HIGHSTREET' },
    starbucks: { bg1: '#faf8f5', bg2: '#ece5d8', acc: '#00704a', k: 'STARBUCKS RESERVE', t: 'SPICE THINGS UP', l1: 'PUMPKIN SPICE LATTE', l2: 'SMALL-LOT ROASTS', l3: 'MOBILE ORDER & PAY' },
    heytea_left: { bg1: '#f8fafc', bg2: '#f1f5f9', acc: '#18181b', k: 'HEYTEA 喜茶', t: 'Real Quality', l1: '100% FRESH BREWED TEA', l2: 'REAL FRUIT • ZERO POWDER', l3: 'SUCCULENT GRAPE BOOM' },
    heytea_right: { bg1: '#fafaf9', bg2: '#f5efe6', acc: '#78350f', k: 'HEYTEA 喜茶', t: 'Real Milk', l1: 'ROASTED BROWN BOBO', l2: 'FRESH ORGANIC MILK', l3: 'NO ARTIFICIAL CREAMERS' },
    mrdiy_pl: { bg1: '#facc15', bg2: '#f59e0b', acc: '#dc2626', k: 'MR. D.I.Y.', t: 'PRICE LOCK', l1: 'HARGA KAMI TETAP SAMA!', l2: 'ALWAYS LOW PRICES', l3: 'LOT S319 • 2F HIGHSTREET' },
    beutea_menu: { bg1: '#fbf6ec', bg2: '#efe3cd', acc: '#92400e', k: '茶仙子 BEUTEA', t: 'SIGNATURE TEAS', l1: 'WHITE PEACH OOLONG • RM13', l2: 'JASMINE GREEN MILK • RM12', l3: 'DA HONG PAO LATTE • RM14' },
    boost_front: { bg1: '#65a30d', bg2: '#15803d', acc: '#fde047', k: 'BOOST JUICE', t: 'LOVE LIFE!', l1: 'MANGO MAGIC • ALL BERRY', l2: 'FRESH FRUIT SMOOTHIES', l3: '98% FAT FREE • LOT FK101' },
    default: { bg1: '#0f172a', bg2: '#1e293b', acc: '#e9b03f', k: '1 UTAMA', t: 'IT’S ALL IN ONE', l1: 'SHOPPING • DINING', l2: 'LEISURE • LIFESTYLE', l3: 'BANDAR UTAMA' }
  };
  const p = presets[brandKey] || presets.default;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 384;
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, 384);
  g.addColorStop(0, p.bg1);
  g.addColorStop(1, p.bg2);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 384);
  ctx.strokeStyle = p.acc;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, 240, 368);
  const isLightPoster = ['toptoy', 'starbucks', 'heytea_left', 'heytea_right', 'beutea_menu', 'mrdiy_pl'].includes(brandKey);
  ctx.fillStyle = p.acc;
  ctx.fillRect(20, 24, 216, 40);
  ctx.fillStyle = isLightPoster && brandKey !== 'mrdiy_pl' ? '#ffffff' : '#09090b';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, p.k, 128, 51, 198, 16, '800', '"Jost", sans-serif', 2);
  ctx.fillStyle = isLightPoster ? '#18181b' : '#ffffff';
  fillAutoFitText(ctx, p.t, 128, 134, 212, 28, '800', '"Oswald", sans-serif', 3);
  ctx.fillStyle = p.acc;
  ctx.fillRect(48, 154, 160, 4);
  ctx.fillStyle = isLightPoster ? '#27272a' : '#f8fafc';
  fillAutoFitText(ctx, p.l1, 128, 210, 208, 16, '700', '"Montserrat", sans-serif', 1);
  fillAutoFitText(ctx, p.l2, 128, 248, 208, 16, '700', '"Montserrat", sans-serif', 1);
  ctx.fillStyle = isLightPoster ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)';
  ctx.fillRect(26, 294, 204, 54);
  ctx.fillStyle = isLightPoster ? '#18181b' : p.acc;
  fillAutoFitText(ctx, p.l3, 128, 328, 190, 14, '800', '"Jost", sans-serif', 1);
  const tex = finalizeTexture(c, { srgb: true });
  storePosterCache.set(brandKey, tex);
  return tex;
}

/**
 * Brand-Matched Exterior Restaurant Menu Lectern Texture (Kills blank white/gray menu stands outside Food District, BHC & Bistros!)
 */
const menuStandCache = new Map();
export function createMenuStandTexture(store) {
  const key = store.id || store.name || 'menu';
  if (menuStandCache.has(key)) return menuStandCache.get(key);
  const uName = (store.name || '').toUpperCase();
  const isBhc = uName.includes('BHC');
  const isFoodDist = uName.includes('FOOD DISTRICT');

  const W = 1024;
  const H = 768;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Rich high-res menu card background
  ctx.fillStyle = isBhc ? '#1a1c22' : '#fbf7ef';
  ctx.fillRect(0, 0, W, H);

  // Outer frame & fine editorial inner rule
  ctx.strokeStyle = isBhc ? '#f4b400' : isFoodDist ? '#b8282e' : '#8b5e34';
  ctx.lineWidth = 18;
  ctx.strokeRect(10, 10, W - 20, H - 20);
  ctx.strokeStyle = isBhc ? 'rgba(244, 180, 0, 0.38)' : 'rgba(139, 94, 52, 0.32)';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, W - 60, H - 60);

  // Warm brand header banner
  const hGrad = ctx.createLinearGradient(36, 36, W - 36, 176);
  if (isBhc) {
    hGrad.addColorStop(0, '#f6be18');
    hGrad.addColorStop(1, '#e59f00');
  } else if (isFoodDist) {
    hGrad.addColorStop(0, '#162848');
    hGrad.addColorStop(1, '#223b66');
  } else {
    hGrad.addColorStop(0, '#3a2416');
    hGrad.addColorStop(1, '#26170e');
  }
  ctx.fillStyle = hGrad;
  ctx.fillRect(36, 36, W - 72, 138);

  const cleanName = (store.name || 'BISTRO').replace(/\s*\([^)]*\)/g, '').trim();
  ctx.fillStyle = isBhc ? '#111215' : '#fffaf0';
  ctx.textAlign = 'center';
  fillAutoFitText(ctx, `${cleanName}  •  MENU`, W * 0.5, 108, W - 140, 44, '800', '"Jost", sans-serif', 4);
  ctx.fillStyle = isBhc ? '#3a2c04' : '#f5d080';
  fillAutoFitText(
    ctx,
    isBhc
      ? 'KOREAN FRIED CHICKEN  •  LOT G601'
      : isFoodDist
        ? 'ARTISAN DINING HALL  •  LOT S346-S347'
        : `SIGNATURE SELECTION  •  ${store.lot || '1 UTAMA'}`,
    W * 0.5,
    152,
    W - 160,
    20,
    '700',
    '"Montserrat", sans-serif',
    5
  );

  // Column headers
  ctx.fillStyle = isBhc ? '#facc15' : '#8b5e34';
  ctx.textAlign = 'left';
  ctx.font = '800 22px "Montserrat", sans-serif';
  ctx.fillText('SIGNATURE DISHES', 64, 224);
  ctx.textAlign = 'right';
  ctx.fillText('PRICE (RM)', W - 64, 224);

  ctx.strokeStyle = isBhc ? 'rgba(250, 204, 21, 0.35)' : 'rgba(139, 94, 52, 0.35)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(64, 240);
  ctx.lineTo(W - 64, 240);
  ctx.stroke();

  const items = isBhc
    ? [
        ['Bburinkle Crispy Chicken', 'Signature cheese & herb seasoning', 'RM 36.90'],
        ['Macho King Wings', 'Aged soy & honey glaze', 'RM 35.90'],
        ['Gold King Crispy', 'Sweet garlic & golden soy crunch', 'RM 34.90'],
        ['Red King Hot & Spicy', 'Chili pepper & habanero kick', 'RM 35.90'],
        ['Creamy Cheese Balls (5 pcs)', 'Crispy golden mochi cheese', 'RM 16.90'],
        ['Sotteok Sotteok Skewer', 'Rice cake & sausage sweet glaze', 'RM 14.90']
      ]
    : isFoodDist
      ? [
          ['Nasi Lemak Royale Platter', 'Spiced ayam berempah & sambal', 'RM 18.90'],
          ['Teppanyaki Norwegian Salmon', 'Garlic butter rice & miso soup', 'RM 24.90'],
          ['Artisan Dim Sum Basket', 'Har gow, siew mai & chili oil', 'RM 16.50'],
          ['Seoul Beef Bulgogi Bibimbap', 'Hot stone bowl & kimchi', 'RM 19.90'],
          ['Penang Char Kuey Teow', 'Wok hei tiger prawns & cockles', 'RM 17.50'],
          ['Hainanese Roast Chicken', 'Fragrant rice & ginger scallion', 'RM 15.90']
        ]
      : [
          ['Chef Signature Platter', 'House-prepared seasonal specialty', 'RM 28.90'],
          ['Slow-Braised House Entrée', 'Artisan herbs & roasted jus', 'RM 32.90'],
          ['Crispy Golden Appetizer', 'Served with house dipping sauce', 'RM 16.90'],
          ['Wok-Seared Noodle Bowl', 'Fresh market greens & aromatic oil', 'RM 21.90'],
          ['Artisan Craft Beverage', 'Handcrafted chilled refresher', 'RM 12.90'],
          ['Signature Dessert Pairing', 'Warm house-baked sweet finish', 'RM 15.90']
        ];

  const startY = 294;
  const rowStep = 74;
  items.forEach(([title, desc, price], idx) => {
    const ry = startY + idx * rowStep;
    if (idx % 2 === 1) {
      ctx.fillStyle = isBhc ? 'rgba(255,255,255,0.04)' : 'rgba(139, 94, 52, 0.06)';
      ctx.fillRect(54, ry - 36, W - 108, 64);
    }
    ctx.fillStyle = isBhc ? '#f8fafc' : '#181e29';
    ctx.textAlign = 'left';
    fillAutoFitText(ctx, title, 68, ry - 4, 620, 28, '700', '"Montserrat", sans-serif', 0);

    ctx.fillStyle = isBhc ? '#94a3b8' : '#57534e';
    fillAutoFitText(ctx, desc, 68, ry + 20, 620, 17, '500', '"Montserrat", sans-serif', 0);

    ctx.fillStyle = isBhc ? '#facc15' : '#9a3412';
    ctx.textAlign = 'right';
    fillAutoFitText(ctx, price, W - 68, ry + 4, 210, 28, '800', '"Jost", sans-serif', 1);
  });

  const tex = finalizeTexture(c, { srgb: true });
  menuStandCache.set(key, tex);
  return tex;
}

/**
 * Vertical-Grain Honey Oak Timber PBR Maps (MODU Korean Hanok vertical posts — ZERO horizontal brick stripes!)
 */
let cachedVertOak = null;
export function createVerticalOakMaps(repeatX = 1, repeatY = 2) {
  if (cachedVertOak) return cachedVertOak;
  const s = 512;
  const planks = 6;
  const step = s / planks;
  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');
  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, s, s);
  for (let i = 0; i < planks; i++) {
    const x0 = i * step;
    const sh = 0.90 + hash2(i, 7.3) * 0.18;
    ctxA.fillStyle = `rgb(${Math.floor(204 * sh)},${Math.floor(164 * sh)},${Math.floor(118 * sh)})`;
    ctxA.fillRect(x0, 0, step - 2, s);
    for (let g = 0; g < 16; g++) {
      ctxA.fillStyle = g % 2 === 0 ? 'rgba(110,72,34,0.11)' : 'rgba(255,236,204,0.10)';
      ctxA.fillRect(x0 + g * (step / 16), 0, 2, s);
    }
    ctxA.fillStyle = '#7c5834';
    ctxA.fillRect(x0 + step - 2, 0, 2, s);
    ctxN.fillStyle = 'rgb(92,128,238)';
    ctxN.fillRect(x0, 0, 2, s);
  }
  cachedVertOak = {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY })
  };
  return cachedVertOak;
}

/**
 * Warm Light-Oak Wood Plank Floor & Hanok Timber PBR Maps (Adidas Floor & MODU Samgyetang!)
 */
let cachedOakPlanks = null;
export function createOakPlankMaps(repeatX = 3, repeatY = 2) {
  if (cachedOakPlanks) return cachedOakPlanks;
  const s = 512;
  const planks = 8;
  const step = s / planks;
  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');
  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, s, s);

  for (let i = 0; i < planks; i++) {
    const y0 = i * step;
    const sh = 0.88 + hash2(i, 3.1) * 0.22;
    ctxA.fillStyle = `rgb(${Math.floor(212 * sh)},${Math.floor(176 * sh)},${Math.floor(132 * sh)})`;
    ctxA.fillRect(0, y0, s, step - 3);
    for (let g = 0; g < 18; g++) {
      ctxA.fillStyle = g % 2 === 0 ? 'rgba(110,72,36,0.12)' : 'rgba(255,236,204,0.12)';
      ctxA.fillRect(0, y0 + g * (step / 18), s, 2);
    }
    ctxA.fillStyle = '#6c4d2e';
    ctxA.fillRect(0, y0 + step - 3, s, 3);
    ctxN.fillStyle = 'rgb(128,90,235)';
    ctxN.fillRect(0, y0, s, 3);
  }
  cachedOakPlanks = {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY })
  };
  return cachedOakPlanks;
}

/**
 * Gridded Warm Amber Translucent Glass-Block Transom Maps for Coach (G309) (Kills flat safety-orange plastic box!)
 */
let cachedAmberGlassBlocks = null;
export function createAmberGlassBlockMaps() {
  if (cachedAmberGlassBlocks) return cachedAmberGlassBlocks;
  const w = 512;
  const h = 128;
  const cA = document.createElement('canvas');
  cA.width = w;
  cA.height = h;
  const ctx = cA.getContext('2d');
  ctx.fillStyle = '#3b2616';
  ctx.fillRect(0, 0, w, h);
  const cols = 16;
  const rows = 3;
  const cw = w / cols;
  const ch = h / rows;
  for (let gx = 0; gx < cols; gx++) {
    for (let gy = 0; gy < rows; gy++) {
      const x0 = gx * cw;
      const y0 = gy * ch;
      const rg = ctx.createRadialGradient(x0 + cw * 0.5, y0 + ch * 0.5, 2, x0 + cw * 0.5, y0 + ch * 0.5, cw * 0.65);
      rg.addColorStop(0, '#f8d288');
      rg.addColorStop(0.55, '#c9883a');
      rg.addColorStop(1, '#7a491c');
      ctx.fillStyle = rg;
      ctx.fillRect(x0 + 2, y0 + 2, cw - 4, ch - 4);
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x0 + 3, y0 + 3, cw - 6, ch - 6);
    }
  }
  cachedAmberGlassBlocks = finalizeTexture(cA, { srgb: true, repeatX: 2, repeatY: 1 });
  return cachedAmberGlassBlocks;
}

/**
 * Warm Porous Beige-Champagne Travertine Limestone PBR Maps (Zara piers/tables, Parkson piers, 3F Rainforest Canopy Overlook parapet!)
 */
const travertineCache = new Map();
export function createTravertineStoneMaps(repeatX = 2, repeatY = 2) {
  const cacheKey = `${repeatX}:${repeatY}`;
  if (travertineCache.has(cacheKey)) return travertineCache.get(cacheKey);

  const s = 1024;
  const rows = 4;
  const cols = 2;
  const rowH = s / rows;
  const colW = s / cols;

  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');

  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');

  const cR = document.createElement('canvas');
  cR.width = cR.height = s;
  const ctxR = cR.getContext('2d');

  // Base warm champagne travertine
  ctxA.fillStyle = '#d6c7b0';
  ctxA.fillRect(0, 0, s, s);
  ctxN.fillStyle = 'rgb(128,128,255)';
  ctxN.fillRect(0, 0, s, s);
  ctxR.fillStyle = 'rgb(148,148,148)';
  ctxR.fillRect(0, 0, s, s);

  // Subtle ashlar stone block tonal variations
  for (let r = 0; r < rows; r++) {
    const y0 = r * rowH;
    const xOffset = (r % 2) * (colW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x0 = c * colW + xOffset;
      const v = hash2(r * 7 + c, 13.7);
      const tone = 208 + Math.floor((v - 0.5) * 14);
      ctxA.fillStyle = `rgb(${tone + 10},${tone - 4},${tone - 24})`;
      ctxA.fillRect(x0 + 2, y0 + 2, colW - 4, rowH - 4);

      const rv = 140 + Math.floor((hash2(c + 5, r + 9) - 0.5) * 22);
      ctxR.fillStyle = `rgb(${rv},${rv},${rv})`;
      ctxR.fillRect(x0 + 2, y0 + 2, colW - 4, rowH - 4);
    }
  }

  // Realistic horizontal mineral vein strata bands (calcite & warm ochre layers)
  for (let i = 0; i < 96; i++) {
    const yBase = hash2(i, 2.9) * s;
    const bandH = 3 + hash2(i, 7.1) * 14;
    const isLight = i % 3 === 0;
    const alpha = 0.08 + hash2(i, 4.3) * 0.14;
    ctxA.fillStyle = isLight
      ? `rgba(246, 239, 224, ${alpha.toFixed(3)})`
      : i % 2 === 0
        ? `rgba(174, 149, 114, ${alpha.toFixed(3)})`
        : `rgba(138, 116, 86, ${(alpha * 0.85).toFixed(3)})`;

    ctxA.beginPath();
    ctxA.moveTo(0, yBase);
    for (let x = 0; x <= s; x += 64) {
      const wave = Math.sin((x / s) * Math.PI * 2 + i * 1.4) * 3.5;
      ctxA.lineTo(x, yBase + wave);
    }
    for (let x = s; x >= 0; x -= 64) {
      const wave = Math.sin((x / s) * Math.PI * 2 + i * 1.4 + 0.5) * 3.5;
      ctxA.lineTo(x, yBase + bandH + wave);
    }
    ctxA.closePath();
    ctxA.fill();

    // Mineralized calcite bands are slightly smoother; normal subtle strata undulation
    ctxR.fillStyle = isLight ? 'rgba(112,112,112,0.34)' : 'rgba(168,168,168,0.28)';
    ctxR.fillRect(0, yBase, s, bandH * 0.7);
    ctxN.fillStyle = i % 2 === 0 ? 'rgba(128,136,252,0.28)' : 'rgba(128,120,252,0.28)';
    ctxN.fillRect(0, yBase, s, bandH * 0.5);
  }

  // Characteristic porous travertine elongated horizontal vugs / micro-pits
  for (let p = 0; p < 420; p++) {
    const px = hash2(p, 1.7) * s;
    const py = hash2(p, 8.3) * s;
    const pw = 3 + hash2(p, 5.5) * 14;
    const ph = 1.2 + hash2(p, 9.1) * 2.4;
    const pitAlpha = 0.14 + hash2(p, 3.3) * 0.22;
    ctxA.fillStyle = `rgba(104, 84, 60, ${pitAlpha.toFixed(3)})`;
    ctxA.fillRect(px, py, pw, ph);

    ctxR.fillStyle = 'rgb(208,208,208)';
    ctxR.fillRect(px, py, pw, ph);

    ctxN.fillStyle = 'rgb(128,96,238)';
    ctxN.fillRect(px, py, pw, Math.max(1, ph * 0.5));
    ctxN.fillStyle = 'rgb(128,160,238)';
    ctxN.fillRect(px, py + ph * 0.5, pw, Math.max(1, ph * 0.5));
  }

  // Subtle staggered ashlar joint seams
  ctxA.strokeStyle = '#9c8b74';
  ctxA.lineWidth = 3;
  ctxR.strokeStyle = 'rgb(218,218,218)';
  ctxR.lineWidth = 4;

  for (let r = 0; r < rows; r++) {
    const y0 = r * rowH;
    // Horizontal course seam
    ctxA.beginPath();
    ctxA.moveTo(0, y0);
    ctxA.lineTo(s, y0);
    ctxA.stroke();

    ctxR.beginPath();
    ctxR.moveTo(0, y0);
    ctxR.lineTo(s, y0);
    ctxR.stroke();

    ctxN.fillStyle = 'rgb(128,92,240)';
    ctxN.fillRect(0, y0, s, 2);
    ctxN.fillStyle = 'rgb(128,164,240)';
    ctxN.fillRect(0, y0 + 2, s, 2);

    // Staggered vertical ashlar joints
    const xOffset = (r % 2) * (colW * 0.5);
    for (let c = 0; c <= cols; c++) {
      const vx = ((c * colW + xOffset) % s + s) % s;
      ctxA.beginPath();
      ctxA.moveTo(vx, y0);
      ctxA.lineTo(vx, y0 + rowH);
      ctxA.stroke();

      ctxR.beginPath();
      ctxR.moveTo(vx, y0);
      ctxR.lineTo(vx, y0 + rowH);
      ctxR.stroke();

      ctxN.fillStyle = 'rgb(92,128,240)';
      ctxN.fillRect(vx, y0, 2, rowH);
      ctxN.fillStyle = 'rgb(164,128,240)';
      ctxN.fillRect(vx + 2, y0, 2, rowH);
    }
  }

  const out = {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX, repeatY })
  };
  travertineCache.set(cacheKey, out);
  return out;
}

/**
 * High-Frequency Architectural Ribbed Commercial Carpet PBR Maps (Game On Sports Hub electric-orange entrance tunnel!)
 */
const ribbedCarpetCache = new Map();
export function createRibbedCarpetMaps(hex = '#ea580c', repeatX = 6, repeatY = 6) {
  const cacheKey = `${hex}:${repeatX}:${repeatY}`;
  if (ribbedCarpetCache.has(cacheKey)) return ribbedCarpetCache.get(cacheKey);

  const cleanHex = typeof hex === 'string' && hex.startsWith('#') && hex.length === 7 ? hex.slice(1) : 'ea580c';
  const baseR = parseInt(cleanHex.slice(0, 2), 16);
  const baseG = parseInt(cleanHex.slice(2, 4), 16);
  const baseB = parseInt(cleanHex.slice(4, 6), 16);

  const s = 512;
  const ribPitch = 8; // 64 high-frequency architectural ribs across 512px

  const cA = document.createElement('canvas');
  cA.width = cA.height = s;
  const ctxA = cA.getContext('2d');

  const cN = document.createElement('canvas');
  cN.width = cN.height = s;
  const ctxN = cN.getContext('2d');

  const cR = document.createElement('canvas');
  cR.width = cR.height = s;
  const ctxR = cR.getContext('2d');

  // Base ribbed channels + crests
  for (let x = 0; x < s; x += ribPitch) {
    // Left rib slope
    ctxA.fillStyle = `rgb(${Math.min(255, Math.floor(baseR * 1.04))},${Math.min(255, Math.floor(baseG * 1.04))},${Math.min(255, Math.floor(baseB * 1.04))})`;
    ctxA.fillRect(x, 0, 2, s);
    // Raised rib crown
    ctxA.fillStyle = `rgb(${Math.min(255, Math.floor(baseR * 1.12))},${Math.min(255, Math.floor(baseG * 1.12))},${Math.min(255, Math.floor(baseB * 1.12))})`;
    ctxA.fillRect(x + 2, 0, 2, s);
    // Right rib slope
    ctxA.fillStyle = `rgb(${Math.floor(baseR * 0.94)},${Math.floor(baseG * 0.94)},${Math.floor(baseB * 0.94)})`;
    ctxA.fillRect(x + 4, 0, 2, s);
    // Deep recessed rib trough
    ctxA.fillStyle = `rgb(${Math.floor(baseR * 0.72)},${Math.floor(baseG * 0.72)},${Math.floor(baseB * 0.72)})`;
    ctxA.fillRect(x + 6, 0, 2, s);

    // High-frequency rib normal profile
    ctxN.fillStyle = 'rgb(84,128,240)';
    ctxN.fillRect(x, 0, 2, s);
    ctxN.fillStyle = 'rgb(128,128,255)';
    ctxN.fillRect(x + 2, 0, 2, s);
    ctxN.fillStyle = 'rgb(172,128,240)';
    ctxN.fillRect(x + 4, 0, 2, s);
    ctxN.fillStyle = 'rgb(128,128,225)';
    ctxN.fillRect(x + 6, 0, 2, s);

    // Matte fibrous commercial carpet roughness (0.85 - 0.96)
    ctxR.fillStyle = 'rgb(220,220,220)';
    ctxR.fillRect(x, 0, 6, s);
    ctxR.fillStyle = 'rgb(245,245,245)';
    ctxR.fillRect(x + 6, 0, 2, s);
  }

  // Fine woven loop-pile cross-tufting micro-grain so it reads as commercial textile (not plastic stripes)
  for (let x = 0; x < s; x += 4) {
    for (let y = 0; y < s; y += 4) {
      const h = hash2(x * 0.73, y * 1.19);
      ctxA.fillStyle = h > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.11)';
      ctxA.fillRect(x, y, 2, 2);
      const ny = 118 + Math.floor(h * 20);
      ctxN.fillStyle = `rgba(128,${ny},246,0.35)`;
      ctxN.fillRect(x, y, 3, 2);
      const rv = 216 + Math.floor(h * 26);
      ctxR.fillStyle = `rgba(${rv},${rv},${rv},0.55)`;
      ctxR.fillRect(x, y, 3, 3);
    }
  }

  const out = {
    map: finalizeTexture(cA, { srgb: true, repeatX, repeatY }),
    normalMap: finalizeTexture(cN, { srgb: false, repeatX, repeatY }),
    roughnessMap: finalizeTexture(cR, { srgb: false, repeatX, repeatY })
  };
  ribbedCarpetCache.set(cacheKey, out);
  return out;
}

// ============================================================================
// PHOTO-MATCHED 1 UTAMA BESPOKE BRAND MEDALLION, BACKWALL & BOOTH LOGOS (ROUND-13)
// ============================================================================

let cachedSushiZanmaiLogoTex = null;
export function createSushiZanmaiLogoTexture() {
  if (cachedSushiZanmaiLogoTex) return cachedSushiZanmaiLogoTex;
  const w = 1024;
  const h = 640;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // EXACT Photo-Match to real 1 Utama SK9A Sushi Zanmai (2_SK9A_SUSHI_ZANMAI.jpg):
  // Thick organic matcha-sage dry-brush donut ring (#84a942) with COMPLETELY OPEN transparent center so wooden dowels show through!
  ctx.save();
  ctx.translate(410, 320);
  for (let pass = 0; pass < 6; pass++) {
    ctx.strokeStyle = pass < 2 ? '#7ea33b' : pass < 4 ? '#8eb448' : '#6f9430';
    ctx.lineWidth = 86 - pass * 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(pass * 3 - 6, pass * 2 - 4, 186 - pass * 3, -Math.PI * 0.42 + pass * 0.05, Math.PI * 1.46 - pass * 0.04);
    ctx.stroke();
  }
  ctx.restore();

  // Vertical bold Japanese calligraphy 寿司三昧 running down the LEFT rim with radiant warm backlit white halo glow!
  const kanji = ['寿', '司', '三', '昧'];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 108px "Noto Serif JP", "Yu Mincho", serif';
  kanji.forEach((ch, i) => {
    const ky = 128 + i * 124;
    ctx.save();
    ctx.shadowColor = '#fffde7';
    ctx.shadowBlur = 24;
    ctx.strokeStyle = '#fffde7';
    ctx.lineWidth = 14;
    ctx.strokeText(ch, 212, ky);
    ctx.fillStyle = '#0e0e0e';
    ctx.fillText(ch, 212, ky);
    ctx.restore();
  });

  // Horizontal bold brush-script "Sushi Zanmai" spanning across center-right with radiant warm backlit halo (unclipped full 'i'!)
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'italic 900 88px "Georgia", "Times New Roman", serif';
  ctx.shadowColor = '#fffde7';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = '#fffde7';
  ctx.lineWidth = 13;
  ctx.strokeText('Sushi Zanmai', 282, 314, 650);
  ctx.fillStyle = '#0d0d0d';
  ctx.fillText('Sushi Zanmai', 282, 314, 650);
  ctx.restore();

  // Authentic crimson-red rectangular スシ stamp nestled at bottom-center of the green brush ring!
  ctx.save();
  ctx.translate(476, 480);
  ctx.rotate(0.06);
  ctx.fillStyle = '#b91c1c';
  ctx.fillRect(-78, -42, 156, 84);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 52px "Noto Serif JP", sans-serif';
  ctx.fillText('スシ', 0, 2);
  ctx.restore();

  cachedSushiZanmaiLogoTex = finalizeTexture(c, { srgb: true });
  return cachedSushiZanmaiLogoTex;
}

let cachedMrDiyPillarTex = null;
export function createMrDiyPillarTexture() {
  if (cachedMrDiyPillarTex) return cachedMrDiyPillarTex;
  const w = 512;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  // Photo-matched warm burnt-orange textured pillar from 2_S319_MR_D_I_Y_.jpg
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#dd6118');
  g.addColorStop(0.5, '#ea6a1e');
  g.addColorStop(1, '#c85012');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // Subtle horizontal wood-plaster architectural seams
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < h; y += 36) ctx.fillRect(0, y, w, 2);
  // Crisp signature white painted "Always Low prices" typography directly on the orange column!
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.font = '600 54px "Plus Jakarta Sans", "Jost", sans-serif';
  ctx.fillText('Always', 52, 236);
  ctx.font = '800 132px "Plus Jakarta Sans", "Jost", sans-serif';
  ctx.fillText('Low', 112, 360);
  ctx.font = '600 54px "Plus Jakarta Sans", "Jost", sans-serif';
  ctx.fillText('prices', 246, 434);
  cachedMrDiyPillarTex = finalizeTexture(c, { srgb: true });
  return cachedMrDiyPillarTex;
}

let cachedMrDiyHammerTex = null;
export function createMrDiyHammerBadgeTexture() {
  if (cachedMrDiyHammerTex) return cachedMrDiyHammerTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);

  // Circular bright yellow MR. D.I.Y. medallion badge
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(256, 256, 242, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Cartoon smiling yellow-and-red hammer mascot centered above MR.D.I.Y.
  ctx.save();
  ctx.translate(256, 200);
  // Hammer handle
  ctx.fillStyle = '#b45309';
  drawRoundRectPath(ctx, -20, 0, 40, 128, 14);
  ctx.fill();
  // Hammer steel/red head
  ctx.fillStyle = '#dc2626';
  drawRoundRectPath(ctx, -98, -74, 196, 86, 22);
  ctx.fill();
  ctx.strokeStyle = '#18181b';
  ctx.lineWidth = 8;
  ctx.stroke();
  // Friendly cartoon eyes & smile
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-32, -34, 18, 0, Math.PI * 2);
  ctx.arc(32, -34, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111827';
  ctx.beginPath();
  ctx.arc(-28, -32, 9, 0, Math.PI * 2);
  ctx.arc(28, -32, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, -16, 26, 0.2, Math.PI - 0.2);
  ctx.stroke();
  ctx.restore();

  // Bold red MR.D.I.Y. wordmark inside bottom half of badge
  ctx.textAlign = 'center';
  ctx.font = '900 72px "Montserrat", "Jost", sans-serif';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.strokeText('MR.D.I.Y.', 256, 396);
  ctx.fillStyle = '#dc2626';
  ctx.fillText('MR.D.I.Y.', 256, 396);

  cachedMrDiyHammerTex = finalizeTexture(c, { srgb: true });
  return cachedMrDiyHammerTex;
}

let cachedMrDiyChalkTex = null;
export function createMrDiyChalkboardTexture() {
  if (cachedMrDiyChalkTex) return cachedMrDiyChalkTex;
  const w = 512;
  const h = 768;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#1d2026';
  ctx.fillRect(0, 0, w, h);

  // Subtle chalk smudge grain
  for (let i = 0; i < 320; i++) {
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(hash2(i, 3.1) * w, hash2(i, 8.7) * h, 26, 10);
  }
  ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
  ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
  ctx.lineWidth = 3.5;

  // Hand-drawn white chalk DIY tool line-art motifs (wrench, lightbulb, hammer, tape, gear, scissors)
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const cx = 86 + col * 170;
      const cy = 96 + row * 136;
      const kind = (row * 3 + col) % 4;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(((row + col) % 3 - 1) * 0.35);
      if (kind === 0) {
        // Chalk wrench
        ctx.strokeRect(-10, -34, 20, 68);
        ctx.beginPath();
        ctx.arc(0, -40, 20, 0.4, Math.PI * 2 - 0.4);
        ctx.stroke();
      } else if (kind === 1) {
        // Chalk lightbulb
        ctx.beginPath();
        ctx.arc(0, -10, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeRect(-10, 14, 20, 16);
      } else if (kind === 2) {
        // Chalk hammer
        ctx.strokeRect(-8, -8, 16, 46);
        ctx.strokeRect(-32, -32, 64, 24);
      } else {
        // Chalk gear
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#facc15';
  ctx.font = '800 32px "Jost", sans-serif';
  ctx.fillText('ALWAYS LOW PRICES', w * 0.5, h - 42);

  cachedMrDiyChalkTex = finalizeTexture(c, { srgb: true });
  return cachedMrDiyChalkTex;
}

let cachedIppudoDividerTex = null;
export function createIppudoDividerTexture() {
  if (cachedIppudoDividerTex) return cachedIppudoDividerTex;
  const w = 1024;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#585c62';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 450; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
    ctx.fillRect(hash2(i, 1.7) * w, hash2(i, 5.3) * h, 18, 6);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 44px "Jost", sans-serif';
  ctx.fillText('SMILE   •   ARIGATOU   •   一風堂', w * 0.5, 118);
  ctx.fillStyle = '#e2e8f0';
  ctx.font = '500 22px "Jost", sans-serif';
  ctx.fillText('HAKATA TONKOTSU RAMEN  •  ESTABLISHED 1985', w * 0.5, 174);
  cachedIppudoDividerTex = finalizeTexture(c, { srgb: true });
  return cachedIppudoDividerTex;
}

let cachedBhcBackwallTex = null;
export function createBhcBackwallSignTexture() {
  if (cachedBhcBackwallTex) return cachedBhcBackwallTex;
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  // Raw textured grey Venetian plaster back wall
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#6a6e73');
  bg.addColorStop(0.5, '#7c8086');
  bg.addColorStop(1, '#5e6268');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.05)';
    ctx.fillRect(hash2(i, 2.1) * w, hash2(i, 7.9) * h, 42, 16);
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#facc15';
  ctx.font = '900 132px "Montserrat", "Jost", sans-serif';
  ctx.fillText('bhc', w * 0.35, 250);
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 92px "Jost", sans-serif';
  ctx.fillText('CHICKEN', w * 0.67, 246);
  ctx.fillStyle = '#fde68a';
  ctx.font = '700 32px "Jost", sans-serif';
  ctx.fillText('TASTE THE ORIGINAL KOREAN FLAVOUR', w * 0.5, 336);
  cachedBhcBackwallTex = finalizeTexture(c, { srgb: true });
  return cachedBhcBackwallTex;
}

let cachedZusPastryMedallionTex = null;
export function createZusPastryMedallionTexture() {
  if (cachedZusPastryMedallionTex) return cachedZusPastryMedallionTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = '#0f2e78';
  ctx.beginPath();
  ctx.arc(256, 256, 242, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 84px "Cormorant Garamond", serif';
  ctx.fillText('coffee', 256, 218);
  ctx.font = '700 30px "Jost", sans-serif';
  ctx.fillText('MEETS PASTRY', 256, 274);
  ctx.fillStyle = '#93c5fd';
  ctx.font = '800 54px "Jost", sans-serif';
  ctx.fillText('BY ZUS', 256, 348);
  cachedZusPastryMedallionTex = finalizeTexture(c, { srgb: true });
  return cachedZusPastryMedallionTex;
}

let cachedStarbucksSirenTex = null;
export function createStarbucksSirenTexture() {
  if (cachedStarbucksSirenTex) return cachedStarbucksSirenTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, s, s);
  ctx.fillStyle = '#00704a';
  ctx.beginPath();
  ctx.arc(256, 256, 242, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(256, 256, 224, 0, Math.PI * 2);
  ctx.stroke();
  // Stylized iconic white Siren crown, flowing twin hair waves & central star
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(256, 226, 46, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(192, 168);
  ctx.lineTo(222, 126);
  ctx.lineTo(256, 152);
  ctx.lineTo(290, 126);
  ctx.lineTo(320, 168);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 16;
  for (const side of [-1, 1]) {
    for (let w = 0; w < 3; w++) {
      ctx.beginPath();
      ctx.arc(256 + side * (86 + w * 26), 278, 56 + w * 14, side > 0 ? Math.PI * 0.65 : -Math.PI * 0.35, side > 0 ? Math.PI * 1.45 : Math.PI * 0.45);
      ctx.stroke();
    }
  }
  ctx.fillStyle = '#00704a';
  ctx.beginPath();
  ctx.arc(256, 232, 26, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 42px "Jost", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('★', 256, 150);
  cachedStarbucksSirenTex = finalizeTexture(c, { srgb: true });
  return cachedStarbucksSirenTex;
}

let cachedComeTrueWallTex = null;
export function createComeTrueWallLogoTexture() {
  if (cachedComeTrueWallTex) return cachedComeTrueWallTex;
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#c8ccd0';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = '#2e3338';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(256, 195, 76, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(256, 195, 50, 0.3, Math.PI * 1.85);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(256, 195, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#25292e';
  ctx.font = '700 44px "Jost", sans-serif';
  ctx.fillText('Come True CAFE', 256, 344);
  ctx.font = '700 34px "Noto Serif JP", serif';
  ctx.fillText('成 真 咖 啡', 256, 398);
  cachedComeTrueWallTex = finalizeTexture(c, { srgb: true });
  return cachedComeTrueWallTex;
}

let cachedRollerWaNeonTex = null;
export function createRollerWaNeonSignTexture() {
  if (cachedRollerWaNeonTex) return cachedRollerWaNeonTex;
  const w = 1024;
  const h = 384;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#111d4a';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.shadowColor = '#93c5fd';
  ctx.shadowBlur = 24;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 700 156px "Playfair Display", "Cormorant Garamond", serif';
  ctx.fillText('RollerWa', w * 0.5, 236);
  ctx.shadowBlur = 0;
  cachedRollerWaNeonTex = finalizeTexture(c, { srgb: true });
  return cachedRollerWaNeonTex;
}

let cachedRollerWaSkateTex = null;
export function createRollerWaSkateIconTexture() {
  if (cachedRollerWaSkateTex) return cachedRollerWaSkateTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#3b3532';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = '#f472b6';
  ctx.shadowBlur = 22;
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  // Glowing white neon quad roller-skate outline
  ctx.beginPath();
  ctx.moveTo(156, 118);
  ctx.lineTo(256, 118);
  ctx.lineTo(268, 224);
  ctx.quadraticCurveTo(356, 232, 376, 294);
  ctx.lineTo(376, 326);
  ctx.lineTo(136, 326);
  ctx.lineTo(156, 118);
  ctx.closePath();
  ctx.stroke();
  // 4 neon quad skate wheels
  for (const wx of [174, 232, 298, 352]) {
    ctx.beginPath();
    ctx.arc(wx, 368, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
  cachedRollerWaSkateTex = finalizeTexture(c, { srgb: true });
  return cachedRollerWaSkateTex;
}

let cachedPjpacMonogramTex = null;
export function createPjpacMonogramTexture() {
  if (cachedPjpacMonogramTex) return cachedPjpacMonogramTex;
  const s = 512;
  const c = document.createElement('canvas');
  c.width = c.height = s;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, s, s);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 22;
  ctx.strokeRect(20, 20, s - 40, s - 40);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f59e0b';
  ctx.font = '900 132px "Jost", sans-serif';
  ctx.fillText('PJ', 256, 224);
  ctx.fillStyle = '#18181b';
  ctx.font = '900 124px "Jost", sans-serif';
  ctx.fillText('PAC', 256, 358);
  ctx.fillStyle = '#64748b';
  ctx.font = '700 26px "Jost", sans-serif';
  ctx.fillText('PERFORMING ARTS CENTRE', 256, 434);
  cachedPjpacMonogramTex = finalizeTexture(c, { srgb: true });
  return cachedPjpacMonogramTex;
}

let cachedWindlabBackwallTex = null;
export function createWindlabBackwallSignTexture() {
  if (cachedWindlabBackwallTex) return cachedWindlabBackwallTex;
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0c0e13';
  ctx.fillRect(0, 0, w, h);
  // Glowing orange turbofan emblem + crisp white WINDLAB INDOOR SKYDIVING
  ctx.strokeStyle = '#f97316';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(210, 232, 74, 0, Math.PI * 2);
  ctx.stroke();
  for (let b = 0; b < 6; b++) {
    const a = (b / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(210, 232);
    ctx.lineTo(210 + Math.cos(a) * 64, 232 + Math.sin(a) * 64);
    ctx.stroke();
  }
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 108px "Jost", sans-serif';
  ctx.fillText('WINDLAB', 324, 248);
  ctx.fillStyle = '#fb923c';
  ctx.font = '700 36px "Jost", sans-serif';
  ctx.fillText('INDOOR SKYDIVING  •  1 UTAMA E', 328, 316);
  cachedWindlabBackwallTex = finalizeTexture(c, { srgb: true });
  return cachedWindlabBackwallTex;
}

let cachedPhotoismStripTex = null;
export function createPhotoismStripTexture() {
  if (cachedPhotoismStripTex) return cachedPhotoismStripTex;
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#18181b';
  ctx.fillRect(0, 0, w, h);
  const stripCols = ['#f472b6', '#38bdf8', '#facc15', '#a78bfa'];
  for (let st = 0; st < 4; st++) {
    const sx = 24 + st * 120;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(sx, 24, 102, 464);
    for (let fr = 0; fr < 4; fr++) {
      ctx.fillStyle = stripCols[(st + fr) % stripCols.length];
      ctx.fillRect(sx + 8, 36 + fr * 98, 86, 86);
      // Tiny smiling portrait silhouette inside each 4-cut frame
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(sx + 51, 70 + fr * 98, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sx + 51, 114 + fr * 98, 24, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#18181b';
    ctx.textAlign = 'center';
    ctx.font = '700 13px "Jost", sans-serif';
    ctx.fillText('PHOTOISM', sx + 51, 466);
  }
  cachedPhotoismStripTex = finalizeTexture(c, { srgb: true });
  return cachedPhotoismStripTex;
}

const cachedRestroomWayfinding = new Map();
export function createRestroomWayfindingTexture(surauLabel = 'SURAU') {
  if (cachedRestroomWayfinding.has(surauLabel)) return cachedRestroomWayfinding.get(surauLabel);
  const w = 1024;
  const h = 160;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Sleek 1 Utama dark brushed-espresso architectural wayfinding bar (subtle, NEVER a shopfront!)
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#272320');
  bg.addColorStop(1, '#1a1715');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Thin brushed-champagne hairline border
  ctx.strokeStyle = '#c9a96e';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, w - 12, h - 12);

  // Minimalist crisp vector pictograms on left: Male | Female | OKU | Baby | Mosque Dome
  const drawMan = (cx, cy) => {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(cx, cy - 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 10, cy - 13, 20, 24);
    ctx.fillRect(cx - 9, cy + 11, 7, 22);
    ctx.fillRect(cx + 2, cy + 11, 7, 22);
  };
  const drawWoman = (cx, cy) => {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath(); ctx.arc(cx, cy - 26, 9, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 13); ctx.lineTo(cx + 7, cy - 13);
    ctx.lineTo(cx + 15, cy + 16); ctx.lineTo(cx - 15, cy + 16);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - 8, cy + 16, 6, 17);
    ctx.fillRect(cx + 2, cy + 16, 6, 17);
  };
  const drawOku = (cx, cy) => {
    ctx.strokeStyle = '#f8fafc'; ctx.fillStyle = '#f8fafc'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(cx - 2, cy - 24, 7, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx - 4, cy + 14, 15, 0.25 * Math.PI, 1.55 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 2, cy - 14); ctx.lineTo(cx - 2, cy + 4); ctx.lineTo(cx + 12, cy + 4); ctx.lineTo(cx + 16, cy + 22); ctx.stroke();
  };
  const drawMosque = (cx, cy) => {
    ctx.fillStyle = '#e2c285';
    ctx.beginPath();
    ctx.arc(cx, cy + 2, 18, Math.PI, 0);
    ctx.lineTo(cx + 18, cy + 24);
    ctx.lineTo(cx - 18, cy + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - 2, cy - 28, 4, 14);
    ctx.beginPath(); ctx.arc(cx, cy - 28, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1f1c19';
    ctx.beginPath(); ctx.arc(cx, cy + 24, 7, Math.PI, 0); ctx.fill();
  };

  drawMan(68, 80);
  drawWoman(116, 80);
  drawOku(172, 80);

  ctx.fillStyle = '#524940';
  ctx.fillRect(212, 34, 2, 92);

  drawMosque(252, 82);

  // Clean bilingual Malaysian mall wayfinding typography (auto-fitted — ZERO right-edge clipping!)
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '700 30px "Plus Jakarta Sans", "Jost", sans-serif';
  ctx.fillText(`RESTROOMS  •  BABY ROOM  •  ${surauLabel}`, 296, 62, 696);

  ctx.fillStyle = '#d4b882';
  ctx.font = '600 21px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('TANDAS LELAKI & WANITA  •  OKU  •  BILIK BAYI  •  SURAU & WUDHU', 296, 108, 696);

  const tex = finalizeTexture(c, { srgb: true });
  cachedRestroomWayfinding.set(surauLabel, tex);
  return tex;
}

const cachedDoorPlaques = new Map();
export function createDoorPlaqueTexture(iconKind, title, subtitle, bgHex = '#272320', fgHex = '#f8fafc', accentHex = '#c9a96e') {
  const key = `${iconKind}|${title}|${subtitle}|${bgHex}`;
  if (cachedDoorPlaques.has(key)) return cachedDoorPlaques.get(key);
  const w = 512;
  const h = 160;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Icon badge on left
  ctx.fillStyle = accentHex;
  ctx.fillRect(22, 22, 106, 116);
  ctx.fillStyle = bgHex;
  const cx = 75;
  const cy = 80;
  if (iconKind === 'male') {
    ctx.beginPath(); ctx.arc(cx, cy - 28, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(cx - 12, cy - 13, 24, 28);
    ctx.fillRect(cx - 10, cy + 15, 8, 24);
    ctx.fillRect(cx + 2, cy + 15, 8, 24);
  } else if (iconKind === 'female') {
    ctx.beginPath(); ctx.arc(cx, cy - 28, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 13); ctx.lineTo(cx + 8, cy - 13);
    ctx.lineTo(cx + 18, cy + 18); ctx.lineTo(cx - 18, cy + 18);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - 9, cy + 18, 7, 20);
    ctx.fillRect(cx + 2, cy + 18, 7, 20);
  } else if (iconKind === 'baby') {
    ctx.beginPath(); ctx.arc(cx, cy - 20, 14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + 14, 22, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 22, cy + 14, 44, 18);
  } else {
    // Surau subtle dome
    ctx.beginPath();
    ctx.arc(cx, cy + 4, 22, Math.PI, 0);
    ctx.lineTo(cx + 22, cy + 32);
    ctx.lineTo(cx - 22, cy + 32);
    ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - 2.5, cy - 30, 5, 16);
    ctx.fillStyle = accentHex;
    ctx.beginPath(); ctx.arc(cx, cy + 32, 9, Math.PI, 0); ctx.fill();
  }

  ctx.fillStyle = fgHex;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.font = '800 36px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(title, 148, 62, 342);
  ctx.fillStyle = accentHex;
  ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(subtitle, 148, 106, 342);

  const tex = finalizeTexture(c, { srgb: true });
  cachedDoorPlaques.set(key, tex);
  return tex;
}

// ============================================================================
// ROUND-15 PHOTO-EXACT 1 UTAMA LANDMARK TEXTURES
// (Rainforest Striped Bridge Deck, Circular Glass Funnel, Terracotta Tile Floor, Checkered Centre Court Columns!)
// ============================================================================
let cachedRfBridgeStripeTex = null;
export function createRainforestBridgeStripeTexture() {
  if (cachedRfBridgeStripeTex) return cachedRfBridgeStripeTex;
  const w = 512;
  const h = 1024;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Light cream-terrazzo walkway base (#e8e5dd) with subtle stone speckle
  ctx.fillStyle = '#e8e5dd';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) {
    const sx = (i * 197) % w;
    const sy = (i * 313) % h;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(130,126,118,0.12)' : 'rgba(255,255,255,0.18)';
    ctx.fillRect(sx, sy, 2, 2);
  }

  // Alternating transverse dark charcoal-grey (#4d5459) and light cream (#e6e3db) non-slip tile bands in center (100% match to media_1795265138674_d367ad8b.jpg & #009/#019!)
  const bandH = 32;
  const sideMargin = 68;
  for (let y = 0; y < h; y += bandH * 2) {
    ctx.fillStyle = '#4e555b';
    ctx.fillRect(sideMargin, y, w - sideMargin * 2, bandH);
    // Subtle dark-slate micro-grain on dark bands
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(sideMargin, y + 2, w - sideMargin * 2, 3);
  }
  // Fine architectural tile grout lines (horizontal + vertical border seams)
  ctx.strokeStyle = 'rgba(92, 96, 100, 0.28)';
  ctx.lineWidth = 2;
  for (let y = 0; y <= h; y += bandH) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
  for (const vx of [sideMargin, w - sideMargin, w * 0.5]) {
    ctx.beginPath();
    ctx.moveTo(vx, 0);
    ctx.lineTo(vx, h);
    ctx.stroke();
  }

  const tex = finalizeTexture(c, { repeatX: 1, repeatY: 4, srgb: true });
  cachedRfBridgeStripeTex = tex;
  return tex;
}

let cachedRfGlassGridTex = null;
export function createRainforestGlassGridTexture() {
  if (cachedRfGlassGridTex) return cachedRfGlassGridTex;
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Bright daylight sky-tinted clear structural curtain-wall glass (#d4ebea) matching circular Rainforest glass funnel
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0.0, 'rgba(232, 246, 250, 0.30)');
  g.addColorStop(0.55, 'rgba(198, 232, 232, 0.34)');
  g.addColorStop(1.0, 'rgba(164, 210, 206, 0.44)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Crisp vertical & horizontal brushed dark-silver / forest-green curtain-wall mullions
  ctx.fillStyle = '#384644';
  const cols = 4;
  const rows = 4;
  for (let i = 0; i <= cols; i++) {
    ctx.fillRect(Math.round((i / cols) * w) - 4, 0, 8, h);
  }
  for (let j = 0; j <= rows; j++) {
    ctx.fillRect(0, Math.round((j / rows) * h) - 4, w, 8);
  }
  // Fine metallic highlight edge on mullions
  ctx.fillStyle = 'rgba(220, 238, 236, 0.45)';
  for (let i = 0; i < cols; i++) {
    ctx.fillRect(Math.round((i / cols) * w) + 4, 0, 2, h);
  }

  const tex = finalizeTexture(c, { repeatX: 10, repeatY: 2.5, srgb: true });
  cachedRfGlassGridTex = tex;
  return tex;
}

let cachedRfTerracottaTex = null;
export function createRainforestTerracottaFloorTexture() {
  if (cachedRfTerracottaTex) return cachedRfTerracottaTex;
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Authentic GF Rainforest diagonal terracotta tile + beige limestone border grid (#352, #383!)
  ctx.fillStyle = '#c9b99e';
  ctx.fillRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(Math.PI / 4);
  const cell = 148;
  for (let gx = -4; gx <= 4; gx++) {
    for (let gy = -4; gy <= 4; gy++) {
      const x0 = gx * cell;
      const y0 = gy * cell;
      ctx.fillStyle = '#b97856';
      ctx.fillRect(x0 + 16, y0 + 16, cell - 32, cell - 32);
      // 3x3 sub-tiles inside each terracotta square
      ctx.strokeStyle = 'rgba(92, 54, 34, 0.35)';
      ctx.lineWidth = 2;
      const sub = (cell - 32) / 3;
      for (let k = 1; k < 3; k++) {
        ctx.beginPath();
        ctx.moveTo(x0 + 16 + k * sub, y0 + 16);
        ctx.lineTo(x0 + 16 + k * sub, y0 + cell - 16);
        ctx.moveTo(x0 + 16, y0 + 16 + k * sub);
        ctx.lineTo(x0 + cell - 16, y0 + 16 + k * sub);
        ctx.stroke();
      }
    }
  }
  ctx.restore();
  const tex = finalizeTexture(c, { repeatX: 0.28, repeatY: 0.28, srgb: true });
  cachedRfTerracottaTex = tex;
  return tex;
}

let cachedBroadleafCanopyTex = null;
export function createBroadleafCanopyClusterTexture() {
  if (cachedBroadleafCanopyTex) return cachedBroadleafCanopyTex;
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  // Thin dark woody branching twigs radiating from center
  ctx.strokeStyle = '#3b2b1d';
  ctx.lineCap = 'round';
  for (let b = 0; b < 9; b++) {
    const ang = (b / 9) * Math.PI * 2 + 0.25;
    const len = 140 + (b % 3) * 35;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(w * 0.5, h * 0.52);
    ctx.quadraticCurveTo(
      w * 0.5 + Math.cos(ang + 0.2) * len * 0.55,
      h * 0.52 + Math.sin(ang + 0.2) * len * 0.55,
      w * 0.5 + Math.cos(ang) * len,
      h * 0.52 + Math.sin(ang) * len
    );
    ctx.stroke();
  }

  // 78 layered individual pointed tropical rainforest leaves (sunlit lime-emerald -> mid rainforest green -> deep shaded forest green)
  const palette = ['#215524', '#2c6e2c', '#3b8832', '#4da13a', '#68b842', '#1b4720', '#7dc44e'];
  for (let i = 0; i < 78; i++) {
    const ring = i < 16 ? 0.24 : i < 44 ? 0.56 : 0.82;
    const ang = i * 2.39996 + (i % 5) * 0.14;
    const dist = ring * 188 + ((i * 29) % 34) - 17;
    const lx = w * 0.5 + Math.cos(ang) * dist;
    const ly = h * 0.5 + Math.sin(ang) * dist;
    const lw = 18 + (i % 5) * 4.5;
    const lh = 44 + (i % 6) * 8.5;
    const rot = ang + Math.sin(i * 1.7) * 0.55;

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    // Pointed botanical tropical leaf silhouette
    ctx.fillStyle = palette[i % palette.length];
    ctx.beginPath();
    ctx.moveTo(0, -lh * 0.5);
    ctx.bezierCurveTo(lw * 0.9, -lh * 0.18, lw * 0.85, lh * 0.28, 0, lh * 0.5);
    ctx.bezierCurveTo(-lw * 0.85, lh * 0.28, -lw * 0.9, -lh * 0.18, 0, -lh * 0.5);
    ctx.closePath();
    ctx.fill();

    // Fine sunlit central midrib & subtle veins
    ctx.strokeStyle = i % 3 === 0 ? 'rgba(182, 232, 118, 0.45)' : 'rgba(22, 54, 24, 0.35)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, -lh * 0.42);
    ctx.lineTo(0, lh * 0.44);
    ctx.stroke();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  cachedBroadleafCanopyTex = tex;
  return tex;
}

let cachedCcColumnTex = null;
export function createCentreCourtCheckeredColumnTexture() {
  if (cachedCcColumnTex) return cachedCcColumnTex;
  const w = 512;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');

  // Iconic Old Wing Centre Court crimson-red column wrap with red/white checkered top & bottom collars (#064, #453!)
  ctx.fillStyle = '#c81e2b';
  ctx.fillRect(0, 0, w, h);
  const sq = 32;
  for (const yStart of [0, 32, h - 64, h - 32]) {
    for (let x = 0; x < w; x += sq) {
      const alt = ((x / sq) + (yStart / sq)) % 2 === 0;
      ctx.fillStyle = alt ? '#ffffff' : '#b91c1c';
      ctx.fillRect(x, yStart, sq, sq);
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 44px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('CENTRE COURT', w * 0.5, h * 0.44);
  ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillStyle = '#fde68a';
  ctx.fillText('1 UTAMA • OLD WING', w * 0.5, h * 0.56);

  const tex = finalizeTexture(c, { srgb: true });
  cachedCcColumnTex = tex;
  return tex;
}
