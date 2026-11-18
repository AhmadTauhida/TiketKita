import './load-env.js';

import { afterAll, beforeEach } from 'vitest';

import prisma from '../src/config/database.js';

beforeEach(async () => {
  await prisma.ticket.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.bookingDetail.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.event.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
