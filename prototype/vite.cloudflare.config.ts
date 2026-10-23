import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { copyFile } from 'node:fs/promises';

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  root: here('./cloudflare/client'),
  publicDir: here('./public'),
  resolve: {alias: {'@': here('./')}},
  css: {postcss: here('./')},
  plugins: [react(), {
    name: 'cloudflare-static-headers',
    async closeBundle() { await copyFile(here('./cloudflare/client/_headers'), here('./dist-cloudflare/_headers')); },
  }],
  build: {outDir: here('./dist-cloudflare'), emptyOutDir: true},
});
