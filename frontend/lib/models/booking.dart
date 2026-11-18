import 'payment.dart';

class BookingEvent {
  const BookingEvent({
    required this.id,
    required this.title,
    required this.eventDate,
    required this.location,
    this.imageUrl,
  });

  final String id;
  final String title;
  final String? imageUrl;
  final DateTime eventDate;
  final String location;

  factory BookingEvent.fromJson(Map<String, dynamic> json) {
    return BookingEvent(
      id: json['id'] as String,
      title: json['title'] as String,
      imageUrl: json['imageUrl'] as String?,
      eventDate: DateTime.parse(json['eventDate'] as String),
      location: json['location'] as String? ?? '',
    );
  }
}

class BookingItem {
  const BookingItem({
    required this.id,
    required this.ticketTypeId,
    required this.ticketTypeName,
    required this.quantity,
    required this.unitPrice,
    required this.subtotal,
  });

  final String id;
  final String ticketTypeId;
  final String ticketTypeName;
  final int quantity;
  final int unitPrice;
  final int subtotal;

  factory BookingItem.fromJson(Map<String, dynamic> json) {
    return BookingItem(
      id: json['id'] as String,
      ticketTypeId: json['ticketTypeId'] as String,
      ticketTypeName: json['ticketTypeName'] as String,
      quantity: (json['quantity'] as num).toInt(),
      unitPrice: (json['unitPrice'] as num).toInt(),
      subtotal: (json['subtotal'] as num).toInt(),
    );
  }
}

class Booking {
  const Booking({
    required this.id,
    required this.bookingCode,
    required this.status,
    required this.totalAmount,
    required this.totalQuantity,
    required this.createdAt,
    required this.items,
    this.expiresAt,
    this.event,
    this.payment,
  });

  final String id;
  final String bookingCode;
  final String status;
  final int totalAmount;
  final int totalQuantity;
  final DateTime? expiresAt;
  final DateTime createdAt;
  final BookingEvent? event;
  final List<BookingItem> items;
  final Payment? payment;

  factory Booking.fromJson(Map<String, dynamic> json) {
    final eventJson = json['event'] as Map<String, dynamic>?;
    final items = json['items'] as List? ?? const [];

    return Booking(
      id: json['id'] as String,
      bookingCode: json['bookingCode'] as String,
      status: json['status'] as String,
      totalAmount: (json['totalAmount'] as num).toInt(),
      totalQuantity: (json['totalQuantity'] as num).toInt(),
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.parse(json['expiresAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      event: eventJson == null ? null : BookingEvent.fromJson(eventJson),
      items: items
          .whereType<Map<String, dynamic>>()
          .map(BookingItem.fromJson)
          .toList(),
      payment: json['payment'] == null
          ? null
          : Payment.fromJson(json['payment'] as Map<String, dynamic>),
    );
  }
}
