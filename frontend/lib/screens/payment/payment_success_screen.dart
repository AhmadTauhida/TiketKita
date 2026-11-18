import 'package:flutter/material.dart';

import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/booking.dart';
import '../../routes/app_routes.dart';

class PaymentSuccessScreen extends StatelessWidget {
  const PaymentSuccessScreen({super.key, required this.booking});

  final Booking booking;

  void _goHome(BuildContext context) {
    Navigator.of(context).pushNamedAndRemoveUntil(
      AppRoutes.main,
      (_) => false,
      arguments: 0,
    );
  }

  void _goTickets(BuildContext context) {
    Navigator.of(context).pushNamedAndRemoveUntil(
      AppRoutes.main,
      (_) => false,
      arguments: 2,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final total = booking.totalAmount == 0
        ? 'Gratis'
        : formatRupiah(booking.totalAmount);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _goHome(context);
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                const Spacer(),
                const Icon(
                  Icons.check_circle_rounded,
                  size: 88,
                  color: AppColors.success,
                ),
                const SizedBox(height: 16),
                Text(
                  'Pembayaran Berhasil',
                  style: theme.textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tiket digitalmu sudah diterbitkan.',
                  textAlign: TextAlign.center,
                  style: theme.textTheme.bodyMedium,
                ),
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Text(
                          'Kode Booking',
                          style: theme.textTheme.bodySmall,
                        ),
                        const SizedBox(height: 2),
                        SelectableText(
                          booking.bookingCode,
                          style: theme.textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const Divider(height: 24),
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                'Total',
                                style: theme.textTheme.titleSmall,
                              ),
                            ),
                            Text(
                              total,
                              style: theme.textTheme.titleMedium?.copyWith(
                                color: AppColors.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    onPressed: () => _goTickets(context),
                    child: const Text('Lihat Tiket'),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: OutlinedButton(
                    onPressed: () => _goHome(context),
                    child: const Text('Kembali ke Beranda'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
