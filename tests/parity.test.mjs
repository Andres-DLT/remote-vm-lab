import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import test from 'node:test';
import {
  CHAR_RAMPS,
  KERNEL_PRESETS,
  computeSobelAsciiGridFromRgba,
  gridToPlainText
} from '../src/sobelEngine.js';

function loadPythonBatchSnapshots() {
  const pyCode = `
import json, cv2, ave_del_paraiso_sobel as m
img = m.load_flower_image(auto_crop=True)
results = {}
for width in (64, 72):
    resized = m.resize_for_ascii(img, width)
    rgba = cv2.cvtColor(resized, cv2.COLOR_BGR2RGBA)
    results[f"rgba_{width}"] = {
        "cols": int(resized.shape[1]),
        "rows": int(resized.shape[0]),
        "rgba": rgba.reshape(-1).tolist(),
    }

cases = []
for kernel_key, ksize in (("3", 3), ("5", 5), ("scharr", -1)):
    for mode in ("combined", "edges", "vectors", "magnitude"):
        cases.append((72, 52, kernel_key, ksize, mode, "classic"))

for ramp_key in ("classic", "highContrast", "botanical", "blocks"):
    cases.append((64, 48, "3", 3, "combined", ramp_key))

resized_cache = {w: m.resize_for_ascii(img, w) for w in (64, 72)}
for width, threshold, kernel_key, ksize, mode, ramp_key in cases:
    out = m.sobel_ascii_arrays_from_resized(
        resized_cache[width],
        edge_threshold=threshold,
        ksize=ksize,
        saturation_boost=1.38,
        contrast_boost=1.16,
        mode=mode,
        ramp=ramp_key,
    )
    _, plain_lines = m.arrays_to_lines(out["chars"], out["rgb"])
    key = f"{width}:{threshold}:{kernel_key}:{mode}:{ramp_key}"
    results[key] = {
        "plain": "\\n".join(plain_lines),
        "stats": out["stats"],
    }

print(json.dumps(results))
`;
  const stdout = execFileSync('python3', ['-c', pyCode], {
    cwd: new URL('..', import.meta.url),
    encoding: 'utf-8',
    maxBuffer: 32 * 1024 * 1024
  });
  return JSON.parse(stdout);
}

const snapshots = loadPythonBatchSnapshots();

test('KERNEL_PRESETS["5"] define el kernel cv2.Sobel 5x5 real de OpenCV', () => {
  const k5 = KERNEL_PRESETS['5'];
  assert.equal(k5.size, 5);
  assert.equal(k5.gx.length, 5);
  assert.equal(k5.gy.length, 5);
  assert.deepEqual(k5.gx[2], [-6, -12, 0, 12, 6]);
  assert.deepEqual(
    k5.gy.map(row => row[2]),
    [-6, -12, 0, 12, 6]
  );
});

for (const kernelKey of ['3', '5', 'scharr']) {
  for (const viewMode of ['combined', 'edges', 'vectors', 'magnitude']) {
    test(`Paridad 100% JS vs Python OpenCV para kernel=${kernelKey} y modo=${viewMode}`, () => {
      const base = snapshots.rgba_72;
      const pySnap = snapshots[`72:52:${kernelKey}:${viewMode}:classic`];
      const rgba = new Uint8ClampedArray(base.rgba);

      const jsGrid = computeSobelAsciiGridFromRgba(rgba, base.cols, base.rows, {
        edgeThreshold: 52,
        kernelKey,
        saturationBoost: 1.38,
        contrastBoost: 1.16,
        rampKey: 'classic',
        viewMode
      });

      assert.equal(jsGrid.cols, pySnap.stats.cols);
      assert.equal(jsGrid.rows, pySnap.stats.rows);
      assert.equal(jsGrid.stats.maxMag, pySnap.stats.max_mag);
      assert.equal(jsGrid.stats.edgeCount, pySnap.stats.edge_cells);
      assert.equal(jsGrid.stats.activeCount, pySnap.stats.active_cells);
      assert.equal(Number(jsGrid.stats.edgeRatio), pySnap.stats.edge_ratio);
      assert.equal(gridToPlainText(jsGrid), pySnap.plain);
    });
  }
}

