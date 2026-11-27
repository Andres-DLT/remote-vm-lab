import { exportVerticalGif, exportVerticalWebm } from './exporter.js';
import { computeSobelGridWithPyodide, isPyodideReady } from './pyodideRunner.js';
import {
  CHAR_RAMPS,
  KERNEL_PRESETS,
  computeSobelAsciiGrid,
  extractCroppedImageCanvas,
  gridToAnsiText,
  gridToPlainText,
  renderProceduralStrelitziaToCanvas
} from './sobelEngine.js';
import { renderVmDashboard } from './vmDashboard.js';

const state = {
  sourceType: 'photo', // 'photo' | 'procedural' | 'upload'
  viewMode: 'combined', // 'combined' | 'edges' | 'magnitude'
  renderTarget: 'canvas', // 'canvas' | 'pre'
  verticalFraming: false,
  pipExpanded: false,

  // cv2.Sobel & ASCII pipeline parameters
  cols: 88,
  edgeThreshold: 52,
  kernelKey: '3',
  saturationBoost: 1.38,
  contrastBoost: 1.16,
  rampKey: 'classic',

  // Animation states
  isRevealing: false,
  revealProgress: 1.0, // 0..1
  breezeActive: false,
  breezePhase: 0,

  // Live code dock state
  activeCodeLine: 11, // 0..11
  flashedStages: new Set(),

  // Pyodide WebAssembly state
  pyodideBusy: false,
  lastPyodideMs: null,

  // Export state
  exportBusy: false,

  // Hover cell inspector
  hoveredCell: null,

  // Cached source canvas & computed grid
  sourceCanvas: null,
  sourceVersion: 0,
  gridData: null
};

