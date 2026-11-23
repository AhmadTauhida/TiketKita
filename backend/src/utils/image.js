const IMAGE_SIGNATURES = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    matches: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    matches: (buffer) =>
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a,
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    matches: (buffer) =>
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP',
  },
];

export const ALLOWED_IMAGE_MIME_TYPES = new Set(
  IMAGE_SIGNATURES.map((signature) => signature.mime),
);

export function normalizeImageMimeType(mimeType) {
  if (typeof mimeType !== 'string') {
    return '';
  }

  const normalized = mimeType.split(';')[0].trim().toLowerCase();

  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }

  const signature = IMAGE_SIGNATURES.find((candidate) =>
    candidate.matches(buffer),
  );

  if (!signature) {
    return null;
  }

  return {
    mime: signature.mime,
    extension: signature.extension,
  };
}
