import 'event_brief.dart';

class TicketSummary {
  const TicketSummary({
    required this.id,
    required this.ticketCode,
    required this.status,
    required this.issuedAt,
    required this.ticketTypeName,
    required this.bookingCode,
    required this.event,
  });

  final String id;
  final String ticketCode;
  final String status;
  final DateTime issuedAt;
  final String ticketTypeName;
  final String bookingCode;
  final EventBrief event;

  factory TicketSummary.fromJson(Map<String, dynamic> json) {
    return TicketSummary(
      id: json['id'] as String,
      ticketCode: json['ticketCode'] as String,
      status: json['status'] as String,
      issuedAt: DateTime.parse(json['issuedAt'] as String),
      ticketTypeName: json['ticketTypeName'] as String,
      bookingCode: json['bookingCode'] as String,
      event: EventBrief.fromJson(json['event'] as Map<String, dynamic>),
    );
  }
}
