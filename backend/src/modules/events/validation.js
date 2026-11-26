import { z } from 'zod';

const statusSchema = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
  message: 'Status acara tidak valid',
});

const sortSchema = z.enum(['date_asc', 'date_desc'], {
  message: 'Urutan acara tidak valid',
});

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal tidak valid')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, 'Tanggal tidak valid');

export const listEventsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  categoryId: z.uuid('Kategori tidak valid').optional(),
  status: statusSchema.optional(),
  sort: sortSchema.default('date_asc'),
  date: dateOnlySchema.optional(),
  page: z.coerce.number().int('Page harus bilangan bulat').min(1, 'Page minimal 1').default(1),
  limit: z.coerce
    .number()
    .int('Limit harus bilangan bulat')
    .min(1, 'Limit minimal 1')
    .max(50, 'Limit maksimal 50')
    .default(10),
});
