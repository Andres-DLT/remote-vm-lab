/**
 * Motor matemático de detección de bordes cv2.Sobel + Arte ASCII Botánico
 * Reproduce con precisión el pipeline de OpenCV en Python:
 *   1. Pre-suavizado Gaussiano 3x3
 *   2. Convolución Sobel horizontal (Gx) y vertical (Gy)
 *   3. Magnitud |G| = hypot(Gx, Gy) y orientación θ = (atan2(Gy, Gx) * 180 / π + 180) % 180
 *   4. Mapeo vectorial a caracteres direccionales ('|', '/', '-', '\\') + rampa de luminancia
 */

export const CHAR_RAMPS = {
  classic: {
    name: 'Sobel + Clásica ( .:-=+*#%@)',
    ramp: ' .:-=+*#%@'
  },
  highContrast: {
    name: 'Alto Contraste ( .:+#@)',
    ramp: ' .:+#@'
  },
  botanical: {
    name: 'Botánica Fina ( .·:;!i1tfLCG08@)',
    ramp: ' .·:;!i1tfLCG08@'
  },
  blocks: {
    name: 'Bloques ANSI ( ░▒▓█)',
    ramp: ' ░▒▓█'
  }
};

export const KERNEL_PRESETS = {
  '3': {
    label: 'cv2.Sobel (ksize=3)',
    pyArg: 'ksize=3',
    cliArg: '--ksize 3',
    ksize: 3,
    size: 3,
    gx: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ],
    gy: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ]
  },
  '5': {
    label: 'cv2.Sobel (ksize=5)',
    pyArg: 'ksize=5',
    cliArg: '--ksize 5',
    ksize: 5,
    size: 5,
    gx: [
      [-1, -2, 0, 2, 1],
      [-4, -8, 0, 8, 4],
      [-6, -12, 0, 12, 6],
      [-4, -8, 0, 8, 4],
      [-1, -2, 0, 2, 1]
    ],
    gy: [
      [-1, -4, -6, -4, -1],
      [-2, -8, -12, -8, -2],
      [0, 0, 0, 0, 0],
      [2, 8, 12, 8, 2],
      [1, 4, 6, 4, 1]
    ]
  },
  scharr: {
    label: 'cv2.Sobel (ksize=cv2.FILTER_SCHARR)',
    pyArg: 'ksize=-1',
    cliArg: '--ksize -1',
    ksize: -1,
    size: 3,
    gx: [
      [-3, 0, 3],
      [-10, 0, 10],
      [-3, 0, 3]
    ],
    gy: [
      [-3, -10, -3],
      [0, 0, 0],
      [3, 10, 3]
    ]
  }
};

export function reflect101(idx, len) {
  if (len <= 1) return 0;
  let i = idx;
  while (i < 0 || i >= len) {
    if (i < 0) i = -i;
    if (i >= len) i = 2 * (len - 1) - i;
  }
  return i;
}

export function mapAngleToEdgeGlyph(angleDeg) {
  if (angleDeg < 22.5 || angleDeg >= 157.5) return '|';
  if (angleDeg < 67.5) return '/';
  if (angleDeg < 112.5) return '-';
  return '\\';
}

function boostRgbSaturationAndContrastInto(r, g, b, satBoost, contrastBoost, outArr, outOffset) {
  const rf = r / 255;
  const gf = g / 255;
  const bf = b / 255;
  const max = Math.max(rf, gf, bf);
  const min = Math.min(rf, gf, bf);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === rf) h = (gf - bf) / d + (gf < bf ? 6 : 0);
    else if (max === gf) h = (bf - rf) / d + 2;
    else h = (rf - gf) / d + 4;
    h /= 6;
  }

  const sNew = Math.min(1, Math.max(0, s * satBoost));
  const vNew = Math.min(1, Math.max(0, v * contrastBoost));

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = vNew * (1 - sNew);
  const q = vNew * (1 - f * sNew);
  const t = vNew * (1 - (1 - f) * sNew);

  let ro = 0,
    go = 0,
    bo = 0;
  switch (i % 6) {
    case 0:
      ro = vNew;
      go = t;
      bo = p;
      break;
    case 1:
      ro = q;
      go = vNew;
      bo = p;
      break;
    case 2:
      ro = p;
      go = vNew;
      bo = t;
      break;
    case 3:
      ro = p;
      go = q;
      bo = vNew;
      break;
    case 4:
      ro = t;
      go = p;
      bo = vNew;
      break;
    case 5:
      ro = vNew;
      go = p;
      bo = q;
      break;
  }

  outArr[outOffset] = Math.min(255, Math.round(ro * 255));
  outArr[outOffset + 1] = Math.min(255, Math.round(go * 255));
  outArr[outOffset + 2] = Math.min(255, Math.round(bo * 255));
}

