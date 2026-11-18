import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';

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
