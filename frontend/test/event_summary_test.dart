import 'package:flutter_test/flutter_test.dart';
import 'package:tiketkita/models/category.dart';
import 'package:tiketkita/models/event_summary.dart';

const category = Category(id: 'category-1', name: 'Seminar');

EventSummary event({
  required String status,
  required DateTime eventDate,
  DateTime? endDate,
  bool isSoldOut = false,
}) {
  return EventSummary(
    id: 'event-1',
    title: 'Acara Uji',
    category: category,
    organizer: 'Himpunan',
    location: 'Auditorium',
    eventDate: eventDate,
    endDate: endDate,
    status: status,
    isSoldOut: isSoldOut,
  );
}

void main() {
  final now = DateTime.now();

  test('menandai acara yang sudah lewat sebagai selesai', () {
    final past = event(
      status: 'UPCOMING',
      eventDate: now.subtract(const Duration(days: 2)),
      endDate: now.subtract(const Duration(days: 1)),
    );

    expect(past.isCompleted, isTrue);
    expect(past.isUnavailable, isTrue);
    expect(past.statusLabel, 'Acara Selesai');
  });

  test('menandai acara yang sedang berlangsung', () {
    final ongoing = event(
      status: 'ONGOING',
      eventDate: now.subtract(const Duration(hours: 1)),
      endDate: now.add(const Duration(hours: 1)),
    );

    expect(ongoing.isOngoing, isTrue);
    expect(ongoing.isUnavailable, isFalse);
    expect(ongoing.statusLabel, 'Sedang Berlangsung');
  });

  test('menandai acara yang tiketnya habis', () {
    final soldOut = event(
      status: 'UPCOMING',
      eventDate: now.add(const Duration(days: 1)),
      isSoldOut: true,
    );

    expect(soldOut.isUnavailable, isTrue);
    expect(soldOut.statusLabel, 'Tiket Habis');
  });

  test('menandai acara yang dibatalkan', () {
    final cancelled = event(
      status: 'CANCELLED',
      eventDate: now.add(const Duration(days: 1)),
    );

    expect(cancelled.isCancelled, isTrue);
    expect(cancelled.isUnavailable, isTrue);
    expect(cancelled.statusLabel, 'Acara Dibatalkan');
  });
}
