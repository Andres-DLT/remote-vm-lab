#!/usr/bin/env python3
"""
Ave del Paraíso (Strelitzia reginae) — Arte ASCII con cv2.Sobel (Estilo TikTok)
===============================================================================
Renderiza la flor Ave del Paraíso en la terminal combinando:
  1. Detección de bordes direccionales con `cv2.Sobel` (Gx, Gy -> magnitud y ángulo)
     mapeados a caracteres vectoriales ('|', '/', '-', '\\').
  2. Relleno por luminancia con rampa de densidad ASCII (' .:-=+*#%@').
  3. Color ANSI TrueColor de 24 bits (\033[38;2;R;G;Bm) con realce botánico HSV.
  4. Panel inferior de "Código en Vivo" sincronizado estilo TikTok.

Uso rápido:
  python3 ave_del_paraiso_sobel.py                  # Animación TikTok + código en vivo abajo
  python3 ave_del_paraiso_sobel.py --static         # Render estático instantáneo + código abajo
  python3 ave_del_paraiso_sobel.py --mode edges     # Solo bordes direccionales cv2.Sobel
  python3 ave_del_paraiso_sobel.py --width 90       # Ajustar columnas ASCII
"""

from __future__ import annotations

import argparse
import math
import os
import shutil
import sys
import time
from pathlib import Path
from typing import List, Tuple

import cv2
import numpy as np

# Rampa de densidad luminosa (de oscuro a brillante)
DENSITY_RAMP = " .:-=+*#%@"

# Fragmento de código que se muestra y resalta en vivo en el panel inferior (estilo TikTok)
LIVE_CODE_LINES = [
    ("import cv2, numpy as np", "setup"),
    ("img = cv2.imread('ave-del-paraiso.jpg')", "load"),
    ("hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)", "hsv"),
    ("gray = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (3, 3), 0)", "gray"),
    ("gx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)  # Derivada horizontal Gx", "sobel_x"),
    ("gy = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)  # Derivada vertical Gy", "sobel_y"),
    ("mag = np.hypot(gx, gy) / np.hypot(gx, gy).max() * 255.0", "mag"),
    ("angle = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0", "angle"),
    ("edge_char = np.select([angle<22.5, angle<67.5, angle<112.5, angle<157.5],", "map_edge"),
    ("                      ['|', '/', '-', '\\\\'], default='|')", "map_edge"),
    ("glyph = np.where(mag >= EDGE_THRESH, edge_char, DENSITY_RAMP[lum_idx])", "compose"),
    ("sys.stdout.write(f'\\033[38;2;{r};{g};{b}m{glyph}\\033[0m')", "render"),
]


