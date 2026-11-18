import { z } from 'zod';

import prisma from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';

const uuidSchema = z.uuid();

const ticketInclude = {
  bookingDetail: {
    include: {
      ticketType: { include: { event: true } },
      booking: { include: { user: true } },
    },
  },
};

export async function listTickets(userId, { status, page, limit }) {
  const where = {
    ...(status ? { status } : {}),
    bookingDetail: { booking: { userId } },
  };

  const [tickets, totalItems] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: ticketInclude,
      orderBy: [{ issuedAt: 'desc' }, { id: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.ticket.count({ where }),
  ]);

  return {
    items: tickets,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}

export async function getTicket(userId, ticketId) {
  if (!uuidSchema.safeParse(ticketId).success) {
    throw new NotFoundError('Tiket tidak ditemukan');
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: ticketId,
      bookingDetail: { booking: { userId } },
    },
    include: ticketInclude,
  });

  if (!ticket) {
    throw new NotFoundError('Tiket tidak ditemukan');
  }

  return ticket;
}
