import prisma from '../../config/database.js';
import { NotFoundError } from '../../utils/errors.js';
import { serializeUser } from '../../utils/serializer.js';

export async function getProfile(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new NotFoundError('Pengguna tidak ditemukan');
  }

  return serializeUser(user);
}

export async function updateProfile(userId, { name, phone, profileImage }) {
  const data = { name, phone };

  if (profileImage !== undefined) {
    data.profileImage = profileImage;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return serializeUser(user);
}