def generate_procedural_strelitzia(height: int = 800, width: int = 600) -> np.ndarray:
    """
    Genera una flor Ave del Paraíso (Strelitzia reginae) procedural en alta definición
    usando primitivas de OpenCV si no se encuentra el archivo de imagen local.
    """
    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    cx, cy = int(width * 0.44), int(height * 0.48)

    # 1. Tallo principal verde esmeralda curvo
    stem_pts = np.array([
        [int(width * 0.34), height - 10],
        [int(width * 0.33), int(height * 0.72)],
        [int(width * 0.37), int(height * 0.54)],
        [cx, cy + 18],
    ], dtype=np.int32)
    cv2.polylines(canvas, [stem_pts], False, (55, 145, 45), thickness=28, lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [stem_pts], False, (85, 195, 70), thickness=10, lineType=cv2.LINE_AA)

    # 2. Sépalos naranjas/dorados en abanico (cresta del Ave del Paraíso)
    sepals = [
        # (ángulo_grados, largo, ancho_base, color_bgr_base, color_bgr_punta)
        (-152, 250, 28, (15, 110, 245), (30, 190, 255)),
        (-136, 265, 30, (10, 125, 250), (45, 210, 255)),
        (-118, 280, 34, (15, 140, 255), (60, 225, 255)),
        (-96,  295, 36, (20, 155, 255), (75, 235, 255)),
        (-72,  260, 28, (18, 130, 250), (55, 215, 255)),
    ]
    for deg, length, half_w, col_base, col_tip in sepals:
        rad = math.radians(deg)
        tip_x = int(cx + math.cos(rad) * length)
        tip_y = int(cy + math.sin(rad) * length)
        perp_x = -math.sin(rad)
        perp_y = math.cos(rad)
        mid_x = int(cx + math.cos(rad) * (length * 0.45) + perp_x * (half_w * 0.35))
        mid_y = int(cy + math.sin(rad) * (length * 0.45) + perp_y * (half_w * 0.35))
        p1 = [cx, cy]
        p2 = [int(mid_x + perp_x * half_w), int(mid_y + perp_y * half_w)]
        p3 = [tip_x, tip_y]
        p4 = [int(mid_x - perp_x * half_w * 0.7), int(mid_y - perp_y * half_w * 0.7)]
        poly = np.array([p1, p2, p3, p4], dtype=np.int32)
        cv2.fillPoly(canvas, [poly], col_base, lineType=cv2.LINE_AA)
        # Nervadura central brillante para enriquecer gradientes de cv2.Sobel
        cv2.line(canvas, (cx, cy), (tip_x, tip_y), col_tip, 4, lineType=cv2.LINE_AA)
        cv2.polylines(canvas, [poly], True, col_tip, 2, lineType=cv2.LINE_AA)

    # 3. Pétalos azules cobalto eléctrico (lengua en flecha)
    tongues = [
        (-62, 255, 18, (235, 95, 25), (255, 175, 80)),
        (-22, 240, 20, (245, 105, 30), (255, 190, 95)),
    ]
    for deg, length, half_w, col_main, col_highlight in tongues:
        rad = math.radians(deg)
        tip_x = int(cx + math.cos(rad) * length)
        tip_y = int(cy + math.sin(rad) * length)
        perp_x, perp_y = -math.sin(rad), math.cos(rad)
        barb_x = int(cx + math.cos(rad) * (length * 0.55) + perp_x * half_w)
        barb_y = int(cy + math.sin(rad) * (length * 0.55) + perp_y * half_w)
        inner_x = int(cx + math.cos(rad) * (length * 0.50) - perp_x * (half_w * 0.45))
        inner_y = int(cy + math.sin(rad) * (length * 0.50) - perp_y * (half_w * 0.45))
        poly = np.array([[cx + 10, cy - 4], [barb_x, barb_y], [tip_x, tip_y], [inner_x, inner_y]], dtype=np.int32)
        cv2.fillPoly(canvas, [poly], col_main, lineType=cv2.LINE_AA)
        cv2.line(canvas, (cx + 10, cy - 4), (tip_x, tip_y), col_highlight, 3, lineType=cv2.LINE_AA)

    # 4. Espata horizontal (pico de ave verde con borde carmesí/rojizo)
    beak_tip = (int(width * 0.92), int(height * 0.46))
    beak_poly = np.array([
        [cx - 32, cy + 28],
        [cx + 15, cy - 6],
        [int(width * 0.72), int(height * 0.45)],
        list(beak_tip),
        [int(width * 0.65), int(height * 0.53)],
        [cx - 18, cy + 56],
    ], dtype=np.int32)
    cv2.fillPoly(canvas, [beak_poly], (55, 130, 45), lineType=cv2.LINE_AA)
    # Borde superior carmesí de la espata
    rim_pts = np.array([
        [cx - 24, cy + 16],
        [cx + 20, cy - 4],
        [int(width * 0.74), int(height * 0.45)],
        list(beak_tip),
    ], dtype=np.int32)
    cv2.polylines(canvas, [rim_pts], False, (55, 45, 235), thickness=7, lineType=cv2.LINE_AA)
    cv2.polylines(canvas, [beak_poly], True, (95, 185, 80), thickness=2, lineType=cv2.LINE_AA)

    return canvas