/**
 * Dibuja una flor Ave del Paraíso (Strelitzia reginae) procedural en un canvas
 * con curvas Bézier y nervaduras definidas para cuando se selecciona el preset vectorial
 * o con fase de animación de brisa.
 */
export function renderProceduralStrelitziaToCanvas(targetCanvas, breezePhase = 0) {
  const w = 640;
  const h = 800;
  if (targetCanvas.width !== w) targetCanvas.width = w;
  if (targetCanvas.height !== h) targetCanvas.height = h;
  const ctx = targetCanvas.getContext('2d');

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);

  const swayX = Math.sin(breezePhase) * 14;
  const swayY = Math.cos(breezePhase * 0.8) * 6;
  const cx = w * 0.43 + swayX * 0.35;
  const cy = h * 0.51 + swayY * 0.35;

  // 1. Tallo verde esmeralda con luz lateral
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w * 0.33, h - 10);
  ctx.quadraticCurveTo(w * 0.32, h * 0.68, cx, cy + 20);
  ctx.lineWidth = 30;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1f6e32';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(w * 0.323, h - 10);
  ctx.quadraticCurveTo(w * 0.312, h * 0.68, cx - 4, cy + 20);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#52c468';
  ctx.stroke();
  ctx.restore();

  // 2. Abanico de sépalos fuego/naranja/dorado (cresta del Ave del Paraíso)
  const sepals = [
    { angle: -156, len: 295, width: 34, c1: '#e6480f', c2: '#ff9e1b', c3: '#ffe066' },
    { angle: -139, len: 320, width: 38, c1: '#f05412', c2: '#ffad24', c3: '#ffeb82' },
    { angle: -120, len: 345, width: 42, c1: '#f76314', c2: '#ffb829', c3: '#fff099' },
    { angle: -97, len: 360, width: 44, c1: '#fa6b16', c2: '#ffc42e', c3: '#fff3ad' },
    { angle: -72, len: 315, width: 36, c1: '#f25c13', c2: '#ffb024', c3: '#ffe680' }
  ];

  sepals.forEach((sp, idx) => {
    const localSway = Math.sin(breezePhase + idx * 0.45) * 3.2;
    const rad = ((sp.angle + localSway) * Math.PI) / 180;
    const tx = cx + Math.cos(rad) * sp.len;
    const ty = cy + Math.sin(rad) * sp.len;
    const px = -Math.sin(rad);
    const py = Math.cos(rad);

    const mx = cx + Math.cos(rad) * (sp.len * 0.46) + px * (sp.width * 0.32);
    const my = cy + Math.sin(rad) * (sp.len * 0.46) + py * (sp.width * 0.32);

    const grad = ctx.createLinearGradient(cx, cy, tx, ty);
    grad.addColorStop(0, sp.c1);
    grad.addColorStop(0.58, sp.c2);
    grad.addColorStop(1, sp.c3);

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(mx + px * sp.width, my + py * sp.width, tx, ty);
    ctx.quadraticCurveTo(mx - px * sp.width * 0.65, my - py * sp.width * 0.65, cx, cy);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Borde y nervadura central definida para activar cv2.Sobel
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = sp.c3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(mx + px * 4, my + py * 4, tx, ty);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff5bd';
    ctx.stroke();
  });

  // 3. Pétalos lengua en flecha azul cobalto eléctrico
  const tongues = [
    { angle: -61, len: 310, barb: 24 },
    { angle: -21, len: 295, barb: 26 }
  ];

  tongues.forEach((tg, idx) => {
    const localSway = Math.cos(breezePhase + idx * 0.7) * 2.6;
    const rad = ((tg.angle + localSway) * Math.PI) / 180;
    const tx = cx + 14 + Math.cos(rad) * tg.len;
    const ty = cy - 4 + Math.sin(rad) * tg.len;
    const px = -Math.sin(rad);
    const py = Math.cos(rad);

    const bx = cx + 14 + Math.cos(rad) * (tg.len * 0.54) + px * tg.barb;
    const by = cy - 4 + Math.sin(rad) * (tg.len * 0.54) + py * tg.barb;
    const ix = cx + 14 + Math.cos(rad) * (tg.len * 0.48) - px * (tg.barb * 0.45);
    const iy = cy - 4 + Math.sin(rad) * (tg.len * 0.48) - py * (tg.barb * 0.45);

    const bGrad = ctx.createLinearGradient(cx, cy, tx, ty);
    bGrad.addColorStop(0, '#1742b5');
    bGrad.addColorStop(0.55, '#2b6df8');
    bGrad.addColorStop(1, '#85bcff');

    ctx.beginPath();
    ctx.moveTo(cx + 8, cy);
    ctx.quadraticCurveTo(bx, by, tx, ty);
    ctx.quadraticCurveTo(ix, iy, cx + 8, cy);
    ctx.closePath();
    ctx.fillStyle = bGrad;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#99c9ff';
    ctx.stroke();
  });

  // 4. Espata horizontal (pico verde esmeralda con labio carmesí)
  const beakTipX = w * 0.93 + swayX * 0.4;
  const beakTipY = h * 0.48 + swayY * 0.5;

  const beakGrad = ctx.createLinearGradient(cx - 25, cy, beakTipX, beakTipY + 45);
  beakGrad.addColorStop(0, '#a3243b');
  beakGrad.addColorStop(0.22, '#226b34');
  beakGrad.addColorStop(0.75, '#339c4c');
  beakGrad.addColorStop(1, '#8be07b');

  ctx.beginPath();
  ctx.moveTo(cx - 32, cy + 28);
  ctx.quadraticCurveTo(cx + 25, cy - 10, w * 0.68, h * 0.475);
  ctx.lineTo(beakTipX, beakTipY);
  ctx.quadraticCurveTo(w * 0.65, h * 0.56, cx - 18, cy + 56);
  ctx.closePath();
  ctx.fillStyle = beakGrad;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = '#75d468';
  ctx.stroke();

  // Labio superior carmesí/rojo encendido de la espata
  ctx.beginPath();
  ctx.moveTo(cx - 24, cy + 16);
  ctx.quadraticCurveTo(cx + 30, cy - 8, beakTipX - 10, beakTipY);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#f23051';
  ctx.stroke();
}

