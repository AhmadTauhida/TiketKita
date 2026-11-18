import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';

const baseUser = {
  name: 'Demo Test',
  email: 'demo-test@tiketkita.test',
  phone: '081234567890',
  password: 'Demo1234',
};

function register(payload = {}) {
  return request(app)
    .post('/api/v1/auth/register')
    .send({ ...baseUser, ...payload });
}

function login(payload = {}) {
  return request(app)
    .post('/api/v1/auth/login')
    .send({ email: baseUser.email, password: baseUser.password, ...payload });
}

describe('POST /api/v1/auth/register', () => {
  it('mendaftarkan pengguna baru', async () => {
    const res = await register();

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(baseUser.email);
    expect(res.body.data.user.name).toBe(baseUser.name);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('menolak email duplikat dengan 409', async () => {
    await register();
    const res = await register();

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email sudah terdaftar');
  });

  it('menolak input tidak valid dengan 422 dan errors', async () => {
    const res = await register({ email: 'bukan-email', password: 'abc' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.data).toBeNull();
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.some((error) => error.field === 'email')).toBe(true);
    expect(res.body.errors.some((error) => error.field === 'password')).toBe(true);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('login sukses mengembalikan token dan user', async () => {
    await register();
    const res = await login();

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe('string');
    expect(res.body.data.user.email).toBe(baseUser.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('menolak password salah dengan 401', async () => {
    await register();
    const res = await login({ password: 'Salah1234' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });

  it('menolak email tidak terdaftar dengan 401', async () => {
    const res = await login({ email: 'tidak-ada@tiketkita.test' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Email atau password salah');
  });
});

describe('Autentikasi endpoint privat', () => {
  it('menolak request tanpa token dengan 401', async () => {
    const res = await request(app).get('/api/v1/users/profile');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('menolak token rusak dengan 401', async () => {
    const res = await request(app)
      .get('/api/v1/users/profile')
      .set('Authorization', 'Bearer token-rusak');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
