import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const checks = [
  ['Documentation links', ['../scripts/check-docs.mjs']],
  ['TypeScript', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['Workflow tests', ['--experimental-transform-types', '--test', 'tests/domain.test.mjs']],
  ['Service worker syntax', ['--check', 'public/sw.js']],
  ['Production build', ['scripts/run-framework.mjs', 'build']],
  ['Fresh-database API integration', ['tests/integration.mjs']],
  ['Standalone Cloudflare client build', ['node_modules/vite/bin/vite.js', 'build', '--config', 'vite.cloudflare.config.ts']],
  ['Standalone Cloudflare integration', ['tests/cloudflare.integration.mjs']],
];
for (const [label, args] of checks) {
  console.log('\nChecking: ' + label);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nAll repository verification checks passed. Device/browser acceptance remains separate.');
