import { DomainError } from './domain';

export async function readBoundedBody(request: Request, maxBytes: number): Promise<Uint8Array<ArrayBuffer>> {
  const tooLarge = () => new DomainError('Request is too large', 413);
  const declared = Number(request.headers.get('content-length'));
  if (declared > maxBytes) throw tooLarge();
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  let bytes = new Uint8Array(Number.isSafeInteger(declared) && declared > 0 ? declared : 0);
  let used = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const size = used + value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw tooLarge();
      }
      if (size > bytes.length) {
        const capacity = Math.min(maxBytes, Math.max(size, bytes.length * 2, 4096));
        const larger = new Uint8Array(capacity);
        larger.set(bytes.subarray(0, used));
        bytes = larger;
      }
      bytes.set(value, used);
      used = size;
    }
  } finally {
    reader.releaseLock();
  }
  return bytes.subarray(0, used);
}
