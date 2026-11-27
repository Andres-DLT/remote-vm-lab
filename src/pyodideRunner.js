import { KERNEL_PRESETS } from './sobelEngine.js';

const PYODIDE_INDEX_URL = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';

let pyodideInstance = null;
let pyodideLoadingPromise = null;

export function isPyodideReady() {
  return Boolean(pyodideInstance);
}

/**
 * Inicializa Pyodide bajo demanda, instala numpy + opencv-python en WebAssembly
 * y carga el módulo real ave_del_paraiso_sobel.py en el intérprete Python del navegador.
 */
export async function ensurePyodideLoaded(onStatus) {
  if (pyodideInstance) return pyodideInstance;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = (async () => {
    try {
      if (onStatus) onStatus('Descargando runtime Pyodide (WebAssembly)...');
      const { loadPyodide } = await import(/* @vite-ignore */ `${PYODIDE_INDEX_URL}pyodide.mjs`);
      const pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX_URL });

      if (onStatus) onStatus('Cargando paquetes OpenCV (cv2) y NumPy en WASM...');
      await pyodide.loadPackage(['numpy', 'opencv-python']);

      if (onStatus) onStatus('Importando ave_del_paraiso_sobel.py...');
      const resp = await fetch('./ave_del_paraiso_sobel.py');
      if (!resp.ok) {
        throw new Error(`No se pudo cargar ave_del_paraiso_sobel.py (${resp.status})`);
      }
      const pySource = await resp.text();
      pyodide.FS.writeFile('/home/pyodide/ave_del_paraiso_sobel.py', pySource, { encoding: 'utf8' });

      await pyodide.runPythonAsync(`
import sys, json, cv2, numpy as np
if '/home/pyodide' not in sys.path:
    sys.path.insert(0, '/home/pyodide')
import ave_del_paraiso_sobel as sobel_mod

def run_browser_sobel(rgba_bytes, cols, rows, edge_threshold, ksize, sat_boost, contrast_boost, mode, ramp_key):
    arr = np.frombuffer(bytes(rgba_bytes), dtype=np.uint8).reshape((rows, cols, 4))
    bgr = cv2.cvtColor(arr, cv2.COLOR_RGBA2BGR)
    out = sobel_mod.sobel_ascii_arrays_from_resized(
        bgr,
        edge_threshold=float(edge_threshold),
        ksize=int(ksize),
        saturation_boost=float(sat_boost),
        contrast_boost=float(contrast_boost),
        mode=str(mode),
        ramp=str(ramp_key),
    )
    return json.dumps({
        "chars": out["chars"].tolist(),
        "edge_chars": out["edge_chars"].tolist(),
        "rgb": out["rgb"].tolist(),
        "gx": np.rint(out["gx"]).astype(int).tolist(),
        "gy": np.rint(out["gy"]).astype(int).tolist(),
        "mag": np.rint(out["mag"]).astype(int).tolist(),
        "angle": np.round(out["angle"], 1).tolist(),
        "lum": out["lum"].tolist(),
        "is_edge": out["is_edge"].tolist(),
        "stats": out["stats"],
    })
`);

      pyodideInstance = pyodide;
      return pyodide;
    } catch (err) {
      pyodideLoadingPromise = null;
      throw err;
    }
  })();

  return pyodideLoadingPromise;
}

/**
 * Ejecuta cv2.Sobel real dentro de Pyodide sobre el canvas fuente y devuelve gridData compatible con el estudio.
 */
export async function computeSobelGridWithPyodide(sourceCanvas, options, onStatus) {
  const pyodide = await ensurePyodideLoaded(onStatus);
  const {
    cols = 88,
    edgeThreshold = 52,
    kernelKey = '3',
    saturationBoost = 1.38,
    contrastBoost = 1.16,
    rampKey = 'classic',
    viewMode = 'combined',
    charAspect = 0.5
  } = options;

  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const rows = Math.max(16, Math.trunc((srcH / srcW) * cols * charAspect));

  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = cols;
  tempCanvas.height = rows;
  const ctx = tempCanvas.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, cols, rows);
  ctx.drawImage(sourceCanvas, 0, 0, cols, rows);

  const rgba = ctx.getImageData(0, 0, cols, rows).data;
  const preset = KERNEL_PRESETS[kernelKey] || KERNEL_PRESETS['3'];

  const t0 = performance.now();
  const runFn = pyodide.globals.get('run_browser_sobel');
  const jsonStr = runFn(
    rgba,
    cols,
    rows,
    edgeThreshold,
    preset.ksize,
    saturationBoost,
    contrastBoost,
    viewMode,
    rampKey
  );
  runFn.destroy?.();
  const elapsedMs = Math.round((performance.now() - t0) * 10) / 10;

  const parsed = JSON.parse(jsonStr);
  const grid = new Array(rows);
  for (let y = 0; y < rows; y++) {
    const rowCells = new Array(cols);
    for (let x = 0; x < cols; x++) {
      const [r, g, b] = parsed.rgb[y][x];
      rowCells[x] = {
        char: parsed.chars[y][x],
        edgeChar: parsed.edge_chars[y][x],
        r,
        g,
        b,
        gx: parsed.gx[y][x],
        gy: parsed.gy[y][x],
        mag: parsed.mag[y][x],
        angle: parsed.angle[y][x],
        lum: parsed.lum[y][x],
        isEdge: Boolean(parsed.is_edge[y][x])
      };
    }
    grid[y] = rowCells;
  }

  return {
    grid,
    cols,
    rows,
    elapsedMs,
    stats: {
      cols,
      rows,
      maxMag: parsed.stats.max_mag,
      edgeCount: parsed.stats.edge_cells,
      activeCount: parsed.stats.active_cells,
      edgeRatio: parsed.stats.edge_ratio.toFixed(1)
    }
  };
}
