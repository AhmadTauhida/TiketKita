import { z } from 'zod';

const nameSchema = z
  .string({ message: 'Nama wajib diisi' })
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter');

const emailSchema = z
  .string({ message: 'Email wajib diisi' })
  .trim()
  .toLowerCase()
  .pipe(z.email('Format email tidak valid').max(150, 'Email maksimal 150 karakter'));

const phoneSchema = z
  .string({ message: 'Nomor telepon wajib diisi' })
  .regex(/^(\+62|62|0)8[0-9]{8,12}$/, 'Format nomor telepon tidak valid');

const passwordSchema = z
  .string({ message: 'Password wajib diisi' })
  .min(8, 'Password minimal 8 karakter')
  .regex(/[A-Za-z]/, 'Password harus mengandung huruf')
  .regex(/[0-9]/, 'Password harus mengandung angka');

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string({ message: 'Password wajib diisi' }).min(1, 'Password wajib diisi'),
});