def load_flower_image(image_path: str | None = None, auto_crop: bool = True) -> np.ndarray:
    """Carga la imagen del Ave del Paraíso y recorta márgenes negros sobrantes."""
    candidates = []
    if image_path:
        candidates.append(Path(image_path))
    script_dir = Path(__file__).resolve().parent
    candidates.extend([
        script_dir / "public" / "ave-del-paraiso.jpg",
        script_dir / "ave-del-paraiso.jpg",
        Path("public/ave-del-paraiso.jpg"),
    ])

    img = None
    for candidate in candidates:
        if candidate.is_file():
            img = cv2.imread(str(candidate), cv2.IMREAD_COLOR)
            if img is not None:
                break

    if img is None:
        img = generate_procedural_strelitzia()

    if auto_crop:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        coords = cv2.findNonZero((gray > 14).astype(np.uint8))
        if coords is not None:
            x, y, w, h = cv2.boundingRect(coords)
            pad_x = int(w * 0.06)
            pad_y = int(h * 0.06)
            x0 = max(0, x - pad_x)
            y0 = max(0, y - pad_y)
            x1 = min(img.shape[1], x + w + pad_x)
            y1 = min(img.shape[0], y + h + pad_y)
            img = img[y0:y1, x0:x1]

    return img


def map_sobel_angle_to_char(angle_deg: float) -> str:
    """
    Convierte el ángulo del gradiente de Sobel [0, 180) en el carácter ASCII
    que sigue la dirección tangente del borde de la flor:
      - Gradiente horizontal (0° o 180°) -> borde vertical '|'
      - Gradiente diagonal (45°)         -> borde '/'
      - Gradiente vertical (90°)         -> borde horizontal '-'
      - Gradiente diagonal (135°)        -> borde '\\'
    """
    if angle_deg < 22.5 or angle_deg >= 157.5:
        return "|"
    if angle_deg < 67.5:
        return "/"
    if angle_deg < 112.5:
        return "-"
    return "\\"


def compute_sobel_ascii_frame(
    img_bgr: np.ndarray,
    width: int = 86,
    edge_threshold: float = 52.0,
    ksize: int = 3,
    saturation_boost: float = 1.35,
    contrast_boost: float = 1.15,
    mode: str = "combined",
    char_aspect: float = 0.5,
    bg_cutoff: int = 14,
) -> Tuple[List[str], List[str], dict]:
    """
    Ejecuta el pipeline completo con `cv2.Sobel` y devuelve:
      - ansi_lines: líneas coloreadas con secuencias ANSI TrueColor
      - plain_lines: líneas en texto plano ASCII
      - stats: métricas del pipeline (max_mag, edge_ratio, cols, rows)
    """
    h, w = img_bgr.shape[:2]
    rows = max(16, int((h / w) * width * char_aspect))
    resized = cv2.resize(img_bgr, (width, rows), interpolation=cv2.INTER_AREA)

    # Realce botánico de saturación y contraste en espacio HSV
    hsv = cv2.cvtColor(resized, cv2.COLOR_BGR2HSV).astype(np.float32)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1] * saturation_boost, 0, 255)
    hsv[:, :, 2] = np.clip(hsv[:, :, 2] * contrast_boost, 0, 255)
    enhanced_bgr = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
    rgb = cv2.cvtColor(enhanced_bgr, cv2.COLOR_BGR2RGB)
    # Para que los bordes de silueta cv2.Sobel tomen el color vivo del pétalo y no del fondo negro
    edge_rgb = cv2.dilate(rgb, np.ones((3, 3), dtype=np.uint8))

    # Conversión a escala de grises y suavizado ligero antes de cv2.Sobel
    gray = cv2.cvtColor(resized, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (3, 3), 0)

    # Derivadas horizontales (Gx) y verticales (Gy) mediante cv2.Sobel
    gx = cv2.Sobel(blurred, cv2.CV_64F, 1, 0, ksize=ksize)
    gy = cv2.Sobel(blurred, cv2.CV_64F, 0, 1, ksize=ksize)

    # Magnitud y orientación del vector gradiente
    mag_raw = np.hypot(gx, gy)
    max_mag = float(mag_raw.max()) if mag_raw.size else 1.0
    mag = (mag_raw / (max_mag + 1e-6)) * 255.0
    angles = (np.degrees(np.arctan2(gy, gx)) + 180.0) % 180.0

    ansi_lines: List[str] = []
    plain_lines: List[str] = []
    edge_count = 0
    active_count = 0
    ramp_len = len(DENSITY_RAMP)

    for y in range(rows):
        ansi_row: List[str] = []
        plain_row: List[str] = []
        for x in range(width):
            lum = int(gray[y, x])
            m = float(mag[y, x])

            if lum < bg_cutoff and m < edge_threshold:
                ansi_row.append(" ")
                plain_row.append(" ")
                continue

            active_count += 1
            r, g, b = int(rgb[y, x, 0]), int(rgb[y, x, 1]), int(rgb[y, x, 2])
            er, eg, eb = int(edge_rgb[y, x, 0]), int(edge_rgb[y, x, 1]), int(edge_rgb[y, x, 2])

            if mode == "edges":
                if m >= edge_threshold * 0.72:
                    ch = map_sobel_angle_to_char(float(angles[y, x]))
                    edge_count += 1
                    r, g, b = er, eg, eb
                else:
                    ch = " "
            elif mode == "magnitude":
                idx = min(ramp_len - 1, int((m / 255.0) * (ramp_len - 1)))
                ch = DENSITY_RAMP[idx]
                if m >= edge_threshold:
                    edge_count += 1
                # Mapa térmico naranja-dorado-azul según magnitud Sobel
                norm_m = m / 255.0
                r = int(min(255, 255 * norm_m * 1.25))
                g = int(min(255, 190 * (norm_m ** 1.3)))
                b = int(min(255, 95 + 160 * (1.0 - norm_m))) if norm_m > 0.08 else 0
            else:
                # Modo "combined" (TikTok signature): bordes direccionales cv2.Sobel + relleno luminoso
                if m >= edge_threshold:
                    ch = map_sobel_angle_to_char(float(angles[y, x]))
                    edge_count += 1
                    r = min(255, int(er * 1.12 + 14))
                    g = min(255, int(eg * 1.12 + 14))
                    b = min(255, int(eb * 1.12 + 14))
                else:
                    idx = min(ramp_len - 1, max(1, int((lum / 255.0) * (ramp_len - 1))))
                    ch = DENSITY_RAMP[idx]

            plain_row.append(ch)
            if ch == " ":
                ansi_row.append(" ")
            else:
                ansi_row.append(f"\033[38;2;{r};{g};{b}m{ch}\033[0m")

        ansi_lines.append("".join(ansi_row))
        plain_lines.append("".join(plain_row))

    stats = {
        "cols": width,
        "rows": rows,
        "max_mag": round(max_mag, 1),
        "edge_cells": edge_count,
        "active_cells": active_count,
        "edge_ratio": round((edge_count / max(1, active_count)) * 100.0, 1),
        "ksize": ksize,
        "threshold": edge_threshold,
    }
    return ansi_lines, plain_lines, stats


