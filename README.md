# Remote VM Lab 📱☁️

Proyecto experimental de aplicación web / dashboard interactivo en VM remota, optimizado para desarrollarse y probarse **on-the-go desde el celular** mediante **GitHub Codespaces**.

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/Andres-DLT/remote-vm-lab)

---

## 📱 Cómo trabajar desde tu celular (On-The-Go)

### Opción 1: Un toque con GitHub Codespaces (100% en la nube)
No necesitas tener tu Mac encendida:
1. Abre [https://codespaces.new/Andres-DLT/remote-vm-lab](https://codespaces.new/Andres-DLT/remote-vm-lab) desde el navegador de tu celular (Safari / Chrome) o desde la app **GitHub Mobile**.
2. El contenedor (`.devcontainer/devcontainer.json`) instalará las dependencias y levantará automáticamente el servidor en el puerto **`5173`**.
3. En la pestaña **Ports** (o en la notificación emergente), toca la dirección del puerto `5173` para ver el dashboard interactivo en vivo mientras editas.
4. El editor tiene activado **Auto-Save** (`1s`), **Word Wrap** y sin minimapa para adaptarse a la pantalla vertical del teléfono.

### Opción 2: Con Agentes de IA desde el celular
- **GitHub Mobile / Copilot**: Abre el repositorio en la app de GitHub Mobile para pedirle cambios o abrir PRs con Copilot.
- **Claude App (iOS / Android)**: Conecta tu cuenta de GitHub y selecciona `Andres-DLT/remote-vm-lab` en Claude Code Web para enviarle instrucciones en lenguaje natural mientras vas en camino.

---

## 💻 Desarrollo local (Mac)

```bash
npm install
npm run dev
```

Abre `http://localhost:5173` (o la IP local en la misma red Wi-Fi desde tu celular).

---

## 🗂️ Estructura del proyecto

- [`.devcontainer/devcontainer.json`](.devcontainer/devcontainer.json) — Configuración lista para GitHub Codespaces (Node 22, GitHub CLI, auto-forward del puerto `5173` y ajustes móviles de VS Code).
- [`index.html`](index.html) — Entrada principal con viewport móvil configurado.
- [`src/main.js`](src/main.js) — Dashboard interactivo *mobile-first* con telemetría simulada, botones táctiles de acciones rápidas, consola con *pills* de comandos para no teclear de más en móvil y bloc de notas persistente.
- [`src/style.css`](src/style.css) — Diseño oscuro responsivo con barra de navegación inferior estilo app móvil.
