import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';
import '../core/utils/formatters.dart';
import '../models/booking.dart';
import 'status_badge.dart';

class BookingCard extends StatelessWidget {
  const BookingCard({super.key, required this.booking, required this.onTap});

  final Booking booking;
  final VoidCallback onTap;

  String get _totalLabel => booking.totalAmount == 0
      ? 'Gratis'
      : formatRupiah(booking.totalAmount);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Text(
                      booking.event?.title ?? 'Acara',
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleSmall
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                  ),
                  const SizedBox(width: 8),
                  StatusBadge(status: booking.status),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                booking.bookingCode,
                style: theme.textTheme.bodySmall,
              ),
              const SizedBox(height: 2),
              Text(
                formatEventDate(booking.createdAt),
                style: theme.textTheme.bodySmall,
              ),
              const Divider(height: 20),
              Row(
                children: [
                  Text(
                    '${booking.totalQuantity} tiket',
                    style: theme.textTheme.bodySmall,
                  ),
                  const Spacer(),
                  Text(
                    _totalLabel,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.chevron_right_rounded),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
