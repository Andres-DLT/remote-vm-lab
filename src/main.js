import { exportVerticalGif, exportVerticalWebm } from './exporter.js';
import { computeSobelGridWithPyodide, isPyodideReady } from './pyodideRunner.js';
import {
  CHAR_RAMPS,
  KERNEL_PRESETS,
  computeSobelAsciiGrid,
  extractCroppedImageCanvas,
  getSampledReferenceCanvas,
  gridToAnsiText,
  gridToPlainText,
  renderProceduralStrelitziaToCanvas
} from './sobelEngine.js';
import { renderVmDashboard } from './vmDashboard.js';

const STORY_ACTS = [
  {
    act: 1,
    shortLabel: '1. 📸 Foto Real',
    badge: 'PASO 1 DE 5 • LA FLOR REAL',
    title: 'Empezamos con la fotografía real del Ave del Paraíso (Strelitzia reginae)',
    subtitle:
      'Mira cómo la cortina escanea la foto original: cada pétalo naranja, lengua azul y pico verde se mide píxel a píxel.',
    codeLine: 1
  },
  {
    act: 2,
    shortLabel: '2. 🟠 Escáner Gx (|)',
    badge: 'PASO 2 DE 5 • DERIVADA HORIZONTAL Gx',
    title: 'cv2.Sobel(dx=1, dy=0) detecta cambios de luz de izquierda a derecha → traza "|"',
    subtitle:
      'Donde la luz salta horizontalmente (como en el tallo y los pétalos verticales), Sobel dibuja barras verticales "|".',
    codeLine: 5
  },
  {
    act: 3,
    shortLabel: '3. 🔵 Escáner Gy (-)',
    badge: 'PASO 3 DE 5 • DERIVADA VERTICAL Gy',
    title: 'cv2.Sobel(dx=0, dy=1) detecta cambios de luz de arriba a abajo → traza "-"',
    subtitle:
      'Donde la luz salta verticalmente (como en el pico horizontal del ave), Sobel dibuja guiones horizontales "-".',
    codeLine: 6
  },
  {
    act: 4,
    shortLabel: '4. 🧭 Brújula (/ | \\ -)',
    badge: 'PASO 4 DE 5 • BRÚJULA DE ÁNGULOS arctan2(Gy, Gx)',
    title: 'Combinamos Gx y Gy para obtener el ángulo exacto θ° de cada pétalo (→ ↗ ↑ ↖)',
    subtitle:
      'En vez de usar letras al azar, el ángulo del borde elige el carácter que sigue la curva del pétalo: |  /  -  \\.',
    codeLine: 9
  },
  {
    act: 5,
    shortLabel: '5. 🌺 Floración Viva',
    badge: 'PASO 5 DE 5 • ARTE ASCII VIVO + CORTINA RAYOS X',
    title: 'Relleno de luz + color botánico 24-bit + floración cinética y polen vivo',
    subtitle:
      'Toca o mueve el cursor sobre la flor para empujar los pétalos con viento, lanzar ondas de choque o deslizar la cortina.',
    codeLine: 11
  }
];

