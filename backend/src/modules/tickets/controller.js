import { sendSuccess } from '../../utils/api-response.js';
import {
  serializeTicketDetail,
  serializeTicketSummary,
} from '../../utils/serializer.js';
import * as ticketsService from './service.js';

export async function listTickets(req, res) {
  const result = await ticketsService.listTickets(
    req.userId,
    req.validatedQuery,
  );

  return sendSuccess(res, {
    status: 200,
    message: 'Daftar tiket berhasil diambil',
    data: {
      items: result.items.map(serializeTicketSummary),
      pagination: result.pagination,
    },
  });
}

export async function getTicket(req, res) {
  const ticket = await ticketsService.getTicket(req.userId, req.params.id);

  return sendSuccess(res, {
    status: 200,
    message: 'Detail tiket berhasil diambil',
    data: { ticket: serializeTicketDetail(ticket) },
  });
}