let sharedCropTempCanvas = null;

/**
 * Recorta automáticamente el margen negro alrededor de la flor para aprovechar toda la rejilla ASCII.
 */
export function extractCroppedImageCanvas(sourceEl, targetCroppedCanvas = null) {
  const srcW = sourceEl.naturalWidth || sourceEl.width || 640;
  const srcH = sourceEl.naturalHeight || sourceEl.height || 800;

  if (!sharedCropTempCanvas && typeof document !== 'undefined') {
    sharedCropTempCanvas = document.createElement('canvas');
  }
  const temp = sharedCropTempCanvas || targetCroppedCanvas;
  if (temp.width !== srcW) temp.width = srcW;
  if (temp.height !== srcH) temp.height = srcH;
  const tCtx = temp.getContext('2d', { willReadFrequently: true });
  tCtx.drawImage(sourceEl, 0, 0, srcW, srcH);

  const imgData = tCtx.getImageData(0, 0, srcW, srcH).data;
  let minX = srcW,
    minY = srcH,
    maxX = 0,
    maxY = 0;
  let found = false;

  const step = 2;
  for (let y = 0; y < srcH; y += step) {
    for (let x = 0; x < srcW; x += step) {
      const idx = (y * srcW + x) * 4;
      const lum = (9798 * imgData[idx] + 19235 * imgData[idx + 1] + 3735 * imgData[idx + 2] + 16384) >> 15;
      if (lum > 14 && imgData[idx + 3] > 30) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        found = true;
      }
    }
  }

  if (!found) return temp;

  const w = Math.max(32, maxX - minX);
  const h = Math.max(32, maxY - minY);
  const padX = Math.round(w * 0.05);
  const padY = Math.round(h * 0.05);
  const x0 = Math.max(0, minX - padX);
  const y0 = Math.max(0, minY - padY);
  const x1 = Math.min(srcW, maxX + padX);
  const y1 = Math.min(srcH, maxY + padY);
  const cw = x1 - x0;
  const ch = y1 - y0;

  const cropped = targetCroppedCanvas || document.createElement('canvas');
  if (cropped.width !== cw) cropped.width = cw;
  if (cropped.height !== ch) cropped.height = ch;
  cropped.getContext('2d').drawImage(temp, x0, y0, cw, ch, 0, 0, cw, ch);
  return cropped;
}

