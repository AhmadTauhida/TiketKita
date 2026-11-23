import express from 'express';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import { env } from '../src/config/env.js';
import { errorHandler } from '../src/middlewares/error.js';
import {
  AVATAR_MAX_BYTES,
  uploadAvatar,
  validateAvatar,
} from '../src/middlewares/upload.js';
import { createObjectPath, createStorage } from '../src/services/storage.js';
import { BadGatewayError } from '../src/utils/errors.js';
import {
  detectImageType,
  normalizeImageMimeType,
} from '../src/utils/image.js';

const jpegBuffer = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from('fake-jpeg-payload'),
]);

const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('fake-png-payload'),
]);

const webpBuffer = Buffer.concat([
  Buffer.from('RIFF'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP'),
  Buffer.from('fake-webp-payload'),
]);

function createUploadApp() {
  const app = express();

  app.post('/upload', uploadAvatar, validateAvatar, (req, res) => {
    res.json({
      ok: true,
      mime: req.file.detectedMimeType,
      extension: req.file.detectedExtension,
      size: req.file.size,
    });
  });

  app.use(errorHandler);

  return app;
}

describe('konfigurasi storage', () => {
  it('memaksa driver memory saat NODE_ENV=test', () => {
    expect(env.nodeEnv).toBe('test');
    expect(env.storageDriver).toBe('memory');
  });
});

describe('deteksi tipe gambar', () => {
  it('mendeteksi JPEG, PNG, dan WebP dari magic bytes', () => {
    expect(detectImageType(jpegBuffer)).toEqual({
      mime: 'image/jpeg',
      extension: 'jpg',
    });
    expect(detectImageType(pngBuffer)).toEqual({
      mime: 'image/png',
      extension: 'png',
    });
    expect(detectImageType(webpBuffer)).toEqual({
      mime: 'image/webp',
      extension: 'webp',
    });
  });

  it('menolak buffer yang bukan gambar yang didukung', () => {
    expect(detectImageType(Buffer.from('bukan gambar'))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });

  it('menormalisasi alias image/jpg menjadi image/jpeg', () => {
    expect(normalizeImageMimeType('image/jpg')).toBe('image/jpeg');
    expect(normalizeImageMimeType('IMAGE/PNG; charset=binary')).toBe(
      'image/png',
    );
  });
});

describe('adapter storage memory', () => {
  it('mengunggah, menghasilkan URL publik, dan menghapus object', async () => {
    const storage = createStorage({ driver: 'memory', bucket: 'media' });
    const result = await storage.uploadObject({
      path: 'avatars/user-1/photo.jpg',
      buffer: jpegBuffer,
      contentType: 'image/jpeg',
    });

    expect(result.url).toBe(
      'https://memory.local/storage/v1/object/public/media/avatars/user-1/photo.jpg',
    );
    expect(result.size).toBe(jpegBuffer.length);
    expect(await storage.deleteObjectByUrl(result.url)).toBe(true);
    expect(await storage.deleteObjectByUrl(result.url)).toBe(false);
    expect(await storage.deleteObjectByUrl('https://example.com/file.jpg')).toBe(
      false,
    );
  });

  it('membuat path object dengan nama acak dan komponen aman', () => {
    const path = createObjectPath({
      folder: 'avatars',
      ownerId: '11111111-1111-4111-8111-111111111111',
      extension: 'jpg',
    });

    expect(path).toMatch(
      /^avatars\/11111111-1111-4111-8111-111111111111\/[0-9a-f-]{36}\.jpg$/,
    );
  });
});

describe('adapter storage Supabase', () => {
  const legacyKey = 'eyJhbGciOiJIUzI1NiJ9.legacy.signature';
  const secretKey = 'sb_secret_test_key';

  it('mengirim legacy service_role sebagai apikey dan Bearer', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
    }));
    const storage = createStorage({
      driver: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      secretKey: legacyKey,
      bucket: 'media',
      fetchImpl,
    });

    const result = await storage.uploadObject({
      path: 'avatars/user-1/photo.jpg',
      buffer: jpegBuffer,
      contentType: 'image/jpeg',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.supabase.co/storage/v1/object/media/avatars/user-1/photo.jpg',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: `Bearer ${legacyKey}`,
          apikey: legacyKey,
          'Content-Type': 'image/jpeg',
        }),
      }),
    );
    expect(result.url).toBe(
      'https://example.supabase.co/storage/v1/object/public/media/avatars/user-1/photo.jpg',
    );
  });

  it('mengirim secret key baru hanya lewat header apikey', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
    }));
    const storage = createStorage({
      driver: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      secretKey,
      bucket: 'media',
      fetchImpl,
    });

    await storage.uploadObject({
      path: 'avatars/user-1/photo.jpg',
      buffer: jpegBuffer,
      contentType: 'image/jpeg',
    });

    const options = fetchImpl.mock.calls[0][1];
    expect(options.headers).toMatchObject({ apikey: secretKey });
    expect(options.headers).not.toHaveProperty('Authorization');
  });

  it('menghapus object berdasarkan URL publik bucket yang sama', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => '',
    }));
    const storage = createStorage({
      driver: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      secretKey,
      bucket: 'media',
      fetchImpl,
    });

    const deleted = await storage.deleteObjectByUrl(
      'https://example.supabase.co/storage/v1/object/public/media/avatars/user-1/photo.jpg',
    );

    expect(deleted).toBe(true);
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://example.supabase.co/storage/v1/object/media/avatars/user-1/photo.jpg',
      expect.objectContaining({
        method: 'DELETE',
        headers: { apikey: secretKey },
      }),
    );
  });

  it('tidak menghapus URL dari host atau bucket lain', async () => {
    const fetchImpl = vi.fn();
    const storage = createStorage({
      driver: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      secretKey,
      bucket: 'media',
      fetchImpl,
    });

    expect(
      await storage.deleteObjectByUrl(
        'https://other.supabase.co/storage/v1/object/public/media/avatars/user-1/photo.jpg',
      ),
    ).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('membungkus kegagalan storage sebagai BadGatewayError', async () => {
    const storage = createStorage({
      driver: 'supabase',
      supabaseUrl: 'https://example.supabase.co',
      secretKey,
      bucket: 'media',
      fetchImpl: async () => ({
        ok: false,
        status: 500,
        text: async () => 'storage error',
      }),
    });

    await expect(
      storage.uploadObject({
        path: 'avatars/user-1/photo.jpg',
        buffer: jpegBuffer,
        contentType: 'image/jpeg',
      }),
    ).rejects.toBeInstanceOf(BadGatewayError);
  });
});

