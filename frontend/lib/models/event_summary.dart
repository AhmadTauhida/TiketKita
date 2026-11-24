import 'category.dart';

class EventSummary {
  const EventSummary({
    required this.id,
    required this.title,
    required this.category,
    required this.organizer,
    required this.location,
    required this.eventDate,
    required this.status,
    this.imageUrl,
    this.endDate,
    this.minPrice,
    this.isSoldOut = false,
  });

  final String id;
  final String title;
  final String? imageUrl;
  final Category category;
  final String organizer;
  final String location;
  final DateTime eventDate;
  final DateTime? endDate;
  final String status;
  final int? minPrice;
  final bool isSoldOut;

  bool get isCancelled => status == 'CANCELLED';

  bool get isCompleted =>
      status == 'COMPLETED' ||
      (!isCancelled &&
          (endDate?.isBefore(DateTime.now()) ??
              eventDate.isBefore(DateTime.now())));

  bool get isOngoing => status == 'ONGOING' && !isCompleted;

  bool get isPast => isCompleted;

  bool get isUnavailable => isSoldOut || isCompleted || isCancelled;

  String? get statusLabel {
    if (isCancelled) {
      return 'Acara Dibatalkan';
    }

    if (isCompleted) {
      return 'Acara Selesai';
    }

    if (isOngoing) {
      return 'Sedang Berlangsung';
    }

    if (isSoldOut) {
      return 'Tiket Habis';
    }

    return null;
  }

  factory EventSummary.fromJson(Map<String, dynamic> json) {
    return EventSummary(
      id: json['id'] as String,
      title: json['title'] as String,
      imageUrl: json['imageUrl'] as String?,
      category: Category.fromJson(json['category'] as Map<String, dynamic>),
      organizer: json['organizer'] as String? ?? '',
      location: json['location'] as String? ?? '',
      eventDate: DateTime.parse(json['eventDate'] as String),
      endDate: json['endDate'] == null
          ? null
          : DateTime.parse(json['endDate'] as String),
      status: json['status'] as String? ?? 'UPCOMING',
      minPrice: (json['minPrice'] as num?)?.toInt(),
      isSoldOut: json['isSoldOut'] as bool? ?? false,
    );
  }
}