// Buffers reutilizables para evitar asignaciones de memoria y GC en Brisa Viva 60fps
const scratchBuffers = {
  size: 0,
  gray: null,
  blurred: null,
  rgbBoosted: null,
  edgeRgb: null,
  gxArr: null,
  gyArr: null,
  magRaw: null,
  angleArr: null
};

function ensureScratchBuffers(total) {
  if (scratchBuffers.size !== total) {
    scratchBuffers.size = total;
    scratchBuffers.gray = new Uint8Array(total);
    scratchBuffers.blurred = new Uint8Array(total);
    scratchBuffers.rgbBoosted = new Uint8Array(total * 3);
    scratchBuffers.edgeRgb = new Uint8Array(total * 3);
    scratchBuffers.gxArr = new Float64Array(total);
    scratchBuffers.gyArr = new Float64Array(total);
    scratchBuffers.magRaw = new Float64Array(total);
    scratchBuffers.angleArr = new Float64Array(total);
  }
  return scratchBuffers;
}

const GAUSSIAN_3X3 = [
  [1, 2, 1],
  [2, 4, 2],
  [1, 2, 1]
];

/**
 * Ejecuta el pipeline cv2.Sobel sobre un buffer RGBA de tamaño (cols x rows).
 * Función pura sin dependencia del DOM para máxima velocidad y pruebas de paridad con Python.
 */
