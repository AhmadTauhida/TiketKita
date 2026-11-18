import { sendSuccess } from '../../utils/api-response.js';
import { serializeEventDetail, serializeEventSummary } from '../../utils/serializer.js';
import * as eventsService from './service.js';

export async function listEvents(req, res) {
  const result = await eventsService.listEvents(req.validatedQuery);

  return sendSuccess(res, {
    status: 200,
    message: 'Daftar acara berhasil diambil',
    data: {
      items: result.items.map(serializeEventSummary),
      pagination: result.pagination,
    },
  });
}

export async function listFeaturedEvents(req, res) {
  const events = await eventsService.listFeaturedEvents();

  return sendSuccess(res, {
    status: 200,
    message: 'Acara unggulan berhasil diambil',
    data: { items: events.map(serializeEventSummary) },
  });
}

export async function getEventDetail(req, res) {
  const event = await eventsService.getEventDetail(req.params.id);

  return sendSuccess(res, {
    status: 200,
    message: 'Detail acara berhasil diambil',
    data: { event: serializeEventDetail(event) },
  });
}
