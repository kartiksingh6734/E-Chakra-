import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const root = fileURLToPath(new URL('../', import.meta.url));
await build({ configFile: join(root, 'vite.pages.config.ts') });

const output = join(root, 'dist-pages');
const assets = (await readdir(join(output, 'assets'))).map(name => 'assets/' + name);
const files = ['index.html', 'manifest.webmanifest', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'walkthrough.png', ...assets].sort();
const hash = createHash('sha256');
for (const file of files) hash.update(file).update('\0').update(await readFile(join(output, file)));
const worker = await readFile(join(root, 'github-pages/service-worker.js'), 'utf8');
const version = hash.update(worker).digest('hex').slice(0, 24);
const header = 'const release = ' + JSON.stringify(version) + ';\nconst files = ' + JSON.stringify(files) + ';\n';
await writeFile(join(output, 'sw.js'), header + worker);
