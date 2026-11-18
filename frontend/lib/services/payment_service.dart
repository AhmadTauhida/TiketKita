import '../core/network/api_client.dart';
import '../models/booking.dart';

class PaymentService {
  PaymentService(this._api);

  final ApiClient _api;

  Future<Booking> pay({
    required String bookingId,
    required String paymentMethod,
  }) async {
    final data = await _api.post(
      '/payments/$bookingId',
      body: {'paymentMethod': paymentMethod},
    ) as Map<String, dynamic>;

    return Booking.fromJson(data['booking'] as Map<String, dynamic>);
  }
}
