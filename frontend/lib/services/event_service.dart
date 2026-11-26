import '../core/network/api_client.dart';
import '../models/api_page.dart';
import '../models/category.dart';
import '../models/event_detail.dart';
import '../models/event_summary.dart';

class EventService {
  EventService(this._api);

  final ApiClient _api;

  Future<ApiPage<EventSummary>> getEvents({
    String? q,
    String? categoryId,
    String? status,
    String sort = 'date_asc',
    String? date,
    int page = 1,
    int limit = 10,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'limit': '$limit',
      'sort': sort,
      if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
      if (categoryId != null && categoryId.isNotEmpty) 'categoryId': categoryId,
      if (status != null && status.isNotEmpty) 'status': status,
      if (date != null && date.isNotEmpty) 'date': date,
    };

    final data =
        await _api.get('/events', query: query) as Map<String, dynamic>;
    return ApiPage.fromJson(data, EventSummary.fromJson);
  }

  Future<List<EventSummary>> getFeatured() async {
    final data = await _api.get('/events/featured') as Map<String, dynamic>;
    final items = data['items'] as List? ?? const [];

    return items
        .whereType<Map<String, dynamic>>()
        .map(EventSummary.fromJson)
        .toList();
  }

  Future<List<Category>> getCategories() async {
    final data = await _api.get('/categories') as Map<String, dynamic>;
    final items = data['items'] as List? ?? const [];

    return items
        .whereType<Map<String, dynamic>>()
        .map(Category.fromJson)
        .toList();
  }

  Future<EventDetail> getEventDetail(String eventId) async {
    final data =
        await _api.get('/events/$eventId') as Map<String, dynamic>;
    return EventDetail.fromJson(data['event'] as Map<String, dynamic>);
  }
}
