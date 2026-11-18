import 'ticket.dart';

class TicketDetail {
  const TicketDetail({
    required this.summary,
    required this.qrToken,
    required this.ownerName,
    this.usedAt,
    this.address,
  });

  final TicketSummary summary;
  final String qrToken;
  final String ownerName;
  final DateTime? usedAt;
  final String? address;

  factory TicketDetail.fromJson(Map<String, dynamic> json) {
    final event = json['event'] as Map<String, dynamic>;

    return TicketDetail(
      summary: TicketSummary.fromJson(json),
      qrToken: json['qrToken'] as String,
      ownerName: json['ownerName'] as String? ?? '',
      usedAt: json['usedAt'] == null
          ? null
          : DateTime.parse(json['usedAt'] as String),
      address: event['address'] as String?,
    );
  }
}
