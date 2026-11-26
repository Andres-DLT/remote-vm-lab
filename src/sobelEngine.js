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
    gx: [
      [-1, 0, 1],
      [-4, 0, 4],
      [-1, 0, 1]
    ],
    gy: [
      [-1, -4, -1],
      [0, 0, 0],
      [1, 4, 1]
    ]
  },
  scharr: {
    label: 'cv2.Sobel (ksize=cv2.FILTER_SCHARR)',
    pyArg: 'ksize=-1',
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

export function mapAngleToEdgeGlyph(angleDeg) {
  if (angleDeg < 22.5 || angleDeg >= 157.5) return '|';
  if (angleDeg < 67.5) return '/';
  if (angleDeg < 112.5) return '-';
  return '\\';
}

function boostRgbSaturationAndContrast(r, g, b, satBoost, contrastBoost) {
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

  return [
    Math.min(255, Math.round(ro * 255)),
    Math.min(255, Math.round(go * 255)),
    Math.min(255, Math.round(bo * 255))
  ];
}

/**
 * Dibuja una flor Ave del Paraíso (Strelitzia reginae) procedural en un canvas
 * con curvas Bézier y nervaduras definidas para cuando se selecciona el preset vectorial
 * o con fase de animación de brisa.
 */
export function renderProceduralStrelitziaToCanvas(targetCanvas, breezePhase = 0) {
  const w = 640;
  const h = 800;
  targetCanvas.width = w;
  targetCanvas.height = h;
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

/**
 * Recorta automáticamente el margen negro alrededor de la flor para aprovechar toda la rejilla ASCII.
 */
export function extractCroppedImageCanvas(sourceEl) {
  const srcW = sourceEl.naturalWidth || sourceEl.width || 640;
  const srcH = sourceEl.naturalHeight || sourceEl.height || 800;

  const temp = document.createElement('canvas');
  temp.width = srcW;
  temp.height = srcH;
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
      const lum = 0.299 * imgData[idx] + 0.587 * imgData[idx + 1] + 0.114 * imgData[idx + 2];
      if (lum > 15 && imgData[idx + 3] > 30) {
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

  const cropped = document.createElement('canvas');
  cropped.width = cw;
  cropped.height = ch;
  cropped.getContext('2d').drawImage(temp, x0, y0, cw, ch, 0, 0, cw, ch);
  return cropped;
}

/**
 * Ejecuta el pipeline cv2.Sobel sobre el canvas fuente y devuelve la matriz completa de celdas ASCII.
 */
export function computeSobelAsciiGrid(sourceCanvas, options) {
  const {
    cols = 88,
    edgeThreshold = 52,
    kernelKey = '3',
    saturationBoost = 1.35,
    contrastBoost = 1.15,
    rampKey = 'classic',
    viewMode = 'combined',
    breezePhase = null,
    charAspect = 0.5
  } = options;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const rows = Math.max(20, Math.round((srcH / srcW) * cols * charAspect));

  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = cols;
  sampleCanvas.height = rows;
  const sCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sCtx.fillStyle = '#000000';
  sCtx.fillRect(0, 0, cols, rows);

  if (breezePhase !== null) {
    // Aplicar deformación sinusoidal por franjas horizontales para simular brisa viva
    const slices = rows;
    for (let y = 0; y < slices; y++) {
      const vFactor = Math.pow(1 - y / slices, 1.35);
      const dx = Math.sin(y / 6.5 + breezePhase) * (cols * 0.016) * vFactor;
      const sy = (y / slices) * srcH;
      const sh = srcH / slices;
      sCtx.drawImage(sourceCanvas, 0, sy, srcW, sh, dx, y, cols, 1.15);
    }
  } else {
    sCtx.drawImage(sourceCanvas, 0, 0, cols, rows);
  }

  const rgba = sCtx.getImageData(0, 0, cols, rows).data;
  const total = cols * rows;

  const gray = new Float32Array(total);
  const rgbBoosted = new Uint8Array(total * 3);

  for (let i = 0; i < total; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
    const [br, bg, bb] = boostRgbSaturationAndContrast(r, g, b, saturationBoost, contrastBoost);
    rgbBoosted[i * 3] = br;
    rgbBoosted[i * 3 + 1] = bg;
    rgbBoosted[i * 3 + 2] = bb;
  }

  // 1. GaussianBlur 3x3 (como cv2.GaussianBlur(gray, (3, 3), 0))
  const blurred = new Float32Array(total);
  const gKernel = [
    [1, 2, 1],
    [2, 4, 2],
    [1, 2, 1]
  ];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const ny = Math.min(rows - 1, Math.max(0, y + ky));
        for (let kx = -1; kx <= 1; kx++) {
          const nx = Math.min(cols - 1, Math.max(0, x + kx));
          sum += gray[ny * cols + nx] * gKernel[ky + 1][kx + 1];
        }
      }
      blurred[y * cols + x] = sum / 16.0;
    }
  }

  // 2. cv2.Sobel Gx & Gy
  const preset = KERNEL_PRESETS[kernelKey] || KERNEL_PRESETS['3'];
  const kGx = preset.gx;
  const kGy = preset.gy;

  const gxArr = new Float32Array(total);
  const gyArr = new Float32Array(total);
  const magRaw = new Float32Array(total);
  const angleArr = new Float32Array(total);
  let maxMag = 1e-6;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let sx = 0;
      let sy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const ny = Math.min(rows - 1, Math.max(0, y + ky));
        for (let kx = -1; kx <= 1; kx++) {
          const nx = Math.min(cols - 1, Math.max(0, x + kx));
          const val = blurred[ny * cols + nx];
          sx += val * kGx[ky + 1][kx + 1];
          sy += val * kGy[ky + 1][kx + 1];
        }
      }
      const idx = y * cols + x;
      gxArr[idx] = sx;
      gyArr[idx] = sy;
      const m = Math.hypot(sx, sy);
      magRaw[idx] = m;
      if (m > maxMag) maxMag = m;
      angleArr[idx] = ((Math.atan2(sy, sx) * 180) / Math.PI + 180) % 180;
    }
  }

  // 3. Dilatación 3x3 de color para que los bordes de silueta hereden el color vivo del pétalo
  const edgeRgb = new Uint8Array(total * 3);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let bestLum = -1;
      let br = 0,
        bg = 0,
        bb = 0;
      for (let ky = -1; ky <= 1; ky++) {
        const ny = Math.min(rows - 1, Math.max(0, y + ky));
        for (let kx = -1; kx <= 1; kx++) {
          const nx = Math.min(cols - 1, Math.max(0, x + kx));
          const nIdx = ny * cols + nx;
          if (gray[nIdx] > bestLum) {
            bestLum = gray[nIdx];
            br = rgbBoosted[nIdx * 3];
            bg = rgbBoosted[nIdx * 3 + 1];
            bb = rgbBoosted[nIdx * 3 + 2];
          }
        }
      }
      const idx = y * cols + x;
      edgeRgb[idx * 3] = br;
      edgeRgb[idx * 3 + 1] = bg;
      edgeRgb[idx * 3 + 2] = bb;
    }
  }

  const rampStr = (CHAR_RAMPS[rampKey] || CHAR_RAMPS.classic).ramp;
  const rampLen = rampStr.length;
  const bgCutoff = 13;

  const grid = new Array(rows);
  let edgeCount = 0;
  let activeCount = 0;

  for (let y = 0; y < rows; y++) {
    const rowCells = new Array(cols);
    for (let x = 0; x < cols; x++) {
      const idx = y * cols + x;
      const lum = gray[idx];
      const mag = (magRaw[idx] / maxMag) * 255.0;
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
      let r = rgbBoosted[idx * 3];
      let g = rgbBoosted[idx * 3 + 1];
      let b = rgbBoosted[idx * 3 + 2];
      const er = edgeRgb[idx * 3];
      const eg = edgeRgb[idx * 3 + 1];
      const eb = edgeRgb[idx * 3 + 2];

      let ch = ' ';
      let isEdge = false;

      if (viewMode === 'edges') {
        if (mag >= edgeThreshold * 0.72) {
          ch = edgeChar;
          isEdge = true;
          edgeCount++;
          r = Math.min(255, Math.round(er * 1.15 + 18));
          g = Math.min(255, Math.round(eg * 1.15 + 18));
          b = Math.min(255, Math.round(eb * 1.15 + 18));
        } else {
          ch = ' ';
        }
      } else if (viewMode === 'magnitude') {
        const rIdx = Math.min(rampLen - 1, Math.floor((mag / 255.0) * (rampLen - 1)));
        ch = rampStr[rIdx];
        isEdge = mag >= edgeThreshold;
        if (isEdge) edgeCount++;
        const normM = mag / 255.0;
        r = Math.min(255, Math.round(255 * Math.min(1, normM * 1.3)));
        g = Math.min(255, Math.round(195 * Math.pow(normM, 1.25)));
        b = normM > 0.07 ? Math.min(255, Math.round(80 + 165 * (1 - normM))) : 0;
      } else {
        // Modo combinado (Bordes direccionales cv2.Sobel + densidad por luminancia)
        if (mag >= edgeThreshold) {
          ch = edgeChar;
          isEdge = true;
          edgeCount++;
          r = Math.min(255, Math.round(er * 1.14 + 16));
          g = Math.min(255, Math.round(eg * 1.14 + 16));
          b = Math.min(255, Math.round(eb * 1.14 + 16));
        } else {
          const rIdx = Math.min(rampLen - 1, Math.max(1, Math.floor((lum / 255.0) * (rampLen - 1))));
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
      maxMag: Math.round(maxMag),
      edgeCount,
      activeCount,
      edgeRatio: ((edgeCount / Math.max(1, activeCount)) * 100).toFixed(1)
    }
  };
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
