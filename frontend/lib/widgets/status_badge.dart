import 'package:flutter/material.dart';

import '../core/theme/app_theme.dart';

class StatusBadge extends StatelessWidget {
  const StatusBadge({
    super.key,
    required this.status,
    this.isTicket = false,
  });

  final String status;
  final bool isTicket;

  String get _label {
    if (isTicket) {
      switch (status) {
        case 'ACTIVE':
          return 'Aktif';
        case 'USED':
          return 'Terpakai';
        case 'CANCELLED':
          return 'Dibatalkan';
        default:
          return status;
      }
    }

    switch (status) {
      case 'PENDING':
        return 'Menunggu';
      case 'PAID':
        return 'Dibayar';
      case 'CANCELLED':
        return 'Dibatalkan';
      case 'EXPIRED':
        return 'Kedaluwarsa';
      default:
        return status;
    }
  }

  Color get _color {
    switch (status) {
      case 'PENDING':
        return AppColors.accent;
      case 'PAID':
      case 'ACTIVE':
        return AppColors.success;
      case 'CANCELLED':
        return AppColors.error;
      default:
        return Colors.grey.shade600;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        _label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: color,
              fontWeight: FontWeight.bold,
            ),
      ),
    );
  }
}
