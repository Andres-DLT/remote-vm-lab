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

- **Panel Superior (Terminal ASCII Viva + Guía en 5 Pasos)**:
  - **Historia Explicada en 5 Pasos (`🎬 Historia Explicada (5 Pasos)`)**: Guía visual pensada para que cualquier persona entienda al instante el algoritmo: **1. Foto Real HD** → **2. Escáner Horizontal $G_x$ (`|`)** → **3. Escáner Vertical $G_y$ (`-`)** → **4. Brújula de Ángulos (`| / - \`)** → **5. Floración Viva + Rayos X**.
  - **Cortina Interactiva Rayos X (`🌗 Cortina Foto ↔ ASCII`)**: Desliza una cortina sobre los pétalos para comparar lado a lado la fotografía original HD, las flechas vectoriales $\nabla I$ (`→ ↗ ↑ ↖`) y el arte ASCII direccional.
  - **Floración Cinética + Polen Bioluminiscente + Viento Interactivo**: Los sépalos naranjas y lenguas azules se abren dinámicamente, oscilan con el viento de tu cursor/dedo, emiten partículas de polen (`✦ * + ·`) y reaccionan al clic con **Ondas de Choque Vectoriales (`💥`)**.
  - **Lupa Rayos X Magnificada (`🔬 Lupa Rayos X cv2.Sobel`)**: Muestra un zoom píxel a píxel de la foto real junto con la flecha de gradiente y el carácter ASCII elegido.
  - **Exportación Vertical 9:16 (`🎥 Exportar WebM` / `🎞️ Exportar GIF`)**: Graba la historia completa en 5 pasos con cortina Foto↔ASCII, floración viva y código Python abajo en formato 9:16.
- **Panel Inferior (`ave_del_paraiso_sobel.py` en Vivo + Traductor en Español Sencillo)**:
  - **Traductor Línea por Línea (`💡`)**: Explica en lenguaje cotidiano y sin tecnicismos qué hace cada línea de código de Python y cómo afecta a la flor.
  - **Python Real en el Navegador (`🐍 Ejecutar Python Real (Pyodide)`)**: Carga bajo demanda `opencv-python` y `numpy` en WebAssembly mediante Pyodide y ejecuta el módulo [`ave_del_paraiso_sobel.py`](ave_del_paraiso_sobel.py) directamente en el navegador.
  - Cada deslizador (`WIDTH`, `EDGE_THRESH`, `ksize`, saturación, contraste, rampa ASCII) actualiza en tiempo real los valores literales dentro del código Python inferior y el comando CLI.
- **Panel Remote VM Lab (`🖥️ VM Lab` en `#/vm-lab`)**: Conserva el dashboard móvil original del repositorio en la ruta `#/vm-lab`.

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