let animFrameId = null;
let revealStartTime = 0;
let lastCodeDockSig = '';
let proceduralRawCanvas = null;
let proceduralCroppedCanvas = null;
const REVEAL_DURATION_MS = 3800;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function buildShellHTML() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div id="vm-dashboard-view" hidden></div>
    <div class="studio-shell" id="studio-view">
      <header class="studio-header">
        <div class="brand-group">
          <div class="brand-emblem" aria-hidden="true">/|\\</div>
          <div class="brand-titles">
            <h1>
              Ave del Paraíso — Arte ASCII con cv2.Sobel
              <span class="species-tag">Strelitzia reginae</span>
            </h1>
            <p class="brand-subtitle">
              Detección de bordes direccional <code>cv2.Sobel(gray, cv2.CV_64F, dx, dy)</code> + código Python en vivo abajo
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-primary" id="btn-play-scan">
            ▶ Escaneo Paso a Paso
          </button>
          <button type="button" class="btn btn-breeze" id="btn-toggle-breeze">
            🌬️ Brisa Viva 60fps
          </button>
          <button type="button" class="btn btn-vertical" id="btn-toggle-framing">
            📱 Vista Vertical 9:16
          </button>
          <button type="button" class="btn" id="btn-export-webm" title="Grabar animación en video WebM 9:16">
            🎥 Exportar WebM
          </button>
          <button type="button" class="btn" id="btn-export-gif" title="Exportar animación en GIF 9:16">
            🎞️ Exportar GIF
          </button>
          <button type="button" class="btn" id="btn-copy-ascii">
            📋 Copiar ASCII
          </button>
          <a
            class="btn"
            id="btn-download-py"
            href="./ave_del_paraiso_sobel.py"
            download="ave_del_paraiso_sobel.py"
          >
            🐍 Descargar .py
          </a>
          <a class="btn btn-vm-lab" id="btn-open-vm-lab" href="#/vm-lab" title="Abrir el panel original Remote VM Lab">
            🖥️ VM Lab
          </a>
        </div>
      </header>

      <main class="studio-workspace" id="studio-workspace">
        <!-- LEFT / MAIN: Split Stage (Top ASCII Flower + Bottom Live Python Code) -->
        <section class="sobel-split-stage" aria-label="Terminal de Arte ASCII y Código en Vivo">
          <div class="stage-topbar">
            <div class="window-dots">
              <span class="win-dot crimson"></span>
              <span class="win-dot gold"></span>
              <span class="win-dot emerald"></span>
              <span class="terminal-title" id="terminal-dim-label">python3 ave_del_paraiso_sobel.py — 88×53</span>
            </div>

            <div class="view-mode-tabs" role="tablist">
              <button type="button" class="mode-tab active" data-view-mode="combined" id="tab-mode-combined">
                🌺 Sobel + Color
              </button>
              <button type="button" class="mode-tab" data-view-mode="edges" id="tab-mode-edges">
                📐 Solo Bordes (/ | \\ -)
              </button>
              <button type="button" class="mode-tab" data-view-mode="magnitude" id="tab-mode-magnitude">
                🔥 Magnitud |G|
              </button>
              <button type="button" class="mode-tab" id="btn-toggle-selectable">
                🔤 Seleccionar Texto
              </button>
            </div>
          </div>

          <!-- UPPER VIEWPORT: ASCII Art Canvas + Reference PiP -->
          <div class="ascii-viewport-wrapper" id="ascii-viewport-wrapper">
            <canvas
              class="ascii-canvas"
              id="ascii-canvas"
              role="img"
              aria-label="Arte ASCII direccional de la flor Ave del Paraíso generado con cv2.Sobel"
            ></canvas>
            <div class="sr-only" id="ascii-sr-summary" aria-live="polite"></div>
            <pre class="ascii-pre-selectable" id="ascii-pre" hidden></pre>

            <div class="reference-pip" id="reference-pip" title="Haz clic para ampliar/reducir la referencia original">
              <div class="reference-pip-header">
                <span>Ref. Original</span>
                <span id="pip-toggle-label">🔍</span>
              </div>
              <canvas id="pip-canvas" aria-label="Miniatura de la imagen de referencia original"></canvas>
            </div>
          </div>

          <!-- MATHEMATICAL SOBEL CELL INSPECTOR HUD -->
          <div class="sobel-hud-bar" id="sobel-hud-bar">
            <div class="hud-metrics" id="hud-metrics-content">
              <span class="hud-pill">Pasa el cursor o toca la flor para inspeccionar <strong>Gx, Gy, |G| y θ°</strong> de cada celda ASCII</span>
            </div>
            <div class="hud-metrics">
              <span class="hud-pill" id="pyodide-runtime-pill" hidden>
                WASM cv2.Sobel: <strong id="stat-pyodide-ms">-- ms</strong>
              </span>
              <span class="hud-pill">Bordes Sobel: <strong id="stat-edge-ratio">--%</strong></span>
              <span class="hud-pill">Celdas activas: <strong id="stat-active-cells">--</strong></span>
            </div>
          </div>

          <!-- LOWER VIEWPORT: LIVE PYTHON CODE DOCK ("con código en vivo abajo") -->
          <div class="live-code-dock" id="live-code-dock">
            <div class="code-dock-header">
              <div class="code-dock-title">
                <span class="code-live-indicator"></span>
                <span>ave_del_paraiso_sobel.py — Código en Vivo Sincronizado</span>
              </div>
              <div class="header-actions">
                <span class="code-dock-subtitle">Haz clic en cualquier línea para inspeccionar su etapa</span>
                <button
                  type="button"
                  class="btn btn-sm btn-pyodide"
                  id="btn-run-pyodide"
                  title="Ejecuta el script real con OpenCV (cv2.Sobel) compilado a WebAssembly mediante Pyodide"
                >
                  🐍 Ejecutar Python Real (Pyodide)
                </button>
                <button type="button" class="btn btn-sm" id="btn-copy-python">
                  📋 Copiar Script Python
                </button>
                <button type="button" class="btn btn-sm" id="btn-copy-ansi">
                  🎨 Copiar ANSI (Terminal)
                </button>
              </div>
            </div>

            <div class="code-lines-container" id="live-code-lines"></div>

            <div class="cli-command-bar">
              <code class="cli-prompt" id="live-cli-command">$ python3 ave_del_paraiso_sobel.py --width 88 --threshold 52 --ksize 3</code>
              <button type="button" class="btn btn-sm" id="btn-copy-cli">Copiar CLI</button>
            </div>
          </div>
        </section>

        <!-- RIGHT SIDEBAR: Interactive Parameters & Sobel Kernel Matrices -->
        <aside class="controls-sidebar" aria-label="Controles del Pipeline cv2.Sobel">
          <div class="panel-card">
            <div class="panel-heading">
              <h2>Fuente Botánica</h2>
              <span class="panel-tag">Strelitzia</span>
            </div>
            <div class="source-grid">
              <button type="button" class="source-btn active" data-source="photo" id="btn-src-photo">
                🌺 Foto Estudio HD
              </button>
              <button type="button" class="source-btn" data-source="procedural" id="btn-src-procedural">
                🎨 Vector Procedural
              </button>
            </div>
            <label class="upload-label" for="input-upload-image">
              <span>📷 Subir otra flor / imagen...</span>
              <input type="file" id="input-upload-image" accept="image/*" hidden />
            </label>
          </div>

          <div class="panel-card">
            <div class="panel-heading">
              <h2>Parámetros cv2.Sobel</h2>
              <span class="panel-tag">Tiempo Real</span>
            </div>

            <div class="control-group">
              <div class="control-item">
                <div class="control-label">
                  <label for="slider-cols">Resolución Columnas (<code>WIDTH</code>)</label>
                  <code id="val-cols">88 cols</code>
                </div>
                <input type="range" id="slider-cols" min="48" max="140" step="2" value="88" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="slider-threshold">Umbral de Borde (<code>EDGE_THRESH</code>)</label>
                  <code id="val-threshold">52</code>
                </div>
                <input type="range" id="slider-threshold" min="14" max="150" step="1" value="52" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="select-kernel">Operador Derivativo (<code>ksize</code>)</label>
                </div>
                <select class="select-input" id="select-kernel">
                  <option value="3">cv2.Sobel (ksize=3) — Estándar 3×3</option>
                  <option value="5">cv2.Sobel (ksize=5) — Suavizado 5×5 Real</option>
                  <option value="scharr">cv2.Sobel (ksize=-1) — Filtro Scharr</option>
                </select>
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="slider-saturation">Saturación Botánica HSV</label>
                  <code id="val-saturation">1.38×</code>
                </div>
                <input type="range" id="slider-saturation" min="0.5" max="2.2" step="0.02" value="1.38" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="slider-contrast">Contraste / Brillo</label>
                  <code id="val-contrast">1.16×</code>
                </div>
                <input type="range" id="slider-contrast" min="0.7" max="1.8" step="0.02" value="1.16" />
              </div>

              <div class="control-item">
                <div class="control-label">
                  <label for="select-ramp">Rampa de Densidad ASCII</label>
                </div>
                <select class="select-input" id="select-ramp">
                  ${Object.entries(CHAR_RAMPS)
                    .map(([k, v]) => `<option value="${k}">${v.name}</option>`)
                    .join('')}
                </select>
              </div>
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-heading">
              <h2>Matrices de Convolución</h2>
              <span class="panel-tag" id="kernel-tag-label">ksize=3</span>
            </div>
            <p style="font-size: 0.76rem; color: var(--text-secondary);">
              Cada celda calcula <code style="color: var(--strelitzia-orange);">Gx</code> y
              <code style="color: var(--strelitzia-blue);">Gy</code> para elegir el trazo tangente al pétalo:
            </p>
            <div class="kernels-grid" id="kernels-matrix-view"></div>

            <div class="compass-legend">
              <div class="compass-item">
                <div class="compass-glyph">|</div>
                <div class="compass-angle">0° / 180°</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">/</div>
                <div class="compass-angle">45°</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">-</div>
                <div class="compass-angle">90°</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">\\</div>
                <div class="compass-angle">135°</div>
              </div>
            </div>
          </div>
        </aside>
      </main>

      <div class="toast-msg" id="toast-msg" role="status" aria-live="polite"></div>
    </div>
  `;
}

let toastTimer = null;
function showToast(message, durationMs = 2600) {
  const el = document.getElementById('toast-msg');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimer);
  if (durationMs > 0) {
    toastTimer = setTimeout(() => el.classList.remove('visible'), durationMs);
  }
}

function renderKernelMatrices() {
  const container = document.getElementById('kernels-matrix-view');
  const tag = document.getElementById('kernel-tag-label');
  const preset = KERNEL_PRESETS[state.kernelKey] || KERNEL_PRESETS['3'];
  const dim = preset.size || preset.gx.length;
  if (tag) tag.textContent = `${preset.pyArg} (${dim}×${dim})`;

  const formatMatrix = (mat, title) => `
    <div class="kernel-box">
      <div class="kernel-title"><span>${title}</span><span>${dim}×${dim}</span></div>
      <div class="matrix-grid matrix-${dim}x${dim}" style="grid-template-columns: repeat(${dim}, 1fr);">
        ${mat
          .flat()
          .map(v => {
            const cls = v < 0 ? 'neg' : v > 0 ? 'pos' : '';
            return `<div class="matrix-cell ${dim === 5 ? 'cell-5x5' : ''} ${cls}">${v > 0 ? `+${v}` : v}</div>`;
          })
          .join('')}
      </div>
    </div>
  `;

  container.innerHTML = formatMatrix(preset.gx, 'Gx (Horizontal)') + formatMatrix(preset.gy, 'Gy (Vertical)');
}

function getLivePythonLines() {
  const preset = KERNEL_PRESETS[state.kernelKey] || KERNEL_PRESETS['3'];
  const rampStr = (CHAR_RAMPS[state.rampKey] || CHAR_RAMPS.classic).ramp;
  const imgName =
    state.sourceType === 'procedural'
      ? 'procedural_strelitzia()'
      : state.sourceType === 'upload'
      ? "'custom_flower.jpg'"
      : "'public/ave-del-paraiso.jpg'";

  return [
    {
      num: '01',
      stage: 'import',
      badge: 'import',
      html: `<span class="tok-kw">import</span> cv2, numpy <span class="tok-kw">as</span> np, sys`
    },
    {
      num: '02',
      stage: 'input',
      badge: 'input',
      html: `img = cv2.<span class="tok-fn">imread</span>(<span class="tok-str">${imgName}</span>)  <span class="tok-cmt"># Strelitzia reginae</span>`
    },
    {
      num: '03',
      stage: 'resize',
      badge: 'resize',
      html: `resized = cv2.<span class="tok-fn">resize</span>(img, (<span class="tok-live-val">${state.cols}</span>, <span class="tok-num">${
        state.gridData ? state.gridData.rows : 53
      }</span>), interpolation=cv2.INTER_AREA)`
    },
    {
      num: '04',
      stage: 'hsv',
      badge: 'hsv',
      html: `hsv = cv2.<span class="tok-fn">cvtColor</span>(resized, cv2.COLOR_BGR2HSV) * [<span class="tok-num">1</span>, <span class="tok-live-val">${state.saturationBoost.toFixed(
        2
      )}</span>, <span class="tok-live-val">${state.contrastBoost.toFixed(2)}</span>]`
    },
    {
      num: '05',
      stage: 'blur',
      badge: 'blur',
      html: `gray = cv2.<span class="tok-fn">GaussianBlur</span>(cv2.<span class="tok-fn">cvtColor</span>(resized, cv2.COLOR_BGR2GRAY), (<span class="tok-num">3</span>, <span class="tok-num">3</span>), <span class="tok-num">0</span>)`
    },
    {
      num: '06',
      stage: 'sobel_x',
      badge: 'Sobel Gx',
      html: `gx = cv2.<span class="tok-fn">Sobel</span>(gray, cv2.CV_64F, <span class="tok-num">1</span>, <span class="tok-num">0</span>, <span class="tok-live-val">${preset.pyArg}</span>)  <span class="tok-cmt"># ∂I/∂x</span>`
    },
    {
      num: '07',
      stage: 'sobel_y',
      badge: 'Sobel Gy',
      html: `gy = cv2.<span class="tok-fn">Sobel</span>(gray, cv2.CV_64F, <span class="tok-num">0</span>, <span class="tok-num">1</span>, <span class="tok-live-val">${preset.pyArg}</span>)  <span class="tok-cmt"># ∂I/∂y</span>`
    },
    {
      num: '08',
      stage: 'mag',
      badge: 'magnitud',
      html: `mag = np.<span class="tok-fn">hypot</span>(gx, gy) / np.<span class="tok-fn">hypot</span>(gx, gy).<span class="tok-fn">max</span>() * <span class="tok-num">255.0</span>`
    },
    {
      num: '09',
      stage: 'angle',
      badge: 'ángulo θ',
      html: `angle = (np.<span class="tok-fn">degrees</span>(np.<span class="tok-fn">arctan2</span>(gy, gx)) + <span class="tok-num">180.0</span>) % <span class="tok-num">180.0</span>`
    },
    {
      num: '10',
      stage: 'map_edge',
      badge: 'vectores',
      html: `edge_ch = np.<span class="tok-fn">select</span>([angle&lt;<span class="tok-num">22.5</span>, angle&lt;<span class="tok-num">67.5</span>, angle&lt;<span class="tok-num">112.5</span>, angle&lt;<span class="tok-num">157.5</span>], [<span class="tok-str">'|'</span>,<span class="tok-str">'/'</span>,<span class="tok-str">'-'</span>,<span class="tok-str">'\\\\'</span>], <span class="tok-str">'|'</span>)`
    },
    {
      num: '11',
      stage: 'compose',
      badge: 'umbral',
      html: `glyph = np.<span class="tok-fn">where</span>(mag &gt;= <span class="tok-live-val">${state.edgeThreshold}</span>, edge_ch, <span class="tok-str">"${rampStr}"</span>[lum_idx])`
    },
    {
      num: '12',
      stage: 'render',
      badge: 'ANSI 24b',
      html: `sys.stdout.<span class="tok-fn">write</span>(<span class="tok-str">f"\\033[38;2;{r};{g};{b}m{glyph}\\033[0m"</span>)  <span class="tok-cmt"># modo=${state.viewMode}</span>`
    }
  ];
}

