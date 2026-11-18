import { sendSuccess } from '../../utils/api-response.js';
import { serializeBooking, serializePayment } from '../../utils/serializer.js';
import * as paymentsService from './service.js';

export async function createPayment(req, res) {
  const result = await paymentsService.payBooking(
    req.userId,
    req.params.bookingId,
    req.body,
  );

  return sendSuccess(res, {
    status: 200,
    message: 'Pembayaran berhasil',
    data: {
      booking: serializeBooking(result.booking),
      payment: serializePayment(result.payment),
      ticketCount: result.ticketCount,
    },
  });
}

export async function getPayment(req, res) {
  const payment = await paymentsService.getPayment(
    req.userId,
    req.params.bookingId,
  );

  return sendSuccess(res, {
    status: 200,
    message: 'Detail pembayaran berhasil diambil',
    data: { payment: serializePayment(payment) },
  });
}
