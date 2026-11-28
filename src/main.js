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

const STORY_ACTS = [
  {
    act: 1,
    shortLabel: '1. Foto Real',
    badge: 'PASO 1 DE 5 • LA FLOR REAL',
    title: 'Empezamos con la fotografía real del Ave del Paraíso (Strelitzia reginae)',
    subtitle:
      'Mira cómo la cortina escanea la foto original: cada pétalo naranja, lengua azul y pico verde se mide píxel a píxel.',
    codeLine: 1
  },
  {
    act: 2,
    shortLabel: '2. Escáner Gx (|)',
    badge: 'PASO 2 DE 5 • DERIVADA HORIZONTAL Gx',
    title: 'cv2.Sobel(dx=1, dy=0) detecta cambios de luz de izquierda a derecha → traza "|"',
    subtitle:
      'Donde la luz salta horizontalmente (como en el tallo y los pétalos verticales), Sobel dibuja barras verticales "|".',
    codeLine: 5
  },
  {
    act: 3,
    shortLabel: '3. Escáner Gy (-)',
    badge: 'PASO 3 DE 5 • DERIVADA VERTICAL Gy',
    title: 'cv2.Sobel(dx=0, dy=1) detecta cambios de luz de arriba a abajo → traza "-"',
    subtitle:
      'Donde la luz salta verticalmente (como en el pico horizontal del ave), Sobel dibuja guiones horizontales "-".',
    codeLine: 6
  },
  {
    act: 4,
    shortLabel: '4. Brújula (/ | \\ -)',
    badge: 'PASO 4 DE 5 • BRÚJULA DE ÁNGULOS arctan2(Gy, Gx)',
    title: 'Combinamos Gx y Gy para obtener el ángulo exacto θ° de cada pétalo (→ ↗ ↑ ↖)',
    subtitle:
      'En vez de usar letras al azar, el ángulo del borde elige el carácter que sigue la curva del pétalo: |  /  -  \\.',
    codeLine: 9
  },
  {
    act: 5,
    shortLabel: '5. Floración Viva',
    badge: 'PASO 5 DE 5 • ARTE ASCII VIVO + CORTINA RAYOS X',
    title: 'Relleno de luz + color botánico 24-bit + floración cinética y polen vivo',
    subtitle:
      'Toca o mueve el cursor sobre la flor para empujar los pétalos con viento, lanzar ondas de choque o deslizar la cortina.',
    codeLine: 11
  }
];

const CHOREO_CAPTIONS = {
  bloom: {
    badge: 'MODO FLORACIÓN',
    title: 'La flor abre y cierra sus sépalos mientras suelta polen ASCII',
    subtitle: 'Mueve el cursor para soplar viento sobre los pétalos; haz clic en uno para lanzar una onda vectorial.'
  },
  curtain: {
    badge: 'MODO CORTINA',
    title: 'Izquierda: foto real · Derecha: lo que ve cv2.Sobel. Arrastra el asa ↔',
    subtitle: 'Arrastra el asa amarilla ↔ para comparar; un clic fuera del asa lanza una onda vectorial.'
  },
  pulse: {
    badge: 'MODO PULSO',
    title: 'Un pulso de luz recorre solo los bordes detectados por cv2.Sobel',
    subtitle: 'Los anillos iluminan los contornos (/ | \\ -) para que se vea qué celdas son borde y cuáles relleno.'
  }
};
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
  codeFocus: false, // true = solo la línea activa ±1 (pantallas compactas)

  // UX state
  mobileTab: 'escena', // 'escena' | 'ajustes' | 'codigo'
  lastPointer: null, // { clientX, clientY, isTouch }
  curtainHintSeen: false,

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
const CURTAIN_HANDLE_RADIUS = 16;
const CURTAIN_GRAB_TOLERANCE_PX = 22; // zona de agarre alrededor de la línea de la cortina
const ONBOARDING_STORAGE_KEY = 'ave-sobel-onboarding-v1';
const CURTAIN_HINT_STORAGE_KEY = 'ave-sobel-curtain-hint-v1';

function safeStorageGet(key) {
  try {
    return window.localStorage?.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    window.localStorage?.setItem(key, value);
  } catch {
    /* almacenamiento no disponible (modo privado): ignorar */
  }
}

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// Movimiento reducido: menos polen, sin viento del cursor, sin ráfagas y animación más lenta
let reducedMotion = prefersReducedMotion();

