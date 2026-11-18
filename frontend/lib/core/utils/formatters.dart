import 'package:intl/intl.dart';

String formatRupiah(num value) {
  return 'Rp ${NumberFormat.decimalPattern('id_ID').format(value)}';
}

String formatPriceLabel(int? minPrice, {required bool isSoldOut}) {
  if (isSoldOut) {
    return 'Habis';
  }

  if (minPrice == null) {
    return 'Belum ada tiket';
  }

  if (minPrice == 0) {
    return 'Gratis';
  }

  return 'Mulai dari ${formatRupiah(minPrice)}';
}

String formatEventDate(
  DateTime value, {
  bool includeDay = true,
  bool includeTime = true,
}) {
  final wib = value.toUtc().add(const Duration(hours: 7));
  final pattern = <String>[
    if (includeDay) 'EEE, ',
    'd MMM yyyy',
    if (includeTime) ' • HH.mm',
  ].join();

  return '${DateFormat(pattern, 'id_ID').format(wib)} WIB';
}

String formatCountdown(Duration duration) {
  final totalSeconds = duration.isNegative ? 0 : duration.inSeconds;
  final minutes = (totalSeconds ~/ 60).toString().padLeft(2, '0');
  final seconds = (totalSeconds % 60).toString().padLeft(2, '0');

  return '$minutes:$seconds';
}
