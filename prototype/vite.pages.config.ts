import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const project = fileURLToPath(new URL('./', import.meta.url));
const publicDir = path.join(project, '.sites-runtime/pages-public');

export default defineConfig(async () => {
  // Both the dev server and the static release serve the same project-relative assets.
  await mkdir(publicDir, { recursive: true });
  const manifest = JSON.parse(await readFile(path.join(project, 'public/manifest.webmanifest'), 'utf8'));
  manifest.id = manifest.start_url = manifest.scope = './';
  for (const icon of manifest.icons) icon.src = icon.src.replace(/^\//, '');
  await writeFile(path.join(publicDir, 'manifest.webmanifest'), JSON.stringify(manifest));
  for (const file of ['favicon.svg', 'icon-192.png', 'icon-512.png']) {
    await copyFile(path.join(project, 'public', file), path.join(publicDir, file));
  }
  const evidence = path.join(project, '../docs/evidence/desktop-chromium');
  await copyFile(path.join(evidence, 'demo.webm'), path.join(publicDir, 'walkthrough.webm'));
  await copyFile(path.join(evidence, 'records.png'), path.join(publicDir, 'walkthrough.png'));
  await writeFile(path.join(publicDir, '.nojekyll'), '');
  await writeFile(path.join(publicDir, 'firebase-config.json'), '{}\n');

  return {
    root: path.join(project, 'github-pages'),
    envDir: project,
    base: '/E-Chakra-/',
    publicDir,
    plugins: [react()],
    resolve: { alias: { '@': project } },
    define: { 'import.meta.env.VITE_GITHUB_PAGES': JSON.stringify('true') },
    build: { outDir: path.join(project, 'dist-pages'), emptyOutDir: true },
  };
});