def format_live_code_panel(
    active_line_idx: int,
    stats: dict,
    char_progress: float = 1.0,
    max_visible_lines: int = 7,
) -> List[str]:
    """
    Construye el panel inferior de código Python en vivo (estilo TikTok)
    resaltando la línea activa del pipeline `cv2.Sobel`.
    """
    width = stats["cols"]
    divider = (
        f"\033[38;2;250;122;37m━━\033[0m "
        f"\033[1;38;2;248;250;252m🐍 LIVE CODE: ave_del_paraiso_sobel.py\033[0m "
        f"\033[38;2;148;163;184m│ cv2.Sobel(ksize={stats['ksize']}) "
        f"│ thresh={int(stats['threshold'])} │ bordes={stats['edge_ratio']}%\033[0m "
        f"\033[38;2;59;130;246m" + "━" * max(4, width - 78) + "\033[0m"
    )

    total = len(LIVE_CODE_LINES)
    active_line_idx = max(0, min(total - 1, active_line_idx))

    # Ventana deslizante centrada en la línea activa
    half = max_visible_lines // 2
    start = max(0, min(active_line_idx - half, total - max_visible_lines))
    end = min(total, start + max_visible_lines)

    out = [divider]
    for idx in range(start, end):
        code_text, _stage = LIVE_CODE_LINES[idx]
        # Sustituir parámetros dinámicos en vivo
        code_text = code_text.replace("ksize=3", f"ksize={stats['ksize']}")
        code_text = code_text.replace("EDGE_THRESH", f"{int(stats['threshold'])}")

        line_no = f"{idx + 1:02d}"
        if idx == active_line_idx:
            typed_len = max(1, int(len(code_text) * min(1.0, max(0.15, char_progress))))
            visible_code = code_text[:typed_len]
            cursor = "█" if char_progress < 0.99 else ""
            out.append(
                f" \033[48;2;30;41;59m\033[38;2;250;122;37m▶ {line_no} │\033[0m"
                f"\033[48;2;20;28;44m \033[1;38;2;250;204;46m{visible_code}\033[38;2;59;130;246m{cursor}\033[0m"
            )
        elif idx < active_line_idx:
            out.append(
                f" \033[38;2;100;116;139m  {line_no} │\033[0m "
                f"\033[38;2;148;226;213m{code_text}\033[0m"
            )
        else:
            out.append(
                f" \033[38;2;71;85;105m  {line_no} │ {code_text}\033[0m"
            )
    return out


