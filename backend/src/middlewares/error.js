import { ZodError } from 'zod';

import { AppError, ValidationError } from '../utils/errors.js';
import { sendError } from '../utils/api-response.js';

export function notFoundHandler(req, res) {
  return sendError(res, {
    status: 404,
    message: 'Endpoint tidak ditemukan',
  });
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ValidationError) {
    return sendError(res, {
      status: 422,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.') || 'body',
      message: issue.message,
    }));

    return sendError(res, {
      status: 422,
      message: 'Validasi gagal',
      errors,
    });
  }

  if (err instanceof AppError) {
    return sendError(res, {
      status: err.statusCode,
      message: err.message,
    });
  }

  if (err?.type === 'entity.parse.failed' || (err instanceof SyntaxError && err.status === 400)) {
    return sendError(res, {
      status: 400,
      message: 'JSON tidak dapat diparse',
    });
  }

  if (err?.code === 'P2002') {
    return sendError(res, {
      status: 409,
      message: 'Data sudah terdaftar',
    });
  }

  console.error(err);

  return sendError(res, {
    status: 500,
    message: 'Terjadi kesalahan pada server',
  });
}