function buildCliCommandText() {
  const kFlag =
    state.kernelKey === '5'
      ? ' --ksize 5'
      : state.kernelKey === 'scharr'
      ? ' --ksize -1'
      : '';
  const cFlag = Math.abs(state.contrastBoost - 1.15) > 0.005 ? ` --contrast ${state.contrastBoost}` : '';
  const rFlag = state.rampKey !== 'classic' ? ` --ramp ${state.rampKey}` : '';
  const mFlag = state.viewMode !== 'combined' ? ` --mode ${state.viewMode}` : '';
  return `--width ${state.cols} --threshold ${state.edgeThreshold}${kFlag} --saturation ${state.saturationBoost}${cFlag}${rFlag}${mFlag}`;
}

function renderLiveCodeDock(force = false) {
  const container = document.getElementById('live-code-lines');
  if (!container) return;

  const rows = state.gridData ? state.gridData.rows : 53;
  const flashedKey = Array.from(state.flashedStages).sort().join(',');
  const sig = `${state.sourceType}|${state.cols}x${rows}|${state.edgeThreshold}|${state.kernelKey}|${state.saturationBoost}|${state.contrastBoost}|${state.rampKey}|${state.viewMode}|${state.activeCodeLine}|${state.isRevealing}|${flashedKey}`;

  if (!force && sig === lastCodeDockSig) return;
  lastCodeDockSig = sig;

  const lines = getLivePythonLines();
  container.innerHTML = lines
    .map((line, idx) => {
      const isActive = idx === state.activeCodeLine;
      const isFlashed = state.flashedStages.has(line.stage);
      const cursorHtml = isActive && state.isRevealing ? '<span class="typewriter-cursor"></span>' : '';
      return `
        <div
          class="code-line ${isActive ? 'active-step' : ''} ${isFlashed ? 'param-flash' : ''}"
          data-code-idx="${idx}"
          data-stage="${line.stage}"
        >
          <span class="line-num">${isActive ? '▶ ' : ''}${line.num}</span>
          <span class="line-content">${line.html}${cursorHtml}</span>
          <span class="line-badge">${line.badge}</span>
        </div>
      `;
    })
    .join('');

  const cliEl = document.getElementById('live-cli-command');
  if (cliEl) {
    cliEl.innerHTML = `$ python3 ave_del_paraiso_sobel.py <span>${buildCliCommandText()}</span>`;
  }
}