export function computeSobelAsciiGridFromRgba(rgba, cols, rows, options = {}, reusePreproc = false) {
  const {
    edgeThreshold = 52,
    kernelKey = '3',
    saturationBoost = 1.35,
    contrastBoost = 1.15,
    rampKey = 'classic',
    viewMode = 'combined',
    bgCutoff = 14
  } = options;

  const total = cols * rows;
  const { gray, blurred, rgbBoosted, edgeRgb, gxArr, gyArr, magRaw, angleArr } = ensureScratchBuffers(total);

  if (!reusePreproc) {
    for (let i = 0; i < total; i++) {
      const r = rgba[i * 4];
      const g = rgba[i * 4 + 1];
      const b = rgba[i * 4 + 2];
      // Mismo coeficiente entero BT.601 de 15 bits que cv2.cvtColor(BGR2GRAY) en OpenCV
      gray[i] = (9798 * r + 19235 * g + 3735 * b + 16384) >> 15;
      boostRgbSaturationAndContrastInto(r, g, b, saturationBoost, contrastBoost, rgbBoosted, i * 3);
    }

    // 1. GaussianBlur 3x3 con BORDER_REFLECT_101 (idéntico a cv2.GaussianBlur(gray, (3, 3), 0))
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let sum = 0;
        for (let ky = -1; ky <= 1; ky++) {
          const ny = reflect101(y + ky, rows);
          const rowOffset = ny * cols;
          const kRow = GAUSSIAN_3X3[ky + 1];
          for (let kx = -1; kx <= 1; kx++) {
            const nx = reflect101(x + kx, cols);
            sum += gray[rowOffset + nx] * kRow[kx + 1];
          }
        }
        blurred[y * cols + x] = (sum + 8) >> 4;
      }
    }

    // 2. Dilatación 3x3 por canal (como cv2.dilate(rgb, np.ones((3, 3), np.uint8)))
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        let maxR = 0,
          maxG = 0,
          maxB = 0;
        for (let ky = -1; ky <= 1; ky++) {
          const ny = Math.min(rows - 1, Math.max(0, y + ky));
          for (let kx = -1; kx <= 1; kx++) {
            const nx = Math.min(cols - 1, Math.max(0, x + kx));
            const nIdx3 = (ny * cols + nx) * 3;
            if (rgbBoosted[nIdx3] > maxR) maxR = rgbBoosted[nIdx3];
            if (rgbBoosted[nIdx3 + 1] > maxG) maxG = rgbBoosted[nIdx3 + 1];
            if (rgbBoosted[nIdx3 + 2] > maxB) maxB = rgbBoosted[nIdx3 + 2];
          }
        }
        const idx3 = (y * cols + x) * 3;
        edgeRgb[idx3] = maxR;
        edgeRgb[idx3 + 1] = maxG;
        edgeRgb[idx3 + 2] = maxB;
      }
    }
  }

  // 3. cv2.Sobel Gx & Gy (soporta kernels 3x3, 5x5 real y Scharr con BORDER_REFLECT_101)
  const preset = KERNEL_PRESETS[kernelKey] || KERNEL_PRESETS['3'];
  const kGx = preset.gx;
  const kGy = preset.gy;
  const kSize = preset.size || kGx.length;
  const kRadius = (kSize - 1) >> 1;

  let maxMag = 0;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sx = 0;
      let sy = 0;
      for (let ky = -kRadius; ky <= kRadius; ky++) {
        const ny = reflect101(y + ky, rows);
        const rowOffset = ny * cols;
        const gxRow = kGx[ky + kRadius];
        const gyRow = kGy[ky + kRadius];
        for (let kx = -kRadius; kx <= kRadius; kx++) {
          const nx = reflect101(x + kx, cols);
          const val = blurred[rowOffset + nx];
          const kCol = kx + kRadius;
          sx += val * gxRow[kCol];
          sy += val * gyRow[kCol];
        }
      }
      const idx = y * cols + x;
      gxArr[idx] = sx;
      gyArr[idx] = sy;
      const m = Math.hypot(sx, sy);
      magRaw[idx] = m;
      if (m > maxMag) maxMag = m;
      angleArr[idx] = (((Math.atan2(sy, sx) * 180) / Math.PI) + 180) % 180;
    }
  }

  const denom = (maxMag > 0 ? maxMag : 1.0) + 1e-6;
  const rampStr = (CHAR_RAMPS[rampKey] || CHAR_RAMPS.classic).ramp;
  const rampLen = rampStr.length;

  const grid = new Array(rows);
  let edgeCount = 0;
  let activeCount = 0;

  for (let y = 0; y < rows; y++) {
    const rowCells = new Array(cols);
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const lum = gray[idx];
      const mag = (magRaw[idx] / denom) * 255.0;
      const angle = angleArr[idx];
      const gx = gxArr[idx];
      const gy = gyArr[idx];
      const edgeChar = mapAngleToEdgeGlyph(angle);

      if (lum < bgCutoff && mag < edgeThreshold) {
        rowCells[x] = {
          char: ' ',
          edgeChar: ' ',
          r: 0,
          g: 0,
          b: 0,
          gx: 0,
          gy: 0,
          mag: 0,
          angle: 0,
          lum: 0,
          isEdge: false
        };
        continue;
      }

      activeCount++;
      const idx3 = idx * 3;
      let r = rgbBoosted[idx3];
      let g = rgbBoosted[idx3 + 1];
      let b = rgbBoosted[idx3 + 2];
      const er = edgeRgb[idx3];
      const eg = edgeRgb[idx3 + 1];
      const eb = edgeRgb[idx3 + 2];

      let ch = ' ';
      let isEdge = false;

      if (viewMode === 'edges') {
        if (mag >= edgeThreshold * 0.72) {
          ch = edgeChar;
          isEdge = true;
          edgeCount++;
          r = Math.min(255, Math.trunc(er * 1.12 + 14));
          g = Math.min(255, Math.trunc(eg * 1.12 + 14));
          b = Math.min(255, Math.trunc(eb * 1.12 + 14));
        } else {
          ch = ' ';
        }
      } else if (viewMode === 'magnitude') {
        const rIdx = Math.min(rampLen - 1, Math.trunc((mag / 255.0) * (rampLen - 1)));
        ch = rampStr[rIdx];
        isEdge = mag >= edgeThreshold;
        if (isEdge) edgeCount++;
        const normM = mag / 255.0;
        r = Math.min(255, Math.trunc(255 * normM * 1.25));
        g = Math.min(255, Math.trunc(190 * Math.pow(normM, 1.3)));
        b = normM > 0.08 ? Math.min(255, Math.trunc(95 + 160 * (1 - normM))) : 0;
      } else {
        // Modo combinado (Bordes direccionales cv2.Sobel + densidad por luminancia)
        if (mag >= edgeThreshold) {
          ch = edgeChar;
          isEdge = true;
          edgeCount++;
          r = Math.min(255, Math.trunc(er * 1.12 + 14));
          g = Math.min(255, Math.trunc(eg * 1.12 + 14));
          b = Math.min(255, Math.trunc(eb * 1.12 + 14));
        } else {
          const rIdx = Math.min(rampLen - 1, Math.max(1, Math.trunc((lum / 255.0) * (rampLen - 1))));
          ch = rampStr[rIdx];
        }
      }

      rowCells[x] = {
        char: ch,
        edgeChar: mag >= edgeThreshold * 0.65 ? edgeChar : ' ',
        r,
        g,
        b,
        gx: Math.round(gx),
        gy: Math.round(gy),
        mag: Math.round(mag),
        angle: Math.round(angle * 10) / 10,
        lum: Math.round(lum),
        isEdge
      };
    }
    grid[y] = rowCells;
  }

  return {
    grid,
    cols,
    rows,
    stats: {
      cols,
      rows,
      maxMag: Math.round(maxMag * 10) / 10,
      edgeCount,
      activeCount,
      edgeRatio: ((edgeCount / Math.max(1, activeCount)) * 100).toFixed(1)
    }
  };
}

