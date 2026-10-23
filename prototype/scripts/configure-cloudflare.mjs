import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const [databaseId, accountId] = process.argv.slice(2);
if (!/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(databaseId || '') || databaseId.startsWith('00000000-')) {
  throw new Error('Usage: pnpm cloudflare:configure REAL_D1_DATABASE_UUID [CLOUDFLARE_ACCOUNT_ID]');
}
if (accountId && !/^[a-f0-9]{32}$/i.test(accountId)) throw new Error('Invalid Cloudflare account ID.');
const config = JSON.parse(await readFile(new URL('wrangler.cloudflare.json', root), 'utf8'));
config.d1_databases[0].database_id = databaseId;
if (accountId) config.account_id = accountId;
const target = new URL('wrangler.cloudflare.local.json', root);
await writeFile(target, JSON.stringify(config, null, 2) + '\n');
console.log('Saved deployment configuration: ' + fileURLToPath(target));
console.log('No resources have been created or deployed. No credentials are stored in this file.');
