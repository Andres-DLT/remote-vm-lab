import { GIFEncoder, applyPalette, quantize } from 'gifenc';

const CODE_LINES_PREVIEW = [
  '01 │ import cv2, numpy as np, sys',
  "02 │ img = cv2.imread('public/ave-del-paraiso.jpg')",
  '03 │ resized = cv2.resize(img, (WIDTH, ROWS), cv2.INTER_AREA)',
  '04 │ hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV) * [1, SAT, VAL]',
  '05 │ gray = cv2.GaussianBlur(cv2.cvtColor(resized, BGR2GRAY), (3,3), 0)',
  '06 │ gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=KSIZE)  # ∂I/∂x',
  '07 │ gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=KSIZE)  # ∂I/∂y',
  '08 │ mag = np.hypot(gx, gy) / np.hypot(gx, gy).max() * 255.0',
  '09 │ angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0',
  "10 │ edge_ch = np.select([angle<22.5,...], ['|','/','-','\\\\'], '|')",
  '11 │ glyph = np.where(mag >= THRESH, edge_ch, DENSITY_RAMP[lum_idx])',
  '12 │ sys.stdout.write(f"\\033[38;2;{r};{g};{b}m{glyph}\\033[0m")'
];

/**
 * Dibuja un fotograma completo en formato vertical 9:16 (Flor ASCII arriba + Código Python en vivo abajo).
 */
