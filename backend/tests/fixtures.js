import prisma from '../src/config/database.js';

export function futureDate(days = 5) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function pastDate(days = 5) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function createCategory(overrides = {}) {
  return prisma.category.create({
    data: {
      name: 'Seminar',
      description: 'Seminar dan konferensi',
      icon: 'school',
      ...overrides,
    },
  });
}

export async function createEvent({
  categoryId,
  title,
  organizer = 'Himpunan Informatika',
  location = 'Auditorium Utama',
  address = 'Jl. Merdeka No. 10, Jakarta',
  description = 'Deskripsi acara untuk pengujian. Kalimat kedua sebagai pelengkap.',
  status = 'UPCOMING',
  eventDate = futureDate(5),
  endDate = null,
  ticketTypes = [],
}) {
  return prisma.event.create({
    data: {
      categoryId,
      title,
      organizer,
      location,
      address,
      description,
      status,
      eventDate,
      endDate,
      imageUrl: `https://picsum.photos/seed/${title.toLowerCase().replace(/\s+/g, '-')}/800/450`,
      ticketTypes: {
        create: ticketTypes,
      },
    },
  });
}

export function ticketType(name, price, quota, availableStock = quota) {
  return { name, price, quota, availableStock };
}