const state = {
  sourceType: 'photo', // 'photo' | 'procedural' | 'upload'
  viewMode: 'combined', // 'combined' | 'edges' | 'vectors' | 'magnitude'
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

  // Choreography & Story state (Always alive by default!)
  choreography: 'story', // 'story' | 'bloom' | 'curtain' | 'pulse'
  motionPlaying: true,
  storyAutoCycle: true,
  storyAct: 1, // 1..5
  storyActProgress: 0, // 0..1 within current act
  phase: 0,
  bloomFactor: 1.0,

  // Split-Screen X-Ray Curtain (Foto Real <-> Arte ASCII)
  curtainEnabled: false,
  curtainPos: 0.42, // 0..1
  isDraggingCurtain: false,

  // Interactive Pointer Wind & Click Shockwaves
  pointerWind: {
    active: false,
    normX: 0.5,
    normY: 0.5,
    forceX: 0
  },
  shockwaves: [],
  pollenParticles: [],

  // Live code dock state
  activeCodeLine: 0, // 0..11
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
let lastTickTime = 0;
let storyActStartTime = 0;
let lastCodeDockSig = '';
let lastStoryBannerSig = '';
let proceduralRawCanvas = null;
let proceduralCroppedCanvas = null;

// Duración de cada acto en el Modo Historia automático (ms)
const ACT_DURATIONS_MS = [2900, 2900, 2900, 3200, 6500];

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function initPollenParticles(count = 28) {
  const glyphs = ['✦', '*', '+', '·', '°'];
  const colors = [
    [253, 224, 71],  // Polen dorado
    [251, 146, 60],  // Naranja fuego
    [96, 165, 250],  // Azul cobalto
    [74, 222, 128],  // Verde esmeralda
    [244, 63, 94]    // Carmesí
  ];
  state.pollenParticles = Array.from({ length: count }, (_, i) => ({
    x: 0.18 + Math.random() * 0.68,
    y: 0.15 + Math.random() * 0.65,
    vx: (Math.random() - 0.5) * 0.0025,
    vy: -0.0022 - Math.random() * 0.0032,
    glyph: glyphs[i % glyphs.length],
    rgb: colors[i % colors.length],
    phase: Math.random() * Math.PI * 2,
    sizeBoost: (i % 3) * 0.15
  }));
}

function spawnPollenBurst(normX, normY, count = 7) {
  const glyphs = ['✦', '*', '+'];
  const colors = [
    [253, 224, 71],
    [251, 146, 60],
    [96, 165, 250]
  ];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 0.004 + Math.random() * 0.005;
    state.pollenParticles.push({
      x: normX,
      y: normY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.002,
      glyph: glyphs[i % glyphs.length],
      rgb: colors[i % colors.length],
      phase: Math.random() * Math.PI * 2,
      sizeBoost: 0.35,
      ttl: 55
    });
  }
  if (state.pollenParticles.length > 64) {
    state.pollenParticles.splice(0, state.pollenParticles.length - 64);
  }
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
              Ave del Paraíso — Arte ASCII Vivo con cv2.Sobel
              <span class="species-tag">Strelitzia reginae</span>
            </h1>
            <p class="brand-subtitle">
              De la fotografía real a vectores direccionales <code>(| / - \\)</code> y floración cinética en tiempo real
            </p>
          </div>
        </div>

        <div class="header-actions">
          <button type="button" class="btn btn-primary" id="btn-play-story" title="Reproducir explicación visual en 5 pasos">
            🎬 Historia Explicada (5 Pasos)
          </button>
          <button type="button" class="btn btn-breeze active" id="btn-toggle-motion" title="Activar/Pausar movimiento orgánico continuo">
            🌺 Flor Viva: ACTIVA
          </button>
          <button type="button" class="btn" id="btn-toggle-curtain" title="Comparar Foto Original HD vs Arte ASCII con una cortina interactiva">
            🌗 Cortina Foto ↔ ASCII
          </button>
          <button type="button" class="btn btn-vertical" id="btn-toggle-framing">
            📱 Vista Vertical 9:16
          </button>
          <button type="button" class="btn" id="btn-export-webm" title="Grabar la historia completa en video WebM 9:16">
            🎥 Exportar WebM
          </button>
          <button type="button" class="btn" id="btn-export-gif" title="Exportar la historia completa en GIF animado 9:16">
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
        <!-- LEFT / MAIN: Split Stage (Story Explainer + Top ASCII Flower + Bottom Live Python Code) -->
        <section class="sobel-split-stage" aria-label="Terminal de Arte ASCII y Código en Vivo">
          <!-- INTERACTIVE 5-STEP STORY STEPPER (Solves "no le entienden") -->
          <div class="story-guide-bar" id="story-guide-bar">
            <div class="story-steps-pills" role="tablist" aria-label="Pasos de cómo funciona cv2.Sobel">
              ${STORY_ACTS.map(
                s => `
                <button
                  type="button"
                  class="story-step-pill ${s.act === 1 ? 'active' : ''}"
                  data-story-act="${s.act}"
                  id="btn-story-act-${s.act}"
                >
                  ${s.shortLabel}
                </button>
              `
              ).join('')}
            </div>

            <div class="story-explainer-banner" id="story-explainer-banner">
              <div class="story-explainer-text">
                <span class="story-badge" id="story-banner-badge">${STORY_ACTS[0].badge}</span>
                <strong class="story-title" id="story-banner-title">${STORY_ACTS[0].title}</strong>
                <p class="story-subtitle" id="story-banner-subtitle">${STORY_ACTS[0].subtitle}</p>
              </div>
              <div class="story-progress-track">
                <div class="story-progress-fill" id="story-progress-fill" style="width: 15%"></div>
              </div>
            </div>
          </div>

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
                📐 Trazos (/ | \\ -)
              </button>
              <button type="button" class="mode-tab" data-view-mode="vectors" id="tab-mode-vectors">
                🧭 Flechas ∇I (→ ↗ ↑)
              </button>
              <button type="button" class="mode-tab" data-view-mode="magnitude" id="tab-mode-magnitude">
                🔥 Magnitud |G|
              </button>
              <button type="button" class="mode-tab" id="btn-toggle-selectable">
                🔤 Seleccionar Texto
              </button>
            </div>
          </div>

          <!-- UPPER VIEWPORT: ASCII Art Canvas + X-Ray Magnifier Lens + Reference PiP -->
          <div class="ascii-viewport-wrapper" id="ascii-viewport-wrapper">
            <canvas
              class="ascii-canvas"
              id="ascii-canvas"
              role="img"
              aria-label="Arte ASCII direccional vivo de la flor Ave del Paraíso generado con cv2.Sobel"
            ></canvas>
            <div class="sr-only" id="ascii-sr-summary" aria-live="polite"></div>
            <pre class="ascii-pre-selectable" id="ascii-pre" hidden></pre>

            <!-- Floating X-Ray Magnifier Lens on Hover/Touch -->
            <div class="xray-lens-card" id="xray-lens-card" hidden>
              <div class="xray-lens-header">
                <span>🔬 Lupa Rayos X cv2.Sobel</span>
                <code id="xray-coord-label">(0, 0)</code>
              </div>
              <div class="xray-lens-body">
                <canvas id="xray-patch-canvas" width="76" height="76"></canvas>
                <div class="xray-lens-math">
                  <div class="xray-glyph-row">
                    <span class="xray-big-arrow" id="xray-arrow-char">↗</span>
                    <span class="xray-equals">→</span>
                    <span class="xray-big-glyph" id="xray-edge-char">/</span>
                  </div>
                  <div class="xray-angle-line" id="xray-angle-text">Ángulo: 45°</div>
                  <div class="xray-plain-explain" id="xray-plain-explain">
                    Borde diagonal detectado
                  </div>
                </div>
              </div>
            </div>

            <div class="reference-pip" id="reference-pip" title="Haz clic para ampliar/reducir la foto original">
              <div class="reference-pip-header">
                <span>Foto Original</span>
                <span id="pip-toggle-label">🔍</span>
              </div>
              <canvas id="pip-canvas" aria-label="Miniatura de la imagen de referencia original"></canvas>
            </div>
          </div>

          <!-- MATHEMATICAL SOBEL CELL INSPECTOR HUD -->
          <div class="sobel-hud-bar" id="sobel-hud-bar">
            <div class="hud-metrics" id="hud-metrics-content">
              <span class="hud-pill">✨ <strong>Interactivo:</strong> Mueve el cursor para crear viento y ver la Lupa Rayos X • Haz clic en la flor para lanzar una <strong>Onda Vectorial</strong></span>
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

            <!-- PLAIN-SPANISH TRANSLATION OF ACTIVE CODE LINE -->
            <div class="code-plain-explainer" id="code-plain-explainer">
              <span class="explainer-icon">💡</span>
              <span id="code-plain-explainer-text">
                Haz clic en cualquier línea de código para ver qué hace en español sencillo y resaltar su efecto en la flor.
              </span>
            </div>

            <div class="code-lines-container" id="live-code-lines"></div>

            <div class="cli-command-bar">
              <code class="cli-prompt" id="live-cli-command">$ python3 ave_del_paraiso_sobel.py --width 88 --threshold 52 --ksize 3</code>
              <button type="button" class="btn btn-sm" id="btn-copy-cli">Copiar CLI</button>
            </div>
          </div>
        </section>

        <!-- RIGHT SIDEBAR: Choreography, Interactive Parameters & Sobel Kernel Matrices -->
        <aside class="controls-sidebar" aria-label="Controles del Pipeline cv2.Sobel">
          <div class="panel-card">
            <div class="panel-heading">
              <h2>Coreografía Visual</h2>
              <span class="panel-tag">En Vivo</span>
            </div>
            <div class="choreo-grid" id="choreo-grid">
              <button type="button" class="source-btn active" data-choreo="story">
                🎬 Historia 5 Pasos
              </button>
              <button type="button" class="source-btn" data-choreo="bloom">
                🌺 Floración + Polen
              </button>
              <button type="button" class="source-btn" data-choreo="curtain">
                🌗 Cortina Foto↔ASCII
              </button>
              <button type="button" class="source-btn" data-choreo="pulse">
                ⚡ Pulso Bioluminiscente
              </button>
            </div>
            <button type="button" class="btn" id="btn-trigger-shockwave" style="width: 100%; justify-content: center; margin-top: 6px;">
              💥 Lanzar Onda de Choque Vectorial
            </button>
          </div>

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
                🎨 Flor Cinética 2D
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
              <h2>¿Por qué cv2.Sobel?</h2>
              <span class="panel-tag" id="kernel-tag-label">ksize=3</span>
            </div>
            <p style="font-size: 0.76rem; color: var(--text-secondary);">
              Un ASCII común solo mide brillo. <strong>cv2.Sobel</strong> mide hacia dónde apunta cada borde (<code style="color: var(--strelitzia-orange);">Gx</code>, <code style="color: var(--strelitzia-blue);">Gy</code>) para dibujar la silueta exacta:
            </p>
            <div class="compass-legend" style="margin-bottom: 10px;">
              <div class="compass-item">
                <div class="compass-glyph">|</div>
                <div class="compass-angle">Vertical</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">/</div>
                <div class="compass-angle">Diagonal 45°</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">-</div>
                <div class="compass-angle">Horizontal</div>
              </div>
              <div class="compass-item">
                <div class="compass-glyph">\\</div>
                <div class="compass-angle">Diagonal 135°</div>
              </div>
            </div>
            <div class="kernels-grid" id="kernels-matrix-view"></div>
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
      explain: 'Importamos OpenCV (cv2) para visión artificial y NumPy (np) para cálculo matricial rápido.',
      html: `<span class="tok-kw">import</span> cv2, numpy <span class="tok-kw">as</span> np, sys`
    },
    {
      num: '02',
      stage: 'input',
      badge: 'foto real',
      explain: 'Cargamos la fotografía real de la flor Ave del Paraíso (o el modelo cinético 2D).',
      html: `img = cv2.<span class="tok-fn">imread</span>(<span class="tok-str">${imgName}</span>)  <span class="tok-cmt"># Strelitzia reginae</span>`
    },
    {
      num: '03',
      stage: 'resize',
      badge: 'rejilla',
      explain: `Ajustamos la imagen a una cuadrícula de ${state.cols} columnas × ${state.gridData ? state.gridData.rows : 53} filas de caracteres ASCII.`,
      html: `resized = cv2.<span class="tok-fn">resize</span>(img, (<span class="tok-live-val">${state.cols}</span>, <span class="tok-num">${
        state.gridData ? state.gridData.rows : 53
      }</span>), interpolation=cv2.INTER_AREA)`
    },
    {
      num: '04',
      stage: 'hsv',
      badge: 'color vivo',
      explain: `Multiplicamos la saturación (${state.saturationBoost.toFixed(2)}×) y el brillo (${state.contrastBoost.toFixed(2)}×) para encender el naranja y azul cobalto.`,
      html: `hsv = cv2.<span class="tok-fn">cvtColor</span>(resized, cv2.COLOR_BGR2HSV) * [<span class="tok-num">1</span>, <span class="tok-live-val">${state.saturationBoost.toFixed(
        2
      )}</span>, <span class="tok-live-val">${state.contrastBoost.toFixed(2)}</span>]`
    },
    {
      num: '05',
      stage: 'blur',
      badge: 'suavizado',
      explain: 'Convertimos a escala de grises y aplicamos un filtro Gaussiano 3×3 para limpiar ruido antes de medir bordes.',
      html: `gray = cv2.<span class="tok-fn">GaussianBlur</span>(cv2.<span class="tok-fn">cvtColor</span>(resized, cv2.COLOR_BGR2GRAY), (<span class="tok-num">3</span>, <span class="tok-num">3</span>), <span class="tok-num">0</span>)`
    },
    {
      num: '06',
      stage: 'sobel_x',
      badge: 'Sobel Gx (|)',
      explain: 'Derivada horizontal Gx: detecta dónde cambia la luz de izquierda a derecha (bordes verticales "|").',
      html: `gx = cv2.<span class="tok-fn">Sobel</span>(gray, cv2.CV_64F, <span class="tok-num">1</span>, <span class="tok-num">0</span>, <span class="tok-live-val">${preset.pyArg}</span>)  <span class="tok-cmt"># ∂I/∂x → |</span>`
    },
    {
      num: '07',
      stage: 'sobel_y',
      badge: 'Sobel Gy (-)',
      explain: 'Derivada vertical Gy: detecta dónde cambia la luz de arriba a abajo (bordes horizontales "-").',
      html: `gy = cv2.<span class="tok-fn">Sobel</span>(gray, cv2.CV_64F, <span class="tok-num">0</span>, <span class="tok-num">1</span>, <span class="tok-live-val">${preset.pyArg}</span>)  <span class="tok-cmt"># ∂I/∂y → -</span>`
    },
    {
      num: '08',
      stage: 'mag',
      badge: 'fuerza |G|',
      explain: 'Teorema de Pitágoras hypot(Gx, Gy): calcula qué tan fuerte es el borde de cada pétalo de 0 a 255.',
      html: `mag = np.<span class="tok-fn">hypot</span>(gx, gy) / np.<span class="tok-fn">hypot</span>(gx, gy).<span class="tok-fn">max</span>() * <span class="tok-num">255.0</span>`
    },
    {
      num: '09',
      stage: 'angle',
      badge: 'ángulo θ°',
      explain: 'Arcotangente arctan2(Gy, Gx): calcula el ángulo exacto (0° a 180°) hacia donde se inclina cada pétalo.',
      html: `angle = (np.<span class="tok-fn">degrees</span>(np.<span class="tok-fn">arctan2</span>(gy, gx)) + <span class="tok-num">180.0</span>) % <span class="tok-num">180.0</span>`
    },
    {
      num: '10',
      stage: 'map_edge',
      badge: 'brújula /|\\-',
      explain: "Traduce el ángulo θ° al símbolo ASCII que dibuja la inclinación real del pétalo: '|', '/', '-' o '\\'.",
      html: `edge_ch = np.<span class="tok-fn">select</span>([angle&lt;<span class="tok-num">22.5</span>, angle&lt;<span class="tok-num">67.5</span>, angle&lt;<span class="tok-num">112.5</span>, angle&lt;<span class="tok-num">157.5</span>], [<span class="tok-str">'|'</span>,<span class="tok-str">'/'</span>,<span class="tok-str">'-'</span>,<span class="tok-str">'\\\\'</span>], <span class="tok-str">'|'</span>)`
    },
    {
      num: '11',
      stage: 'compose',
      badge: 'contorno+luz',
      explain: `Si la fuerza del borde supera ${state.edgeThreshold}, dibuja el trazo direccional (/|\\-); si es interior, sombrea por brillo.`,
      html: `glyph = np.<span class="tok-fn">where</span>(mag &gt;= <span class="tok-live-val">${state.edgeThreshold}</span>, edge_ch, <span class="tok-str">"${rampStr}"</span>[lum_idx])`
    },
    {
      num: '12',
      stage: 'render',
      badge: 'ANSI 24-bit',
      explain: 'Imprime cada carácter coloreado con su código RGB real de 24 bits y anima la flor en tiempo real.',
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

function updateStoryBannerUI() {
  const actObj = STORY_ACTS[Math.max(0, Math.min(4, state.storyAct - 1))];
  const progPct = Math.round(((state.storyAct - 1 + state.storyActProgress) / 5) * 100);
  const sig = `${state.storyAct}|${progPct}`;
  if (sig === lastStoryBannerSig) return;
  lastStoryBannerSig = sig;

  document.querySelectorAll('[data-story-act]').forEach(btn => {
    const actNum = Number(btn.getAttribute('data-story-act'));
    btn.classList.toggle('active', actNum === state.storyAct);
  });

  const badgeEl = document.getElementById('story-banner-badge');
  const titleEl = document.getElementById('story-banner-title');
  const subEl = document.getElementById('story-banner-subtitle');
  const fillEl = document.getElementById('story-progress-fill');

  if (badgeEl) badgeEl.textContent = actObj.badge;
  if (titleEl) titleEl.textContent = actObj.title;
  if (subEl) subEl.textContent = actObj.subtitle;
  if (fillEl) fillEl.style.width = `${Math.max(6, Math.min(100, progPct))}%`;
}

function renderLiveCodeDock(force = false) {
  const container = document.getElementById('live-code-lines');
  if (!container) return;

  const rows = state.gridData ? state.gridData.rows : 53;
  const flashedKey = Array.from(state.flashedStages).sort().join(',');
  const sig = `${state.sourceType}|${state.cols}x${rows}|${state.edgeThreshold}|${state.kernelKey}|${state.saturationBoost}|${state.contrastBoost}|${state.rampKey}|${state.viewMode}|${state.activeCodeLine}|${flashedKey}`;

  if (!force && sig === lastCodeDockSig) return;
  lastCodeDockSig = sig;

  const lines = getLivePythonLines();
  const activeLineObj = lines[Math.max(0, Math.min(lines.length - 1, state.activeCodeLine))];

  const explainerTextEl = document.getElementById('code-plain-explainer-text');
  if (explainerTextEl && activeLineObj) {
    explainerTextEl.innerHTML = `<strong>Línea ${activeLineObj.num} (${activeLineObj.badge}):</strong> ${activeLineObj.explain}`;
  }

  container.innerHTML = lines
    .map((line, idx) => {
      const isActive = idx === state.activeCodeLine;
      const isFlashed = state.flashedStages.has(line.stage);
      return `
        <div
          class="code-line ${isActive ? 'active-step' : ''} ${isFlashed ? 'param-flash' : ''}"
          data-code-idx="${idx}"
          data-stage="${line.stage}"
        >
          <span class="line-num">${isActive ? '▶ ' : ''}${line.num}</span>
          <span class="line-content">${line.html}</span>
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

function computeEffectiveCurtainRatio() {
  if (state.curtainEnabled || state.choreography === 'curtain') {
    if (state.isDraggingCurtain || state.curtainEnabled) {
      return state.curtainPos;
    }
    return 0.18 + ((Math.sin(state.phase * 0.55) + 1) * 0.5) * 0.64;
  }
  if (state.choreography === 'story') {
    if (state.storyAct === 1) {
      // En el Paso 1 mostramos la foto real y la cortina va descubriendo los vectores
      return Math.max(0.18, 0.92 - state.storyActProgress * 0.55);
    }
    if (state.storyAct === 5 && state.storyActProgress > 0.35) {
      // En el Paso 5 hacemos un barrido suave de cortina Rayos X para comparar Foto vs ASCII
      const subT = (state.storyActProgress - 0.35) / 0.65;
      return Math.sin(subT * Math.PI) * 0.58;
    }
  }
  return 0;
}

function drawAsciiGridToCanvas() {
  if (!state.gridData) return;
  const { grid, cols, rows } = state.gridData;

  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const wrapper = document.getElementById('ascii-viewport-wrapper');
  const availW = wrapper && wrapper.clientWidth > 120 ? wrapper.clientWidth - 28 : 960;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
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

  const padX = 10;
  const padY = 10;
  const innerW = cols * baseCharW;
  const innerH = rows * baseCharH;

  const refCanvas = getSampledReferenceCanvas() || state.sourceCanvas;
  const curtainRatio = computeEffectiveCurtainRatio();
  const splitX = curtainRatio > 0.01 ? padX + innerW * curtainRatio : -1;

  // En los pasos 2 y 3 mostramos una silueta tenue de la foto real de fondo para que se entienda dónde cae cada borde
  if (refCanvas && state.choreography === 'story' && (state.storyAct === 2 || state.storyAct === 3)) {
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.drawImage(refCanvas, padX, padY, innerW, innerH);
    ctx.restore();
  }

  // Si la cortina Foto Original <-> ASCII está activa, dibujar la foto HD en el lado izquierdo
  if (refCanvas && splitX > padX + 2) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(padX, padY, splitX - padX, innerH);
    ctx.clip();
    ctx.drawImage(refCanvas, padX, padY, innerW, innerH);

    // Superponer vectores direccionales tenues en la franja cercana a la cortina para conectar Foto -> Sobel
    const vectorBandLeft = Math.max(padX, splitX - baseCharW * 7);
    ctx.font = `700 ${Math.max(7, Math.round(baseCharH * 0.78))}px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'top';
    for (let y = 0; y < rows; y += 2) {
      const row = grid[y];
      const py = padY + y * baseCharH;
      for (let x = 0; x < cols; x += 2) {
        const px = padX + x * baseCharW;
        if (px >= vectorBandLeft && px < splitX - 2) {
          const cell = row[x];
          if (cell.isEdge && cell.arrowChar !== ' ') {
            ctx.fillStyle = 'rgba(253, 224, 71, 0.9)';
            ctx.fillText(cell.arrowChar, px, py);
          }
        }
      }
    }
    ctx.restore();
  }

  ctx.font = `600 ${Math.max(6, Math.round(baseCharH * 0.82))}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textBaseline = 'top';

  // Pulso bioluminiscente viajando por las nervaduras desde el corazón de la espata
  const centerCol = cols * 0.44;
  const centerRow = rows * 0.52;
  const maxDist = Math.hypot(cols, rows) * 0.85;
  const pulseRadius = (state.phase * 16) % maxDist;
  const pulseStrength = state.choreography === 'pulse' ? 115 : 65;

  for (let y = 0; y < rows; y++) {
    const row = grid[y];
    const py = padY + y * baseCharH;

    for (let x = 0; x < cols; x++) {
      const px = padX + x * baseCharW;
      if (splitX > padX && px < splitX - baseCharW * 0.45) {
        continue;
      }

      const cell = row[x];
      if (cell.char === ' ' && cell.edgeChar === ' ') continue;

      let ch = cell.char;
      let r = cell.r;
      let g = cell.g;
      let b = cell.b;

      // Filtrado pedagógico según el Paso activo en Modo Historia
      if (state.choreography === 'story') {
        if (state.storyAct === 2) {
          // Paso 2: Solo derivada horizontal Gx -> bordes verticales '|'
          const scanCol = cols * (0.1 + 0.9 * state.storyActProgress);
          if (x > scanCol) continue;
          if (Math.abs(cell.gx) >= 36 && (cell.edgeChar === '|' || Math.abs(cell.gx) >= Math.abs(cell.gy))) {
            ch = '|';
            r = 255;
            g = 152;
            b = 46;
          } else {
            ch = '·';
            r = Math.trunc(r * 0.25);
            g = Math.trunc(g * 0.25);
            b = Math.trunc(b * 0.25);
          }
        } else if (state.storyAct === 3) {
          // Paso 3: Solo derivada vertical Gy -> bordes horizontales '-'
          const scanRow = rows * (0.1 + 0.9 * state.storyActProgress);
          if (y > scanRow) continue;
          if (Math.abs(cell.gy) >= 36 && (cell.edgeChar === '-' || Math.abs(cell.gy) > Math.abs(cell.gx))) {
            ch = '-';
            r = 76;
            g = 175;
            b = 255;
          } else {
            ch = '·';
            r = Math.trunc(r * 0.25);
            g = Math.trunc(g * 0.25);
            b = Math.trunc(b * 0.25);
          }
        } else if (state.storyAct === 4) {
          // Paso 4: Brújula de ángulos: flechas ∇I (→ ↗ ↑) transformándose en trazos tangentes (/ | \ -)
          if (cell.edgeChar === ' ') continue;
          const morphX = cols * state.storyActProgress;
          if (x < morphX) {
            ch = cell.edgeChar;
            r = Math.min(255, r + 30);
            g = Math.min(255, g + 30);
            b = Math.min(255, b + 30);
          } else {
            ch = cell.arrowChar || cell.edgeChar;
            r = 253;
            g = 224;
            b = 71;
          }
        }
      }

      // Ondas de choque interactivas al hacer clic sobre la flor
      for (let s = 0; s < state.shockwaves.length; s++) {
        const sw = state.shockwaves[s];
        const d = Math.hypot(x - sw.col, y - sw.row);
        const diff = Math.abs(d - sw.radius);
        if (diff < 3.5) {
          const wFactor = 1 - diff / 3.5;
          if (cell.edgeChar !== ' ') {
            ch = cell.arrowChar || cell.edgeChar;
          }
          r = Math.min(255, Math.round(r + 120 * wFactor));
          g = Math.min(255, Math.round(g + 110 * wFactor));
          b = Math.min(255, Math.round(b + 140 * wFactor));
        }
      }

      // Pulso bioluminiscente periódico por las nervaduras de los pétalos
      if (cell.isEdge) {
        const distFromHub = Math.hypot(x - centerCol, y - centerRow);
        const ringDiff = Math.abs(distFromHub - pulseRadius);
        if (ringDiff < 3.4) {
          const boost = (1 - ringDiff / 3.4) * pulseStrength;
          r = Math.min(255, Math.round(r + boost));
          g = Math.min(255, Math.round(g + boost * 0.9));
          b = Math.min(255, Math.round(b + boost));
        }
      }

      if (ch === ' ') continue;
      ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      ctx.fillText(ch, px, py);
    }
  }

  // Dibujar partículas bioluminiscentes de polen ASCII flotando desde la cresta
  if (state.pollenParticles.length > 0) {
    ctx.font = `700 ${Math.max(9, Math.round(baseCharH * 0.92))}px "JetBrains Mono", monospace`;
    for (let i = 0; i < state.pollenParticles.length; i++) {
      const p = state.pollenParticles[i];
      const px = padX + p.x * innerW;
      const py = padY + p.y * innerH;
      if (px < splitX + 6) continue;
      const alpha = 0.45 + 0.55 * Math.sin(state.phase * 2.4 + p.phase);
      ctx.fillStyle = `rgba(${p.rgb[0]}, ${p.rgb[1]}, ${p.rgb[2]}, ${alpha.toFixed(2)})`;
      ctx.fillText(p.glyph, px, py);
    }
  }

  // Dibujar línea divisoria y tirador de la Cortina Interactiva Foto <-> ASCII
  if (splitX > padX + 4 && splitX < padX + innerW - 4) {
    const grad = ctx.createLinearGradient(0, padY, 0, padY + innerH);
    grad.addColorStop(0, 'rgba(250, 122, 37, 0.2)');
    grad.addColorStop(0.5, 'rgba(250, 204, 46, 0.98)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.2)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(splitX, padY);
    ctx.lineTo(splitX, padY + innerH);
    ctx.stroke();

    // Etiquetas "FOTO REAL" | "ARTE ASCII cv2.Sobel"
    ctx.font = `700 11px "JetBrains Mono", monospace`;
    ctx.textBaseline = 'middle';
    if (splitX > padX + 95) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(splitX - 90, padY + 10, 82, 22);
      ctx.strokeStyle = 'rgba(250, 204, 46, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(splitX - 90, padY + 10, 82, 22);
      ctx.fillStyle = '#fde047';
      ctx.fillText('📸 FOTO HD', splitX - 83, padY + 21);
    }
    if (splitX < padX + innerW - 125) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(splitX + 8, padY + 10, 112, 22);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(splitX + 8, padY + 10, 112, 22);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('📐 ASCII Sobel', splitX + 15, padY + 21);
    }

    // Tirador central circular
    const handleY = padY + innerH * 0.5;
    ctx.beginPath();
    ctx.arc(splitX, handleY, 13, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    ctx.font = '700 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('↔', splitX, handleY + 0.5);
    ctx.textAlign = 'start';
  }

  // Retícula de inspección del kernel Sobel al pasar el cursor
  if (state.hoveredCell) {
    const { col, row } = state.hoveredCell;
    const preset = KERNEL_PRESETS[state.kernelKey] || KERNEL_PRESETS['3'];
    const kDim = preset.size || 3;
    const kHalf = (kDim - 1) >> 1;
    if (col >= 0 && col < cols && row >= 0 && row < rows) {
      const rx = padX + (col - kHalf) * baseCharW - 1;
      const ry = padY + (row - kHalf) * baseCharH - 1;
      ctx.strokeStyle = 'rgba(250, 204, 46, 0.9)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(rx, ry, baseCharW * kDim + 2, baseCharH * kDim + 2);
    }
  }

  ctx.restore();

  canvas.dataset.charW = String(baseCharW);
  canvas.dataset.charH = String(baseCharH);
  canvas.dataset.padX = String(padX);
  canvas.dataset.padY = String(padY);
}

function updateXRayMagnifierLens(cellInfo) {
  const card = document.getElementById('xray-lens-card');
  if (!card) return;

  if (!cellInfo || cellInfo.cell.char === ' ') {
    card.hidden = true;
    return;
  }

  card.hidden = false;
  const { col, row, cell } = cellInfo;
  const coordEl = document.getElementById('xray-coord-label');
  const arrowEl = document.getElementById('xray-arrow-char');
  const edgeEl = document.getElementById('xray-edge-char');
  const angleEl = document.getElementById('xray-angle-text');
  const explainEl = document.getElementById('xray-plain-explain');

  if (coordEl) coordEl.textContent = `celda (${col}, ${row})`;
  if (arrowEl) {
    arrowEl.textContent = cell.arrowChar !== ' ' ? cell.arrowChar : '•';
    arrowEl.style.color = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
  }
  if (edgeEl) {
    edgeEl.textContent = cell.char;
    edgeEl.style.color = `rgb(${cell.r}, ${cell.g}, ${cell.b})`;
  }
  if (angleEl) {
    angleEl.textContent = `Gx:${cell.gx}  Gy:${cell.gy}  θ:${cell.angle}°`;
  }
  if (explainEl) {
    if (cell.isEdge) {
      const dirDesc =
        cell.edgeChar === '|'
          ? 'Borde vertical'
          : cell.edgeChar === '-'
          ? 'Borde horizontal'
          : 'Borde diagonal';
      explainEl.textContent = `${dirDesc} (|G|=${cell.mag}) → traza '${cell.edgeChar}'`;
    } else {
      explainEl.textContent = `Interior de pétalo (luz=${cell.lum}) → sombrea '${cell.char}'`;
    }
  }

  // Dibujar parche 7x7 de la foto real con el vector gradiente encima
  const patchCanvas = document.getElementById('xray-patch-canvas');
  const refCanvas = getSampledReferenceCanvas() || state.sourceCanvas;
  if (patchCanvas && refCanvas && state.gridData) {
    const pCtx = patchCanvas.getContext('2d');
    const pw = patchCanvas.width;
    const ph = patchCanvas.height;
    pCtx.fillStyle = '#04060a';
    pCtx.fillRect(0, 0, pw, ph);

    pCtx.imageSmoothingEnabled = false;
    const sx = Math.max(0, col - 3);
    const sy = Math.max(0, row - 3);
    pCtx.drawImage(refCanvas, sx, sy, 7, 7, 0, 0, pw, ph);

    // Cuadrícula y celda central
    pCtx.strokeStyle = 'rgba(250, 204, 46, 0.85)';
    pCtx.lineWidth = 1.5;
    const cellPx = pw / 7;
    pCtx.strokeRect(cellPx * 3, cellPx * 3, cellPx, cellPx);
  }
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
  const summaryText = `Flor Ave del Paraíso en arte ASCII vivo (${cols} columnas por ${rows} filas), operador ${preset.label}, ${stats.activeCount} celdas activas y ${stats.edgeRatio}% de bordes direccionales.`;
  const canvas = document.getElementById('ascii-canvas');
  if (canvas) canvas.setAttribute('aria-label', summaryText);
}

function updateHoverHud(cellInfo) {
  const hud = document.getElementById('hud-metrics-content');
  updateXRayMagnifierLens(cellInfo);
  if (!hud) return;

  if (!cellInfo || cellInfo.cell.char === ' ') {
    hud.innerHTML = `
      <span class="hud-pill">✨ <strong>Interactivo:</strong> Mueve el cursor para crear viento y ver la Lupa Rayos X • Haz clic en la flor para lanzar una <strong>Onda Vectorial</strong></span>
    `;
    return;
  }

  const { col, row, cell } = cellInfo;
  const rgbHex = `#${[cell.r, cell.g, cell.b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  const kindLabel = cell.isEdge ? 'Borde cv2.Sobel' : 'Relleno Luminancia';

  hud.innerHTML = `
    <span class="hud-pill">Celda: <strong>(${col}, ${row})</strong></span>
    <span class="hud-pill">Vector: <strong>${cell.arrowChar || '•'}</strong> → <span class="hud-glyph-badge">${cell.char}</span> <span>${kindLabel}</span></span>
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

function computeFrameForPhase(breezePhaseOverride = null, bloomFactorOverride = 1.0) {
  if (!state.sourceCanvas) return null;

  let canvasToSample = state.sourceCanvas;
  if (state.sourceType === 'procedural' && (breezePhaseOverride !== null || bloomFactorOverride !== 1.0)) {
    if (!proceduralRawCanvas) proceduralRawCanvas = document.createElement('canvas');
    if (!proceduralCroppedCanvas) proceduralCroppedCanvas = document.createElement('canvas');
    renderProceduralStrelitziaToCanvas(proceduralRawCanvas, breezePhaseOverride || 0, bloomFactorOverride);
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
    bloomFactor: state.sourceType !== 'procedural' ? bloomFactorOverride : 1.0,
    pointerWind: state.pointerWind.active ? state.pointerWind : null,
    sourceVersion: state.sourceVersion
  });
}

function recomputeAndRender(breezePhaseOverride = null, bloomFactorOverride = 1.0) {
  if (!state.sourceCanvas) return;

  if (state.sourceType === 'procedural' && (breezePhaseOverride !== null || bloomFactorOverride !== 1.0)) {
    if (!proceduralRawCanvas) proceduralRawCanvas = document.createElement('canvas');
    if (!proceduralCroppedCanvas) proceduralCroppedCanvas = document.createElement('canvas');
    renderProceduralStrelitziaToCanvas(proceduralRawCanvas, breezePhaseOverride || 0, bloomFactorOverride);
    state.sourceCanvas = extractCroppedImageCanvas(proceduralRawCanvas, proceduralCroppedCanvas);
    state.sourceVersion++;
    renderPipPreview();
  }

  state.gridData = computeFrameForPhase(breezePhaseOverride, bloomFactorOverride);

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

function updateParticlesAndShockwaves() {
  // Actualizar partículas de polen bioluminiscente
  for (let i = state.pollenParticles.length - 1; i >= 0; i--) {
    const p = state.pollenParticles[i];
    p.x += p.vx + Math.sin(state.phase * 1.4 + p.phase) * 0.0018;
    p.y += p.vy;
    if (state.pointerWind.active) {
      const dy = Math.abs(p.y - state.pointerWind.normY);
      if (dy < 0.25) {
        p.x += state.pointerWind.forceX * 0.006;
      }
    }
    if (typeof p.ttl === 'number') {
      p.ttl--;
      if (p.ttl <= 0) {
        state.pollenParticles.splice(i, 1);
        continue;
      }
    }
    if (p.y < 0.03 || p.x < 0.04 || p.x > 0.96) {
      p.y = 0.48 + Math.random() * 0.22;
      p.x = 0.22 + Math.random() * 0.54;
    }
  }

  // Actualizar ondas de choque radiales
  for (let i = state.shockwaves.length - 1; i >= 0; i--) {
    const sw = state.shockwaves[i];
    sw.radius += 1.45;
    if (sw.radius > sw.maxRadius) {
      state.shockwaves.splice(i, 1);
    }
  }

  // Decaimiento suave del viento del cursor
  if (state.pointerWind.active) {
    state.pointerWind.forceX *= 0.9;
    if (Math.abs(state.pointerWind.forceX) < 0.01) {
      state.pointerWind.active = false;
    }
  }
}

function startAnimationLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  lastTickTime = performance.now();
  if (!storyActStartTime) storyActStartTime = lastTickTime;

  const tick = now => {
    const dt = Math.min(64, now - lastTickTime);
    lastTickTime = now;

    if (state.motionPlaying && state.renderTarget === 'canvas') {
      state.phase += dt * 0.0032;

      // Avance automático por los 5 pasos del Modo Historia
      if (state.choreography === 'story' && state.storyAutoCycle) {
        const actDur = ACT_DURATIONS_MS[state.storyAct - 1] || 3200;
        const elapsed = now - storyActStartTime;
        const prog = Math.min(1.0, elapsed / actDur);
        state.storyActProgress = prog;
        const actMeta = STORY_ACTS[state.storyAct - 1];
        if (actMeta) state.activeCodeLine = actMeta.codeLine;

        if (elapsed >= actDur) {
          state.storyAct = (state.storyAct % 5) + 1;
          state.storyActProgress = 0;
          storyActStartTime = now;
        }
        updateStoryBannerUI();
      }

      // Calcular factor de apertura cinética (bloomFactor) según la coreografía
      if (state.choreography === 'bloom') {
        // Ciclo continuo de floración: capullo -> apertura total de la cresta -> respiración
        const cycle = (state.phase * 0.32) % (Math.PI * 2);
        state.bloomFactor = 0.42 + 0.62 * Math.pow(Math.sin(cycle * 0.5), 2);
      } else if (state.choreography === 'story' && state.storyAct === 5) {
        state.bloomFactor = 0.48 + 0.54 * Math.min(1.0, state.storyActProgress * 1.45);
      } else {
        // Respiración orgánica continua
        state.bloomFactor = 0.96 + Math.sin(state.phase * 0.85) * 0.06;
      }

      updateParticlesAndShockwaves();
      recomputeAndRender(state.phase, state.bloomFactor);
      animFrameId = requestAnimationFrame(tick);
    } else if (state.shockwaves.length > 0) {
      updateParticlesAndShockwaves();
      drawAsciiGridToCanvas();
      animFrameId = requestAnimationFrame(tick);
    } else {
      animFrameId = null;
    }
  };

  animFrameId = requestAnimationFrame(tick);
}

function selectStoryAct(actNum, autoCycle = false) {
  state.choreography = 'story';
  state.storyAct = Math.max(1, Math.min(5, actNum));
  state.storyActProgress = autoCycle ? 0.02 : 0.72;
  state.storyAutoCycle = autoCycle;
  storyActStartTime = performance.now();

  const actMeta = STORY_ACTS[state.storyAct - 1];
  if (actMeta) {
    state.activeCodeLine = actMeta.codeLine;
  }

  document.querySelectorAll('[data-choreo]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-choreo') === 'story');
  });

  updateStoryBannerUI();
  renderLiveCodeDock(true);

  if (state.renderTarget !== 'canvas') {
    toggleSelectableMode(false);
  }
  if (!state.motionPlaying) {
    recomputeAndRender(state.phase, 1.0);
  } else {
    startAnimationLoop();
  }
}

function setChoreography(choreoKey) {
  state.choreography = choreoKey;
  document.querySelectorAll('[data-choreo]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-choreo') === choreoKey);
  });

  if (choreoKey === 'story') {
    selectStoryAct(1, true);
    showToast('🎬 Modo Historia 5 Pasos: explicando cv2.Sobel en vivo');
  } else if (choreoKey === 'bloom') {
    state.storyAct = 5;
    state.storyActProgress = 1;
    state.curtainEnabled = false;
    document.getElementById('btn-toggle-curtain')?.classList.remove('active');
    updateStoryBannerUI();
    showToast('🌺 Floración Cinética: apertura de sépalos + polen bioluminiscente');
  } else if (choreoKey === 'curtain') {
    state.storyAct = 5;
    state.storyActProgress = 1;
    updateStoryBannerUI();
    showToast('🌗 Cortina Rayos X: arrastra la línea amarilla o mira la comparación Foto ↔ ASCII');
  } else if (choreoKey === 'pulse') {
    state.storyAct = 5;
    state.storyActProgress = 1;
    state.curtainEnabled = false;
    document.getElementById('btn-toggle-curtain')?.classList.remove('active');
    updateStoryBannerUI();
    triggerRadialShockwave();
    showToast('⚡ Pulso Bioluminiscente en Nervaduras + Ondas Vectoriales');
  }

  if (!state.motionPlaying) {
    state.motionPlaying = true;
    const motionBtn = document.getElementById('btn-toggle-motion');
    if (motionBtn) {
      motionBtn.classList.add('active');
      motionBtn.textContent = '🌺 Flor Viva: ACTIVA';
    }
  }
  startAnimationLoop();
}

function triggerRadialShockwave(colOverride = null, rowOverride = null) {
  if (!state.gridData) return;
  const col = colOverride !== null ? colOverride : Math.round(state.gridData.cols * 0.45);
  const row = rowOverride !== null ? rowOverride : Math.round(state.gridData.rows * 0.5);
  state.shockwaves.push({
    col,
    row,
    radius: 1,
    maxRadius: Math.hypot(state.gridData.cols, state.gridData.rows) * 0.85
  });
  spawnPollenBurst(col / state.gridData.cols, row / state.gridData.rows, 9);
  if (!animFrameId) startAnimationLoop();
}

function setViewMode(mode) {
  state.viewMode = mode;
  document.querySelectorAll('[data-view-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-view-mode') === mode);
  });
  recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
}

function toggleSelectableMode(forcePre) {
  const canvas = document.getElementById('ascii-canvas');
  const pre = document.getElementById('ascii-pre');
  const btn = document.getElementById('btn-toggle-selectable');

  const toPre = typeof forcePre === 'boolean' ? forcePre : state.renderTarget === 'canvas';
  state.renderTarget = toPre ? 'pre' : 'canvas';

  if (toPre) {
    canvas.hidden = true;
    pre.hidden = false;
    btn?.classList.add('active');
    renderSelectablePre();
  } else {
    canvas.hidden = false;
    pre.hidden = true;
    btn?.classList.remove('active');
    drawAsciiGridToCanvas();
    if (state.motionPlaying) startAnimationLoop();
  }
}

function loadPhotoPreset(autoStart = !prefersReducedMotion()) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    state.sourceType = 'photo';
    state.sourceCanvas = extractCroppedImageCanvas(img);
    state.sourceVersion++;
    renderPipPreview();
    recomputeAndRender(state.phase, state.bloomFactor);
    if (autoStart) {
      state.motionPlaying = true;
      selectStoryAct(1, true);
    }
  };
  img.onerror = () => {
    loadProceduralPreset(autoStart);
  };
  img.src = './ave-del-paraiso.jpg';
}

function loadProceduralPreset(autoStart = !prefersReducedMotion()) {
  state.sourceType = 'procedural';
  if (!proceduralRawCanvas) proceduralRawCanvas = document.createElement('canvas');
  if (!proceduralCroppedCanvas) proceduralCroppedCanvas = document.createElement('canvas');
  renderProceduralStrelitziaToCanvas(proceduralRawCanvas, state.phase, state.bloomFactor);
  state.sourceCanvas = extractCroppedImageCanvas(proceduralRawCanvas, proceduralCroppedCanvas);
  state.sourceVersion++;
  renderPipPreview();
  recomputeAndRender(state.phase, state.bloomFactor);
  if (autoStart) {
    state.motionPlaying = true;
    setChoreography('bloom');
  }
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
    showToast(`Generando ${label} con historia en 5 pasos... 0%`, 0);
    await exporterFn(
      (phase, bloom) => {
        const gridData = computeFrameForPhase(phase, bloom);
        const refCanvas = getSampledReferenceCanvas() || state.sourceCanvas;
        return { gridData, refCanvas };
      },
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
    state.motionPlaying = false;
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
    if (state.renderTarget === 'canvas' && !state.motionPlaying) {
      drawAsciiGridToCanvas();
    }
  });

  document.getElementById('btn-play-story')?.addEventListener('click', () => {
    state.motionPlaying = true;
    const motionBtn = document.getElementById('btn-toggle-motion');
    if (motionBtn) {
      motionBtn.classList.add('active');
      motionBtn.textContent = '🌺 Flor Viva: ACTIVA';
    }
    selectStoryAct(1, true);
  });

  document.querySelectorAll('[data-story-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const actNum = Number(btn.getAttribute('data-story-act'));
      selectStoryAct(actNum, false);
    });
  });

  document.querySelectorAll('[data-choreo]').forEach(btn => {
    btn.addEventListener('click', () => {
      setChoreography(btn.getAttribute('data-choreo'));
    });
  });

  document.getElementById('btn-trigger-shockwave')?.addEventListener('click', () => {
    triggerRadialShockwave();
  });

  document.getElementById('btn-toggle-motion')?.addEventListener('click', e => {
    state.motionPlaying = !state.motionPlaying;
    e.currentTarget.classList.toggle('active', state.motionPlaying);
    e.currentTarget.textContent = state.motionPlaying ? '🌺 Flor Viva: ACTIVA' : '⏸️ Flor Viva: PAUSADA';
    if (state.motionPlaying) {
      if (state.renderTarget !== 'canvas') toggleSelectableMode(false);
      startAnimationLoop();
    } else {
      recomputeAndRender(null, 1.0);
    }
  });

  document.getElementById('btn-toggle-curtain')?.addEventListener('click', e => {
    state.curtainEnabled = !state.curtainEnabled;
    e.currentTarget.classList.toggle('active', state.curtainEnabled);
    if (state.curtainEnabled) {
      showToast('🌗 Cortina activa: arrastra sobre la flor para comparar Foto Real vs Arte ASCII');
    }
    drawAsciiGridToCanvas();
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

  // Delegated click listener for Live Code Dock lines
  document.getElementById('live-code-lines')?.addEventListener('click', e => {
    const rowEl = e.target.closest('[data-code-idx]');
    if (!rowEl) return;
    const idx = Number(rowEl.getAttribute('data-code-idx'));
    const stage = rowEl.getAttribute('data-stage');
    state.activeCodeLine = idx;

    if (stage === 'sobel_x') {
      selectStoryAct(2, false);
    } else if (stage === 'sobel_y') {
      selectStoryAct(3, false);
    } else if (stage === 'angle' || stage === 'map_edge') {
      selectStoryAct(4, false);
    } else if (stage === 'mag') {
      setViewMode('magnitude');
    } else if (stage === 'compose' || stage === 'render') {
      setViewMode('combined');
      selectStoryAct(5, false);
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
        recomputeAndRender(state.phase, state.bloomFactor);
        selectStoryAct(1, true);
        flashCodeStages(['input']);
        showToast('Imagen cargada: iniciando transformación cv2.Sobel en 5 pasos');
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
    recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
    flashCodeStages(['resize']);
  });

  document.getElementById('slider-threshold')?.addEventListener('input', e => {
    state.edgeThreshold = Number(e.target.value);
    document.getElementById('val-threshold').textContent = String(state.edgeThreshold);
    state.activeCodeLine = 10;
    recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
    flashCodeStages(['compose']);
  });

  document.getElementById('select-kernel')?.addEventListener('change', e => {
    state.kernelKey = e.target.value;
    state.activeCodeLine = 5;
    renderKernelMatrices();
    recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
    flashCodeStages(['sobel_x', 'sobel_y']);
  });

  document.getElementById('slider-saturation')?.addEventListener('input', e => {
    state.saturationBoost = Number(e.target.value);
    document.getElementById('val-saturation').textContent = `${state.saturationBoost.toFixed(2)}×`;
    state.activeCodeLine = 3;
    recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
    flashCodeStages(['hsv']);
  });

  document.getElementById('slider-contrast')?.addEventListener('input', e => {
    state.contrastBoost = Number(e.target.value);
    document.getElementById('val-contrast').textContent = `${state.contrastBoost.toFixed(2)}×`;
    state.activeCodeLine = 3;
    recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
    flashCodeStages(['hsv']);
  });

  document.getElementById('select-ramp')?.addEventListener('change', e => {
    state.rampKey = e.target.value;
    state.activeCodeLine = 10;
    recomputeAndRender(state.motionPlaying ? state.phase : null, state.bloomFactor);
    flashCodeStages(['compose']);
  });

  // Canvas pointer inspection + interactive wind + curtain drag + shockwave click
  const canvas = document.getElementById('ascii-canvas');
  if (canvas) {
    let lastNormX = null;

    const inspectPointer = (pt, isDown = false) => {
      if (!state.gridData) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.offsetWidth / rect.width;
      const charW = Number(canvas.dataset.charW || 8.6);
      const charH = Number(canvas.dataset.charH || 16.5);
      const padX = Number(canvas.dataset.padX || 10);
      const padY = Number(canvas.dataset.padY || 10);

      const relX = (pt.x - rect.left) * scaleX - padX;
      const relY = (pt.y - rect.top) * scaleX - padY;
      const innerW = state.gridData.cols * charW;
      const innerH = state.gridData.rows * charH;

      const normX = Math.max(0, Math.min(1, relX / Math.max(1, innerW)));
      const normY = Math.max(0, Math.min(1, relY / Math.max(1, innerH)));

      if (state.isDraggingCurtain || (isDown && (state.curtainEnabled || state.choreography === 'curtain'))) {
        state.curtainPos = Math.max(0.05, Math.min(0.95, normX));
      }

      if (lastNormX !== null) {
        const deltaX = normX - lastNormX;
        if (Math.abs(deltaX) > 0.002) {
          state.pointerWind.active = true;
          state.pointerWind.normX = normX;
          state.pointerWind.normY = normY;
          state.pointerWind.forceX = Math.max(-1.2, Math.min(1.2, deltaX * 18));
        }
      }
      lastNormX = normX;

      const col = Math.floor(relX / charW);
      const row = Math.floor(relY / charH);

      if (col >= 0 && col < state.gridData.cols && row >= 0 && row < state.gridData.rows) {
        const cell = state.gridData.grid[row][col];
        state.hoveredCell = { col, row };
        updateHoverHud({ col, row, cell });
        if (!state.motionPlaying) drawAsciiGridToCanvas();
      }
    };

    canvas.addEventListener('mousedown', e => {
      if (state.curtainEnabled || state.choreography === 'curtain') {
        state.isDraggingCurtain = true;
      }
      inspectPointer({ x: e.clientX, y: e.clientY }, true);
      if (state.hoveredCell) {
        triggerRadialShockwave(state.hoveredCell.col, state.hoveredCell.row);
      }
    });

    window.addEventListener('mouseup', () => {
      state.isDraggingCurtain = false;
    });

    canvas.addEventListener('mousemove', e => inspectPointer({ x: e.clientX, y: e.clientY }));
    canvas.addEventListener('mouseleave', () => {
      state.hoveredCell = null;
      lastNormX = null;
      updateHoverHud(null);
      if (!state.motionPlaying) drawAsciiGridToCanvas();
    });

    canvas.addEventListener(
      'touchstart',
      e => {
        const t = e.touches[0];
        if (!t) return;
        inspectPointer({ x: t.clientX, y: t.clientY }, true);
        if (state.hoveredCell) {
          triggerRadialShockwave(state.hoveredCell.col, state.hoveredCell.row);
        }
      },
      { passive: true }
    );

    canvas.addEventListener(
      'touchmove',
      e => {
        const t = e.touches[0];
        if (t) inspectPointer({ x: t.clientX, y: t.clientY }, true);
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
  initPollenParticles(28);
  buildShellHTML();
  renderKernelMatrices();
  renderLiveCodeDock(true);
  bindEvents();
  loadPhotoPreset();
  handleRouteChange();
}

init();