function initPollenParticles(count = 28) {
  const glyphs = ['*', '+', '·', '°'];
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
  const glyphs = ['*', '+', '·'];
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
          <button
            type="button"
            class="btn btn-breeze active"
            id="btn-toggle-motion"
            aria-pressed="true"
            title="Activar/Pausar todo el movimiento de la flor"
          >
            Flor Viva
          </button>
          <button type="button" class="btn btn-vertical" id="btn-toggle-framing" aria-pressed="false" title="Encuadre vertical 9:16 para móvil y redes">
            9:16
          </button>

          <div class="menu-wrap" id="export-menu-wrap">
            <button
              type="button"
              class="btn btn-primary"
              id="btn-export-menu"
              aria-haspopup="menu"
              aria-expanded="false"
              aria-controls="export-menu"
            >
              Exportar <span class="menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="menu-popover" id="export-menu" role="menu" hidden>
              <div class="menu-section-label">Video vertical 9:16</div>
              <button type="button" class="menu-item" role="menuitem" id="btn-export-webm">
                Grabar video WebM <small>historia completa</small>
              </button>
              <button type="button" class="menu-item" role="menuitem" id="btn-export-gif">
                Exportar GIF animado <small>432×768</small>
              </button>
              <div class="menu-section-label">Copiar</div>
              <button type="button" class="menu-item" role="menuitem" id="btn-copy-ascii">
                Arte ASCII (texto plano)
              </button>
              <button type="button" class="menu-item" role="menuitem" id="btn-copy-ansi">
                ASCII con color ANSI <small>para terminal</small>
              </button>
              <button type="button" class="menu-item" role="menuitem" id="btn-copy-python">
                Script Python <small>con tus parámetros</small>
              </button>
              <div class="menu-section-label">Descargar</div>
              <a
                class="menu-item"
                role="menuitem"
                id="btn-download-py"
                href="./ave_del_paraiso_sobel.py"
                download="ave_del_paraiso_sobel.py"
              >
                ave_del_paraiso_sobel.py
              </a>
            </div>
          </div>
        </div>
      </header>

      <main class="studio-workspace" id="studio-workspace" data-mobile-tab="escena">
        <!-- LEFT / MAIN: Split Stage (Story Explainer + Top ASCII Flower + Bottom Live Python Code) -->
        <section class="sobel-split-stage" id="sobel-split-stage" aria-label="Terminal de Arte ASCII y Código en Vivo">
          <!-- UNIFIED STAGE CONTROL BAR: choreography + story steps + playback -->
          <div class="stage-control-bar" id="stage-control-bar">
            <div class="choreo-segment" role="radiogroup" aria-label="Modo de animación">
              <button type="button" class="seg-btn active" data-choreo="story" role="radio" aria-checked="true" title="Explicación guiada en 5 pasos">
                <span class="seg-label">Historia</span>
              </button>
              <button type="button" class="seg-btn" data-choreo="bloom" role="radio" aria-checked="false" title="Floración cinética + polen">
                <span class="seg-label">Floración</span>
              </button>
              <button type="button" class="seg-btn" data-choreo="curtain" role="radio" aria-checked="false" title="Compara Foto real ↔ Arte ASCII arrastrando ↔">
                <span class="seg-label">Cortina</span>
              </button>
              <button type="button" class="seg-btn" data-choreo="pulse" role="radio" aria-checked="false" title="Pulso bioluminiscente por las nervaduras">
                <span class="seg-label">Pulso</span>
              </button>
            </div>

            <div class="story-transport" id="story-transport">
              <button type="button" class="icon-btn" id="btn-story-prev" aria-label="Paso anterior" title="Paso anterior">Ant.</button>
              <div class="story-steps-pills" role="tablist" aria-label="Pasos de cómo funciona cv2.Sobel">
                ${STORY_ACTS.map(
                  s => `
                  <button
                    type="button"
                    class="story-step-pill ${s.act === 1 ? 'active' : ''}"
                    data-story-act="${s.act}"
                    id="btn-story-act-${s.act}"
                    role="tab"
                    aria-selected="${s.act === 1}"
                    title="${s.shortLabel}"
                  >
                    <span class="pill-num">${s.act}</span><span class="pill-text">${s.shortLabel.replace(/^\d+\.\s*/, '')}</span>
                  </button>
                `
                ).join('')}
              </div>
              <button type="button" class="icon-btn" id="btn-story-next" aria-label="Paso siguiente" title="Paso siguiente">Sig.</button>
              <button
                type="button"
                class="icon-btn icon-btn-accent"
                id="btn-story-autoplay"
                aria-label="Pausar avance automático"
                aria-pressed="true"
                title="Pausar / reanudar el avance automático de pasos"
              >Pausa</button>
            </div>

            <button type="button" class="icon-btn" id="btn-trigger-shockwave" aria-label="Lanzar onda de choque vectorial" title="Lanzar onda de choque vectorial">Onda</button>
          </div>

          <!-- ONE-LINE STORY CAPTION -->
          <div class="story-caption" id="story-explainer-banner" aria-live="polite">
            <span class="story-badge" id="story-banner-badge">${STORY_ACTS[0].badge}</span>
            <strong class="story-title" id="story-banner-title">${STORY_ACTS[0].title}</strong>
            <p class="story-subtitle" id="story-banner-subtitle">${STORY_ACTS[0].subtitle}</p>
            <div class="story-progress-track" aria-hidden="true">
              <div class="story-progress-fill" id="story-progress-fill" style="width: 15%"></div>
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
                Sobel + Color
              </button>
              <button type="button" class="mode-tab" data-view-mode="edges" id="tab-mode-edges">
                Trazos (/ | \\ -)
              </button>
              <button type="button" class="mode-tab" data-view-mode="vectors" id="tab-mode-vectors">
                Flechas ∇I (→ ↗ ↑)
              </button>
              <button type="button" class="mode-tab" data-view-mode="magnitude" id="tab-mode-magnitude">
                Magnitud |G|
              </button>
              <button type="button" class="mode-tab" id="btn-toggle-selectable">
                Seleccionar Texto
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
                <span>Lupa Rayos X cv2.Sobel</span>
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

            <div class="coach-mark" id="coach-mark" hidden>
              <div class="coach-row"><span class="coach-ico">1.</span> Pasa el cursor <em>(o toca)</em> la flor: lupa Rayos X + viento</div>
              <div class="coach-row"><span class="coach-ico">2.</span> Clic en un pétalo = onda vectorial</div>
              <div class="coach-row"><span class="coach-ico">3.</span> En modo Cortina, arrastra el asa amarilla ↔</div>
              <button type="button" class="btn btn-sm" id="btn-coach-dismiss">Entendido</button>
            </div>

            <div class="reference-pip" id="reference-pip" title="Haz clic para ampliar/reducir la foto original">
              <div class="reference-pip-header">
                <span>Foto Original</span>
                <span id="pip-toggle-label">+/-</span>
              </div>
              <canvas id="pip-canvas" aria-label="Miniatura de la imagen de referencia original"></canvas>
            </div>
          </div>

          <!-- MATHEMATICAL SOBEL CELL INSPECTOR HUD -->
          <div class="sobel-hud-bar" id="sobel-hud-bar">
            <div class="hud-metrics" id="hud-metrics-content">
              <span class="hud-pill"><strong>Interactivo:</strong> Mueve el cursor para crear viento y ver la Lupa Rayos X • Haz clic en la flor para lanzar una <strong>Onda Vectorial</strong></span>
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
                  Ejecutar Python Real
                </button>
                <button
                  type="button"
                  class="btn btn-sm"
                  id="btn-toggle-code-focus"
                  aria-pressed="false"
                  aria-controls="live-code-lines"
                  title="Alternar entre ver solo la línea activa o las 12 líneas"
                >
                  ▾ Ver 12 líneas
                </button>
                <button type="button" class="btn btn-sm sheet-close" data-close-sheet aria-label="Cerrar panel de código">Cerrar</button>
              </div>
            </div>

            <!-- PLAIN-SPANISH TRANSLATION OF ACTIVE CODE LINE -->
            <div class="code-plain-explainer" id="code-plain-explainer">
              <span class="explainer-icon">Nota:</span>
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

        <!-- RIGHT SIDEBAR: Image Source, Interactive Parameters & Sobel Kernel Matrices -->
        <aside class="controls-sidebar" id="controls-sidebar" aria-label="Ajustes del Pipeline cv2.Sobel">
          <div class="sheet-header">
            <strong>Ajustes cv2.Sobel</strong>
            <button type="button" class="btn btn-sm sheet-close" data-close-sheet aria-label="Cerrar ajustes">Cerrar</button>
          </div>

          <div class="panel-card">
            <div class="panel-heading">
              <h2>Fuente Botánica</h2>
              <span class="panel-tag">Strelitzia</span>
            </div>
            <div class="source-grid">
              <button type="button" class="source-btn active" data-source="photo" id="btn-src-photo">
                Foto Estudio HD
              </button>
              <button type="button" class="source-btn" data-source="procedural" id="btn-src-procedural">
                Flor Cinética 2D
              </button>
            </div>
            <label class="upload-label" for="input-upload-image">
              <span>Subir otra flor / imagen...</span>
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

      <nav class="mobile-tabbar" id="mobile-tabbar" aria-label="Secciones">
        <button type="button" class="mobile-tab active" data-mobile-tab="escena" aria-pressed="true">
          Escena
        </button>
        <button type="button" class="mobile-tab" data-mobile-tab="ajustes" aria-pressed="false">
          Ajustes
        </button>
        <button type="button" class="mobile-tab" data-mobile-tab="codigo" aria-pressed="false">
          Código
        </button>
      </nav>

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

let lastStoryActRendered = 0;
function updateStoryBannerUI() {
  const actObj = STORY_ACTS[Math.max(0, Math.min(4, state.storyAct - 1))];
  const progPct = Math.round(((state.storyAct - 1 + state.storyActProgress) / 5) * 100);
  const sig = `${state.storyAct}|${progPct}|${state.choreography}|${state.storyAutoCycle}`;
  if (sig === lastStoryBannerSig) return;
  lastStoryBannerSig = sig;

  const fillEl = document.getElementById('story-progress-fill');
  if (fillEl) fillEl.style.width = `${Math.max(6, Math.min(100, progPct))}%`;

  const bar = document.getElementById('stage-control-bar');
  if (bar) bar.classList.toggle('is-story', state.choreography === 'story');

  const autoBtn = document.getElementById('btn-story-autoplay');
  if (autoBtn) {
    const playing = state.storyAutoCycle && state.choreography === 'story';
    autoBtn.textContent = playing ? 'Pausa' : 'Auto';
    autoBtn.setAttribute('aria-pressed', String(playing));
    autoBtn.setAttribute('aria-label', playing ? 'Pausar avance automático' : 'Reanudar avance automático');
  }

  const captionKey = state.choreography === 'story' ? `story-${state.storyAct}` : state.choreography;
  if (captionKey === lastStoryActRendered) return;
  lastStoryActRendered = captionKey;

  document.querySelectorAll('[data-story-act]').forEach(btn => {
    const isActive = Number(btn.getAttribute('data-story-act')) === state.storyAct;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });

  const caption = state.choreography === 'story' ? actObj : CHOREO_CAPTIONS[state.choreography] || actObj;
  const badgeEl = document.getElementById('story-banner-badge');
  const titleEl = document.getElementById('story-banner-title');
  const subEl = document.getElementById('story-banner-subtitle');
  if (badgeEl) badgeEl.textContent = caption.badge.replace(/\s•.*$/, '');
  if (titleEl) {
    titleEl.textContent = caption.title;
    titleEl.title = caption.subtitle;
  }
  if (subEl) subEl.textContent = caption.subtitle;
}

function syncChoreoButtons() {
  document.querySelectorAll('[data-choreo]').forEach(btn => {
    const isActive = btn.getAttribute('data-choreo') === state.choreography;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-checked', String(isActive));
  });
  const wrapper = document.getElementById('ascii-viewport-wrapper');
  if (wrapper) wrapper.classList.toggle('curtain-mode', state.choreography === 'curtain');
  lastStoryBannerSig = '';
  updateStoryBannerUI();
}

function renderLiveCodeDock(force = false) {
  const container = document.getElementById('live-code-lines');
  if (!container) return;

  const rows = state.gridData ? state.gridData.rows : 53;
  const flashedKey = Array.from(state.flashedStages).sort().join(',');
  const sig = `${state.sourceType}|${state.cols}x${rows}|${state.edgeThreshold}|${state.kernelKey}|${state.saturationBoost}|${state.contrastBoost}|${state.rampKey}|${state.viewMode}|${state.activeCodeLine}|${flashedKey}|${state.codeFocus}`;

  if (!force && sig === lastCodeDockSig) return;
  lastCodeDockSig = sig;

  const lines = getLivePythonLines();
  const activeLineObj = lines[Math.max(0, Math.min(lines.length - 1, state.activeCodeLine))];

  const explainerTextEl = document.getElementById('code-plain-explainer-text');
  if (explainerTextEl && activeLineObj) {
    explainerTextEl.innerHTML = `<strong>Línea ${activeLineObj.num} (${activeLineObj.badge}):</strong> ${activeLineObj.explain}`;
  }

  container.classList.toggle('is-focus', state.codeFocus);
  container.innerHTML = lines
    .map((line, idx) => {
      const isActive = idx === state.activeCodeLine;
      const isFlashed = state.flashedStages.has(line.stage);
      const isOutOfFocus = state.codeFocus && Math.abs(idx - state.activeCodeLine) > 1;
      return `
        <div
          class="code-line ${isActive ? 'active-step' : ''} ${isFlashed ? 'param-flash' : ''} ${isOutOfFocus ? 'out-of-focus' : ''}"
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

function isCompactLayout() {
  return window.matchMedia?.('(max-width: 1080px)').matches;
}

function isMobileViewport() {
  return window.matchMedia?.('(max-width: 720px)').matches;
}

// Altura disponible para el lienzo ASCII: en escritorio reservamos espacio para cabecera,
// barra de escena, HUD y el código en modo foco; en móvil adaptamos según si hay cajón abierto.
function computeAvailableCanvasHeight() {
  const vh = window.innerHeight || 900;
  if (state.verticalFraming) return Math.max(420, vh - 120);
  if (isMobileViewport()) {
    const wrapper = document.getElementById('ascii-viewport-wrapper');
    const topY = wrapper ? wrapper.getBoundingClientRect().top : 180;
    const effectiveTop = topY > 40 && topY < vh * 0.55 ? topY : 180;
    if (state.mobileTab !== 'escena') {
      return Math.max(125, vh * 0.52 - effectiveTop - 16);
    }
    return Math.max(190, vh - effectiveTop - 165);
  }
  if (isCompactLayout()) return Math.max(240, vh * 0.5);
  return Math.max(320, vh - 400);
}

function drawAsciiGridToCanvas() {
  if (!state.gridData) return;
  const { grid, cols, rows } = state.gridData;

  const canvas = document.getElementById('ascii-canvas');
  if (!canvas) return;

  const mobile = isMobileViewport();
  const padX = mobile ? 6 : 10;
  const padY = mobile ? 6 : 10;

  const wrapper = document.getElementById('ascii-viewport-wrapper');
  const availW = wrapper && wrapper.clientWidth > 120 ? wrapper.clientWidth - (mobile ? 12 : 28) : 960;

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const defaultCharW = cols > 110 ? 7.2 : cols > 85 ? 8.6 : 10.2;
  const minCharFloor = mobile && state.mobileTab !== 'escena' ? 1.5 : 2.6;
  const maxFitCharW = Math.max(minCharFloor, (availW - padX * 2) / cols);
  const availH = computeAvailableCanvasHeight();
  const maxFitByHeight = Math.max(minCharFloor, (availH - padY * 2) / rows / 1.92);
  const baseCharW = Math.min(defaultCharW, maxFitCharW, maxFitByHeight);
  const baseCharH = baseCharW * 1.92;

  const logicalW = Math.ceil(cols * baseCharW + padX * 2);
  const logicalH = Math.ceil(rows * baseCharH + padY * 2);

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
      ctx.fillRect(splitX - 78, padY + 10, 70, 22);
      ctx.strokeStyle = 'rgba(250, 204, 46, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(splitX - 78, padY + 10, 70, 22);
      ctx.fillStyle = '#fde047';
      ctx.fillText('FOTO HD', splitX - 68, padY + 21);
    }
    if (splitX < padX + innerW - 125) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(splitX + 8, padY + 10, 96, 22);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(splitX + 8, padY + 10, 96, 22);
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('ASCII Sobel', splitX + 16, padY + 21);
    }

    // Tirador central circular (arrastrable siempre que la cortina esté visible)
    const handleY = padY + innerH * 0.5;
    const handleR = CURTAIN_HANDLE_RADIUS;
    if (!state.curtainHintSeen && (state.choreography === 'curtain' || state.curtainEnabled)) {
      const pulseT = (performance.now() % 1400) / 1400;
      ctx.beginPath();
      ctx.arc(splitX, handleY, handleR + 4 + pulseT * 16, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(250, 204, 21, ${(0.75 * (1 - pulseT)).toFixed(2)})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(splitX, handleY, handleR, 0, Math.PI * 2);
    ctx.fillStyle = state.isDraggingCurtain ? '#facc15' : '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.fillStyle = state.isDraggingCurtain ? '#0f172a' : '#fde047';
    ctx.font = '800 14px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('↔', splitX, handleY + 0.5);
    ctx.textAlign = 'start';
  }
  canvas.dataset.splitX = String(splitX > padX + 4 && splitX < padX + innerW - 4 ? splitX : -1);
  canvas.dataset.handleY = String(padY + innerH * 0.5);

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

function resolveInspectedCell(col, row, isTouch = false) {
  if (!state.gridData) return null;
  const { grid, cols, rows } = state.gridData;
  const c0 = Math.max(0, Math.min(cols - 1, col));
  const r0 = Math.max(0, Math.min(rows - 1, row));
  const direct = grid[r0][c0];
  if (direct.char !== ' ' || direct.edgeChar !== ' ') {
    return { col: c0, row: r0, cell: direct };
  }

  // En pantallas táctiles (dedo más ancho que un carácter), buscamos el pétalo más cercano en un radio de 3 celdas
  const maxRadius = isTouch ? 3 : 1;
  let best = null;
  let bestDist = Infinity;
  for (let dy = -maxRadius; dy <= maxRadius; dy++) {
    const rr = r0 + dy;
    if (rr < 0 || rr >= rows) continue;
    for (let dx = -maxRadius; dx <= maxRadius; dx++) {
      const cc = c0 + dx;
      if (cc < 0 || cc >= cols) continue;
      const cand = grid[rr][cc];
      if (cand.char !== ' ' || cand.edgeChar !== ' ') {
        const d = dx * dx + dy * dy - (cand.isEdge ? 0.35 : 0);
        if (d < bestDist) {
          bestDist = d;
          best = { col: cc, row: rr, cell: cand };
        }
      }
    }
  }
  return best || { col: c0, row: r0, cell: direct };
}

function getDefaultSampleCell() {
  if (!state.gridData) return null;
  const { cols, rows } = state.gridData;
  return resolveInspectedCell(Math.round(cols * 0.46), Math.round(rows * 0.44), true);
}

function positionXRayLens(card) {
  const wrapper = document.getElementById('ascii-viewport-wrapper');
  const p = state.lastPointer;
  const shouldDock = Boolean(!p || p.isTouch || isCompactLayout());
  card.classList.toggle('is-docked', shouldDock);
  if (shouldDock || !wrapper) {
    card.style.left = '';
    card.style.top = '';
    return;
  }

  const wRect = wrapper.getBoundingClientRect();
  const cardW = card.offsetWidth || 248;
  const cardH = card.offsetHeight || 120;
  const gap = 22;
  const px = p.clientX - wRect.left;
  const py = p.clientY - wRect.top;

  // Por defecto a la derecha y abajo del cursor; si no cabe, cambia de lado
  let left = px + gap;
  if (left + cardW > wRect.width - 8) left = px - gap - cardW;
  let top = py + gap;
  if (top + cardH > wRect.height - 8) top = py - gap - cardH;

  left = Math.max(8, Math.min(wRect.width - cardW - 8, left));
  top = Math.max(8, Math.min(wRect.height - cardH - 8, top));
  card.style.left = `${Math.round(left)}px`;
  card.style.top = `${Math.round(top)}px`;
}

function updateXRayMagnifierLens(cellInfo) {
  const card = document.getElementById('xray-lens-card');
  if (!card) return;

  const compact = isCompactLayout() || Boolean(state.lastPointer?.isTouch);
  const targetInfo = cellInfo || (compact ? getDefaultSampleCell() : null);

  if (!targetInfo) {
    card.hidden = true;
    return;
  }

  card.hidden = false;
  positionXRayLens(card);
  const { col, row, cell } = targetInfo;
  const isPromptState = !cellInfo && compact;
  const coordEl = document.getElementById('xray-coord-label');
  const arrowEl = document.getElementById('xray-arrow-char');
  const edgeEl = document.getElementById('xray-edge-char');
  const angleEl = document.getElementById('xray-angle-text');
  const explainEl = document.getElementById('xray-plain-explain');

  const displayChar = cell.char !== ' ' ? cell.char : cell.edgeChar !== ' ' ? cell.edgeChar : '·';
  const displayColor = cell.char !== ' ' || cell.edgeChar !== ' ' ? `rgb(${cell.r}, ${cell.g}, ${cell.b})` : '#94a3b8';

  if (coordEl) {
    coordEl.textContent = isPromptState ? 'Desliza sobre la flor' : `celda (${col}, ${row})`;
  }
  if (arrowEl) {
    arrowEl.textContent = cell.arrowChar !== ' ' ? cell.arrowChar : '•';
    arrowEl.style.color = displayColor;
  }
  if (edgeEl) {
    edgeEl.textContent = displayChar;
    edgeEl.style.color = displayColor;
  }
  if (angleEl) {
    angleEl.textContent = `Gx:${cell.gx}  Gy:${cell.gy}  θ:${cell.angle}°`;
  }
  if (explainEl) {
    if (isPromptState) {
      explainEl.textContent = 'Toca o arrastra el dedo por los pétalos para inspeccionar y crear viento';
    } else if (cell.isEdge) {
      const dirDesc =
        cell.edgeChar === '|'
          ? 'Borde vertical'
          : cell.edgeChar === '-'
          ? 'Borde horizontal'
          : 'Borde diagonal';
      explainEl.textContent = `${dirDesc} (|G|=${cell.mag}) → traza '${cell.edgeChar}'`;
    } else if (cell.char !== ' ') {
      explainEl.textContent = `Interior de pétalo (luz=${cell.lum}) → sombrea '${cell.char}'`;
    } else {
      explainEl.textContent = `Fondo oscuro (|G|=${cell.mag}) → toca un pétalo`;
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

  if (!cellInfo) {
    hud.innerHTML = `
      <span class="hud-pill"><strong>Interactivo:</strong> Mueve el cursor o desliza el dedo para crear viento y ver la Lupa Rayos X • Toca la flor para lanzar una <strong>Onda Vectorial</strong></span>
    `;
    return;
  }

  const { col, row, cell } = cellInfo;
  const displayChar = cell.char !== ' ' ? cell.char : cell.edgeChar !== ' ' ? cell.edgeChar : '·';
  const rgbHex = `#${[cell.r, cell.g, cell.b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
  const kindLabel = cell.isEdge ? 'Borde cv2.Sobel' : cell.char !== ' ' ? 'Relleno Luminancia' : 'Fondo';

  hud.innerHTML = `
    <span class="hud-pill">Celda: <strong>(${col}, ${row})</strong></span>
    <span class="hud-pill">Vector: <strong>${cell.arrowChar || '•'}</strong> → <span class="hud-glyph-badge">${displayChar}</span> <span>${kindLabel}</span></span>
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
  if (state.hoveredCell && state.gridData) {
    const resolved = resolveInspectedCell(state.hoveredCell.col, state.hoveredCell.row, Boolean(state.lastPointer?.isTouch));
    if (resolved) updateXRayMagnifierLens(resolved);
  } else if (isCompactLayout()) {
    updateXRayMagnifierLens(null);
  }
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
      state.phase += dt * (reducedMotion ? 0.0011 : 0.0032);

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
  state.curtainEnabled = false;
  state.storyAct = Math.max(1, Math.min(5, actNum));
  state.storyActProgress = autoCycle ? 0.02 : 0.72;
  state.storyAutoCycle = autoCycle;
  storyActStartTime = performance.now();

  const actMeta = STORY_ACTS[state.storyAct - 1];
  if (actMeta) {
    state.activeCodeLine = actMeta.codeLine;
  }

  syncChoreoButtons();
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

function stepStory(delta) {
  const next = ((state.storyAct - 1 + delta + 5) % 5) + 1;
  selectStoryAct(next, false);
}

function setMotionPlaying(playing) {
  state.motionPlaying = playing;
  const motionBtn = document.getElementById('btn-toggle-motion');
  if (motionBtn) {
    motionBtn.classList.toggle('active', playing);
    motionBtn.setAttribute('aria-pressed', String(playing));
    motionBtn.textContent = playing ? 'Flor Viva' : 'Flor en pausa';
  }
}

function setChoreography(choreoKey) {
  state.choreography = choreoKey;
  state.curtainEnabled = false; // la cortina arranca en barrido automático hasta que se arrastra el asa
  syncChoreoButtons();

  if (choreoKey === 'story') {
    selectStoryAct(1, true);
  } else if (choreoKey === 'bloom') {
    state.storyAct = 5;
    state.storyActProgress = 1;
  } else if (choreoKey === 'curtain') {
    state.storyAct = 5;
    state.storyActProgress = 1;
    if (!state.curtainHintSeen) {
      showToast('Arrastra el asa amarilla ↔ para comparar la foto con el arte ASCII', 3600);
    }
  } else if (choreoKey === 'pulse') {
    state.storyAct = 5;
    state.storyActProgress = 1;
    triggerRadialShockwave();
  }

  if (!state.motionPlaying) setMotionPlaying(true);
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
  if (!reducedMotion) spawnPollenBurst(col / state.gridData.cols, row / state.gridData.rows, 9);
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
    btn.textContent = isPyodideReady() ? 'Ejecutando cv2.Sobel...' : 'Cargando Pyodide + OpenCV...';
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
    showToast(`Ejecutado en Python real (Pyodide + OpenCV WASM) en ${pyGrid.elapsedMs} ms`, 3600);
  } catch (err) {
    showToast(`Error en Pyodide: ${err.message || err}`, 4000);
  } finally {
    state.pyodideBusy = false;
    if (btn) {
      btn.disabled = false;
      btn.textContent = 'Ejecutar Python Real';
    }
  }
}

async function handleExportMedia(kind) {
  if (state.exportBusy || !state.sourceCanvas) return;
  state.exportBusy = true;
  const btn = document.getElementById('btn-export-menu');
  const origLabel = btn?.innerHTML || '';
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
        if (btn) btn.textContent = `${label} ${pct}%`;
        showToast(`Exportando ${label}... ${pct}%`, 0);
      }
    );
    showToast(`${label} descargado correctamente`, 3200);
  } catch (err) {
    showToast(`Error al exportar: ${err.message || err}`, 4000);
  } finally {
    state.exportBusy = false;
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = origLabel;
    }
  }
}

function setExportMenuOpen(open) {
  const menu = document.getElementById('export-menu');
  const btn = document.getElementById('btn-export-menu');
  if (!menu || !btn) return;
  menu.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
  if (open) menu.querySelector('.menu-item')?.focus();
}

function setCodeFocus(focus) {
  state.codeFocus = focus;
  const btn = document.getElementById('btn-toggle-code-focus');
  if (btn) {
    btn.textContent = focus ? '▾ Ver 12 líneas' : '▴ Solo línea activa';
    btn.setAttribute('aria-pressed', String(!focus));
  }
  renderLiveCodeDock(true);
}

function setMobileTab(tab) {
  state.mobileTab = tab;
  const workspace = document.getElementById('studio-workspace');
  if (workspace) workspace.dataset.mobileTab = tab;
  document.querySelectorAll('.mobile-tab[data-mobile-tab]').forEach(btn => {
    const isActive = btn.getAttribute('data-mobile-tab') === tab;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-pressed', String(isActive));
  });
  drawAsciiGridToCanvas();
  if (tab !== 'escena' && isCompactLayout()) {
    // Lleva la flor arriba para que se vea mientras se ajusta en el panel inferior
    document.getElementById('sobel-split-stage')?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
  }
}

function dismissCoachMark() {
  const coach = document.getElementById('coach-mark');
  if (!coach || coach.hidden) return;
  coach.hidden = true;
  safeStorageSet(ONBOARDING_STORAGE_KEY, '1');
}

function maybeShowCoachMark() {
  if (safeStorageGet(ONBOARDING_STORAGE_KEY)) return;
  const coach = document.getElementById('coach-mark');
  if (!coach) return;
  coach.hidden = false;
  setTimeout(dismissCoachMark, 5000);
}

function bindEvents() {
  window.addEventListener('resize', () => {
    if (state.renderTarget === 'canvas' && !state.motionPlaying) {
      drawAsciiGridToCanvas();
    }
  });

  window.matchMedia?.('(prefers-reduced-motion: reduce)').addEventListener?.('change', e => {
    reducedMotion = e.matches;
    initPollenParticles(reducedMotion ? 8 : 28);
  });

  // Menú Exportar / Compartir
  document.getElementById('btn-export-menu')?.addEventListener('click', e => {
    e.stopPropagation();
    setExportMenuOpen(document.getElementById('export-menu')?.hidden ?? false);
  });
  document.getElementById('export-menu')?.addEventListener('click', e => {
    if (e.target.closest('.menu-item')) setExportMenuOpen(false);
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#export-menu-wrap')) setExportMenuOpen(false);
  });
  document.getElementById('export-menu-wrap')?.addEventListener('keydown', e => {
    const items = Array.from(document.querySelectorAll('#export-menu .menu-item'));
    const idx = items.indexOf(document.activeElement);
    if (e.key === 'Escape') {
      setExportMenuOpen(false);
      document.getElementById('btn-export-menu')?.focus();
    } else if (e.key === 'ArrowDown' && items.length) {
      e.preventDefault();
      if (document.getElementById('export-menu').hidden) setExportMenuOpen(true);
      else items[(idx + 1) % items.length].focus();
    } else if (e.key === 'ArrowUp' && items.length) {
      e.preventDefault();
      items[(idx - 1 + items.length) % items.length].focus();
    }
  });

  document.querySelectorAll('[data-story-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const actNum = Number(btn.getAttribute('data-story-act'));
      selectStoryAct(actNum, false);
    });
  });

  document.getElementById('btn-story-prev')?.addEventListener('click', () => stepStory(-1));
  document.getElementById('btn-story-next')?.addEventListener('click', () => stepStory(1));
  document.getElementById('btn-story-autoplay')?.addEventListener('click', () => {
    if (!state.motionPlaying) setMotionPlaying(true);
    selectStoryAct(state.storyAct, !state.storyAutoCycle);
  });

  // Atajos de teclado: ← → para cambiar de paso (fuera de campos de formulario)
  document.addEventListener('keydown', e => {
    if (e.target.closest('input, select, textarea, [role="menu"]')) return;
    if (state.choreography !== 'story') return;
    if (e.key === 'ArrowRight') stepStory(1);
    else if (e.key === 'ArrowLeft') stepStory(-1);
  });

  document.querySelectorAll('[data-choreo]').forEach(btn => {
    btn.addEventListener('click', () => {
      setChoreography(btn.getAttribute('data-choreo'));
    });
  });

  document.getElementById('btn-trigger-shockwave')?.addEventListener('click', () => {
    triggerRadialShockwave();
  });

  document.getElementById('btn-toggle-motion')?.addEventListener('click', () => {
    setMotionPlaying(!state.motionPlaying);
    if (state.motionPlaying) {
      if (state.renderTarget !== 'canvas') toggleSelectableMode(false);
      startAnimationLoop();
    } else {
      recomputeAndRender(null, 1.0);
    }
  });

  document.getElementById('btn-toggle-code-focus')?.addEventListener('click', () => {
    setCodeFocus(!state.codeFocus);
  });

  document.querySelectorAll('.mobile-tab[data-mobile-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-mobile-tab');
      setMobileTab(state.mobileTab === tab ? 'escena' : tab);
    });
  });
  document.querySelectorAll('[data-close-sheet]').forEach(btn => {
    btn.addEventListener('click', () => setMobileTab('escena'));
  });

  document.getElementById('btn-coach-dismiss')?.addEventListener('click', dismissCoachMark);

  document.getElementById('btn-toggle-framing')?.addEventListener('click', e => {
    state.verticalFraming = !state.verticalFraming;
    e.currentTarget.classList.toggle('active', state.verticalFraming);
    e.currentTarget.setAttribute('aria-pressed', String(state.verticalFraming));
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

  // En móvil, tocar la barra de explicación de código abre el cajón de código completo
  document.getElementById('code-plain-explainer')?.addEventListener('click', () => {
    if (isCompactLayout()) {
      setMobileTab(state.mobileTab === 'codigo' ? 'escena' : 'codigo');
    }
  });

  // Canvas pointer: lupa + viento al pasar/deslizar, arrastrar asa ↔ (o deslizar en modo Cortina), tocar/clic = onda vectorial
  const canvas = document.getElementById('ascii-canvas');
  if (canvas) {
    let lastNormX = null;
    let downInfo = null; // { x, y, onHandle, moved }

    const toLogical = pt => {
      const rect = canvas.getBoundingClientRect();
      const logicalW = parseFloat(canvas.style.width) || rect.width;
      const scale = logicalW / Math.max(1, rect.width);
      return { lx: (pt.x - rect.left) * scale, ly: (pt.y - rect.top) * scale };
    };

    const isNearCurtainLine = (pt, isTouch = false) => {
      const splitX = Number(canvas.dataset.splitX || -1);
      if (splitX < 0) return false;
      const { lx } = toLogical(pt);
      const tol = isTouch ? 44 : CURTAIN_GRAB_TOLERANCE_PX;
      return Math.abs(lx - splitX) <= tol;
    };

    const inspectPointer = (pt, isTouch) => {
      if (!state.gridData) return;
      state.lastPointer = { clientX: pt.x, clientY: pt.y, isTouch };
      const charW = Number(canvas.dataset.charW || 8.6);
      const charH = Number(canvas.dataset.charH || 16.5);
      const padX = Number(canvas.dataset.padX || 10);
      const padY = Number(canvas.dataset.padY || 10);

      const { lx, ly } = toLogical(pt);
      const relX = lx - padX;
      const relY = ly - padY;
      const innerW = state.gridData.cols * charW;
      const innerH = state.gridData.rows * charH;

      const normX = Math.max(0, Math.min(1, relX / Math.max(1, innerW)));
      const normY = Math.max(0, Math.min(1, relY / Math.max(1, innerH)));

      if (state.isDraggingCurtain) {
        state.curtainPos = Math.max(0.05, Math.min(0.95, normX));
      } else if (!reducedMotion && lastNormX !== null) {
        const deltaX = normX - lastNormX;
        if (Math.abs(deltaX) > 0.002) {
          state.pointerWind.active = true;
          state.pointerWind.normX = normX;
          state.pointerWind.normY = normY;
          state.pointerWind.forceX = Math.max(-1.2, Math.min(1.2, deltaX * 18));
        }
      }
      lastNormX = normX;

      const rawCol = Math.floor(relX / charW);
      const rawRow = Math.floor(relY / charH);
      const inBounds =
        rawCol >= 0 && rawCol < state.gridData.cols && rawRow >= 0 && rawRow < state.gridData.rows;

      if (inBounds || isTouch || downInfo) {
        const clampedCol = Math.max(0, Math.min(state.gridData.cols - 1, rawCol));
        const clampedRow = Math.max(0, Math.min(state.gridData.rows - 1, rawRow));
        const resolved = resolveInspectedCell(clampedCol, clampedRow, isTouch);
        if (resolved) {
          state.hoveredCell = { col: resolved.col, row: resolved.row };
          updateHoverHud(resolved);
          if (!state.motionPlaying) drawAsciiGridToCanvas();
        }
      }
    };

    let touchLensTimer = null;

    const handleGestureStart = (pt, isTouch, pointerId = null) => {
      dismissCoachMark();
      const onHandle = isNearCurtainLine(pt, isTouch);
      downInfo = { x: pt.x, y: pt.y, onHandle, moved: false };
      if (pointerId !== null) {
        try {
          canvas.setPointerCapture?.(pointerId);
        } catch {
          /* ignorar si el puntero es sintético o no está activo */
        }
      }
      if (onHandle) {
        state.isDraggingCurtain = true;
        state.curtainEnabled = true; // fija la posición manual
        if (!state.curtainHintSeen) {
          state.curtainHintSeen = true;
          safeStorageSet(CURTAIN_HINT_STORAGE_KEY, '1');
        }
      }
      inspectPointer(pt, isTouch);
    };

    const handleGestureMove = (pt, isTouch) => {
      if (downInfo) {
        const dx = pt.x - downInfo.x;
        const dy = pt.y - downInfo.y;
        if (Math.hypot(dx, dy) > 8) {
          downInfo.moved = true;
          // En modo Cortina, cualquier arrastre horizontal mueve la cortina sin exigir atinarle a la línea
          if (!state.isDraggingCurtain && state.choreography === 'curtain' && Math.abs(dx) >= Math.abs(dy)) {
            state.isDraggingCurtain = true;
            state.curtainEnabled = true;
            downInfo.onHandle = true;
          }
        }
      }
      if (!state.isDraggingCurtain && !isTouch) {
        canvas.classList.toggle('over-handle', isNearCurtainLine(pt, false));
      }
      if (isTouch && !downInfo) return;
      inspectPointer(pt, isTouch);
    };

    const handleGestureEnd = (isTouch, isCancel = false) => {
      if (!downInfo && !state.isDraggingCurtain) return;
      const wasTap = downInfo && !downInfo.onHandle && !downInfo.moved && !isCancel;
      state.isDraggingCurtain = false;
      downInfo = null;
      if (wasTap && state.hoveredCell) {
        triggerRadialShockwave(state.hoveredCell.col, state.hoveredCell.row);
      }
      if (isTouch) {
        clearTimeout(touchLensTimer);
        touchLensTimer = setTimeout(() => {
          lastNormX = null;
          if (!state.motionPlaying) drawAsciiGridToCanvas();
        }, 2500);
      }
      if (!state.motionPlaying) drawAsciiGridToCanvas();
    };

    // Soporte directo para Touch Events (iOS Safari, Android Chrome y WebViews de redes sociales)
    canvas.addEventListener(
      'touchstart',
      e => {
        if (e.touches.length === 1) {
          e.preventDefault();
          const t = e.touches[0];
          handleGestureStart({ x: t.clientX, y: t.clientY }, true);
        }
      },
      { passive: false }
    );
    canvas.addEventListener(
      'touchmove',
      e => {
        if (e.touches.length === 1) {
          e.preventDefault();
          const t = e.touches[0];
          handleGestureMove({ x: t.clientX, y: t.clientY }, true);
        }
      },
      { passive: false }
    );
    canvas.addEventListener('touchend', () => handleGestureEnd(true, false));
    canvas.addEventListener('touchcancel', () => handleGestureEnd(true, true));

    canvas.addEventListener('pointerdown', e => {
      handleGestureStart({ x: e.clientX, y: e.clientY }, e.pointerType !== 'mouse', e.pointerId);
    });
    canvas.addEventListener('pointermove', e => {
      handleGestureMove({ x: e.clientX, y: e.clientY }, e.pointerType !== 'mouse');
    });
    canvas.addEventListener('pointerup', e => handleGestureEnd(e.pointerType !== 'mouse', false));
    canvas.addEventListener('pointercancel', e => handleGestureEnd(e.pointerType !== 'mouse', true));

    canvas.addEventListener('pointerleave', e => {
      if (state.isDraggingCurtain) return;
      if (e.pointerType === 'mouse') {
        state.hoveredCell = null;
        lastNormX = null;
        canvas.classList.remove('over-handle');
        updateHoverHud(null);
        if (!state.motionPlaying) drawAsciiGridToCanvas();
      }
    });
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
  initPollenParticles(reducedMotion ? 8 : 28);
  state.curtainHintSeen = Boolean(safeStorageGet(CURTAIN_HINT_STORAGE_KEY));
  buildShellHTML();
  renderKernelMatrices();
  setCodeFocus((window.innerHeight || 900) < 1000 || isCompactLayout());
  syncChoreoButtons();
  bindEvents();
  loadPhotoPreset();
  maybeShowCoachMark();
}

init();
