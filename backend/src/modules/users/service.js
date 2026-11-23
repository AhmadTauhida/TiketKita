import prisma from '../../config/database.js';
import { createObjectPath, storage } from '../../services/storage.js';
import { NotFoundError } from '../../utils/errors.js';
import { serializeUser } from '../../utils/serializer.js';

const AVATAR_FOLDER = 'avatars';

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

export async function uploadProfilePhoto(userId, file) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, profileImage: true },
  });

  if (!existing) {
    throw new NotFoundError('Pengguna tidak ditemukan');
  }

  const objectPath = createObjectPath({
    folder: AVATAR_FOLDER,
    ownerId: userId,
    extension: file.detectedExtension,
  });

  const uploaded = await storage.uploadObject({
    path: objectPath,
    buffer: file.buffer,
    contentType: file.detectedMimeType,
  });

  let user;

  try {
    user = await prisma.user.update({
      where: { id: userId },
      data: { profileImage: uploaded.url },
    });
  } catch (error) {
    await storage.deleteObjectByUrl(uploaded.url).catch(() => {});
    throw error;
  }

  if (existing.profileImage && existing.profileImage !== uploaded.url) {
    await storage.deleteObjectByUrl(existing.profileImage).catch(() => {});
  }

  return serializeUser(user);
}