function flashCodeStages(stages) {
  stages.forEach(s => state.flashedStages.add(s));
  renderLiveCodeDock(true);
  setTimeout(() => {
    stages.forEach(s => state.flashedStages.delete(s));
    renderLiveCodeDock(true);
  }, 420);
}

function drawAsciiGridToCanvas() {
  if (!state.gridData) return;
  const { grid, cols, rows } = state.gridData;

  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const wrapper = document.getElementById('ascii-viewport-wrapper');
  const availW = wrapper && wrapper.clientWidth > 120 ? wrapper.clientWidth - 28 : 960;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  // Ajustar celda para que quepa en pantallas móviles sin desbordar horizontalmente
  const defaultCharW = cols > 110 ? 7.2 : cols > 85 ? 8.6 : 10.2;
  const maxFitCharW = Math.max(3.8, (availW - 20) / cols);
  const baseCharW = Math.min(defaultCharW, maxFitCharW);
  const baseCharH = baseCharW * 1.92;

  const logicalW = Math.ceil(cols * baseCharW + 20);
  const logicalH = Math.ceil(rows * baseCharH + 20);

  const targetW = Math.round(logicalW * dpr);
  const targetH = Math.round(logicalH * dpr);
  if (canvas.width !== targetW) canvas.width = targetW;
  if (canvas.height !== targetH) canvas.height = targetH;
  canvas.style.width = `${logicalW}px`;
  canvas.style.height = `${logicalH}px`;

  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);

  // Obsidian terminal background
  ctx.fillStyle = '#04060a';
  ctx.fillRect(0, 0, logicalW, logicalH);

  ctx.font = `600 ${Math.max(6, Math.round(baseCharH * 0.82))}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'top';

  const padX = 10;
  const padY = 10;

  const colorRowLimit = state.isRevealing ? Math.floor(state.revealProgress * rows) : rows;
  const edgeScanLimit = state.isRevealing
    ? Math.min(rows, colorRowLimit + Math.max(5, Math.floor(rows * 0.16)))
    : rows;

  for (let y = 0; y < rows; y++) {
    if (state.isRevealing && y >= edgeScanLimit) continue;

    const inEdgeScanBand = state.isRevealing && y >= colorRowLimit && y < edgeScanLimit;
    const row = grid[y];
    const py = padY + y * baseCharH;

    for (let x = 0; x < cols; x++) {
      const cell = row[x];
      if (inEdgeScanBand) {
        if (cell.edgeChar === ' ') continue;
        ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
        ctx.fillText(cell.edgeChar, padX + x * baseCharW, py);
      } else {
        if (cell.char === ' ') continue;
        ctx.fillStyle = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
        ctx.fillText(cell.char, padX + x * baseCharW, py);
      }
    }
  }

  // Draw laser scanline during progressive scan reveal
  if (state.isRevealing && colorRowLimit < rows) {
    const scanY = padY + colorRowLimit * baseCharH;
    const grad = ctx.createLinearGradient(0, scanY - 4, logicalW, scanY + 4);
    grad.addColorStop(0, 'rgba(250, 122, 37, 0)');
    grad.addColorStop(0.5, 'rgba(250, 204, 46, 0.75)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, scanY - 1, logicalW, 2.5);
  }

  // Draw Sobel kernel inspection reticle if user is hovering a cell
  if (state.hoveredCell) {
    const { col, row } = state.hoveredCell;
    const preset = KERNEL_PRESETS[state.kernelKey] || KERNEL_PRESETS['3'];
    const kDim = preset.size || 3;
    const kHalf = (kDim - 1) >> 1;
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      const rx = padX + (col - kHalf) * baseCharW - 1;
      const ry = padY + (row - kHalf) * baseCharH - 1;
      ctx.strokeStyle = 'rgba(250, 204, 46, 0.85)';
      ctx.lineWidth = 1.3;
      ctx.strokeRect(rx, ry, baseCharW * kDim + 2, baseCharH * kDim + 2);
    }
  }

  ctx.restore();

  // Save cell geometry on canvas dataset for pointer inspection
  canvas.dataset.charW = String(baseCharW);
  canvas.dataset.charH = String(baseCharH);
  canvas.dataset.padX = String(padX);
  canvas.dataset.padY = String(padY);
}

function renderSelectablePre() {
  const pre = document.getElementById('ascii-pre');
  if (!pre || !state.gridData) return;

  const htmlRows = state.gridData.grid.map(row =>
    row
      .map(c => {
        if (c.char === ' ') return ' ';
        const safeChar = c.char === '<' ? '&lt;' : c.char === '>' ? '&gt;' : c.char === '&' ? '&amp;' : c.char;
        return `<span style="color:rgb(${c.r},${c.g},${c.b})">${safeChar}</span>`;
      })
      .join('')
  );
  pre.innerHTML = htmlRows.join('\n');
}

function updateStatsAndHud() {
  if (!state.gridData) return;
  const { stats, cols, rows } = state.gridData;

  const dimLabel = document.getElementById('terminal-dim-label');
  if (dimLabel) {
    dimLabel.textContent = `python3 ave_del_paraiso_sobel.py — ${cols}×${rows}`;
  }

  const ratioEl = document.getElementById('stat-edge-ratio');
  if (ratioEl) ratioEl.textContent = `${stats.edgeRatio}% (${stats.edgeCount})`;

  const activeEl = document.getElementById('stat-active-cells');
  if (activeEl) activeEl.textContent = String(stats.activeCount);

  const preset = KERNEL_PRESETS[state.kernelKey] || KERNEL_PRESETS['3'];
  const summaryText = `Flor Ave del Paraíso en arte ASCII (${cols} columnas por ${rows} filas), operador ${preset.label}, ${stats.activeCount} celdas activas y ${stats.edgeRatio}% de bordes direccionales.`;
  const canvas = document.getElementById('ascii-canvas');
  if (canvas) canvas.setAttribute('aria-label', summaryText);
  const srEl = document.getElementById('ascii-sr-summary');
  if (srEl && !state.breezeActive) srEl.textContent = summaryText;
}

function updateHoverHud(cellInfo) {
  const hud = document.getElementById('hud-metrics-content');
  if (!hud) return;

  if (!cellInfo || cellInfo.cell.char === ' ') {
    hud.innerHTML = `
      <span class="hud-pill">Pasa el cursor o toca la flor para inspeccionar <strong>Gx, Gy, |G| y θ°</strong> de cada celda ASCII</span>
    `;
    return;
  }

  const { col, row, cell } = cellInfo;
  const rgbHex = `#${[cell.r, cell.g, cell.b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  const kindLabel = cell.isEdge ? 'Borde cv2.Sobel' : 'Relleno Luminancia';

  hud.innerHTML = `
    <span class="hud-pill">Celda: <strong>(${col}, ${row})</strong></span>
    <span class="hud-pill">Glifo: <span class="hud-glyph-badge">${cell.char}</span> <span>${kindLabel}</span></span>
    <span class="hud-pill">Gx: <strong>${cell.gx}</strong></span>
    <span class="hud-pill">Gy: <strong>${cell.gy}</strong></span>
    <span class="hud-pill">|G|: <strong>${cell.mag}</strong>/255</span>
    <span class="hud-pill">θ: <strong>${cell.angle}°</strong></span>
    <span class="hud-pill">
      <span class="hud-swatch" style="background:${rgbHex}"></span>
      <strong>\\033[38;2;${cell.r};${cell.g};${cell.b}m</strong>
    </span>
  `;
}

