import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const checks = [
  ['Documentation links', ['../scripts/check-docs.mjs']],
  ['ESLint', ['node_modules/eslint/bin/eslint.js', '.', '--max-warnings', '0']],
  ['TypeScript', ['node_modules/typescript/bin/tsc', '--noEmit']],
  ['Regression tests', ['--experimental-transform-types', '--test', 'tests/*.test.mjs']],
  ['Service worker syntax', ['--check', 'public/sw.js']],
  ['Production build', ['scripts/run-framework.mjs', 'build']],
  ['GitHub Pages production build', ['scripts/build-pages.mjs']],
  ['Fresh-database API integration', ['tests/integration.mjs']],
];
for (const [label, args] of checks) {
  console.log('\nChecking: ' + label);
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log('\nAll repository verification checks passed. Device/browser acceptance remains separate.');
