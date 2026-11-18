import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../src/app.js';
import prisma from '../src/config/database.js';
import { createCategory, createEvent, ticketType } from './fixtures.js';

const primaryUser = {
  name: 'Payer One',
  email: 'payer1@tiketkita.test',
  phone: '081234567890',
  password: 'Demo1234',
};

const secondUser = {
  name: 'Payer Two',
  email: 'payer2@tiketkita.test',
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

async function book(token, items) {
  const res = await request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ items });

  return res.body.data.booking;
}

function pay(token, bookingId, paymentMethod = 'BANK_TRANSFER') {
  return request(app)
    .post(`/api/v1/payments/${bookingId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ paymentMethod });
}

function getPayment(token, bookingId) {
  return request(app)
    .get(`/api/v1/payments/${bookingId}`)
    .set('Authorization', `Bearer ${token}`);
}

describe('POST /api/v1/payments/:bookingId', () => {
  it('membayar booking, mengubah status, dan menerbitkan tiket sesuai quantity', async () => {
    const event = await setupEvent({
      ticketTypes: [ticketType('Regular', 50000, 10), ticketType('VIP', 150000, 5)],
    });
    const regular = await getTicketType(event.id, 'Regular');
    const vip = await getTicketType(event.id, 'VIP');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [
      { ticketTypeId: regular.id, quantity: 2 },
      { ticketTypeId: vip.id, quantity: 1 },
    ]);

    const res = await pay(token, booking.id);

    expect(res.status).toBe(200);
    expect(res.body.data.booking.status).toBe('PAID');
    expect(res.body.data.booking.payment.status).toBe('SUCCESS');
    expect(res.body.data.payment.paymentMethod).toBe('BANK_TRANSFER');
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.payment.amount).toBe(250000);
    expect(res.body.data.payment.transactionReference).toMatch(/^SIM-[A-Z0-9]{12}$/);
    expect(res.body.data.payment.paidAt).toEqual(expect.any(String));
    expect(res.body.data.ticketCount).toBe(3);

    const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
    expect(payment.status).toBe('SUCCESS');
    expect(Number(payment.amount)).toBe(250000);

    const tickets = await prisma.ticket.findMany();
    expect(tickets).toHaveLength(3);
    expect(tickets.every((ticket) => ticket.status === 'ACTIVE')).toBe(true);
    expect(new Set(tickets.map((ticket) => ticket.ticketCode)).size).toBe(3);
    expect(new Set(tickets.map((ticket) => ticket.qrToken)).size).toBe(3);
    expect(tickets.every((ticket) => /^[0-9a-f]{64}$/.test(ticket.qrToken))).toBe(true);

    const stored = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(stored.status).toBe('PAID');
  });

  it('menolak metode pembayaran yang tidak dikenal dengan 422', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);
    const res = await pay(token, booking.id, 'CASH');

    expect(res.status).toBe(422);
    expect(res.body.errors.some((error) => error.field === 'paymentMethod')).toBe(true);
    expect(await prisma.payment.count()).toBe(0);
    expect(await prisma.ticket.count()).toBe(0);
  });

  it('menjawab 409 saat dibayar dua kali tanpa menggandakan tiket', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 3 }]);

    const first = await pay(token, booking.id);
    const second = await pay(token, booking.id);

    expect(first.status).toBe(200);
    expect(second.status).toBe(409);
    expect(second.body.message).toBe('Pemesanan sudah dibayar');
    expect(await prisma.ticket.count()).toBe(3);
    expect(await prisma.payment.count()).toBe(1);
  });

  it('menghasilkan tepat satu sukses dari dua request bayar paralel', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 2 }]);
    const responses = await Promise.all([pay(token, booking.id), pay(token, booking.id)]);

    const success = responses.filter((response) => response.status === 200);
    const failed = responses.filter((response) => response.status === 409);

    expect(success).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect(failed[0].body.message).toBe('Pemesanan sudah dibayar');
    expect(await prisma.ticket.count()).toBe(2);
    expect(await prisma.payment.count()).toBe(1);
  });

  it('menolak pembayaran booking CANCELLED dengan 409', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);

    await request(app)
      .patch(`/api/v1/bookings/${booking.id}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    const res = await pay(token, booking.id);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Pemesanan telah dibatalkan');
    expect(await prisma.payment.count()).toBe(0);
    expect(await prisma.ticket.count()).toBe(0);
  });

  it('menolak pembayaran booking kedaluwarsa, mengembalikan stok, dan tidak menerbitkan tiket', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 2 }]);

    await prisma.booking.update({
      where: { id: booking.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const res = await pay(token, booking.id);

    expect(res.status).toBe(409);
    expect(res.body.message).toBe('Waktu pembayaran telah habis');

    const stored = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(stored.status).toBe('EXPIRED');

    const stock = await prisma.ticketType.findUnique({ where: { id: regular.id } });
    expect(stock.availableStock).toBe(10);
    expect(await prisma.payment.count()).toBe(0);
    expect(await prisma.ticket.count()).toBe(0);
  });

  it('menjawab 404 ketika pengguna lain membayar booking', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const ownerToken = await registerAndLogin(primaryUser);
    const otherToken = await registerAndLogin(secondUser);

    const booking = await book(ownerToken, [{ ticketTypeId: regular.id, quantity: 1 }]);
    const res = await pay(otherToken, booking.id);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Pemesanan tidak ditemukan');
    expect(await prisma.payment.count()).toBe(0);
    expect(await prisma.ticket.count()).toBe(0);
  });

  it('menjawab 404 untuk ID booking yang tidak ada atau bukan UUID', async () => {
    const token = await registerAndLogin(primaryUser);

    const invalid = await pay(token, 'bukan-uuid');
    const missing = await pay(token, '00000000-0000-4000-8000-000000000000');

    expect(invalid.status).toBe(404);
    expect(missing.status).toBe(404);
  });

  it('menolak request tanpa token dengan 401', async () => {
    const res = await request(app)
      .post('/api/v1/payments/00000000-0000-4000-8000-000000000000')
      .send({ paymentMethod: 'QRIS' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/payments/:bookingId', () => {
  it('mengembalikan 404 sebelum pembayaran dibuat', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);
    const res = await getPayment(token, booking.id);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Pembayaran belum dibuat');
  });

  it('mengembalikan detail pembayaran setelah berhasil dibayar', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const token = await registerAndLogin(primaryUser);

    const booking = await book(token, [{ ticketTypeId: regular.id, quantity: 1 }]);
    const paid = await pay(token, booking.id, 'QRIS');
    const res = await getPayment(token, booking.id);

    expect(res.status).toBe(200);
    expect(res.body.data.payment.transactionReference).toBe(
      paid.body.data.payment.transactionReference,
    );
    expect(res.body.data.payment.paymentMethod).toBe('QRIS');
    expect(res.body.data.payment.status).toBe('SUCCESS');
    expect(res.body.data.payment.amount).toBe(50000);
  });

  it('menjawab 404 ketika pengguna lain membuka pembayaran', async () => {
    const event = await setupEvent({ ticketTypes: [ticketType('Regular', 50000, 10)] });
    const regular = await getTicketType(event.id, 'Regular');
    const ownerToken = await registerAndLogin(primaryUser);
    const otherToken = await registerAndLogin(secondUser);

    const booking = await book(ownerToken, [{ ticketTypeId: regular.id, quantity: 1 }]);
    await pay(ownerToken, booking.id);

    const res = await getPayment(otherToken, booking.id);

    expect(res.status).toBe(404);
  });
});