function computeFrameForPhase(breezePhaseOverride = null) {
  if (!state.sourceCanvas) return null;

  let canvasToSample = state.sourceCanvas;
  if (state.sourceType === 'procedural' && breezePhaseOverride !== null) {
    if (!proceduralRawCanvas) proceduralRawCanvas = document.createElement('canvas');
    if (!proceduralCroppedCanvas) proceduralCroppedCanvas = document.createElement('canvas');
    renderProceduralStrelitziaToCanvas(proceduralRawCanvas, breezePhaseOverride);
    canvasToSample = extractCroppedImageCanvas(proceduralRawCanvas, proceduralCroppedCanvas);
  }

  return computeSobelAsciiGrid(canvasToSample, {
    cols: state.cols,
    edgeThreshold: state.edgeThreshold,
    kernelKey: state.kernelKey,
    saturationBoost: state.saturationBoost,
    contrastBoost: state.contrastBoost,
    rampKey: state.rampKey,
    viewMode: state.viewMode,
    breezePhase: state.sourceType !== 'procedural' ? breezePhaseOverride : null,
    sourceVersion: state.sourceVersion
  });
}

function recomputeAndRender(breezePhaseOverride = null) {
  if (!state.sourceCanvas) return;

  if (state.sourceType === 'procedural' && breezePhaseOverride !== null) {
    if (!proceduralRawCanvas) proceduralRawCanvas = document.createElement('canvas');
    if (!proceduralCroppedCanvas) proceduralCroppedCanvas = document.createElement('canvas');
    renderProceduralStrelitziaToCanvas(proceduralRawCanvas, breezePhaseOverride);
    state.sourceCanvas = extractCroppedImageCanvas(proceduralRawCanvas, proceduralCroppedCanvas);
    state.sourceVersion++;
    renderPipPreview();
  }

  state.gridData = computeFrameForPhase(breezePhaseOverride);

  updateStatsAndHud();
  if (state.renderTarget === 'canvas') {
    drawAsciiGridToCanvas();
  } else {
    renderSelectablePre();
  }
  renderLiveCodeDock();
}

function renderPipPreview() {
  const pipCanvas = document.getElementById('pip-canvas');
  if (!pipCanvas || !state.sourceCanvas) return;
  if (pipCanvas.width !== state.sourceCanvas.width) pipCanvas.width = state.sourceCanvas.width;
  if (pipCanvas.height !== state.sourceCanvas.height) pipCanvas.height = state.sourceCanvas.height;
  pipCanvas.getContext('2d').drawImage(state.sourceCanvas, 0, 0);
}

function startAnimationLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);

  const tick = now => {
    let needsNext = false;

    if (state.isRevealing) {
      const elapsed = now - revealStartTime;
      const prog = Math.min(1.0, elapsed / REVEAL_DURATION_MS);
      state.revealProgress = prog;
      state.activeCodeLine = Math.min(11, Math.floor(prog * 12));

      if (prog >= 1.0) {
        state.isRevealing = false;
        state.activeCodeLine = 11;
      } else {
        needsNext = true;
      }
    }

    if (state.breezeActive) {
      state.breezePhase += 0.085;
      recomputeAndRender(state.breezePhase);
      needsNext = true;
    } else {
      drawAsciiGridToCanvas();
      renderLiveCodeDock();
    }

    if (needsNext) {
      animFrameId = requestAnimationFrame(tick);
    } else {
      animFrameId = null;
    }
  };

  animFrameId = requestAnimationFrame(tick);
}

function triggerStepByStepScan() {
  state.isRevealing = true;
  state.revealProgress = 0.02;
  state.activeCodeLine = 0;
  revealStartTime = performance.now();

  if (state.renderTarget !== 'canvas') {
    toggleSelectableMode(false);
  }
  startAnimationLoop();
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.querySelectorAll('[data-view-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view-mode') === mode);
  });
  recomputeAndRender(state.breezeActive ? state.breezePhase : null);
}

function toggleSelectableMode(forcePre) {
  const canvas = document.getElementById('ascii-canvas');
  const pre = document.getElementById('ascii-pre');
  const btn = document.getElementById('btn-toggle-selectable');

  const toPre = typeof forcePre === 'boolean' ? forcePre : state.renderTarget === 'canvas';
  state.renderTarget = toPre ? 'pre' : 'canvas';

  if (toPre) {
    state.breezeActive = false;
    document.getElementById('btn-toggle-breeze')?.classList.remove('active');
    canvas.hidden = true;
    pre.hidden = false;
    btn?.classList.add('active');
    renderSelectablePre();
  } else {
    canvas.hidden = false;
    pre.hidden = true;
    btn?.classList.remove('active');
    drawAsciiGridToCanvas();
  }
}

function loadPhotoPreset(autoAnimate = !prefersReducedMotion()) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.sourceType = 'photo';
    state.sourceCanvas = extractCroppedImageCanvas(img);
    state.sourceVersion++;
    renderPipPreview();
    recomputeAndRender();
    if (autoAnimate) triggerStepByStepScan();
  };
  img.onerror = () => {
    loadProceduralPreset(autoAnimate);
  };
  img.src = './ave-del-paraiso.jpg';
}

function loadProceduralPreset(autoAnimate = !prefersReducedMotion()) {
  state.sourceType = 'procedural';
  if (!proceduralRawCanvas) proceduralRawCanvas = document.createElement('canvas');
  if (!proceduralCroppedCanvas) proceduralCroppedCanvas = document.createElement('canvas');
  renderProceduralStrelitziaToCanvas(proceduralRawCanvas, 0);
  state.sourceCanvas = extractCroppedImageCanvas(proceduralRawCanvas, proceduralCroppedCanvas);
  state.sourceVersion++;
  renderPipPreview();
  recomputeAndRender();
  if (autoAnimate) triggerStepByStepScan();
}

function getFullStandalonePythonCode() {
  const preset = KERNEL_PRESETS[state.kernelKey] || KERNEL_PRESETS['3'];
  const rampStr = (CHAR_RAMPS[state.rampKey] || CHAR_RAMPS.classic).ramp;

  return `#!/usr/bin/env python3
"""
Ave del Paraíso (Strelitzia reginae) — Arte ASCII con cv2.Sobel
Configuración exportada en vivo desde Sobel ASCII Studio
"""
import sys
import cv2
import numpy as np

WIDTH = ${state.cols}
EDGE_THRESHOLD = ${state.edgeThreshold}
SOBEL_KSIZE = ${preset.ksize}  # ${preset.label}
SATURATION_BOOST = ${state.saturationBoost}
CONTRAST_BOOST = ${state.contrastBoost}
DENSITY_RAMP = ${JSON.stringify(rampStr)}
VIEW_MODE = ${JSON.stringify(state.viewMode)}

def render_strelitzia_sobel(image_path="public/ave-del-paraiso.jpg"):
    img = cv2.imread(image_path)
    if img is None:
        raise FileNotFoundError(f"No se encontró la imagen: {image_path}")

    h, w = img.shape[:2]
    rows = max(16, int((h / w) * WIDTH * 0.5))
    resized = cv2.resize(img, (WIDTH, rows), interpolation=cv2.INTER_AREA)

    # Realce botánico HSV
    hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * SATURATION_BOOST, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * CONTRAST_BOOST, 0, 255)
    rgb = cv2.cvtColor(cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR), cv2.COLOR_BGR2RGB)
    edge_rgb = cv2.dilate(rgb, np.ones((3, 3), dtype=np.uint8))

    # Derivadas direccionales con cv2.Sobel
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)
    gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=SOBEL_KSIZE)
    gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=SOBEL_KSIZE)

    mag_raw = np.hypot(gx, gy)
    mag = (mag_raw / (float(mag_raw.max()) + 1e-6)) * 255.0
    angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0

    glyphs = np.select(
        [angle < 22.5, angle < 67.5, angle < 112.5, angle < 157.5],
        ["|", "/", "-", "\\\\"],
        default="|",
    )
    ramp_arr = np.array(list(DENSITY_RAMP))
    lum = gray.astype(np.int32)
    active = ~((lum < 14) & (mag < EDGE_THRESHOLD))
    edge_boost = np.minimum(255, (edge_rgb.astype(np.float64) * 1.12 + 14).astype(np.int32))

    is_edge = active & (mag >= EDGE_THRESHOLD)
    idx = np.minimum(len(DENSITY_RAMP) - 1, np.maximum(1, (lum / 255.0 * (len(DENSITY_RAMP) - 1)).astype(np.int32)))
    chars = np.where(active, np.where(is_edge, glyphs, ramp_arr[idx]), " ")
    out_rgb = np.where(active[..., None], np.where(is_edge[..., None], edge_boost, rgb.astype(np.int32)), 0)

    for char_row, rgb_row in zip(chars.tolist(), out_rgb.tolist()):
        sys.stdout.write(
            "".join(" " if c == " " else f"\\033[38;2;{r};{g};{b}m{c}\\033[0m" for c, (r, g, b) in zip(char_row, rgb_row))
            + "\\n"
        )

if __name__ == "__main__":
    render_strelitzia_sobel(sys.argv[1] if len(sys.argv) > 1 else "public/ave-del-paraiso.jpg")
`;
}

