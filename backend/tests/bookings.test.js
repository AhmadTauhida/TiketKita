import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { createCategory, createEvent, ticketType } from './fixtures.js';

const primaryUser = {
  name: 'Booker One',
  email: 'booker1@tiketkita.test',
  phone: '081234567890',
  password: 'Demo1234',
};

const secondUser = {
  name: 'Booker Two',
  email: 'booker2@tiketkita.test',
  phone: '081298765432',
  password: 'Demo1234',
};

async function registerAndLogin(user) {
  await request(app).post('/api/v1/auth/register').send(user);
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: user.email, password: user.password });

  return res.body.data.token;
}

let categoryCounter = 0;

async function setupEvent({ status = 'UPCOMING', ticketTypes = [] } = {}) {
  categoryCounter += 1;
  const category = await createCategory({ name: `Kategori ${categoryCounter}` });
  const event = await createEvent({
    categoryId: category.id,
    title: `Acara ${Math.random().toString(36).slice(2, 8)}`,
    status,
    ticketTypes,
  });

  return event;
}

async function getTicketType(eventId, name) {
  return prisma.ticketType.findFirst({ where: { eventId, name } });
}

function book(token, items) {
  return request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ items });
}

function getBooking(token, bookingId) {
  return request(app)
    .get(`/api/v1/bookings/${bookingId}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('POST /api/v1/bookings', () => {
  it('membuat pemesanan, menghitung total, dan mengurangi stok', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const res = await book(token, [{ ticketTypeId: regular.id, quantity: 2 }]);

    expect(res.status).toBe(201);
    expect(res.body.data.booking.status).toBe('PENDING');
    expect(res.body.data.booking.totalAmount).toBe(100000);
    expect(res.body.data.booking.totalQuantity).toBe(2);
    expect(res.body.data.booking.bookingCode).toMatch(/^TK-\d{8}-[A-Z0-9]{6}$/);
    expect(res.body.data.booking.items[0].ticketTypeName).toBe('Regular');
    expect(res.body.data.booking.items[0].unitPrice).toBe(50000);
    expect(res.body.data.booking.event.title).toBe(event.title);

    const expiresAt = new Date(res.body.data.booking.expiresAt).getTime();
    const createdAt = new Date(res.body.data.booking.createdAt).getTime();
    expect(expiresAt - createdAt).toBeGreaterThan(13 * 60 * 1000);
    expect(expiresAt - createdAt).toBeLessThanOrEqual(16 * 60 * 1000);

    const stock = await prisma.ticketType.findUnique({ where: { id: regular.id } });
    expect(stock.availableStock).toBe(8);
  });

  it('menolak jumlah melebihi stok dengan 409 dan stok tidak berubah', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 3)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const res = await book(token, [{ ticketTypeId: regular.id, quantity: 4 }]);

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('Regular');

    const stock = await prisma.ticketType.findUnique({ where: { id: regular.id } });
    expect(stock.availableStock).toBe(3);
    expect(await prisma.booking.count()).toBe(0);
  });

  it('menolak item dari acara berbeda dengan 422', async () => {
    const first = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const second = await setupEvent({ ticketTypes: [ticketType('Regular', 60000, 10)] });
    const firstType = await getTicketType(first.id, 'Regular');
    const secondType = await getTicketType(second.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const res = await book(token, [
      { ticketTypeId: firstType.id, quantity: 1 },
      { ticketTypeId: secondType.id, quantity: 1 },
    ]);

    expect(res.status).toBe(422);
    expect(res.body.errors.some((error) => error.field === 'items')).toBe(true);
    expect(await prisma.booking.count()).toBe(0);
  });

  it('menolak ticketTypeId duplikat dengan 422', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const res = await book(token, [
      { ticketTypeId: regular.id, quantity: 1 },
      { ticketTypeId: regular.id, quantity: 1 },
    ]);

    expect(res.status).toBe(422);
    expect(res.body.errors.some((error) => error.field === 'items')).toBe(true);

    const stock = await prisma.ticketType.findUnique({ where: { id: regular.id } });
    expect(stock.availableStock).toBe(10);
  });

  it('menolak pemesanan pada acara CANCELLED dengan 409', async () => {
    const event = await setupEvent({
      status: 'CANCELLED',
      ticketTypes: [ticketType('Regular', 40000, 10)],
    });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const res = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Acara tidak dapat dipesan');
  });

  it('rollback seluruh perubahan stok bila salah satu item gagal', async () => {
    const event = await setupEvent({
      ticketTypes: [ticketType('Regular', 50000, 5), ticketType('VIP', 150000, 1)],
    });
    const regular = await getTicketType(event.id, 'Regular');
    const vip = await getTicketType(event.id, 'VIP');
    const token = await registerAndLogin(primaryUser);

    const res = await book(token, [
      { ticketTypeId: regular.id, quantity: 2 },
      { ticketTypeId: vip.id, quantity: 2 },
    ]);

    expect(res.status).toBe(409);
    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(5);
    expect((await prisma.ticketType.findUnique({ where: { id: vip.id } })).availableStock).toBe(1);
    expect(await prisma.booking.count()).toBe(0);
  });

  it('menghasilkan tepat 3 sukses dari 5 request paralel pada stok 3', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 150000, 3)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const responses = await Promise.all(
      Array.from({ length: 5 }, () => book(token, [{ ticketTypeId: regular.id, quantity: 1 }])),
    );

    const success = responses.filter((response) => response.status === 201);
    const failed = responses.filter((response) => response.status === 409);

    expect(success).toHaveLength(3);
    expect(failed).toHaveLength(2);
    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(0);
    expect(await prisma.booking.count()).toBe(3);
  });
});

describe('GET /api/v1/bookings', () => {
  it('mengembalikan pemesanan milik pengguna dengan pagination dan filter status', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const first = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const second = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);

    await prisma.booking.update({
      where: { id: first.body.data.booking.id },
      data: { status: 'PAID' },
    });

    const all = await request(app)
      .get('/api/v1/bookings?limit=1')
      .set('Authorization', `Bearer ${token}`);

    expect(all.status).toBe(200);
    expect(all.body.data.items).toHaveLength(1);
    expect(all.body.data.pagination.totalItems).toBe(2);
    expect(all.body.data.pagination.totalPages).toBe(2);
    expect(all.body.data.items[0].bookingCode).toBe(second.body.data.booking.bookingCode);

    const paid = await request(app)
      .get('/api/v1/bookings?status=PAID')
      .set('Authorization', `Bearer ${token}`);

    expect(paid.body.data.items).toHaveLength(1);
    expect(paid.body.data.items[0].status).toBe('PAID');
  });

  it('menjawab 404 ketika pengguna lain membuka pemesanan', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const ownerToken = await registerAndLogin(primaryUser);
    const otherToken = await registerAndLogin(secondUser);

    const booking = await book(ownerToken, [{ ticketTypeId: regular.id, quantity: 1 }]);
    const res = await getBooking(otherToken, booking.body.data.booking.id);

    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/bookings/:id/cancel', () => {
  it('membatalkan pemesanan PENDING dan mengembalikan stok', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 2 }]);
    const bookingId = booking.body.data.booking.id;

    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(8);

    const cancelled = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelled.status).toBe(200);
    expect(cancelled.body.data.booking.status).toBe('CANCELLED');
    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(10);

    const repeated = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(repeated.status).toBe(409);
    expect(repeated.body.message).toBe('Pemesanan sudah dibatalkan');
  });

  it('menolak pembatalan pemesanan PAID dengan 409', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 2 }]);
    const bookingId = booking.body.data.booking.id;

    await prisma.booking.update({ where: { id: bookingId }, data: { status: 'PAID' } });

    const res = await request(app)
      .patch(`/api/v1/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Pemesanan yang sudah dibayar tidak dapat dibatalkan');
    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(8);
  });
});

