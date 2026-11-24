import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `npm run dev` proxies /api to the AI server (`npm run dev:api`, port 8787).
// `npm run build:single` produces one self-contained HTML file (no AI server: voice falls back to the device).
export default defineConfig(({ mode }) => ({
  base: mode === 'single' ? './' : '/',
  plugins: [react(), ...(mode === 'single' ? [viteSingleFile()] : [])],
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist' },
  server: { proxy: { '/api': 'http://localhost:8787' } },
}));
