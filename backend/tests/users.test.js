import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import { AVATAR_MAX_BYTES } from '../src/middlewares/upload.js';
import { storage } from '../src/services/storage.js';

const baseUser = {
  name: 'Demo Test',
  email: 'demo-test@tiketkita.test',
  phone: '081234567890',
  password: 'Demo1234',
};

async function createToken() {
  await request(app).post('/api/v1/auth/register').send(baseUser);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: baseUser.email, password: baseUser.password });

  return res.body.data.token;
}

const jpegBuffer = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.from('fake-jpeg-payload'),
]);

const pngBuffer = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('fake-png-payload'),
]);

describe('GET /api/v1/users/profile', () => {
  it('mengembalikan profil pengguna yang login', async () => {
    const token = await createToken();
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(baseUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });
});

describe('PUT /api/v1/users/profile', () => {
  it('memperbarui nama, telepon, dan foto profil', async () => {
    const token = await createToken();
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Nama Baru',
        phone: '081298765432',
        profileImage: 'https://example.com/foto.png',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Nama Baru');
    expect(res.body.data.user.phone).toBe('081298765432');
    expect(res.body.data.user.profileImage).toBe('https://example.com/foto.png');
  });

  it('tidak mengubah email', async () => {
    const token = await createToken();
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Nama Baru',
        phone: '081298765432',
        email: 'lain@tiketkita.test',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(baseUser.email);
  });

  it('menolak nomor telepon tidak valid dengan 422', async () => {
    const token = await createToken();
    const res = await request(app)
      .put('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Nama Baru', phone: '12345' });

    expect(res.status).toBe(422);
    expect(res.body.errors.some((error) => error.field === 'phone')).toBe(true);
  });
});

describe('POST /api/v1/users/profile/photo', () => {
  it('mengunggah foto profil dan menyimpan URL publik', async () => {
    const token = await createToken();
    const res = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', jpegBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Foto profil berhasil diperbarui');
    expect(res.body.data.user.profileImage).toMatch(
      /^https:\/\/memory\.local\/storage\/v1\/object\/public\/media\/avatars\/.+\/.+\.jpg$/,
    );

    const profile = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(profile.body.data.user.profileImage).toBe(
      res.body.data.user.profileImage,
    );
  });

  it('menolak request tanpa token dengan 401', async () => {
    const res = await request(app)
      .post('/api/v1/users/profile/photo')
      .attach('photo', jpegBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(401);
  });

  it('menolak request tanpa file dengan 422', async () => {
    const token = await createToken();
    const res = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(422);
    expect(res.body.errors).toContainEqual({
      field: 'photo',
      message: 'Foto wajib diunggah',
    });
  });

  it('menolak format yang tidak didukung dengan 422', async () => {
    const token = await createToken();
    const res = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', Buffer.from('bukan gambar'), {
        filename: 'catatan.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toBe(
      'Format foto harus JPEG, PNG, atau WebP',
    );
  });

  it('menolak isi file yang tidak cocok dengan MIME dengan 422', async () => {
    const token = await createToken();
    const res = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`)
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
    const token = await createToken();
    const oversizedBuffer = Buffer.concat([
      Buffer.from([0xff, 0xd8, 0xff]),
      Buffer.alloc(AVATAR_MAX_BYTES),
    ]);
    const res = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', oversizedBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(res.status).toBe(422);
    expect(res.body.errors[0].message).toBe('Ukuran foto maksimal 2 MB');
  });

  it('mengganti foto dan menghapus object lama', async () => {
    const token = await createToken();

    const first = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', jpegBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });
    const firstUrl = first.body.data.user.profileImage;

    const second = await request(app)
      .post('/api/v1/users/profile/photo')
      .set('Authorization', `Bearer ${token}`)
      .attach('photo', pngBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(second.status).toBe(200);
    expect(second.body.data.user.profileImage).not.toBe(firstUrl);
    expect(await storage.deleteObjectByUrl(firstUrl)).toBe(false);
  });
});
