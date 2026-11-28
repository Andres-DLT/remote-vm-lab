# Ave del Paraíso — Arte ASCII con `cv2.Sobel` (Estudio Web + Python CLI) 🌺🐍

Proyecto que convierte la flor **Ave del Paraíso (*Strelitzia reginae*)** en arte ASCII direccional a todo color utilizando el operador derivativo **`cv2.Sobel`** de OpenCV, mostrando **la animación ASCII arriba y el código Python en vivo abajo**.

🌐 **Demo interactiva en GitHub Pages:** [**https://andres-dlt.github.io/remote-vm-lab/**](https://andres-dlt.github.io/remote-vm-lab/)

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Andres-DLT/remote-vm-lab)

---

## ✨ ¿Cómo funciona el pipeline con `cv2.Sobel`?

A diferencia de los generadores ASCII tradicionales que solo mapean brillo, este proyecto combina **geometría de bordes direccionales** y **luminancia cromática**:

1. **Realce Botánico HSV (`cv2.cvtColor`)**: Aumenta la saturación de los sépalos naranjas/dorados, la lengua azul cobalto y la espata verde/carmesí para que destaquen sobre el fondo negro.
2. **Derivadas de Sobel (`cv2.Sobel`)**:
   ```python
   gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)  # Gradiente horizontal ∂I/∂x
   gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)  # Gradiente vertical   ∂I/∂y
   mag = np.hypot(gx, gy) / np.hypot(gx, gy).max() * 255.0
   angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0
   ```
