import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { createCategory, createEvent, ticketType } from './fixtures.js';

const primaryUser = {
  name: 'Ticket Owner',
  email: 'ticketowner@tiketkita.test',
  phone: '081234567890',
  password: 'Demo1234',
};

const secondUser = {
  name: 'Ticket Other',
  email: 'ticketother@tiketkita.test',
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

async function setupEvent() {
  categoryCounter += 1;
  const category = await createCategory({ name: `Kategori ${categoryCounter}` });
  const event = await createEvent({
    categoryId: category.id,
    title: `Acara ${Math.random().toString(36).slice(2, 8)}`,
    ticketTypes: [ticketType('Regular', 50000, 10)],
  });

  return event;
}

async function getTicketType(eventId) {
  return prisma.ticketType.findFirst({ where: { eventId, name: 'Regular' } });
}

async function createPaidBooking(token, eventId, quantity) {
  const regular = await getTicketType(eventId);

  const booking = await request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ ticketTypeId: regular.id, quantity }] });

  const bookingId = booking.body.data.booking.id;

  const paid = await request(app)
    .post(`/api/v1/payments/${bookingId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ paymentMethod: 'E_WALLET' });

  return { booking: paid.body.data.booking, bookingId };
}

function listTickets(token, query = '') {
  return request(app)
    .get(`/api/v1/tickets${query}`)
    .set('Authorization', `Bearer ${token}`);
}

function getTicket(token, ticketId) {
  return request(app)
    .get(`/api/v1/tickets/${ticketId}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('GET /api/v1/tickets', () => {
  it('hanya mengembalikan tiket milik pengguna beserta ringkasan yang benar', async () => {
    const event = await setupEvent();
    const token = await registerAndLogin(primaryUser);
    const otherToken = await registerAndLogin(secondUser);

    const { booking } = await createPaidBooking(token, event.id, 3);
    await createPaidBooking(otherToken, event.id, 1);

    const res = await listTickets(token);

    expect(res.status).toBe(200);
    expect(res.body.data.pagination.totalItems).toBe(3);
    expect(res.body.data.items).toHaveLength(3);
    expect(res.body.data.items[0]).toMatchObject({
      status: 'ACTIVE',
      ticketTypeName: 'Regular',
      bookingCode: booking.bookingCode,
      event: {
        id: event.id,
        title: event.title,
        location: event.location,
      },
    });
    expect(res.body.data.items[0].ticketCode).toMatch(/^TKT-[A-Z0-9]{10}$/);
    expect(res.body.data.items[0].issuedAt).toEqual(expect.any(String));
    expect(res.body.data.items[0].qrToken).toBeUndefined();

    const otherRes = await listTickets(otherToken);
    expect(otherRes.body.data.pagination.totalItems).toBe(1);
  });

  it('menerapkan pagination dan urutan issuedAt terbaru', async () => {
    const event = await setupEvent();
    const token = await registerAndLogin(primaryUser);

    await createPaidBooking(token, event.id, 1);
    await new Promise((resolve) => setTimeout(resolve, 20));
    const latest = await createPaidBooking(token, event.id, 2);

    const firstPage = await listTickets(token, '?limit=2');
    expect(firstPage.status).toBe(200);
    expect(firstPage.body.data.items).toHaveLength(2);
    expect(firstPage.body.data.pagination).toEqual({
      page: 1,
      limit: 2,
      totalItems: 3,
      totalPages: 2,
    });
    expect(firstPage.body.data.items[0].bookingCode).toBe(latest.booking.bookingCode);

    const secondPage = await listTickets(token, '?page=2&limit=2');
    expect(secondPage.body.data.items).toHaveLength(1);

    const issuedAt = firstPage.body.data.items.map((item) => new Date(item.issuedAt).getTime());
    expect(issuedAt).toEqual([...issuedAt].sort((a, b) => b - a));
  });

  it('memfilter berdasarkan status tiket', async () => {
    const event = await setupEvent();
    const token = await registerAndLogin(primaryUser);

    await createPaidBooking(token, event.id, 3);

    const firstTicket = await prisma.ticket.findFirst();
    await prisma.ticket.update({
      where: { id: firstTicket.id },
      data: { status: 'USED', usedAt: new Date() },
    });

    const used = await listTickets(token, '?status=USED');
    expect(used.status).toBe(200);
    expect(used.body.data.items).toHaveLength(1);
    expect(used.body.data.items[0].status).toBe('USED');

    const active = await listTickets(token, '?status=ACTIVE');
    expect(active.body.data.items).toHaveLength(2);
  });

  it('menolak status tidak dikenal dengan 422', async () => {
    const token = await registerAndLogin(primaryUser);
    const res = await listTickets(token, '?status=LOST');

    expect(res.status).toBe(422);
    expect(res.body.errors.some((error) => error.field === 'status')).toBe(true);
  });

  it('menolak request tanpa token dengan 401', async () => {
    const res = await request(app).get('/api/v1/tickets');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/tickets/:id', () => {
  it('mengembalikan detail tiket lengkap dengan QR, pemilik, dan alamat acara', async () => {
    const event = await setupEvent();
    const token = await registerAndLogin(primaryUser);

    const { booking } = await createPaidBooking(token, event.id, 1);
    const list = await listTickets(token);
    const ticketId = list.body.data.items[0].id;

    const res = await getTicket(token, ticketId);

    expect(res.status).toBe(200);
    expect(res.body.data.ticket).toMatchObject({
      id: ticketId,
      status: 'ACTIVE',
      usedAt: null,
      ownerName: primaryUser.name,
      bookingCode: booking.bookingCode,
      ticketTypeName: 'Regular',
      event: {
        id: event.id,
        title: event.title,
        location: event.location,
        address: event.address,
      },
    });
    expect(res.body.data.ticket.qrToken).toMatch(/^[0-9a-f]{64}$/);
    expect(res.body.data.ticket.ticketCode).toMatch(/^TKT-[A-Z0-9]{10}$/);
  });

  it('menjawab 404 untuk tiket pengguna lain atau ID tidak valid', async () => {
    const event = await setupEvent();
    const ownerToken = await registerAndLogin(primaryUser);
    const otherToken = await registerAndLogin(secondUser);

    await createPaidBooking(ownerToken, event.id, 1);
    const list = await listTickets(ownerToken);
    const ticketId = list.body.data.items[0].id;

    const other = await getTicket(otherToken, ticketId);
    const invalid = await getTicket(ownerToken, 'bukan-uuid');
    const missing = await getTicket(
      ownerToken,
      '00000000-0000-4000-8000-000000000000',
    );

    expect(other.status).toBe(404);
    expect(invalid.status).toBe(404);
    expect(missing.status).toBe(404);
    expect(invalid.body.message).toBe('Tiket tidak ditemukan');
  });
});
