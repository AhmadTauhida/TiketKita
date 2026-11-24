import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import {
  createCategory,
  createEvent,
  futureDate,
  pastDate,
  ticketType,
} from './fixtures.js';

async function setupCategory(name = 'Seminar') {
  return createCategory({ name });
}

describe('GET /api/v1/events', () => {
  it('menyembunyikan acara CANCELLED dan COMPLETED secara default', async () => {
    const category = await setupCategory();
    const upcoming = await createEvent({ categoryId: category.id, title: 'Acara Upcoming' });
    const ongoing = await createEvent({
      categoryId: category.id,
      title: 'Acara Ongoing',
      status: 'ONGOING',
    });
    await createEvent({
      categoryId: category.id,
      title: 'Acara Batal',
      status: 'CANCELLED',
    });
    await createEvent({
      categoryId: category.id,
      title: 'Acara Selesai',
      status: 'COMPLETED',
      eventDate: pastDate(3),
    });

    const res = await request(app).get('/api/v1/events');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.totalItems).toBe(2);
    expect(res.body.data.items.map((item) => item.id).sort()).toEqual(
      [upcoming.id, ongoing.id].sort(),
    );
  });

  it('menampilkan status tertentu bila diminta eksplisit', async () => {
    const category = await setupCategory();
    await createEvent({ categoryId: category.id, title: 'Acara Batal', status: 'CANCELLED' });

    const res = await request(app).get('/api/v1/events?status=CANCELLED');

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.totalItems).toBe(1);
    expect(res.body.data.items[0].status).toBe('CANCELLED');
  });

  it('menyembunyikan acara yang tanggalnya sudah lewat meski statusnya masih UPCOMING', async () => {
    const category = await setupCategory();
    const pastEvent = await createEvent({
      categoryId: category.id,
      title: 'Acara Terlewat',
      status: 'UPCOMING',
      eventDate: pastDate(2),
      endDate: pastDate(1),
    });

    const list = await request(app).get('/api/v1/events');
    expect(list.status).toBe(200);
    expect(list.body.data.pagination.totalItems).toBe(0);

    const detail = await request(app).get(`/api/v1/events/${pastEvent.id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.event.status).toBe('COMPLETED');
    expect(detail.body.data.event.canBook).toBe(false);
  });

  it('menandai acara yang sedang berlangsung sebagai ONGOING', async () => {
    const category = await setupCategory();
    const ongoing = await createEvent({
      categoryId: category.id,
      title: 'Acara Berlangsung',
      status: 'UPCOMING',
      eventDate: pastDate(1),
      endDate: futureDate(1),
    });

    const res = await request(app).get('/api/v1/events');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].id).toBe(ongoing.id);
    expect(res.body.data.items[0].status).toBe('ONGOING');
  });

  it('mencari berdasarkan judul tanpa sensitif huruf besar-kecil', async () => {
    const category = await setupCategory();
    await createEvent({ categoryId: category.id, title: 'Seminar AI 2026' });
    await createEvent({ categoryId: category.id, title: 'Konser Musik' });

    const res = await request(app).get('/api/v1/events?q=ai');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe('Seminar AI 2026');
  });

  it('mencari berdasarkan penyelenggara', async () => {
    const category = await setupCategory();
    await createEvent({ categoryId: category.id, title: 'Acara Satu', organizer: 'Jazz Community' });
    await createEvent({ categoryId: category.id, title: 'Acara Dua', organizer: 'Himpunan' });

    const res = await request(app).get('/api/v1/events?q=jazz');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].organizer).toBe('Jazz Community');
  });

  it('memfilter berdasarkan kategori', async () => {
    const seminar = await setupCategory('Seminar');
    const musik = await setupCategory('Musik');
    await createEvent({ categoryId: seminar.id, title: 'Acara Seminar' });
    await createEvent({ categoryId: musik.id, title: 'Acara Musik' });

    const res = await request(app).get(`/api/v1/events?categoryId=${musik.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].title).toBe('Acara Musik');
  });

  it('mengembalikan pagination yang benar', async () => {
    const category = await setupCategory();

    for (let index = 0; index < 12; index += 1) {
      await createEvent({
        categoryId: category.id,
        title: `Acara ${index}`,
        eventDate: futureDate(index + 1),
      });
    }

    const firstPage = await request(app).get('/api/v1/events?limit=10');
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(10);
    expect(firstPage.body.data.pagination).toEqual({
      page: 1,
      limit: 10,
      totalItems: 12,
      totalPages: 2,
    });

    const secondPage = await request(app).get('/api/v1/events?page=2&limit=10');
    expect(secondPage.body.data.items).toHaveLength(2);
    expect(secondPage.body.data.pagination.page).toBe(2);
  });
});

