import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
if (args.length && !(args.length === 1 && args[0] === '--dry-run')) throw new Error('Usage: pnpm cloudflare:deploy [--dry-run]');
const dryRun = args[0] === '--dry-run';
const config = dryRun ? 'wrangler.cloudflare.json' : 'wrangler.cloudflare.local.json';
if (!dryRun) {
  let settings;
  try { settings = JSON.parse(await readFile(new URL('../' + config, import.meta.url), 'utf8')); }
  catch { throw new Error('Configure your own D1 database first; see docs/cloudflare-deployment.md. Nothing was deployed.'); }
  if (!settings.d1_databases?.[0]?.database_id || settings.d1_databases[0].database_id.startsWith('00000000-')) {
    throw new Error('A real D1 database ID is required. Nothing was deployed.');
  }
}
function run(command) {
  const result = spawnSync(process.execPath, command, {
    cwd: root, stdio: 'inherit', env: {...process.env, WRANGLER_SEND_METRICS: 'false', CLOUDFLARE_CF_FETCH_ENABLED: 'false'},
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.cloudflare.config.ts']);
if (!dryRun) run(['node_modules/wrangler/bin/wrangler.js', 'd1', 'migrations', 'apply', 'DB', '--remote', '--config', config]);
run(['node_modules/wrangler/bin/wrangler.js', 'deploy', '--config', config, ...(dryRun ? ['--dry-run'] : [])]);
