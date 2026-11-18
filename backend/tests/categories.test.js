import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import { createCategory } from './fixtures.js';

describe('GET /api/v1/categories', () => {
  it('mengembalikan kategori urut nama tanpa pagination', async () => {
    await createCategory({ name: 'Musik', icon: 'music_note' });
    await createCategory({ name: 'Seminar', icon: 'school' });
    await createCategory({ name: 'Festival', icon: 'festival' });

    const res = await request(app).get('/api/v1/categories');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.map((item) => item.name)).toEqual([
      'Festival',
      'Musik',
      'Seminar',
    ]);
    expect(res.body.data.items[0]).toHaveProperty('id');
    expect(res.body.data.items[0]).toHaveProperty('description');
    expect(res.body.data.items[0]).toHaveProperty('icon');
  });
});
