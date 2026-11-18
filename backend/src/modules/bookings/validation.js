import { z } from 'zod';

const bookingItemSchema = z.object({
  ticketTypeId: z.uuid('Jenis tiket tidak valid'),
  quantity: z
    .number({ message: 'Jumlah tiket wajib diisi' })
    .int('Jumlah tiket harus bilangan bulat')
    .min(1, 'Jumlah tiket minimal 1')
    .max(10, 'Jumlah tiket maksimal 10'),
});

export const createBookingSchema = z.object({
  items: z
    .array(bookingItemSchema, { message: 'Items wajib berupa array' })
    .min(1, 'Minimal 1 jenis tiket')
    .max(5, 'Maksimal 5 jenis tiket')
    .refine(
      (items) => new Set(items.map((item) => item.ticketTypeId)).size === items.length,
      { message: 'Jenis tiket tidak boleh duplikat' },
    )
    .refine(
      (items) => items.reduce((total, item) => total + item.quantity, 0) <= 10,
      { message: 'Total tiket maksimal 10' },
    ),
});

export const listBookingsQuerySchema = z.object({
  status: z
    .enum(['PENDING', 'PAID', 'CANCELLED', 'EXPIRED'], {
      message: 'Status pemesanan tidak valid',
    })
    .optional(),
  page: z.coerce.number().int('Page harus bilangan bulat').min(1, 'Page minimal 1').default(1),
  limit: z.coerce
    .number()
    .int('Limit harus bilangan bulat')
    .min(1, 'Limit minimal 1')
    .max(50, 'Limit maksimal 50')
    .default(10),
});
