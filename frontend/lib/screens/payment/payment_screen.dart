import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/booking.dart';
import '../../routes/app_routes.dart';
import '../../services/booking_service.dart';
import '../../services/payment_service.dart';
import '../../widgets/form_error_banner.dart';

class _PaymentOption {
  const _PaymentOption(this.value, this.label, this.icon);

  final String value;
  final String label;
  final IconData icon;
}

const _paymentOptions = <_PaymentOption>[
  _PaymentOption(
    'BANK_TRANSFER',
    'Transfer Bank',
    Icons.account_balance_rounded,
  ),
  _PaymentOption('E_WALLET', 'E-Wallet', Icons.wallet_rounded),
  _PaymentOption('QRIS', 'QRIS', Icons.qr_code_2_rounded),
];

class PaymentScreen extends StatefulWidget {
  const PaymentScreen({super.key, required this.booking});

  final Booking booking;

  @override
  State<PaymentScreen> createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  late Booking _booking = widget.booking;
  String _method = 'BANK_TRANSFER';
  String? _error;
  bool _loading = false;
  bool _expired = false;
  bool _reloadRequested = false;
  Duration _remaining = Duration.zero;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _updateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        _updateRemaining();
      }
    });
  }

  void _updateRemaining() {
    final expiresAt = _booking.expiresAt;

    if (expiresAt == null) {
      return;
    }

    final remaining = expiresAt.difference(DateTime.now());

    if (remaining.isNegative) {
      _timer?.cancel();
      setState(() {
        _remaining = Duration.zero;
        _expired = true;
      });

      if (!_reloadRequested) {
        _reloadRequested = true;
        _reloadBooking();
      }

      return;
    }

    setState(() => _remaining = remaining);
  }

  Future<void> _reloadBooking() async {
    try {
      final booking =
          await context.read<BookingService>().getBooking(_booking.id);

      if (!mounted) {
        return;
      }

      setState(() {
        _booking = booking;
        _expired = booking.status == 'EXPIRED';
      });
    } catch (_) {
      // Biarkan status terakhir bila pemuatan ulang gagal.
    }
  }

  Future<void> _pay() async {
    if (_loading || _expired || _booking.status != 'PENDING') {
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final booking = await context.read<PaymentService>().pay(
            bookingId: _booking.id,
            paymentMethod: _method,
          );

      if (!mounted) {
        return;
      }

      Navigator.of(context).pushReplacementNamed(
        AppRoutes.paymentSuccess,
        arguments: booking,
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      if (error.statusCode == 409 &&
          error.message == 'Pemesanan sudah dibayar') {
        await _openSuccessAfterReload();
        return;
      }

      setState(() {
        _loading = false;
        _error = error.message;
      });

      if (error.statusCode == 409) {
        _reloadBooking();
      }
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loading = false;
        _error = 'Terjadi kesalahan saat memproses pembayaran.';
      });
    }
  }

  Future<void> _openSuccessAfterReload() async {
    try {
      final booking =
          await context.read<BookingService>().getBooking(_booking.id);

      if (!mounted) {
        return;
      }

      Navigator.of(context).pushReplacementNamed(
        AppRoutes.paymentSuccess,
        arguments: booking,
      );
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loading = false;
        _error = error.message;
      });
    }
  }

  String get _totalLabel => _booking.totalAmount == 0
      ? 'Gratis'
      : formatRupiah(_booking.totalAmount);

  String? get _statusMessage {
    if (_expired || _booking.status == 'EXPIRED') {
      return 'Waktu pembayaran telah habis';
    }

    if (_booking.status == 'CANCELLED') {
      return 'Pemesanan telah dibatalkan';
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statusMessage = _statusMessage;
    final canPay = _booking.status == 'PENDING' && !_expired && !_loading;

    return PopScope(
      canPop: true,
      onPopInvokedWithResult: (didPop, result) {
        if (didPop && _booking.status == 'PENDING') {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Pesanan tersimpan, selesaikan pembayaran dalam 15 menit.',
              ),
            ),
          );
        }
      },
      child: Scaffold(
        appBar: AppBar(title: const Text('Pembayaran')),
        body: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.06),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.timer_outlined,
                    color: AppColors.primary,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Sisa waktu pembayaran',
                          style: theme.textTheme.bodySmall,
                        ),
                        Text(
                          formatCountdown(_remaining),
                          style: theme.textTheme.headlineSmall?.copyWith(
                            color: AppColors.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Kode Booking',
                      style: theme.textTheme.bodySmall,
                    ),
                    const SizedBox(height: 2),
                    SelectableText(
                      _booking.bookingCode,
                      style: theme.textTheme.titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold),
                    ),
                    const Divider(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            'Total Pembayaran',
                            style: theme.textTheme.titleSmall,
                          ),
                        ),
                        Text(
                          _totalLabel,
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
            if (statusMessage != null) ...[
              const SizedBox(height: 16),
              FormErrorBanner(message: statusMessage),
            ],
            if (_error != null) ...[
              const SizedBox(height: 16),
              FormErrorBanner(message: _error!),
            ],
            const SizedBox(height: 24),
            Text(
              'Metode Pembayaran',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            for (final option in _paymentOptions)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _MethodCard(
                  option: option,
                  selected: _method == option.value,
                  enabled: canPay,
                  onTap: () => setState(() => _method = option.value),
                ),
              ),
            const SizedBox(height: 8),
            Text(
              'Pembayaran hanya simulasi. Tidak ada transaksi uang sungguhan.',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        bottomNavigationBar: Container(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
                blurRadius: 12,
                offset: const Offset(0, -4),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 48,
              child: FilledButton(
                onPressed: canPay ? _pay : null,
                child: _loading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2.5),
                      )
                    : Text(_expired ? 'Waktu Habis' : 'Bayar'),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _MethodCard extends StatelessWidget {
  const _MethodCard({
    required this.option,
    required this.selected,
    required this.enabled,
    required this.onTap,
  });

  final _PaymentOption option;
  final bool selected;
  final bool enabled;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? AppColors.primary.withValues(alpha: 0.06)
          : Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: enabled ? onTap : null,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected
                  ? AppColors.primary
                  : Theme.of(context).colorScheme.outlineVariant,
            ),
          ),
          child: Row(
            children: [
              Icon(
                option.icon,
                color: selected
                    ? AppColors.primary
                    : Theme.of(context).colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 12),
              Expanded(child: Text(option.label)),
              if (selected)
                const Icon(
                  Icons.check_circle_rounded,
                  color: AppColors.primary,
                ),
            ],
          ),
        ),
      ),
    );
  }
}
