import { sendSuccess } from '../../utils/api-response.js';
import * as usersService from './service.js';

export async function getProfile(req, res) {
  const user = await usersService.getProfile(req.userId);

  return sendSuccess(res, {
    status: 200,
    message: 'Profil berhasil diambil',
    data: { user },
  });
}

export async function updateProfile(req, res) {
  const user = await usersService.updateProfile(req.userId, req.body);

  return sendSuccess(res, {
    status: 200,
    message: 'Profil berhasil diperbarui',
    data: { user },
  });
}
