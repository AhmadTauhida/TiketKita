import '../core/network/api_client.dart';
import '../models/api_page.dart';
import '../models/ticket.dart';

class TicketService {
  TicketService(this._api);

  final ApiClient _api;

  Future<ApiPage<TicketSummary>> listTickets({
    String? status,
    int page = 1,
    int limit = 50,
  }) async {
    final query = <String, String>{
      'page': '$page',
      'limit': '$limit',
      if (status != null && status.isNotEmpty) 'status': status,
    };

    final data =
        await _api.get('/tickets', query: query) as Map<String, dynamic>;

    return ApiPage.fromJson(data, TicketSummary.fromJson);
  }
}
