# Ave del Paraíso — Arte ASCII con `cv2.Sobel` (TikTok Studio + Python CLI) 🌺🐍

Proyecto inspirado en el formato viral de TikTok que convierte la flor **Ave del Paraíso (*Strelitzia reginae*)** en arte ASCII direccional a todo color utilizando el operador derivativo **`cv2.Sobel`** de OpenCV, mostrando **la animación ASCII arriba y el código Python en vivo abajo**.

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

# Animación estilo TikTok en la terminal (flor arriba + código en vivo abajo)
python3 ave_del_paraiso_sobel.py

# Render estático instantáneo con panel de código abajo
python3 ave_del_paraiso_sobel.py --static --width 88

# Ver únicamente los vectores direccionales de borde cv2.Sobel (/ | \ -)
python3 ave_del_paraiso_sobel.py --static --mode edges --threshold 45

# Exportar arte ASCII plano (.txt) o con color ANSI 24-bit (.ans)
python3 ave_del_paraiso_sobel.py --static --save-txt strelitzia.txt --save-ans strelitzia.ans
```

---

## 🖥️ 2. Versión Web Interactiva con Código en Vivo Abajo

La aplicación web reproduce en el navegador el motor matemático de `cv2.Sobel` (kernels 3×3, 5×5 y filtro Scharr) a 60 FPS:

- **Panel Superior (Terminal ASCII)**:
  - **Modo TikTok (`▶ Animar TikTok`)**: Escanea primero los vectores de borde `cv2.Sobel` (`/ | \ -`) y revela progresivamente el color ANSI de la flor mientras el código inferior escribe y ejecuta cada línea.
  - **Brisa Viva 60 FPS (`🌬️ Brisa Viva`)**: Deformación orgánica sinusoidal recalculando `Gx` y `Gy` en cada cuadro.
  - **Inspector Matemático de Celdas**: Pasa el cursor o toca cualquier carácter de la flor para inspeccionar su coordenada, $G_x$, $G_y$, $|G|$, ángulo $\theta^\circ$ y secuencia ANSI `\033[38;2;R;G;Bm`.
- **Panel Inferior (`ave_del_paraiso_sobel.py` en Vivo)**:
  - Cada deslizador (`WIDTH`, `EDGE_THRESH`, `ksize`, saturación, rampa ASCII) actualiza en tiempo real los valores literales dentro del código Python inferior.
  - Haz clic en cualquier línea del código para inspeccionar esa etapa del algoritmo (`Sobel Gx/Gy`, `magnitud`, `vectores`, `ANSI 24b`).

### Ejecutar en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

---

## 🗂️ Estructura del repositorio

- [`ave_del_paraiso_sobel.py`](ave_del_paraiso_sobel.py) — Script autónomo de terminal en Python con OpenCV (`cv2.Sobel`), ANSI TrueColor de 24 bits, generador procedural de respaldo y panel de código en vivo abajo.
- [`requirements.txt`](requirements.txt) — Dependencias de Python (`opencv-python`, `numpy`).
- [`public/ave-del-paraiso.jpg`](public/ave-del-paraiso.jpg) — Fotografía botánica en alto contraste de *Strelitzia reginae* sobre fondo negro puro.
- [`src/sobelEngine.js`](src/sobelEngine.js) — Motor de convolución Gaussiana + `cv2.Sobel` ($G_x, G_y, |G|, \theta$), dilatación cromática de bordes y generador procedural en Canvas.
- [`src/main.js`](src/main.js) — Interfaz del estudio interactivo con código Python sincronizado abajo, inspector de celdas y modo 9:16 TikTok.
- [`src/style.css`](src/style.css) — Sistema de diseño oscuro botánico inspirado en los colores de *Strelitzia reginae*.
