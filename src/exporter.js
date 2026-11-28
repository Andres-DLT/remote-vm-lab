import { GIFEncoder, applyPalette, quantize } from 'gifenc';

const CODE_LINES_PREVIEW = [
  '01 │ import cv2, numpy as np, sys',
  "02 │ img = cv2.imread('public/ave-del-paraiso.jpg')",
  '03 │ resized = cv2.resize(img, (WIDTH, ROWS), cv2.INTER_AREA)',
  '04 │ hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV) * [1, SAT, VAL]',
  '05 │ gray = cv2.GaussianBlur(cv2.cvtColor(resized, BGR2GRAY), (3,3), 0)',
  '06 │ gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=KSIZE)  # ∂I/∂x -> |',
  '07 │ gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=KSIZE)  # ∂I/∂y -> -',
  '08 │ mag = np.hypot(gx, gy) / np.hypot(gx, gy).max() * 255.0',
  '09 │ angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0',
  "10 │ edge_ch = np.select([angle<22.5,...], ['|','/','-','\\\\'], '|')",
  '11 │ glyph = np.where(mag >= THRESH, edge_ch, DENSITY_RAMP[lum_idx])',
  '12 │ sys.stdout.write(f"\\033[38;2;{r};{g};{b}m{glyph}\\033[0m")'
];

const STORY_STEPS_META = [
  {
    badge: 'PASO 1/5 • FOTO REAL',
    title: 'Fotografía real del Ave del Paraíso antes de convertirla',
    codeExplain: 'Cargamos la foto real y realzamos sus colores botánicos (naranja, azul cobalto y verde).'
  },
  {
    badge: 'PASO 2/5 • ESCÁNER HORIZONTAL Gx',
    title: 'cv2.Sobel(dx=1, dy=0) detecta bordes verticales y los traza con "|"',
    codeExplain: 'La derivada horizontal Gx mide cambios de luz izquierda↔derecha para hallar tallos y pétalos verticales.'
  },
  {
    badge: 'PASO 3/5 • ESCÁNER VERTICAL Gy',
    title: 'cv2.Sobel(dx=0, dy=1) detecta el pico horizontal y lo traza con "-"',
    codeExplain: 'La derivada vertical Gy mide cambios arriba↔abajo para detectar la espata y bordes horizontales.'
  },
  {
    badge: 'PASO 4/5 • BRÚJULA VECTORIAL (| / - \\)',
    title: 'arctan2(Gy, Gx) calcula el ángulo exacto de cada pétalo (→ ↗ ↑ ↖)',
    codeExplain: 'El ángulo θ° elige el carácter cuyo trazo sigue la curva exacta del pétalo: |, /, - o \\.'
  },
  {
    badge: 'PASO 5/5 • FLORACIÓN VIVA + CORTINA RAYOS X',
    title: 'Flor Ave del Paraíso en movimiento con cortina Foto↔ASCII y polen vivo',
    codeExplain: 'Combinamos bordes direccionales + relleno de luz en 24 bits con floración cinética y brisa.'
  }
];

/**
 * Dibuja un fotograma completo 9:16 con:
 *   - Banner explicativo paso a paso arriba (para que cualquiera entienda qué hace cv2.Sobel)
 *   - Escenario con cortina Foto Original <-> Flechas Vectoriales <-> Arte ASCII + Polen bioluminiscente
 *   - Panel inferior de código Python en vivo con traducción en español sencillo
 */
