import { z } from 'zod';

import prisma from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { expireOverdueBookings } from '../../utils/expire-bookings.js';

const uuidSchema = z.uuid();

const summaryInclude = {
  category: {
    select: { id: true, name: true },
  },
  ticketTypes: {
    select: { price: true, availableStock: true },
  },
};

const detailInclude = {
  category: {
    select: { id: true, name: true },
  },
  ticketTypes: {
    select: {
      id: true,
      name: true,
      description: true,
      price: true,
      quota: true,
      availableStock: true,
    },
    orderBy: { price: 'asc' },
  },
};

function buildWhere({ q, categoryId, status }) {
  const where = {};

  if (q) {
    where.OR = [
      { title: { contains: q, mode: 'insensitive' } },
      { organizer: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  where.status = status ?? { in: ['UPCOMING', 'ONGOING'] };

  return where;
}

export async function listEvents({ q, categoryId, status, page, limit }) {
  const where = buildWhere({ q, categoryId, status });

  const [events, totalItems] = await prisma.$transaction([
    prisma.event.findMany({
      where,
      include: summaryInclude,
      orderBy: [{ eventDate: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.event.count({ where }),
  ]);

  return {
    items: events,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}

export async function listFeaturedEvents() {
  return prisma.event.findMany({
    where: {
      status: 'UPCOMING',
      eventDate: { gt: new Date() },
    },
    include: summaryInclude,
    orderBy: [{ eventDate: 'asc' }, { id: 'asc' }],
    take: 5,
  });
}

export async function getEventDetail(eventId) {
  if (!uuidSchema.safeParse(eventId).success) {
    throw new NotFoundError('Acara tidak ditemukan');
  }

  return prisma.$transaction(
    async (tx) => {
      await expireOverdueBookings(tx);

      const event = await tx.event.findUnique({
        where: { id: eventId },
        include: detailInclude,
      });

      if (!event) {
        throw new NotFoundError('Acara tidak ditemukan');
      }

      return event;
    },
    { timeout: 15000 },
  );
}
