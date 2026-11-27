import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function syncPythonScriptPlugin() {
  const srcPy = resolve(process.cwd(), 'ave_del_paraiso_sobel.py');
  const destPy = resolve(process.cwd(), 'public/ave_del_paraiso_sobel.py');

  const syncCopy = () => {
    if (existsSync(srcPy)) {
      copyFileSync(srcPy, destPy);
    }
  };

  return {
    name: 'sync-ave-del-paraiso-python',
    buildStart() {
      syncCopy();
    },
    configureServer(server) {
      syncCopy();
      server.watcher.add(srcPy);
    },
    handleHotUpdate({ file }) {
      if (file === srcPy) {
        syncCopy();
      }
    }
  };
}

export default defineConfig({
  base: './',
  plugins: [syncPythonScriptPlugin()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
});