describe('GET /api/v1/events/featured', () => {
  it('mengembalikan maksimal lima UPCOMING terdekat yang belum lewat', async () => {
    const category = await setupCategory();

    for (let index = 1; index <= 6; index += 1) {
      await createEvent({
        categoryId: category.id,
        title: `Acara ${index}`,
        eventDate: futureDate(index),
      });
    }

    await createEvent({
      categoryId: category.id,
      title: 'Acara Batal',
      status: 'CANCELLED',
      eventDate: futureDate(1),
    });
    await createEvent({
      categoryId: category.id,
      title: 'Acara Lampau',
      eventDate: pastDate(1),
    });

    const res = await request(app).get('/api/v1/events/featured');

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(5);
    expect(res.body.data.items.every((item) => item.status === 'UPCOMING')).toBe(true);
    expect(res.body.data.items.every((item) => new Date(item.eventDate) > new Date())).toBe(true);

    const dates = res.body.data.items.map((item) => new Date(item.eventDate).getTime());
    expect(dates).toEqual([...dates].sort((a, b) => a - b));
  });
});

describe('GET /api/v1/events/:id', () => {
  it('mengembalikan detail dengan minPrice, isSoldOut, dan canBook yang benar', async () => {
    const category = await setupCategory();
    const event = await createEvent({
      categoryId: category.id,
      title: 'Seminar AI',
      ticketTypes: [ticketType('VIP', 150000, 50, 0), ticketType('Regular', 50000, 200, 10)],
    });

    const res = await request(app).get(`/api/v1/events/${event.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.event.minPrice).toBe(50000);
    expect(res.body.data.event.isSoldOut).toBe(false);
    expect(res.body.data.event.canBook).toBe(true);
    expect(res.body.data.event.category.name).toBe('Seminar');
    expect(res.body.data.event.ticketTypes.map((type) => type.name)).toEqual([
      'Regular',
      'VIP',
    ]);
  });

  it('menandai isSoldOut saat semua jenis tiket habis', async () => {
    const category = await setupCategory();
    const event = await createEvent({
      categoryId: category.id,
      title: 'Acara Sold Out',
      ticketTypes: [ticketType('Regular', 200000, 100, 0), ticketType('VIP', 500000, 20, 0)],
    });

    const res = await request(app).get(`/api/v1/events/${event.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.event.isSoldOut).toBe(true);
  });

  it('menonaktifkan canBook untuk acara CANCELLED', async () => {
    const category = await setupCategory();
    const event = await createEvent({
      categoryId: category.id,
      title: 'Acara Batal',
      status: 'CANCELLED',
      ticketTypes: [ticketType('Regular', 40000, 100)],
    });

    const res = await request(app).get(`/api/v1/events/${event.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.event.canBook).toBe(false);
  });

  it('menjawab 404 untuk ID yang tidak ada atau bukan UUID', async () => {
    const missing = await request(app).get('/api/v1/events/00000000-0000-4000-8000-000000000000');
    const invalid = await request(app).get('/api/v1/events/bukan-uuid');

    expect(missing.status).toBe(404);
    expect(invalid.status).toBe(404);
    expect(invalid.body.message).toBe('Acara tidak ditemukan');
  });
});
