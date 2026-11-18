import { sendSuccess } from '../../utils/api-response.js';
import * as authService from './service.js';

export async function register(req, res) {
  const user = await authService.register(req.body);

  return sendSuccess(res, {
    status: 201,
    message: 'Registrasi berhasil',
    data: { user },
  });
}

export async function login(req, res) {
  const result = await authService.login(req.body);

  return sendSuccess(res, {
    status: 200,
    message: 'Login berhasil',
    data: result,
  });
}
