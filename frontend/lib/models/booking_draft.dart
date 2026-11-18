import 'event_detail.dart';
import 'ticket_type.dart';

class BookingDraft {
  const BookingDraft({required this.event, required this.quantities});

  final EventDetail event;
  final Map<String, int> quantities;

  int quantityFor(String ticketTypeId) => quantities[ticketTypeId] ?? 0;

  int get totalQuantity =>
      quantities.values.fold(0, (total, quantity) => total + quantity);

  int get totalAmount {
    return event.ticketTypes.fold(0, (total, type) {
      return total + quantityFor(type.id) * type.price;
    });
  }

  List<MapEntry<TicketType, int>> get items {
    return event.ticketTypes
        .where((type) => quantityFor(type.id) > 0)
        .map((type) => MapEntry(type, quantityFor(type.id)))
        .toList();
  }
}
