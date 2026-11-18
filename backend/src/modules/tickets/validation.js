import { z } from 'zod';

export const listTicketsQuerySchema = z.object({
  status: z
    .enum(['ACTIVE', 'USED', 'CANCELLED'], {
      message: 'Status tiket tidak valid',
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
