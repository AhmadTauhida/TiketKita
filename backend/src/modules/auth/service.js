import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import prisma from '../../config/database.js';
import { env } from '../../config/env.js';
import { ConflictError, UnauthorizedError } from '../../utils/errors.js';
import { serializeUser } from '../../utils/serializer.js';

export async function register({ name, email, phone, password }) {
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new ConflictError('Email sudah terdaftar');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptRounds);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
      },
    });

    return serializeUser(user);
  } catch (error) {
    if (error?.code === 'P2002') {
      throw new ConflictError('Email sudah terdaftar');
    }

    throw error;
  }
}

export async function login({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    throw new UnauthorizedError('Email atau password salah');
  }

  const passwordMatches = await bcrypt.compare(password, user.password);

  if (!passwordMatches) {
    throw new UnauthorizedError('Email atau password salah');
  }

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });

  return {
    token,
    user: serializeUser(user),
  };
}
