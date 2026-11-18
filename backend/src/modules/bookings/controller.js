import { sendSuccess } from '../../utils/api-response.js';
import { serializeBooking } from '../../utils/serializer.js';
import * as bookingsService from './service.js';

export async function createBooking(req, res) {
  const booking = await bookingsService.createBooking(req.userId, req.body);

  return sendSuccess(res, {
    status: 201,
    message: 'Pemesanan berhasil dibuat',
    data: { booking: serializeBooking(booking) },
  });
}

export async function listBookings(req, res) {
  const result = await bookingsService.listBookings(req.userId, req.validatedQuery);

  return sendSuccess(res, {
    status: 200,
    message: 'Daftar pemesanan berhasil diambil',
    data: {
      items: result.items.map(serializeBooking),
      pagination: result.pagination,
    },
  });
}

export async function getBooking(req, res) {
  const booking = await bookingsService.getBooking(req.userId, req.params.id);

  return sendSuccess(res, {
    status: 200,
    message: 'Detail pemesanan berhasil diambil',
    data: { booking: serializeBooking(booking) },
  });
}

export async function cancelBooking(req, res) {
  const booking = await bookingsService.cancelBooking(req.userId, req.params.id);

  return sendSuccess(res, {
    status: 200,
    message: 'Pemesanan berhasil dibatalkan',
    data: { booking: serializeBooking(booking) },
  });
}