describe('middleware upload avatar', () => {
  it('menerima JPEG valid dan menyimpan tipe hasil deteksi', async () => {
    const res = await request(createUploadApp())
      .post('/upload')
      .attach('photo', jpegBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      ok: true,
      mime: 'image/jpeg',
      extension: 'jpg',
      size: jpegBuffer.length,
    });
  });

  it('menerima alias image/jpg selama isi file adalah JPEG', async () => {
    const res = await request(createUploadApp())
      .post('/upload')
      .attach('photo', jpegBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpg',
      });

    expect(res.status).toBe(200);
    expect(res.body.mime).toBe('image/jpeg');
  });

  it('menolak request tanpa file dengan 422', async () => {
    const res = await request(createUploadApp()).post('/upload');

    expect(res.status).toBe(422);
    expect(res.body.errors[0]).toMatchObject({
      field: 'photo',
      message: 'Foto wajib diunggah',
    });
  });

  it('menolak MIME yang tidak didukung dengan 422', async () => {
    const res = await request(createUploadApp())
      .post('/upload')
      .attach('photo', Buffer.from('bukan gambar'), {
        filename: 'catatan.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toBe(
      'Format foto harus JPEG, PNG, atau WebP',
    );
  });

  it('menolak file yang isinya tidak cocok dengan MIME dengan 422', async () => {
    const res = await request(createUploadApp())
      .post('/upload')
      .attach('photo', pngBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toBe(
      'Format foto tidak sesuai isi file',
    );
  });

  it('menolak file melebihi 2 MB dengan 422', async () => {
    const oversizedBuffer = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(AVATAR_MAX_BYTES),
    ]);
    const res = await request(createUploadApp())
      .post('/upload')
      .attach('photo', oversizedBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toBe('Ukuran foto maksimal 2 MB');
  });

  it('menolak field multipart yang salah dengan 422', async () => {
    const res = await request(createUploadApp())
      .post('/upload')
      .attach('other', jpegBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('photo');
  });
});
