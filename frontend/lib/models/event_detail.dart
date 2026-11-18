import 'category.dart';
import 'ticket_type.dart';

class EventDetail {
  const EventDetail({
    required this.id,
    required this.title,
    required this.category,
    required this.organizer,
    required this.location,
    required this.eventDate,
    required this.status,
    required this.description,
    required this.canBook,
    required this.ticketTypes,
    this.imageUrl,
    this.endDate,
    this.address,
    this.minPrice,
    this.isSoldOut = false,
  });

  final String id;
  final String title;
  final String? imageUrl;
  final Category category;
  final String organizer;
  final String location;
  final String? address;
  final DateTime eventDate;
  final DateTime? endDate;
  final String status;
  final String description;
  final bool canBook;
  final int? minPrice;
  final bool isSoldOut;
  final List<TicketType> ticketTypes;

  factory EventDetail.fromJson(Map<String, dynamic> json) {
    final types = json['ticketTypes'] as List? ?? const [];

    return EventDetail(
      id: json['id'] as String,
      title: json['title'] as String,
      imageUrl: json['imageUrl'] as String?,
      category: Category.fromJson(json['category'] as Map<String, dynamic>),
      organizer: json['organizer'] as String? ?? '',
      location: json['location'] as String? ?? '',
      address: json['address'] as String?,
      eventDate: DateTime.parse(json['eventDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      status: json['status'] as String? ?? 'UPCOMING',
      description: json['description'] as String? ?? '',
      canBook: json['canBook'] as bool? ?? false,
      minPrice: (json['minPrice'] as num?)?.toInt(),
      isSoldOut: json['isSoldOut'] as bool? ?? false,
      ticketTypes: types
          .whereType<Map<String, dynamic>>()
          .map(TicketType.fromJson)
          .toList(),
    );
  }
}
