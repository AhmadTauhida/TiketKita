import { z } from 'zod';

const statusSchema = z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED'], {
  message: 'Status acara tidak valid',
});

export const listEventsQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  categoryId: z.uuid('Kategori tidak valid').optional(),
  status: statusSchema.optional(),
  page: z.coerce.number().int('Page harus bilangan bulat').min(1, 'Page minimal 1').default(1),
  limit: z.coerce
    .number()
    .int('Limit harus bilangan bulat')
    .min(1, 'Limit minimal 1')
    .max(50, 'Limit maksimal 50')
    .default(10),
});