def apply_breeze_distortion(img_bgr: np.ndarray, phase: float) -> np.ndarray:
    """Aplica una suave brisa orgánica sinusoidal a los pétalos del Ave del Paraíso."""
    h, w = img_bgr.shape[:2]
    y_coords, x_coords = np.indices((h, w), dtype=np.float32)
    # Mayor movimiento en la parte superior de los pétalos y menor en la base del tallo
    vertical_factor = np.clip(1.0 - (y_coords / float(h)), 0.0, 1.0) ** 1.4
    dx = np.sin(y_coords / 28.0 + phase) * 4.5 * vertical_factor
    dy = np.cos(x_coords / 36.0 + phase * 0.8) * 1.8 * vertical_factor
    map_x = np.clip(x_coords + dx, 0, w - 1)
    map_y = np.clip(y_coords + dy, 0, h - 1)
    return cv2.remap(img_bgr, map_x, map_y, interpolation=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)


def run_tiktok_animation(
    img_bgr: np.ndarray,
    width: int,
    edge_threshold: float,
    ksize: int,
    saturation: float,
    mode: str,
    show_code: bool,
    fps: int,
    duration: float,
) -> None:
    """
    Reproduce en la terminal la animación estilo TikTok:
      Fase 1 (Reveal): Escaneo progresivo de bordes cv2.Sobel -> flor ASCII en color
                       mientras el código inferior escribe y ejecuta cada línea.
      Fase 2 (Brisa):  La flor Ave del Paraíso oscila suavemente con cv2.Sobel en tiempo real.
    """
    ansi_lines, _plain, stats = compute_sobel_ascii_frame(
        img_bgr,
        width=width,
        edge_threshold=edge_threshold,
        ksize=ksize,
        saturation_boost=saturation,
        mode=mode,
    )
    edges_only_ansi, _, _ = compute_sobel_ascii_frame(
        img_bgr,
        width=width,
        edge_threshold=edge_threshold * 0.85,
        ksize=ksize,
        saturation_boost=saturation,
        mode="edges",
    )

    total_rows = len(ansi_lines)
    total_frames = max(20, int(fps * duration))
    reveal_frames = max(12, int(total_frames * 0.58))
    frame_delay = 1.0 / max(1, fps)

    # Ocultar cursor y limpiar pantalla
    sys.stdout.write("\033[?25l\033[2J\033[H")
    sys.stdout.flush()

    try:
        for frame_idx in range(total_frames):
            t0 = time.perf_counter()
            if frame_idx < reveal_frames:
                progress = (frame_idx + 1) / float(reveal_frames)
                color_row_limit = int(progress * total_rows)
                edge_row_limit = min(total_rows, color_row_limit + max(4, total_rows // 7))

                frame_buffer: List[str] = []
                for r_idx in range(total_rows):
                    if r_idx < color_row_limit:
                        frame_buffer.append(ansi_lines[r_idx])
                    elif r_idx < edge_row_limit:
                        # Banda de escaneo con bordes puros cv2.Sobel (/ | \ -)
                        frame_buffer.append(edges_only_ansi[r_idx])
                    else:
                        frame_buffer.append("")

                code_float = progress * (len(LIVE_CODE_LINES) - 1)
                active_code_idx = int(code_float)
                char_prog = min(1.0, (code_float - active_code_idx) * 1.4 + 0.25)
            else:
                # Fase 2: Brisa orgánica en tiempo real recalculando cv2.Sobel
                breeze_phase = (frame_idx - reveal_frames) * 0.28
                swayed = apply_breeze_distortion(img_bgr, breeze_phase)
                frame_buffer, _, stats = compute_sobel_ascii_frame(
                    swayed,
                    width=width,
                    edge_threshold=edge_threshold,
                    ksize=ksize,
                    saturation_boost=saturation,
                    mode=mode,
                )
                active_code_idx = len(LIVE_CODE_LINES) - 1
                char_prog = 1.0

            if show_code:
                code_panel = format_live_code_panel(active_code_idx, stats, char_prog, max_visible_lines=7)
                full_output = "\n".join(frame_buffer + [""] + code_panel)
            else:
                full_output = "\n".join(frame_buffer)

            sys.stdout.write("\033[H" + full_output + "\033[J\n")
            sys.stdout.flush()

            elapsed = time.perf_counter() - t0
            if elapsed < frame_delay:
                time.sleep(frame_delay - elapsed)
    except KeyboardInterrupt:
        pass
    finally:
        sys.stdout.write("\033[?25h\033[0m\n")
        sys.stdout.flush()


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Arte ASCII de la flor Ave del Paraíso con cv2.Sobel y código en vivo abajo (TikTok)"
    )
    parser.add_argument("--image", "-i", type=str, default=None, help="Ruta a una imagen personalizada")
    parser.add_argument("--width", "-w", type=int, default=0, help="Ancho en columnas ASCII (0 = auto según terminal)")
    parser.add_argument("--threshold", "-t", type=float, default=52.0, help="Umbral de borde cv2.Sobel (10-180)")
    parser.add_argument("--ksize", "-k", type=int, choices=[3, 5], default=3, help="Tamaño del kernel cv2.Sobel (3 o 5)")
    parser.add_argument("--saturation", "-s", type=float, default=1.35, help="Multiplicador de saturación HSV")
    parser.add_argument(
        "--mode",
        "-m",
        choices=["combined", "edges", "magnitude"],
        default="combined",
        help="Modo visual: combined (Sobel + densidad), edges (solo / | \\ -), magnitude (mapa gradiente)",
    )
    parser.add_argument("--static", action="store_true", help="Imprime un único frame estático y termina")
    parser.add_argument("--no-code", action="store_true", help="Oculta el panel inferior de código en vivo")
    parser.add_argument("--fps", type=int, default=15, help="Cuadros por segundo en modo animado")
    parser.add_argument("--duration", type=float, default=7.0, help="Duración de la animación en segundos")
    parser.add_argument("--save-txt", type=str, default=None, help="Guardar arte ASCII plano en un archivo .txt")
    parser.add_argument("--save-ans", type=str, default=None, help="Guardar arte ASCII con color ANSI en un archivo .ans")

    args = parser.parse_args()

    term_cols, term_rows = shutil.get_terminal_size((96, 46))
    if args.width > 0:
        width = args.width
    else:
        # Ajustar automáticamente para que la flor y el panel de código inferior quepan en la terminal
        avail_rows = max(20, term_rows - (10 if not args.no_code else 2))
        width = max(48, min(96, term_cols - 2, int(avail_rows * 1.65)))

    img_bgr = load_flower_image(args.image, auto_crop=True)

    if args.save_txt or args.save_ans or args.static or not sys.stdout.isatty():
        ansi_lines, plain_lines, stats = compute_sobel_ascii_frame(
            img_bgr,
            width=width,
            edge_threshold=args.threshold,
            ksize=args.ksize,
            saturation_boost=args.saturation,
            mode=args.mode,
        )
        if args.save_txt:
            Path(args.save_txt).write_text("\n".join(plain_lines) + "\n", encoding="utf-8")
        if args.save_ans:
            Path(args.save_ans).write_text("\n".join(ansi_lines) + "\n", encoding="utf-8")

        sys.stdout.write("\n".join(ansi_lines) + "\n")
        if not args.no_code:
            code_panel = format_live_code_panel(
                len(LIVE_CODE_LINES) - 1,
                stats,
                char_progress=1.0,
                max_visible_lines=len(LIVE_CODE_LINES),
            )
            sys.stdout.write("\n" + "\n".join(code_panel) + "\n")
        return

    run_tiktok_animation(
        img_bgr=img_bgr,
        width=width,
        edge_threshold=args.threshold,
        ksize=args.ksize,
        saturation=args.saturation,
        mode=args.mode,
        show_code=not args.no_code,
        fps=args.fps,
        duration=args.duration,
    )


if __name__ == "__main__":
    main()