export function renderVerticalCompositeFrame(ctx, width, height, gridData, revealProgress = 1.0, activeCodeLine = 11) {
  ctx.fillStyle = '#05070c';
  ctx.fillRect(0, 0, width, height);

  // Barra superior estilo ventana de terminal
  const topBarH = Math.round(height * 0.048);
  ctx.fillStyle = '#0d1320';
  ctx.fillRect(0, 0, width, topBarH);

  const dotY = Math.round(topBarH * 0.5);
  const dotColors = ['#ef4444', '#f59e0b', '#22c55e'];
  dotColors.forEach((col, i) => {
    ctx.beginPath();
    ctx.arc(20 + i * 16, dotY, 5, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
  });

  ctx.fillStyle = '#cbd5e1';
  ctx.font = `600 ${Math.round(width * 0.022)}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `python3 ave_del_paraiso_sobel.py — ${gridData.cols}×${gridData.rows}`,
    76,
    dotY
  );

  // Área superior para la flor ASCII (64% de la altura)
  const flowerTop = topBarH + 8;
  const flowerAreaH = Math.round(height * 0.61);
  const flowerAreaW = width - 20;

  const { grid, cols, rows } = gridData;
  const cellW = flowerAreaW / cols;
  const cellH = flowerAreaH / rows;
  const fontPx = Math.max(7, Math.floor(Math.min(cellH * 0.92, cellW * 1.75)));

  ctx.font = `600 ${fontPx}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'top';

  const isScanning = revealProgress < 0.999;
  const colorRowLimit = isScanning ? Math.floor(revealProgress * rows) : rows;
  const edgeScanLimit = isScanning
    ? Math.min(rows, colorRowLimit + Math.max(5, Math.floor(rows * 0.16)))
    : rows;

  for (let y = 0; y < rows; y++) {
    if (isScanning && y >= edgeScanLimit) continue;
    const inEdgeBand = isScanning && y >= colorRowLimit && y < edgeScanLimit;
    const row = grid[y];
    const py = flowerTop + y * cellH;
    for (let x = 0; x < cols; x++) {
      const cell = row[x];
      const ch = inEdgeBand ? cell.edgeChar : cell.char;
      if (ch === ' ') continue;
      ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
      ctx.fillText(ch, 10 + x * cellW, py);
    }
  }

  if (isScanning && colorRowLimit < rows) {
    const scanY = flowerTop + colorRowLimit * cellH;
    const grad = ctx.createLinearGradient(0, scanY - 3, width, scanY + 3);
    grad.addColorStop(0, 'rgba(250, 122, 37, 0)');
    grad.addColorStop(0.5, 'rgba(250, 204, 46, 0.85)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(10, scanY - 1, width - 20, 2.5);
  }

  // Panel inferior de Código en Vivo (32% inferior)
  const dockTop = flowerTop + flowerAreaH + 8;
  const dockH = height - dockTop;
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, dockTop, width, dockH);
  ctx.strokeStyle = 'rgba(250, 122, 37, 0.35)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, dockTop);
  ctx.lineTo(width, dockTop);
  ctx.stroke();

  const headerH = Math.round(dockH * 0.13);
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, dockTop, width, headerH);

  ctx.fillStyle = '#facc15';
  ctx.font = `700 ${Math.round(width * 0.021)}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillText(
    `🐍 LIVE CODE: ave_del_paraiso_sobel.py │ bordes=${gridData.stats.edgeRatio}%`,
    14,
    dockTop + headerH * 0.5
  );

  const linesStart = dockTop + headerH + 4;
  const lineH = (dockH - headerH - 10) / CODE_LINES_PREVIEW.length;
  const codeFontPx = Math.max(8, Math.floor(lineH * 0.72));
  ctx.font = `500 ${codeFontPx}px "JetBrains Mono", monospace`;
  ctx.textBaseline = 'middle';

  CODE_LINES_PREVIEW.forEach((lineText, idx) => {
    const ly = linesStart + idx * lineH;
    const isActive = idx === activeCodeLine;
    if (isActive) {
      ctx.fillStyle = 'rgba(250, 122, 37, 0.18)';
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

/**
 * Exporta un GIF animado en proporción 9:16 (Escaneo Paso a Paso + Brisa Viva).
 */
export async function exportVerticalGif(computeFrameAtPhase, onProgress) {
  const width = 432;
  const height = 768;
  const offCanvas = document.createElement('canvas');
  offCanvas.width = width;
  offCanvas.height = height;
  const ctx = offCanvas.getContext('2d', { willReadFrequently: true });

  const gif = GIFEncoder();
  const totalFrames = 28;
  const revealFrames = 16;
  const staticGrid = computeFrameAtPhase(null);

  for (let i = 0; i < totalFrames; i++) {
    let gridData = staticGrid;
    let revealProg = 1.0;
    let activeLine = 11;

    if (i < revealFrames) {
      revealProg = (i + 1) / revealFrames;
      activeLine = Math.min(11, Math.floor(revealProg * 12));
    } else {
      const phase = (i - revealFrames) * 0.45;
      gridData = computeFrameAtPhase(phase);
    }

    renderVerticalCompositeFrame(ctx, width, height, gridData, revealProg, activeLine);
    const { data } = ctx.getImageData(0, 0, width, height);
    const palette = quantize(data, 128);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, width, height, { palette, delay: 90 });

    if (onProgress) onProgress(Math.round(((i + 1) / totalFrames) * 100));
    await new Promise(r => setTimeout(r, 0));
  }

  gif.finish();
  const bytes = gif.bytes();
  const blob = new Blob([bytes], { type: 'image/gif' });
  triggerDownloadBlob(blob, 'ave-del-paraiso-sobel-9x16.gif');
}

/**
 * Graba un video WebM 9:16 con MediaRecorder reproduciendo el Escaneo Paso a Paso + Brisa Viva.
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

  const mimeCandidates = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm'
  ];
  const mimeType = mimeCandidates.find(m => MediaRecorder.isTypeSupported(m)) || '';
  const stream = recCanvas.captureStream(30);
  const recorder = mimeType
    ? new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 4_500_000 })
    : new MediaRecorder(stream);

  const chunks = [];
  recorder.ondataavailable = e => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  const stopped = new Promise(resolve => {
    recorder.onstop = resolve;
  });

  const staticGrid = computeFrameAtPhase(null);
  const totalFrames = 90; // 3.0s @ 30fps
  const revealFrames = 52;

  recorder.start();
  for (let i = 0; i < totalFrames; i++) {
    let gridData = staticGrid;
    let revealProg = 1.0;
    let activeLine = 11;

    if (i < revealFrames) {
      revealProg = (i + 1) / revealFrames;
      activeLine = Math.min(11, Math.floor(revealProg * 12));
    } else {
      const phase = (i - revealFrames) * 0.16;
      gridData = computeFrameAtPhase(phase);
    }

    renderVerticalCompositeFrame(ctx, width, height, gridData, revealProg, activeLine);
    if (onProgress) onProgress(Math.round(((i + 1) / totalFrames) * 100));
    await new Promise(r => setTimeout(r, 33));
  }

  recorder.stop();
  await stopped;
  stream.getTracks().forEach(t => t.stop());

  const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
  triggerDownloadBlob(blob, 'ave-del-paraiso-sobel-9x16.webm');
}
