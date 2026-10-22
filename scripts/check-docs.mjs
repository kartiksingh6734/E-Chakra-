import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
async function markdownFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const result = [];
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) result.push(...await markdownFiles(path));
    else if (entry.name.endsWith('.md')) result.push(path);
  }
  return result;
}
const rootFiles = (await readdir(root)).filter(name => name.endsWith('.md')).map(name => resolve(root, name));
const files = [...rootFiles, ...await markdownFiles(resolve(root, 'docs')), resolve(root, 'prototype/README.md')];
const errors = [];
let checked = 0;
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const match of content.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) {
    const target = match[1].replace(/^<|>$/g, '');
    if (/^(https?:|mailto:|data:|#)/.test(target)) continue;
    const path = decodeURIComponent(target.split('#')[0].split('?')[0]);
    if (!path) continue;
    const resolved = path.startsWith('/') ? resolve(root, '.' + path) : resolve(dirname(file), path);
    if (relative(root, resolved).startsWith('..')) {
      errors.push(relative(root, file) + ': link escapes repository: ' + target);
      continue;
    }
    try { await stat(resolved); checked++; }
    catch { errors.push(relative(root, file) + ': missing ' + target); }
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`PASS: ${checked} local link targets across ${files.length} Markdown files. External access and heading fragments require separate review.`);