let sharedSampleCanvas = null;
let sharedSampleCtx = null;
let cachedPreprocKey = '';

/**
 * Ejecuta el pipeline cv2.Sobel sobre el canvas fuente reutilizando el canvas de muestreo
 * y cacheando el preprocesado de color/desenfoque cuando la imagen de entrada no cambia.
 */
export function computeSobelAsciiGrid(sourceCanvas, options = {}) {
  const {
    cols = 88,
    saturationBoost = 1.35,
    contrastBoost = 1.15,
    breezePhase = null,
    charAspect = 0.5,
    sourceVersion = 0
  } = options;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const rows = Math.max(16, Math.trunc((srcH / srcW) * cols * charAspect));

  if (!sharedSampleCanvas) {
    sharedSampleCanvas = document.createElement('canvas');
    sharedSampleCtx = sharedSampleCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (sharedSampleCanvas.width !== cols) sharedSampleCanvas.width = cols;
  if (sharedSampleCanvas.height !== rows) sharedSampleCanvas.height = rows;

  const preprocKey =
    breezePhase === null
      ? `${sourceVersion}:${srcW}x${srcH}:${cols}x${rows}:${saturationBoost}:${contrastBoost}`
      : '';
  const reusePreproc = preprocKey !== '' && preprocKey === cachedPreprocKey;

  let rgba = null;
  if (!reusePreproc) {
    sharedSampleCtx.fillStyle = '#000000';
    sharedSampleCtx.fillRect(0, 0, cols, rows);

    if (breezePhase !== null) {
      // Aplicar deformación sinusoidal por franjas horizontales para simular brisa viva
      const slices = rows;
      for (let y = 0; y < slices; y++) {
        const vFactor = Math.pow(1 - y / slices, 1.35);
        const dx = Math.sin(y / 6.5 + breezePhase) * (cols * 0.016) * vFactor;
        const sy = (y / slices) * srcH;
        const sh = srcH / slices;
        sharedSampleCtx.drawImage(sourceCanvas, 0, sy, srcW, sh, dx, y, cols, 1.15);
      }
    } else {
      sharedSampleCtx.drawImage(sourceCanvas, 0, 0, cols, rows);
    }
    rgba = sharedSampleCtx.getImageData(0, 0, cols, rows).data;
    cachedPreprocKey = preprocKey;
  }

  return computeSobelAsciiGridFromRgba(rgba, cols, rows, options, reusePreproc);
}

export function gridToPlainText(gridData) {
  return gridData.grid.map(row => row.map(c => c.char).join('')).join('\n');
}

export function gridToAnsiText(gridData) {
  return gridData.grid
    .map(row =>
      row
        .map(c => (c.char === ' ' ? ' ' : `\x1b[38;2;${c.r};${c.g};${c.b}m${c.char}\x1b[0m`))
        .join('')
    )
    .join('\n');
}
