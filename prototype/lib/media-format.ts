import { DomainError } from './domain';

export const maxMediaBytes = 2_000_000;
const signatures: Record<string, (bytes: Uint8Array) => boolean> = {
  'image/jpeg': bytes => startsWith(bytes, [0xff, 0xd8, 0xff]),
  'image/png': bytes => startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  'image/webp': bytes => tag(bytes, 0) === 'RIFF' && tag(bytes, 8) === 'WEBP',
  'audio/webm': bytes => startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3]),
  'audio/mp4': bytes => tag(bytes, 4) === 'ftyp',
  'audio/ogg': bytes => tag(bytes, 0) === 'OggS',
};

function startsWith(bytes: Uint8Array, prefix: number[]) {
  return prefix.every((byte, index) => bytes[index] === byte);
}

function tag(bytes: Uint8Array, offset: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + 4));
}

export function mediaType(type: string): string {
  const mime = type.split(';')[0].trim().toLowerCase();
  if (!Object.hasOwn(signatures, mime)) throw new DomainError('Unsupported file type');
  return mime;
}

export function checkSignature(mime: string, bytes: Uint8Array) {
  if (!signatures[mime](bytes)) throw new DomainError('File contents do not match the attachment type');
}
