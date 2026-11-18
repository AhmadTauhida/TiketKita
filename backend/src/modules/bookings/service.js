import { Prisma } from '@prisma/client';
import { z } from 'zod';

import prisma from '../../config/database.js';
import { env } from '../../config/env.js';
import { ConflictError, NotFoundError, ValidationError } from '../../utils/errors.js';
import { expireOverdueBookings } from '../../utils/expire-bookings.js';
import { generateBookingCode } from '../../utils/generate-code.js';

const uuidSchema = z.uuid();

const bookingInclude = {
  details: {
    include: {
      ticketType: {
        include: { event: true },
      },
    },
  },
  payment: true,
};

export async function createBooking(userId, { items }) {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          await expireOverdueBookings(tx);

          const ticketTypeIds = [...new Set(items.map((item) => item.ticketTypeId))];
          const ticketTypes = await tx.ticketType.findMany({
            where: { id: { in: ticketTypeIds } },
            include: { event: true },
          });

          if (ticketTypes.length !== ticketTypeIds.length) {
            throw new NotFoundError('Jenis tiket tidak ditemukan');
          }

          const ticketTypeById = new Map(ticketTypes.map((type) => [type.id, type]));
          const eventIds = new Set(ticketTypes.map((type) => type.eventId));

          if (eventIds.size !== 1) {
            throw new ValidationError('Item harus berasal dari satu acara', [
              { field: 'items', message: 'Semua item harus berasal dari acara yang sama' },
            ]);
          }

          const event = ticketTypes[0].event;

          if (event.status !== 'UPCOMING' || event.eventDate.getTime() <= Date.now()) {
            throw new ConflictError('Acara tidak dapat dipesan');
          }

          let totalAmount = new Prisma.Decimal(0);
          const details = [];

          for (const item of items) {
            const ticketType = ticketTypeById.get(item.ticketTypeId);
            const updated = await tx.ticketType.updateMany({
              where: {
                id: ticketType.id,
                availableStock: { gte: item.quantity },
              },
              data: {
                availableStock: { decrement: item.quantity },
              },
            });

            if (updated.count === 0) {
              throw new ConflictError(`Stok tiket tidak mencukupi untuk ${ticketType.name}`);
            }

            const subtotal = ticketType.price.mul(item.quantity);
            totalAmount = totalAmount.add(subtotal);

            details.push({
              ticketTypeId: ticketType.id,
              quantity: item.quantity,
              unitPrice: ticketType.price,
              subtotal,
            });
          }

          const expiresAt = new Date(Date.now() + env.bookingExpiryMinutes * 60 * 1000);

          const booking = await tx.booking.create({
            data: {
              userId,
              bookingCode: generateBookingCode(),
              totalAmount,
              status: 'PENDING',
              expiresAt,
              details: { create: details },
            },
          });

          return tx.booking.findUnique({
            where: { id: booking.id },
            include: bookingInclude,
          });
        },
        { maxWait: 5000, timeout: 15000 },
      );
    } catch (error) {
      const target = Array.isArray(error?.meta?.target)
        ? error.meta.target.join(',')
        : String(error?.meta?.target ?? '');
      const isBookingCodeCollision = error?.code === 'P2002' && target.includes('booking_code');

      if (isBookingCodeCollision && attempt < 5) {
        continue;
      }

      if (isBookingCodeCollision) {
        throw new ConflictError('Gagal membuat kode pemesanan');
      }

      throw error;
    }
  }

  throw new ConflictError('Gagal membuat kode pemesanan');
}

export async function listBookings(userId, { status, page, limit }) {
  return prisma.$transaction(async (tx) => {
    await expireOverdueBookings(tx, { userId });

    const where = { userId, ...(status ? { status } : {}) };

    const [bookings, totalItems] = await Promise.all([
      tx.booking.findMany({
        where,
        include: bookingInclude,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      tx.booking.count({ where }),
    ]);

    return {
      items: bookings,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  });
}

export async function getBooking(userId, bookingId) {
  if (!uuidSchema.safeParse(bookingId).success) {
    throw new NotFoundError('Pemesanan tidak ditemukan');
  }

  return prisma.$transaction(async (tx) => {
    await expireOverdueBookings(tx, { userId, bookingId });

    const booking = await tx.booking.findFirst({
      where: { id: bookingId, userId },
      include: bookingInclude,
    });

    if (!booking) {
      throw new NotFoundError('Pemesanan tidak ditemukan');
    }

    return booking;
  });
}

export async function cancelBooking(userId, bookingId) {
  if (!uuidSchema.safeParse(bookingId).success) {
    throw new NotFoundError('Pemesanan tidak ditemukan');
  }

  return prisma.$transaction(async (tx) => {
    await expireOverdueBookings(tx, { userId, bookingId });

    const booking = await tx.booking.findFirst({
      where: { id: bookingId, userId },
      include: bookingInclude,
    });

    if (!booking) {
      throw new NotFoundError('Pemesanan tidak ditemukan');
    }

    const cancelled = await tx.booking.updateMany({
      where: { id: bookingId, userId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    if (cancelled.count === 0) {
      if (booking.status === 'PAID') {
        throw new ConflictError('Pemesanan yang sudah dibayar tidak dapat dibatalkan');
      }

      if (booking.status === 'CANCELLED') {
        throw new ConflictError('Pemesanan sudah dibatalkan');
      }

      if (booking.status === 'EXPIRED') {
        throw new ConflictError('Pemesanan sudah kedaluwarsa');
      }

      throw new ConflictError('Pemesanan tidak dapat dibatalkan');
    }

    for (const detail of booking.details) {
      await tx.ticketType.update({
        where: { id: detail.ticketTypeId },
        data: { availableStock: { increment: detail.quantity } },
      });
    }

    return tx.booking.findUnique({
      where: { id: bookingId },
      include: bookingInclude,
    });
  });
}
