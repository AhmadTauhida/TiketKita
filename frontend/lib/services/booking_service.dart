import '../core/network/api_client.dart';
import '../models/api_page.dart';
import '../models/booking.dart';

typedef BookingItemInput = ({String ticketTypeId, int quantity});

class BookingService {
  BookingService(this._api);

  final ApiClient _api;

  Future<Booking> createBooking(List<BookingItemInput> items) async {
    final data = await _api.post(
      '/bookings',
      body: {
        'items': items
            .map(
              (item) => {
                'ticketTypeId': item.ticketTypeId,
                'quantity': item.quantity,
              },
            )
            .toList(),
      },
    ) as Map<String, dynamic>;

    return Booking.fromJson(data['booking'] as Map<String, dynamic>);
  }

  Future<Booking> getBooking(String bookingId) async {
    final data =
        await _api.get('/bookings/$bookingId') as Map<String, dynamic>;

    return Booking.fromJson(data['booking'] as Map<String, dynamic>);
  }

  Future<ApiPage<Booking>> listBookings({
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
        await _api.get('/bookings', query: query) as Map<String, dynamic>;

    return ApiPage.fromJson(data, Booking.fromJson);
  }

  Future<Booking> cancelBooking(String bookingId) async {
    final data = await _api.patch(
      '/bookings/$bookingId/cancel',
    ) as Map<String, dynamic>;

    return Booking.fromJson(data['booking'] as Map<String, dynamic>);
  }
}
