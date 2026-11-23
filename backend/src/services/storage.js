import { randomUUID } from 'node:crypto';

import { env } from '../config/env.js';
import { BadGatewayError } from '../utils/errors.js';

const MEMORY_ORIGIN = 'https://memory.local';
const PUBLIC_PATH = '/storage/v1/object/public';

function normalizeObjectPath(value) {
  if (typeof value !== 'string') {
    throw new Error('Path object wajib berupa string');
  }

  const path = value.replace(/^\/+/, '');

  if (!path || path.split('/').some((segment) => segment === '..')) {
    throw new Error('Path object tidak valid');
  }

  return path;
}

function encodeObjectPath(path) {
  return normalizeObjectPath(path)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function createPublicUrl(origin, bucket, path) {
  return `${trimTrailingSlash(origin)}${PUBLIC_PATH}/${encodeURIComponent(bucket)}/${encodeObjectPath(path)}`;
}

function extractObjectPath(url, { origin, bucket }) {
  try {
    const target = new URL(url);
    const expectedOrigin = new URL(origin);

    if (target.origin !== expectedOrigin.origin) {
      return null;
    }

    const prefix = `${PUBLIC_PATH}/${encodeURIComponent(bucket)}/`;

    if (!target.pathname.startsWith(prefix)) {
      return null;
    }

    return decodeURIComponent(target.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

function createMemoryStorage({ bucket }) {
  const objects = new Map();

  return {
    driver: 'memory',
    getPublicUrl(path) {
      return createPublicUrl(MEMORY_ORIGIN, bucket, path);
    },
    async uploadObject({ path, buffer, contentType }) {
      const normalizedPath = normalizeObjectPath(path);
      const body = Buffer.from(buffer);

      objects.set(normalizedPath, { body, contentType });

      return {
        path: normalizedPath,
        url: createPublicUrl(MEMORY_ORIGIN, bucket, normalizedPath),
        contentType,
        size: body.length,
      };
    },
    async deleteObjectByUrl(url) {
      const path = extractObjectPath(url, {
        origin: MEMORY_ORIGIN,
        bucket,
      });

      if (!path) {
        return false;
      }

      return objects.delete(path);
    },
  };
}

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return '';
  }
}

function buildStorageHeaders(secretKey) {
  const headers = { apikey: secretKey };

  if (secretKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${secretKey}`;
  }

  return headers;
}

function createSupabaseStorage({
  supabaseUrl,
  secretKey,
  bucket,
  fetchImpl,
}) {
  const origin = trimTrailingSlash(supabaseUrl);
  const objectBaseUrl = `${origin}/storage/v1/object/${encodeURIComponent(bucket)}`;
  const headers = buildStorageHeaders(secretKey);

  return {
    driver: 'supabase',
    getPublicUrl(path) {
      return createPublicUrl(origin, bucket, path);
    },
    async uploadObject({ path, buffer, contentType }) {
      const normalizedPath = normalizeObjectPath(path);
      const body = Buffer.from(buffer);
      let response;

      try {
        response = await fetchImpl(
          `${objectBaseUrl}/${encodeObjectPath(normalizedPath)}`,
          {
            method: 'POST',
            headers: {
              ...headers,
              'Content-Type': contentType,
            },
            body,
          },
        );
      } catch {
        throw new BadGatewayError('Gagal mengunggah foto, coba lagi');
      }

      if (!response.ok) {
        await readResponseText(response);
        throw new BadGatewayError('Gagal mengunggah foto, coba lagi');
      }

      return {
        path: normalizedPath,
        url: createPublicUrl(origin, bucket, normalizedPath),
        contentType,
        size: body.length,
      };
    },
    async deleteObjectByUrl(url) {
      const path = extractObjectPath(url, { origin, bucket });

      if (!path) {
        return false;
      }

      let response;

      try {
        response = await fetchImpl(
          `${objectBaseUrl}/${encodeObjectPath(path)}`,
          {
            method: 'DELETE',
            headers,
          },
        );
      } catch {
        throw new BadGatewayError('Gagal menghapus foto lama');
      }

      if (response.status === 404) {
        return false;
      }

      if (!response.ok) {
        await readResponseText(response);
        throw new BadGatewayError('Gagal menghapus foto lama');
      }

      return true;
    },
  };
}

export function createStorage({
  driver = env.storageDriver,
  bucket = env.supabaseMediaBucket,
  supabaseUrl = env.supabaseUrl,
  secretKey = env.supabaseSecretKey,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (driver === 'memory') {
    return createMemoryStorage({ bucket });
  }

  if (driver === 'supabase') {
    if (!supabaseUrl || !secretKey) {
      throw new Error(
        'SUPABASE_URL dan SUPABASE_SECRET_KEY (atau SUPABASE_SERVICE_ROLE_KEY) wajib diisi',
      );
    }

    return createSupabaseStorage({
      supabaseUrl,
      secretKey,
      bucket,
      fetchImpl,
    });
  }

  throw new Error('STORAGE_DRIVER harus bernilai memory atau supabase');
}

export function createObjectPath({ folder, ownerId, extension }) {
  const safeFolder = String(folder).toLowerCase().replace(/[^a-z0-9-]/g, '');
  const safeOwnerId = String(ownerId).replace(/[^a-zA-Z0-9-]/g, '');
  const safeExtension = String(extension).toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!safeFolder || !safeOwnerId || !safeExtension) {
    throw new Error('Komponen path object tidak valid');
  }

  return `${safeFolder}/${safeOwnerId}/${randomUUID()}.${safeExtension}`;
}

export const storage = createStorage();
