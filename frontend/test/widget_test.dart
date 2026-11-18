import 'package:flutter_test/flutter_test.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:tiketkita/core/utils/formatters.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('id_ID');
  });

  test('formatRupiah memakai pemisah ribuan Indonesia', () {
    expect(formatRupiah(150000), 'Rp 150.000');
  });

  test('formatPriceLabel menangani gratis, habis, dan minimal', () {
    expect(formatPriceLabel(0, isSoldOut: false), 'Gratis');
    expect(formatPriceLabel(50000, isSoldOut: true), 'Habis');
    expect(
      formatPriceLabel(50000, isSoldOut: false),
      'Mulai dari Rp 50.000',
    );
  });

  test('formatEventDate dikonversi ke WIB', () {
    expect(
      formatEventDate(DateTime.utc(2026, 12, 12, 3)),
      'Sab, 12 Des 2026 • 10.00 WIB',
    );
  });

  test('formatCountdown menampilkan mm:ss', () {
    expect(formatCountdown(const Duration(minutes: 15)), '15:00');
    expect(formatCountdown(const Duration(seconds: 65)), '01:05');
    expect(formatCountdown(const Duration(seconds: -1)), '00:00');
  });
}
