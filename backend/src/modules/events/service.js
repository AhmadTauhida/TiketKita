import { z } from 'zod';

import prisma from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { expireOverdueBookings } from '../../utils/expire-bookings.js';
import { syncEventStatuses } from '../../utils/sync-event-statuses.js';

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

function buildWhere({ q, categoryId, status, date }) {
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

  if (date) {
    const dayStart = new Date(`${date}T00:00:00+07:00`);
    const dayEnd = new Date(`${date}T23:59:59.999+07:00`);

    where.AND = [
      { eventDate: { lte: dayEnd } },
      {
        OR: [
          { eventDate: { gte: dayStart } },
          { endDate: { gte: dayStart } },
        ],
      },
    ];
  }

  where.status = status ?? { in: ['UPCOMING', 'ONGOING'] };

  return where;
}

function buildOrderBy(sort) {
  return sort === 'date_desc'
    ? [{ eventDate: 'desc' }, { id: 'asc' }]
    : [{ eventDate: 'asc' }, { id: 'asc' }];
}

export async function listEvents({ q, categoryId, status, sort, date, page, limit }) {
  const where = buildWhere({ q, categoryId, status, date });

  return prisma.$transaction(async (tx) => {
    await syncEventStatuses(tx);

    const [events, totalItems] = await Promise.all([
      tx.event.findMany({
        where,
        include: summaryInclude,
        orderBy: buildOrderBy(sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      tx.event.count({ where }),
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
  });
}

export async function listFeaturedEvents() {
  return prisma.$transaction(async (tx) => {
    await syncEventStatuses(tx);

    return tx.event.findMany({
      where: {
        status: 'UPCOMING',
        eventDate: { gt: new Date() },
      },
      include: summaryInclude,
      orderBy: [{ eventDate: 'asc' }, { id: 'asc' }],
      take: 5,
    });
  });
}

export async function getEventDetail(eventId) {
  if (!uuidSchema.safeParse(eventId).success) {
    throw new NotFoundError('Acara tidak ditemukan');
  }

  return prisma.$transaction(
    async (tx) => {
      await expireOverdueBookings(tx);
      await syncEventStatuses(tx);

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