describe('Kedaluwarsa pemesanan', () => {
  it('mengubah booking menjadi EXPIRED dan mengembalikan stok tepat satu kali saat dibaca', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 2 }]);
    const bookingId = booking.body.data.booking.id;

    await prisma.booking.update({
      where: { id: bookingId },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const firstRead = await getBooking(token, bookingId);
    expect(firstRead.status).toBe(200);
    expect(firstRead.body.data.booking.status).toBe('EXPIRED');
    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(10);

    const secondRead = await getBooking(token, bookingId);
    expect(secondRead.body.data.booking.status).toBe('EXPIRED');
    expect((await prisma.ticketType.findUnique({ where: { id: regular.id } })).availableStock).toBe(10);
  });

  it('menjalankan sweep pada GET /events/:id sebelum membaca stok', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 5)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);
    await prisma.booking.update({
      where: { id: booking.body.data.booking.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const detail = await request(app).get(`/api/v1/events/${event.id}`);
    const ticket = detail.body.data.event.ticketTypes.find((type) => type.name === 'Regular');

    expect(detail.status).toBe(200);
    expect(ticket.availableStock).toBe(5);
  });

  it('menjalankan sweep pada GET /bookings', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 5)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);
    await prisma.booking.update({
      where: { id: booking.body.data.booking.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await request(app)
      .get('/api/v1/bookings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items[0].status).toBe('EXPIRED');
  });

  it('menjawab 404 untuk ID tidak ada atau bukan UUID', async () => {
    const token = await registerAndLogin(primaryUser);

    const invalid = await getBooking(token, 'bukan-uuid');
    const missing = await getBooking(token, '00000000-0000-4000-8000-000000000000');

    expect(invalid.status).toBe(404);
    expect(missing.status).toBe(404);
  });
});