async function handleRunPyodide() {
  if (state.pyodideBusy || !state.sourceCanvas) return;
  const btn = document.getElementById('btn-run-pyodide');
  state.pyodideBusy = true;
  if (btn) {
    btn.disabled = true;
    btn.textContent = isPyodideReady() ? '🐍 Ejecutando cv2.Sobel...' : '⏳ Cargando Pyodide + OpenCV...';
  }

  try {
    const pyGrid = await computeSobelGridWithPyodide(
      state.sourceCanvas,
      {
        cols: state.cols,
        edgeThreshold: state.edgeThreshold,
        kernelKey: state.kernelKey,
        saturationBoost: state.saturationBoost,
        contrastBoost: state.contrastBoost,
        rampKey: state.rampKey,
        viewMode: state.viewMode
      },
      statusMsg => showToast(statusMsg, 0)
    );

    state.gridData = pyGrid;
    state.lastPyodideMs = pyGrid.elapsedMs;
    updateStatsAndHud();

    const pill = document.getElementById('pyodide-runtime-pill');
    const msEl = document.getElementById('stat-pyodide-ms');
    if (pill && msEl) {
      pill.hidden = false;
      msEl.textContent = `${pyGrid.elapsedMs} ms`;
    }

    if (state.renderTarget === 'canvas') {
      drawAsciiGridToCanvas();
    } else {
      renderSelectablePre();
    }
    flashCodeStages(['sobel_x', 'sobel_y', 'mag', 'angle', 'compose']);
    showToast(`✓ Ejecutado en Python real (Pyodide + OpenCV WASM) en ${pyGrid.elapsedMs} ms`, 3600);
  } catch (err) {
    showToast(`Error en Pyodide: ${err.message || err}`, 4000);
  } finally {
    state.pyodideBusy = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🐍 Ejecutar Python Real (Pyodide)';
    }
  }
}

async function handleExportMedia(kind) {
  if (state.exportBusy || !state.sourceCanvas) return;
  state.exportBusy = true;
  const btnId = kind === 'webm' ? 'btn-export-webm' : 'btn-export-gif';
  const btn = document.getElementById(btnId);
  const origLabel = btn?.textContent || '';
  if (btn) btn.disabled = true;

  try {
    const exporterFn = kind === 'webm' ? exportVerticalWebm : exportVerticalGif;
    const label = kind === 'webm' ? 'WebM 9:16' : 'GIF 9:16';
    showToast(`Generando ${label}... 0%`, 0);
    await exporterFn(
      phase => computeFrameForPhase(phase),
      pct => {
        if (btn) btn.textContent = `⏳ ${pct}%`;
        showToast(`Exportando ${label}... ${pct}%`, 0);
      }
    );
    showToast(`✓ ${label} descargado correctamente`, 3200);
  } catch (err) {
    showToast(`Error al exportar: ${err.message || err}`, 4000);
  } finally {
    state.exportBusy = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = origLabel;
    }
  }
}

function handleRouteChange() {
  const isVmLab = window.location.hash === '#/vm-lab';
  const vmContainer = document.getElementById('vm-dashboard-view');
  const studioContainer = document.getElementById('studio-view');
  if (!vmContainer || !studioContainer) return;

  if (isVmLab) {
    state.breezeActive = false;
    document.getElementById('btn-toggle-breeze')?.classList.remove('active');
    studioContainer.hidden = true;
    vmContainer.hidden = false;
    renderVmDashboard(vmContainer);
  } else {
    vmContainer.hidden = true;
    studioContainer.hidden = false;
    drawAsciiGridToCanvas();
  }
}

