class EventBrief {
  const EventBrief({
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

  factory EventBrief.fromJson(Map<String, dynamic> json) {
    return EventBrief(
      id: json['id'] as String,
      title: json['title'] as String,
      imageUrl: json['imageUrl'] as String?,
      eventDate: DateTime.parse(json['eventDate'] as String),
      location: json['location'] as String? ?? '',
    );
  }
}
