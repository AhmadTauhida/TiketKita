export function sendSuccess(res, { status = 200, message = 'Berhasil', data = null } = {}) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

export function sendError(res, { status = 500, message = 'Terjadi kesalahan pada server', errors } = {}) {
  const body = {
    success: false,
    message,
    data: null,
  };

  if (errors) {
    body.errors = errors;
  }

  return res.status(status).json(body);
}
