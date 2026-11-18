class TicketType {
  const TicketType({
    required this.id,
    required this.name,
    required this.price,
    required this.quota,
    required this.availableStock,
    this.description,
  });

  final String id;
  final String name;
  final String? description;
  final int price;
  final int quota;
  final int availableStock;

  factory TicketType.fromJson(Map<String, dynamic> json) {
    return TicketType(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      price: (json['price'] as num).toInt(),
      quota: (json['quota'] as num).toInt(),
      availableStock: (json['availableStock'] as num).toInt(),
    );
  }
}
