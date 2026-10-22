import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && !(args.length === 2 && args[0] === '--persist-to')) {
  throw new Error('Usage: node scripts/migrate-local.mjs [--persist-to LOCAL_DIRECTORY]');
}
const persistTo = resolve(root, args[1] || '.wrangler/state');
let built;
try {
  built = JSON.parse(await readFile(resolve(root, 'dist/server/wrangler.json'), 'utf8'));
} catch {
  throw new Error('Build first: pnpm run build');
}
const binding = built.d1_databases?.find(item => item.binding === 'DB');
if (!binding) throw new Error('The built configuration has no DB binding.');
const configPath = resolve(root, '.wrangler/local-migrations.json');
await mkdir(dirname(configPath), { recursive: true });
await writeFile(configPath, JSON.stringify({
  name: 'e-chakra-local-migrations',
  compatibility_date: built.compatibility_date,
  d1_databases: [{ ...binding, migrations_dir: resolve(root, 'drizzle') }],
}, null, 2));
// Always local. The migration ledger makes repeated setup safe.
const result = spawnSync(process.execPath, [
  '--import', './scripts/sites-env.mjs', './node_modules/wrangler/bin/wrangler.js',
  'd1', 'migrations', 'apply', 'DB', '--local', '--config', configPath,
  '--persist-to', persistTo,
], { cwd: root, stdio: 'inherit', env: { ...process.env, CI: 'true' } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
