class ApiPage<T> {
  const ApiPage({
    required this.items,
    required this.page,
    required this.limit,
    required this.totalItems,
    required this.totalPages,
  });

  final List<T> items;
  final int page;
  final int limit;
  final int totalItems;
  final int totalPages;

  factory ApiPage.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromItem,
  ) {
    final pagination = json['pagination'] as Map<String, dynamic>? ?? const {};
    final rawItems = json['items'] as List? ?? const [];

    return ApiPage(
      items: rawItems
          .whereType<Map<String, dynamic>>()
          .map(fromItem)
          .toList(),
      page: (pagination['page'] as num?)?.toInt() ?? 1,
      limit: (pagination['limit'] as num?)?.toInt() ?? rawItems.length,
      totalItems:
          (pagination['totalItems'] as num?)?.toInt() ?? rawItems.length,
      totalPages: (pagination['totalPages'] as num?)?.toInt() ?? 1,
    );
  }
}
