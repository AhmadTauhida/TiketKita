import { sendSuccess } from '../../utils/api-response.js';
import { serializeCategory } from '../../utils/serializer.js';
import * as categoriesService from './service.js';

export async function listCategories(req, res) {
  const categories = await categoriesService.listCategories();

  return sendSuccess(res, {
    status: 200,
    message: 'Daftar kategori berhasil diambil',
    data: { items: categories.map(serializeCategory) },
  });
}