import { readFileSync } from 'node:fs';

for (const rampKey of Object.keys(CHAR_RAMPS)) {
  test(`Paridad JS vs Python para rampa de densidad "${rampKey}"`, () => {
    const base = snapshots.rgba_64;
    const pySnap = snapshots[`64:48:3:combined:${rampKey}`];
    const rgba = new Uint8ClampedArray(base.rgba);

    const jsGrid = computeSobelAsciiGridFromRgba(rgba, base.cols, base.rows, {
      edgeThreshold: 48,
      kernelKey: '3',
      saturationBoost: 1.38,
      contrastBoost: 1.16,
      rampKey,
      viewMode: 'combined'
    });
    assert.equal(gridToPlainText(jsGrid), pySnap.plain);
  });
}

test('UX/UI: cabecera limpia con menú Exportar, barra unificada de escena, código plegable, lupa dinámica, pestañas móviles, sin emojis ni restos de vm-lab', () => {
  const mainJs = readFileSync(new URL('../src/main.js', import.meta.url), 'utf-8');
  const styleCss = readFileSync(new URL('../src/style.css', import.meta.url), 'utf-8');
  const exporterJs = readFileSync(new URL('../src/exporter.js', import.meta.url), 'utf-8');
  const pyScript = readFileSync(new URL('../ave_del_paraiso_sobel.py', import.meta.url), 'utf-8');

  // 1. Cabecera con menú desplegable Exportar y sin botones duplicados
  assert.match(mainJs, /id="btn-export-menu"/);
  assert.match(mainJs, /id="export-menu"/);
  assert.doesNotMatch(mainJs, /id="btn-play-story"/);
  assert.doesNotMatch(mainJs, /id="choreo-grid"/);

  // 2. Barra única de escena con modos, transporte Ant./Pausa/Sig. y leyenda compacta
  assert.match(mainJs, /id="stage-control-bar"/);
  assert.match(mainJs, /id="btn-story-prev"/);
  assert.match(mainJs, /id="btn-story-next"/);
  assert.match(mainJs, /id="btn-story-autoplay"/);
  assert.match(mainJs, /class="story-caption"/);

  // 3. Código en vivo plegable (modo foco de 3 líneas vs 12 líneas)
  assert.match(mainJs, /id="btn-toggle-code-focus"/);
  assert.match(mainJs, /out-of-focus/);
  assert.match(styleCss, /\.code-line\.out-of-focus/);

  // 4. Lupa Rayos X que sigue al cursor y se acopla en móvil + separación de gestos cortina vs onda
  assert.match(mainJs, /function positionXRayLens/);
  assert.match(mainJs, /const isNearCurtainLine/);
  assert.match(styleCss, /\.xray-lens-card\.is-docked/);
  assert.match(styleCss, /\.ascii-canvas\.over-handle/);

  // 5. Aviso de primera visita, pestañas móviles inferiores y prefers-reduced-motion
  assert.match(mainJs, /id="coach-mark"/);
  assert.match(mainJs, /id="mobile-tabbar"/);
  assert.match(styleCss, /@media \(prefers-reduced-motion: reduce\)/);

  // 6. Cero emojis en la UI y cero referencias a vm-lab / vmDashboard
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{23E9}-\u{23FA}\u{FE0F}]/u;
  assert.doesNotMatch(mainJs, emojiRegex);
  assert.doesNotMatch(styleCss, emojiRegex);
  assert.doesNotMatch(exporterJs, emojiRegex);
  assert.doesNotMatch(pyScript, emojiRegex);
  assert.doesNotMatch(mainJs, /vm-lab|vmDashboard/i);
  assert.doesNotMatch(styleCss, /\.vm-/);
});