export function renderVerticalCompositeFrame(
  ctx,
  width,
  height,
  gridData,
  options = {}
) {
  const {
    storyAct = 5,
    actProgress = 1.0,
    phase = 0,
    curtainRatio = null,
    refCanvas = null,
    activeCodeLine = 11
  } = options;

  ctx.fillStyle = '#04060b';
  ctx.fillRect(0, 0, width, height);

  // 1. Barra superior de título
  const topBarH = Math.round(height * 0.044);
  ctx.fillStyle = '#0c1220';
  ctx.fillRect(0, 0, width, topBarH);

  const dotY = Math.round(topBarH * 0.5);
  ['#ef4444', '#f59e0b', '#22c55e'].forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(18 + i * 15, dotY, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  ctx.fillStyle = '#e2e8f0';
  ctx.font = `700 ${Math.round(width * 0.022)}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillText(`Ave del Paraíso — cv2.Sobel ASCII Vivo (${gridData.cols}×${gridData.rows})`, 70, dotY);

  // 2. Banner Narrativo Explicativo (resuelve "no le entienden")
  const storyIdx = Math.max(0, Math.min(4, (storyAct || 5) - 1));
  const meta = STORY_STEPS_META[storyIdx];
  const bannerTop = topBarH + 6;
  const bannerH = Math.round(height * 0.072);

  ctx.fillStyle = '#111827';
  ctx.fillRect(10, bannerTop, width - 20, bannerH);
  ctx.strokeStyle = 'rgba(250, 204, 46, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(10, bannerTop, width - 20, bannerH);

  ctx.fillStyle = '#facc15';
  ctx.font = `700 ${Math.round(width * 0.02)}px "JetBrains Mono", monospace`;
  ctx.fillText(meta.badge, 20, bannerTop + bannerH * 0.32);

  ctx.fillStyle = '#f8fafc';
  ctx.font = `600 ${Math.round(width * 0.022)}px "Plus Jakarta Sans", sans-serif`;
  ctx.fillText(meta.title, 20, bannerTop + bannerH * 0.72);

  // 3. Área principal de la flor (56% de la altura)
  const flowerTop = bannerTop + bannerH + 8;
  const flowerAreaH = Math.round(height * 0.555);
  const flowerAreaW = width - 20;
  const flowerLeft = 10;

  const { grid, cols, rows } = gridData;
  const cellW = flowerAreaW / cols;
  const cellH = flowerAreaH / rows;
  const fontPx = Math.max(7, Math.floor(Math.min(cellH * 0.94, cellW * 1.78)));

  // Si estamos en Acto 1 (Foto Real) o hay cortina Foto <-> ASCII activa, dibujar foto de referencia recortada
  let photoSplitX = -1;
  if (storyAct === 1) {
    photoSplitX = flowerLeft + flowerAreaW * (1.0 - actProgress * 0.45);
  } else if (typeof curtainRatio === 'number' && curtainRatio > 0.01) {
    photoSplitX = flowerLeft + flowerAreaW * curtainRatio;
  }

  if (refCanvas && photoSplitX > flowerLeft) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(flowerLeft, flowerTop, photoSplitX - flowerLeft, flowerAreaH);
    ctx.clip();
    ctx.drawImage(refCanvas, flowerLeft, flowerTop, flowerAreaW, flowerAreaH);
    ctx.fillStyle = 'rgba(4, 6, 11, 0.18)';
    ctx.fillRect(flowerLeft, flowerTop, photoSplitX - flowerLeft, flowerAreaH);
    ctx.restore();
  }

  ctx.font = `600 ${fontPx}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'top';

  const pulseRadius = ((phase * 18) % ( Math.hypot(cols, rows) * 0.9 ));
  const centerCol = cols * 0.44;
  const centerRow = rows * 0.52;

  for (let y = 0; y < rows; y++) {
    const row = grid[y];
    const py = flowerTop + y * cellH;
    for (let x = 0; x < cols; x++) {
      const px = flowerLeft + x * cellW;
      if (photoSplitX > flowerLeft && px < photoSplitX - cellW * 0.5) {
        continue;
      }

      const cell = row[x];
      if (cell.char === ' ' && cell.edgeChar === ' ') continue;

      let ch = cell.char;
      let r = cell.r;
      let g = cell.g;
      let b = cell.b;

      if (storyAct === 2) {
        // Solo derivada horizontal Gx -> trazos verticales '|'
        if (Math.abs(cell.gx) >= 38 && (cell.edgeChar === '|' || Math.abs(cell.gx) >= Math.abs(cell.gy))) {
          ch = '|';
          r = 255;
          g = 148;
          b = 42;
        } else {
          ch = '·';
          r = Math.trunc(cell.r * 0.25);
          g = Math.trunc(cell.g * 0.25);
          b = Math.trunc(cell.b * 0.25);
        }
      } else if (storyAct === 3) {
        // Solo derivada vertical Gy -> trazos horizontales '-'
        if (Math.abs(cell.gy) >= 38 && (cell.edgeChar === '-' || Math.abs(cell.gy) > Math.abs(cell.gx))) {
          ch = '-';
          r = 82;
          g = 178;
          b = 255;
        } else {
          ch = '·';
          r = Math.trunc(cell.r * 0.25);
          g = Math.trunc(cell.g * 0.25);
          b = Math.trunc(cell.b * 0.25);
        }
      } else if (storyAct === 4) {
        // Brújula vectorial: mitad flechas ∇I (→ ↗ ↑), mitad trazos tangentes (/ | \ -)
        const waveSplit = cols * (0.15 + 0.75 * actProgress);
        if (cell.edgeChar !== ' ') {
          ch = x < waveSplit ? cell.edgeChar : cell.arrowChar || cell.edgeChar;
          r = Math.min(255, cell.r + 28);
          g = Math.min(255, cell.g + 28);
          b = Math.min(255, cell.b + 28);
        } else {
          continue;
        }
      } else {
        // Pulso bioluminiscente viajando por las nervaduras desde el centro
        const dist = Math.hypot(x - centerCol, y - centerRow);
        const ringDist = Math.abs(dist - pulseRadius);
        if (ringDist < 3.2 && cell.isEdge) {
          const boost = (1 - ringDist / 3.2) * 75;
          r = Math.min(255, Math.round(r + boost));
          g = Math.min(255, Math.round(g + boost));
          b = Math.min(255, Math.round(b + boost));
        }
      }

      if (ch === ' ') continue;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillText(ch, px, py);
    }
  }

  // Dibujar línea divisoria luminosa de la cortina Foto <-> ASCII
  if (photoSplitX > flowerLeft + 8 && photoSplitX < flowerLeft + flowerAreaW - 8) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(photoSplitX, flowerTop);
    ctx.lineTo(photoSplitX, flowerTop + flowerAreaH);
    ctx.stroke();

    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(photoSplitX - 68, flowerTop + 10, 62, 20);
    ctx.fillRect(photoSplitX + 6, flowerTop + 10, 66, 20);
    ctx.fillStyle = '#fde047';
    ctx.font = `700 ${Math.round(width * 0.018)}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'middle';
    ctx.fillText('FOTO HD', photoSplitX - 62, flowerTop + 20);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('cv2.Sobel', photoSplitX + 11, flowerTop + 20);
  }

  // Partículas bioluminiscentes de polen ASCII flotando desde la cresta
  const sparkGlyphs = ['*', '+', '·', '°'];
  const sparkColors = ['#fde047', '#fb923c', '#60a5fa', '#4ade80'];
  ctx.font = `700 ${Math.max(10, Math.round(fontPx * 1.15))}px "JetBrains Mono", monospace`;
  for (let i = 0; i < 16; i++) {
    const seed = i * 1.731;
    const age = (phase * 0.16 + seed) % 1.0;
    const sx = flowerLeft + flowerAreaW * (0.2 + 0.62 * ((Math.sin(seed * 3.7) + 1) * 0.5)) + Math.sin(phase * 1.5 + seed) * 18;
    const sy = flowerTop + flowerAreaH * (0.58 - age * 0.54);
    if (sx > photoSplitX + 6 && sy > flowerTop + 4 && sy < flowerTop + flowerAreaH - 12) {
      ctx.fillStyle = sparkColors[i % sparkColors.length];
      ctx.fillText(sparkGlyphs[(i + Math.floor(phase * 2)) % sparkGlyphs.length], sx, sy);
    }
  }

  // 4. Panel inferior de Código en Vivo + explicación en español claro
  const dockTop = flowerTop + flowerAreaH + 6;
  const dockH = height - dockTop;
  ctx.fillStyle = '#080c14';
  ctx.fillRect(0, dockTop, width, dockH);

  const explainH = Math.round(dockH * 0.17);
  ctx.fillStyle = '#172033';
  ctx.fillRect(0, dockTop, width, explainH);
  ctx.fillStyle = '#fde047';
  ctx.font = `600 ${Math.round(width * 0.0195)}px "Plus Jakarta Sans", sans-serif`;
  ctx.textBaseline = 'middle';
  ctx.fillText(meta.codeExplain, 14, dockTop + explainH * 0.5);

  const linesStart = dockTop + explainH + 4;
  const lineH = (dockH - explainH - 8) / CODE_LINES_PREVIEW.length;
  const codeFontPx = Math.max(8, Math.floor(lineH * 0.74));
  ctx.font = `500 ${codeFontPx}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'middle';

  CODE_LINES_PREVIEW.forEach((lineText, idx) => {
    const ly = linesStart + idx * lineH;
    const isActive = idx === activeCodeLine;
    if (isActive) {
      ctx.fillStyle = 'rgba(250, 122, 37, 0.22)';
      ctx.fillRect(6, ly, width - 12, lineH - 1);
      ctx.fillStyle = '#fde047';
      ctx.fillText(`▶ ${lineText}`, 12, ly + lineH * 0.5);
    } else {
      ctx.fillStyle = idx < activeCodeLine ? '#94e2d5' : '#64748b';
      ctx.fillText(`  ${lineText}`, 12, ly + lineH * 0.5);
    }
  });
}

function triggerDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function computeStoryFrameState(normT, computeFrameAtPhase) {
  // Recorre los 5 actos explicativos + floración + cortina Foto<->ASCII
  const phase = normT * Math.PI * 4.5;
  let storyAct = 5;
  let actProgress = 1.0;
  let bloomFactor = 1.0;
  let curtainRatio = null;
  let activeCodeLine = 11;

  if (normT < 0.16) {
    storyAct = 1;
    actProgress = normT / 0.16;
    activeCodeLine = 1;
  } else if (normT < 0.32) {
    storyAct = 2;
    actProgress = (normT - 0.16) / 0.16;
    activeCodeLine = 5;
  } else if (normT < 0.48) {
    storyAct = 3;
    actProgress = (normT - 0.32) / 0.16;
    activeCodeLine = 6;
  } else if (normT < 0.66) {
    storyAct = 4;
    actProgress = (normT - 0.48) / 0.18;
    activeCodeLine = 9;
  } else {
    storyAct = 5;
    actProgress = (normT - 0.66) / 0.34;
    bloomFactor = 0.45 + 0.55 * Math.min(1, actProgress * 1.4);
    curtainRatio = actProgress > 0.35 ? Math.sin(((actProgress - 0.35) / 0.65) * Math.PI) * 0.62 : null;
    activeCodeLine = 11;
  }

  const { gridData, refCanvas } = computeFrameAtPhase(phase, bloomFactor);
  return {
    gridData,
    refCanvas,
    options: {
      storyAct,
      actProgress,
      phase,
      curtainRatio,
      refCanvas,
      activeCodeLine
    }
  };
}

/**
 * Exporta un GIF animado en proporción 9:16 con la historia de 5 pasos + floración + cortina Foto↔ASCII.
 */
export async function exportVerticalGif(computeFrameAtPhase, onProgress) {
  const width = 432;
  const height = 768;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

  const gif = GIFEncoder();
  const totalFrames = 36;

  for (let i = 0; i < totalFrames; i++) {
    const normT = i / (totalFrames - 1);
    const { gridData, options } = computeStoryFrameState(normT, computeFrameAtPhase);

    renderVerticalCompositeFrame(ctx, width, height, gridData, options);
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 128);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: 110 });

    if (onProgress) onProgress(Math.round(((i + 1) / totalFrames) * 100));
    await new Promise(r => setTimeout(r, 0));
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: 'image/gif' });
  triggerDownloadBlob(blob, 'ave-del-paraiso-sobel-9x16.gif');
}

