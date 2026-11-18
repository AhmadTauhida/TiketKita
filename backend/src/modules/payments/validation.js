import { z } from 'zod';

export const createPaymentSchema = z.object({
  paymentMethod: z.enum(['BANK_TRANSFER', 'E_WALLET', 'QRIS'], {
    message: 'Metode pembayaran tidak valid',
  }),
});
