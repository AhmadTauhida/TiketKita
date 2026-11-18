import { z } from 'zod';

import prisma from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import { expireOverdueBookings } from '../../utils/expire-bookings.js';
import {
  generateQrToken,
  generateTicketCode,
  generateTransactionReference,
} from '../../utils/generate-code.js';
import { bookingInclude } from '../bookings/service.js';

const uuidSchema = z.uuid();
const MAX_ATTEMPTS = 5;

function conflictForStatus(status) {
  if (status === 'PAID') {
    return new ConflictError('Pemesanan sudah dibayar');
  }

  if (status === 'CANCELLED') {
    return new ConflictError('Pemesanan telah dibatalkan');
  }

  if (status === 'EXPIRED') {
    return new ConflictError('Waktu pembayaran telah habis');
  }

  return new ConflictError('Pemesanan tidak dapat dibayar');
}

export async function payBooking(userId, bookingId, { paymentMethod }) {
  if (!uuidSchema.safeParse(bookingId).success) {
    throw new NotFoundError('Pemesanan tidak ditemukan');
  }

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          await expireOverdueBookings(tx, { userId, bookingId });

          const booking = await tx.booking.findFirst({
            where: { id: bookingId, userId },
            include: bookingInclude,
          });

          if (!booking) {
            throw new NotFoundError('Pemesanan tidak ditemukan');
          }

          if (booking.status !== 'PENDING') {
            return { conflict: booking.status };
          }

          const paidAt = new Date();
          const paymentData = {
            paymentMethod,
            amount: booking.totalAmount,
            status: 'SUCCESS',
            transactionReference: generateTransactionReference(),
            paidAt,
          };

          const payment = booking.payment
            ? await tx.payment.update({
                where: { bookingId },
                data: paymentData,
              })
            : await tx.payment.create({
                data: { bookingId, ...paymentData },
              });

          const updated = await tx.booking.updateMany({
            where: { id: bookingId, userId, status: 'PENDING' },
            data: { status: 'PAID' },
          });

          if (updated.count === 0) {
            const current = await tx.booking.findUnique({
              where: { id: bookingId },
            });

            throw conflictForStatus(current?.status);
          }

          const ticketRows = [];

          for (const detail of booking.details) {
            for (let index = 0; index < detail.quantity; index += 1) {
              ticketRows.push({
                bookingDetailId: detail.id,
                ticketCode: generateTicketCode(),
                qrToken: generateQrToken(),
                status: 'ACTIVE',
                issuedAt: paidAt,
              });
            }
          }

          await tx.ticket.createMany({ data: ticketRows });

          const latest = await tx.booking.findUnique({
            where: { id: bookingId },
            include: bookingInclude,
          });

          return {
            booking: latest,
            payment,
            ticketCount: ticketRows.length,
          };
        },
        { maxWait: 5000, timeout: 15000 },
      );

      if (result.conflict) {
        throw conflictForStatus(result.conflict);
      }

      return result;
    } catch (error) {
      if (error?.code === 'P2002') {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { status: true },
        });

        if (booking?.status === 'PAID') {
          throw new ConflictError('Pemesanan sudah dibayar');
        }

        if (attempt < MAX_ATTEMPTS) {
          continue;
        }

        throw new ConflictError('Gagal memproses pembayaran');
      }

      throw error;
    }
  }

  throw new ConflictError('Gagal memproses pembayaran');
}

export async function getPayment(userId, bookingId) {
  if (!uuidSchema.safeParse(bookingId).success) {
    throw new NotFoundError('Pemesanan tidak ditemukan');
  }

  const booking = await prisma.booking.findFirst({
    where: { id: bookingId, userId },
    include: { payment: true },
  });

  if (!booking) {
    throw new NotFoundError('Pemesanan tidak ditemukan');
  }

  if (!booking.payment) {
    throw new NotFoundError('Pembayaran belum dibuat');
  }

  return booking.payment;
}
