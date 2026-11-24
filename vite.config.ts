import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

/**
 * Generates /sw.js for the web build: precaches the app shell (index.html, the hashed JS/CSS,
 * fonts, icons) under a cache named after a hash of the build, so every deploy produces a new
 * service worker and the app can offer "Nueva versión disponible".
 */
function serviceWorker(): Plugin {
  return {
    name: 'sideye-sw',
    apply: 'build',
    generateBundle(_opts, bundle) {
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map') && !f.endsWith('.woff') && f !== 'sw.js');
      const statics = ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
      const precache = ['/', ...files.filter((f) => f !== 'index.html').map((f) => '/' + f), ...statics];
      const hash = createHash('sha256');
      for (const f of files.sort()) {
        const item = bundle[f];
        hash.update(f);
        hash.update(item.type === 'chunk' ? item.code : typeof item.source === 'string' ? item.source : Buffer.from(item.source));
      }
      const version = `${pkg.version}-${hash.digest('hex').slice(0, 10)}`;
      const template = readFileSync(new URL('./src/pwa/sw.template.js', import.meta.url), 'utf8');
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: template.replace('__VERSION__', version).replace('__PRECACHE__', JSON.stringify(precache, null, 2)),
      });
    },
  };
}

// `npm run dev` proxies /api to the AI server (`npm run dev:api`, port 8787).
// `npm run build`: web app + PWA (service worker), served by server/index.mjs.
// `npm run build:ios`: bundle for the Capacitor iOS app (no service worker, API on VITE_API_BASE).
// `npm run build:single` produces one self-contained HTML file (no AI server: voice falls back to the device).
export default defineConfig(({ mode }) => ({
  base: mode === 'single' ? './' : '/',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : []), ...(mode === 'production' ? [serviceWorker()] : [])],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    rollupOptions:
      mode === 'single'
        ? undefined
        : {
            output: {
              // Stable vendor chunk: content updates do not invalidate React/framer-motion in the cache.
              manualChunks: { vendor: ['react', 'react-dom', 'framer-motion', 'zustand'] },
            },
          },
  },
  server: { proxy: { '/api': 'http://localhost:8787' } },
}));