3. **Trazos Vectoriales (`|`, `/`, `-`, `\`)**: Si la magnitud del gradiente supera `EDGE_THRESHOLD`, el ángulo $\theta \in [0^\circ, 180^\circ)$ selecciona el carácter ASCII cuya orientación es tangente al contorno del pétalo.
4. **Relleno por Luminancia + ANSI TrueColor (`\033[38;2;R;G;Bm`)**: El interior de los pétalos se sombrea con la rampa `" .:-=+*#%@"` coloreada en 24 bits.

---

## 🐍 1. Script de Terminal en Python (`ave_del_paraiso_sobel.py`)

Ejecuta la experiencia completa directamente en tu terminal (incluye la animación de escaneo `cv2.Sobel`, brisa orgánica en tiempo real y el **panel inferior de código en vivo**):

```bash
pip install -r requirements.txt

# Animación de escaneo paso a paso en la terminal (flor arriba + código en vivo abajo)
python3 ave_del_paraiso_sobel.py

# Render estático instantáneo con panel de código abajo
python3 ave_del_paraiso_sobel.py --static --width 88

# Ver únicamente los vectores direccionales de borde cv2.Sobel (/ | \ -) o usar el filtro Scharr (ksize=-1)
python3 ave_del_paraiso_sobel.py --static --mode edges --threshold 45 --ksize scharr

# Personalizar contraste y rampa de densidad ASCII (classic, highContrast, botanical, blocks)
python3 ave_del_paraiso_sobel.py --static --ksize 5 --contrast 1.2 --ramp botanical

# Exportar arte ASCII plano (.txt) o con color ANSI 24-bit (.ans)
python3 ave_del_paraiso_sobel.py --static --save-txt strelitzia.txt --save-ans strelitzia.ans
```

---

## 🖥️ 2. Versión Web Interactiva con Código en Vivo Abajo

La aplicación web reproduce con paridad matemática exacta el pipeline de `cv2.Sobel` (kernels 3×3, 5×5 real de OpenCV y filtro Scharr) a 60 FPS:

- **Cabecera Compacta + Menú `📤 Exportar`**:
  - Controles directos (`🌺 Flor Viva`, `📱 9:16`) y un menú desplegable **`📤 Exportar`** que agrupa la grabación de video vertical 9:16 (`🎥 WebM` / `🎞️ GIF`), copiado de arte ASCII plano, ANSI 24-bit, script Python personalizado y descarga directa de `ave_del_paraiso_sobel.py`.
- **Barra Única de Escena + Guía en 5 Pasos con Transporte (`⏮ ⏸ ⏭`)**:
  - **Modos de Animación Unificados**: Selector segmentado (`🎬 Historia` | `🌺 Floración` | `🌗 Cortina` | `⚡ Pulso`) junto a las píldoras de los 5 pasos (**1. Foto Real** → **2. Escáner $G_x$ (`|`)** → **3. Escáner $G_y$ (`-`)** → **4. Brújula (`/ | \ -`)** → **5. Floración Viva**) con controles para pausar o avanzar/retroceder pasos manualmente (o con las flechas `←` / `→`) y leyenda compacta de una sola línea.
  - **Gestos Separados (Cortina `↔` vs. Onda Vectorial `💥`)**: Arrastrar el asa central `↔` (con pulso de bienvenida y cursor `ew-resize`) desliza la cortina Foto HD ↔ Arte ASCII sin disparar ondas accidentales; hacer clic o tocar cualquier pétalo lanza una **Onda de Choque Vectorial (`💥`)**.
  - **Lupa Rayos X Dinámica (`🔬 Lupa Rayos X cv2.Sobel`)**: Sigue suavemente al cursor cambiando de lado cerca de los bordes para no tapar nunca la flor, y en pantallas táctiles/móviles se acopla en la franja inferior.
- **Panel Inferior Plegable (`ave_del_paraiso_sobel.py` en Vivo + Modo Foco 3 Líneas)**:
  - **Vista Compacta sin Scroll**: En pantallas de laptop se activa por defecto el modo foco (mostrando las 3 líneas alrededor de la línea activa) con botón `▾ Ver 12 líneas` / `▴ Solo línea activa` para que la flor y el código se vean siempre al mismo tiempo.
  - **Traductor Línea por Línea (`💡`)** y **Python Real en el Navegador (`🐍 Ejecutar Python Real`)** mediante Pyodide (`opencv-python` + `numpy` en WebAssembly).
- **Cajón Inferior con Pestañas en Móvil (`🌺 Escena` | `🎛️ Ajustes` | `🐍 Código`)**:
  - En móvil y tablet los ajustes de `cv2.Sobel` y el código se abren como un panel inferior deslizable de media altura para ajustar parámetros mientras la flor ASCII sigue visible arriba.
- **Accesibilidad y Primera Visita**: Guía rápida de 3 gestos en la primera visita y soporte completo para `prefers-reduced-motion`.
- **Panel Remote VM Lab (`#/vm-lab`)**: Conserva el dashboard móvil original del repositorio en la ruta `#/vm-lab`.

### Ejecutar y probar en local

```bash
npm install
npm test       # Verifica paridad 100% entre el motor JS y OpenCV en Python
npm run dev
```

Abre `http://localhost:5173`.

---

## 🗂️ Estructura del repositorio

- [`ave_del_paraiso_sobel.py`](ave_del_paraiso_sobel.py) — Script autónomo vectorizado con NumPy y OpenCV (`cv2.Sobel` con `ksize` 3, 5 o `-1`/`scharr`), ANSI TrueColor de 24 bits y panel de código en vivo abajo (copiado automáticamente a `public/` por Vite).
- [`requirements.txt`](requirements.txt) — Dependencias de Python (`opencv-python`, `numpy`).
- [`public/ave-del-paraiso.jpg`](public/ave-del-paraiso.jpg) — Fotografía botánica en alto contraste de *Strelitzia reginae* sobre fondo negro puro.
- [`src/sobelEngine.js`](src/sobelEngine.js) — Motor de convolución Gaussiana + `cv2.Sobel` 3×3, 5×5 real y Scharr con `BORDER_REFLECT_101`, buffers reutilizables y paridad exacta con OpenCV.
- [`src/exporter.js`](src/exporter.js) — Grabador y codificador de video WebM (`MediaRecorder`) y GIF animado (`gifenc`) en formato vertical 9:16.
- [`src/pyodideRunner.js`](src/pyodideRunner.js) — Ejecutor opcional de Python real en el navegador (Pyodide + `opencv-python` + `numpy` en WebAssembly).
- [`src/vmDashboard.js`](src/vmDashboard.js) — Dashboard móvil original de Remote VM Lab accesible en `#/vm-lab`.
- [`src/main.js`](src/main.js) — Interfaz del estudio interactivo con código Python sincronizado abajo, inspector de celdas y vista vertical 9:16.
- [`tests/parity.test.mjs`](tests/parity.test.mjs) — Suite de pruebas automatizadas (`node --test`) que valida la paridad bit a bit entre JS y Python OpenCV.