/**
 * Graba un video WebM 9:16 con MediaRecorder reproduciendo la historia de 5 pasos + floración + cortina Foto↔ASCII.
 */
export async function exportVerticalWebm(computeFrameAtPhase, onProgress) {
  if (typeof MediaRecorder === 'undefined') {
    throw new Error('MediaRecorder no está disponible en este navegador. Usa Exportar GIF.');
  }

  const width = 540;
  const height = 960;
  const recCanvas = document.createElement('canvas');
  recCanvas.width = width;
  recCanvas.height = height;
  const ctx = recCanvas.getContext('2d');

  const mimeCandidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  const mimeType = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
  const stream = recCanvas.captureStream(30);
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_800_000 })
    : new MediaRecorder(stream);

  const chunks = [];
  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise(resolve => {
    recorder.onstop = resolve;
  });

  const totalFrames = 135; // 4.5s @ 30fps

  recorder.start();
  for (let i = 0; i < totalFrames; i++) {
    const normT = i / (totalFrames - 1);
    const { gridData, options } = computeStoryFrameState(normT, computeFrameAtPhase);

    renderVerticalCompositeFrame(ctx, width, height, gridData, options);
    if (onProgress) onProgress(Math.round(((i + 1) / totalFrames) * 100));
    await new Promise(r => setTimeout(r, 33));
  }

  recorder.stop();
  await stopped;
  stream.getTracks().forEach(t => t.stop());

  const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
  triggerDownloadBlob(blob, 'ave-del-paraiso-sobel-9x16.webm');
}
