import assert from 'node:assert/strict';
import test from 'node:test';
import { driverMessageSchema, invocationSchema } from '../scripts/connector-preview/protocol.mjs';

test('connector preview preserves named arguments and structured result fields', () => {
  const invocation = {
    connectorId: 'sample',
    actionName: 'search',
    arguments: { query: 'local preview', options: { limit: 2 } },
  };
  const reply = {
    jsonrpc: '2.0',
    id: '0d2d2918-73cd-4e38-b69b-a6d639a21db8',
    result: { content: [{ type: 'text', text: 'sample result' }] },
  };
  assert.deepEqual(invocationSchema.parse(invocation), invocation);
  assert.deepEqual(driverMessageSchema.parse(reply), reply);
  assert.equal(invocationSchema.safeParse({ ...invocation, arguments: [] }).success, false);
});
