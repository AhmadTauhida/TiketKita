import { z } from 'zod';

const nameSchema = z
  .string({ message: 'Nama wajib diisi' })
  .trim()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter');

const phoneSchema = z
  .string({ message: 'Nomor telepon wajib diisi' })
  .regex(/^(\+62|62|0)8[0-9]{8,12}$/, 'Format nomor telepon tidak valid');

const profileImageSchema = z
  .url('URL foto tidak valid')
  .refine((value) => /^https?:\/\//i.test(value), 'URL foto harus diawali http:// atau https://')
  .nullable()
  .optional();

export const updateProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  profileImage: profileImageSchema,
});