function bindEvents() {
  window.addEventListener('hashchange', handleRouteChange);
  window.addEventListener('resize', () => {
    if (state.renderTarget === 'canvas' && !state.breezeActive && !state.isRevealing) {
      drawAsciiGridToCanvas();
    }
  });

  document.getElementById('btn-play-scan')?.addEventListener('click', () => {
    triggerStepByStepScan();
  });

  document.getElementById('btn-toggle-breeze')?.addEventListener('click', e => {
    state.breezeActive = !state.breezeActive;
    e.currentTarget.classList.toggle('active', state.breezeActive);
    if (state.breezeActive) {
      if (state.renderTarget !== 'canvas') toggleSelectableMode(false);
      startAnimationLoop();
    } else {
      recomputeAndRender(null);
    }
  });

  document.getElementById('btn-toggle-framing')?.addEventListener('click', e => {
    state.verticalFraming = !state.verticalFraming;
    e.currentTarget.classList.toggle('active', state.verticalFraming);
    document.getElementById('studio-workspace')?.classList.toggle('vertical-framing', state.verticalFraming);
    drawAsciiGridToCanvas();
  });

  document.getElementById('btn-export-webm')?.addEventListener('click', () => handleExportMedia('webm'));
  document.getElementById('btn-export-gif')?.addEventListener('click', () => handleExportMedia('gif'));
  document.getElementById('btn-run-pyodide')?.addEventListener('click', () => handleRunPyodide());

  document.querySelectorAll('[data-view-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      setViewMode(btn.getAttribute('data-view-mode'));
    });
  });

  document.getElementById('btn-toggle-selectable')?.addEventListener('click', () => {
    toggleSelectableMode();
  });

  document.getElementById('reference-pip')?.addEventListener('click', e => {
    state.pipExpanded = !state.pipExpanded;
    e.currentTarget.classList.toggle('expanded', state.pipExpanded);
  });

  // Delegated click listener for Live Code Dock lines (no re-binding per frame)
  document.getElementById('live-code-lines')?.addEventListener('click', e => {
    const rowEl = e.target.closest('[data-code-idx]');
    if (!rowEl) return;
    const idx = Number(rowEl.getAttribute('data-code-idx'));
    const stage = rowEl.getAttribute('data-stage');
    state.activeCodeLine = idx;

    if (stage === 'sobel_x' || stage === 'sobel_y' || stage === 'map_edge') {
      setViewMode('edges');
    } else if (stage === 'mag') {
      setViewMode('magnitude');
    } else if (stage === 'compose' || stage === 'render') {
      setViewMode('combined');
    }
    renderLiveCodeDock(true);
  });

  // Source switchers
  document.querySelectorAll('[data-source]').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.getAttribute('data-source');
      document.querySelectorAll('[data-source]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (src === 'photo') loadPhotoPreset(true);
      else loadProceduralPreset(true);
      flashCodeStages(['input']);
    });
  });

  document.getElementById('input-upload-image')?.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        state.sourceType = 'upload';
        document.querySelectorAll('[data-source]').forEach(b => b.classList.remove('active'));
        state.sourceCanvas = extractCroppedImageCanvas(img);
        state.sourceVersion++;
        renderPipPreview();
        recomputeAndRender();
        triggerStepByStepScan();
        flashCodeStages(['input']);
        showToast('Imagen cargada y procesada con cv2.Sobel');
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });

  // Parameter sliders
  document.getElementById('slider-cols')?.addEventListener('input', e => {
    state.cols = Number(e.target.value);
    document.getElementById('val-cols').textContent = `${state.cols} cols`;
    state.activeCodeLine = 2;
    recomputeAndRender(state.breezeActive ? state.breezePhase : null);
    flashCodeStages(['resize']);
  });

  document.getElementById('slider-threshold')?.addEventListener('input', e => {
    state.edgeThreshold = Number(e.target.value);
    document.getElementById('val-threshold').textContent = String(state.edgeThreshold);
    state.activeCodeLine = 10;
    recomputeAndRender(state.breezeActive ? state.breezePhase : null);
    flashCodeStages(['compose']);
  });

  document.getElementById('select-kernel')?.addEventListener('change', e => {
    state.kernelKey = e.target.value;
    state.activeCodeLine = 5;
    renderKernelMatrices();
    recomputeAndRender(state.breezeActive ? state.breezePhase : null);
    flashCodeStages(['sobel_x', 'sobel_y']);
  });

  document.getElementById('slider-saturation')?.addEventListener('input', e => {
    state.saturationBoost = Number(e.target.value);
    document.getElementById('val-saturation').textContent = `${state.saturationBoost.toFixed(2)}×`;
    state.activeCodeLine = 3;
    recomputeAndRender(state.breezeActive ? state.breezePhase : null);
    flashCodeStages(['hsv']);
  });

  document.getElementById('slider-contrast')?.addEventListener('input', e => {
    state.contrastBoost = Number(e.target.value);
    document.getElementById('val-contrast').textContent = `${state.contrastBoost.toFixed(2)}×`;
    state.activeCodeLine = 3;
    recomputeAndRender(state.breezeActive ? state.breezePhase : null);
    flashCodeStages(['hsv']);
  });

  document.getElementById('select-ramp')?.addEventListener('change', e => {
    state.rampKey = e.target.value;
    state.activeCodeLine = 10;
    recomputeAndRender(state.breezeActive ? state.breezePhase : null);
    flashCodeStages(['compose']);
  });

  // Canvas pointer inspection (Sobel Cell Inspector)
  const canvas = document.getElementById('ascii-canvas');
  if (canvas) {
    const inspectPointer = clientX => {
      if (!state.gridData) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.offsetWidth / rect.width;
      const charW = Number(canvas.dataset.charW || 8.6);
      const charH = Number(canvas.dataset.charH || 16.5);
      const padX = Number(canvas.dataset.padX || 10);
      const padY = Number(canvas.dataset.padY || 10);

      const relX = (clientX.x - rect.left) * scaleX - padX;
      const relY = (clientX.y - rect.top) * scaleX - padY;
      const col = Math.floor(relX / charW);
      const row = Math.floor(relY / charH);

      if (col >= 0 && col < state.gridData.cols && row >= 0 && row < state.gridData.rows) {
        const cell = state.gridData.grid[row][col];
        state.hoveredCell = { col, row };
        updateHoverHud({ col, row, cell });
        if (!state.breezeActive && !state.isRevealing) drawAsciiGridToCanvas();
      }
    };

    canvas.addEventListener('mousemove', e => inspectPointer({ x: e.clientX, y: e.clientY }));
    canvas.addEventListener('mouseleave', () => {
      state.hoveredCell = null;
      updateHoverHud(null);
      if (!state.breezeActive && !state.isRevealing) drawAsciiGridToCanvas();
    });
    canvas.addEventListener(
      'touchmove',
      e => {
        const t = e.touches[0];
        if (t) inspectPointer({ x: t.clientX, y: t.clientY });
      },
      { passive: true }
    );
  }

  // Copy buttons
  document.getElementById('btn-copy-ascii')?.addEventListener('click', async () => {
    if (!state.gridData) return;
    await navigator.clipboard.writeText(gridToPlainText(state.gridData));
    showToast('Arte ASCII copiado al portapapeles');
  });

  document.getElementById('btn-copy-ansi')?.addEventListener('click', async () => {
    if (!state.gridData) return;
    await navigator.clipboard.writeText(gridToAnsiText(state.gridData));
    showToast('Arte ASCII con color ANSI 24-bit copiado para terminal');
  });

  document.getElementById('btn-copy-python')?.addEventListener('click', async () => {
    await navigator.clipboard.writeText(getFullStandalonePythonCode());
    showToast('Script Python cv2.Sobel copiado con tus parámetros actuales');
  });

  document.getElementById('btn-copy-cli')?.addEventListener('click', async () => {
    const cliText = document.getElementById('live-cli-command')?.textContent?.replace(/^\$\s*/, '') || '';
    await navigator.clipboard.writeText(cliText);
    showToast('Comando de terminal copiado');
  });
}

function init() {
  buildShellHTML();
  renderKernelMatrices();
  renderLiveCodeDock(true);
  bindEvents();
  loadPhotoPreset();
  handleRouteChange();
}

init();
