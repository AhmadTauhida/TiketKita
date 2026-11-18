import '../core/network/api_client.dart';
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
}
