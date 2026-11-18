import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';
import { UnauthorizedError } from '../utils/errors.js';

export function authenticate(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token tidak ditemukan'));
  }

  const token = header.slice('Bearer '.length).trim();

  if (!token) {
    return next(new UnauthorizedError('Token tidak ditemukan'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });

    if (typeof payload !== 'object' || !payload.sub) {
      throw new Error('Token tidak memiliki subject');
    }

    req.userId = payload.sub;
    return next();
  } catch {
    return next(new UnauthorizedError('Token tidak valid atau sudah kedaluwarsa'));
  }
}
