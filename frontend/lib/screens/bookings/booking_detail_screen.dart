import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/booking.dart';
import '../../routes/app_routes.dart';
import '../../services/booking_service.dart';
import '../../widgets/status_badge.dart';

class BookingDetailScreen extends StatefulWidget {
  const BookingDetailScreen({super.key, required this.bookingId});

  final String bookingId;

  @override
  State<BookingDetailScreen> createState() => _BookingDetailScreenState();
}

class _BookingDetailScreenState extends State<BookingDetailScreen> {
  Booking? _booking;
  bool _loading = true;
  bool _cancelling = false;
  bool _reloadTriggered = false;
  String? _error;
  Duration _remaining = Duration.zero;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load({bool showLoading = true}) async {
    if (showLoading) {
      setState(() {
        _loading = true;
        _error = null;
      });
    }

    try {
      final booking =
          await context.read<BookingService>().getBooking(widget.bookingId);

      if (!mounted) {
        return;
      }

      setState(() {
        _booking = booking;
        _loading = false;
        _error = null;
      });

      _startCountdown();
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _loading = false;
        _error = error is ApiException
            ? error.message
            : 'Terjadi kesalahan saat memuat pesanan.';
      });
    }
  }

  void _startCountdown() {
    _timer?.cancel();

    final booking = _booking;

    if (booking == null ||
        booking.status != 'PENDING' ||
        booking.expiresAt == null) {
      return;
    }

    _updateRemaining();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        _updateRemaining();
      }
    });
  }

  void _updateRemaining() {
    final booking = _booking;
    final expiresAt = booking?.expiresAt;

    if (booking == null ||
        booking.status != 'PENDING' ||
        expiresAt == null) {
      _timer?.cancel();
      return;
    }

    final remaining = expiresAt.difference(DateTime.now());

    if (remaining.isNegative) {
      _timer?.cancel();
      setState(() => _remaining = Duration.zero);

      if (!_reloadTriggered) {
        _reloadTriggered = true;
        _load(showLoading: false);
      }

      return;
    }

    setState(() => _remaining = remaining);
  }

  Future<void> _cancel() async {
    final booking = _booking;

    if (booking == null || _cancelling) {
      return;
    }

    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Batalkan Pemesanan?'),
          content: const Text(
            'Stok tiket akan dikembalikan ke acara. Tindakan ini tidak dapat dibatalkan.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(false),
              child: const Text('Tidak'),
            ),
            FilledButton(
              onPressed: () => Navigator.of(dialogContext).pop(true),
              child: const Text('Ya, Batalkan'),
            ),
          ],
        );
      },
    );

    if (confirmed != true || !mounted) {
      return;
    }

    setState(() => _cancelling = true);

    try {
      await context.read<BookingService>().cancelBooking(booking.id);

      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pemesanan dibatalkan')),
      );
      Navigator.of(context).pop(true);
    } on ApiException catch (error) {
      if (!mounted) {
        return;
      }

      setState(() => _cancelling = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error.message)),
      );
      _load(showLoading: false);
    } catch (_) {
      if (!mounted) {
        return;
      }

      setState(() => _cancelling = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Terjadi kesalahan saat membatalkan pesanan.'),
        ),
      );
    }
  }

  void _pay(Booking booking) {
    Navigator.of(context).pushNamed(
      AppRoutes.payment,
      arguments: booking,
    );
  }

  void _viewTickets() {
    Navigator.of(context).pushNamedAndRemoveUntil(
      AppRoutes.main,
      (_) => false,
      arguments: 2,
    );
  }

  @override
  Widget build(BuildContext context) {
    final booking = _booking;

    return Scaffold(
      appBar: AppBar(title: const Text('Detail Pesanan')),
      body: _loading && booking == null
          ? const Center(child: CircularProgressIndicator())
          : booking == null
              ? _ErrorState(
                  message: _error ?? 'Pesanan tidak ditemukan.',
                  onRetry: _load,
                )
              : _buildContent(booking),
      bottomNavigationBar: booking == null ? null : _buildBottomBar(booking),
    );
  }

  Widget _buildContent(Booking booking) {
    final theme = Theme.of(context);
    final event = booking.event;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    StatusBadge(status: booking.status),
                    const Spacer(),
                    if (booking.status == 'PENDING')
                      Text(
                        formatCountdown(_remaining),
                        style: theme.textTheme.titleMedium?.copyWith(
                          color: AppColors.accent,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Kode Booking', style: theme.textTheme.bodySmall),
                const SizedBox(height: 2),
                SelectableText(
                  booking.bookingCode,
                  style: theme.textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                if (booking.status == 'PENDING') ...[
                  const SizedBox(height: 4),
                  Text(
                    'Sisa waktu pembayaran',
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (event != null)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    event.title,
                    style: theme.textTheme.titleMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 6),
                  _InfoRow(
                    icon: Icons.calendar_today_rounded,
                    text: formatEventDate(event.eventDate),
                  ),
                  const SizedBox(height: 4),
                  _InfoRow(
                    icon: Icons.location_on_outlined,
                    text: event.location,
                  ),
                ],
              ),
            ),
          ),
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Rincian Tiket',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                for (var index = 0; index < booking.items.length; index++) ...[
                  if (index > 0) const Divider(height: 20),
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              booking.items[index].ticketTypeName,
                              style: theme.textTheme.bodyMedium,
                            ),
                            Text(
                              '${booking.items[index].quantity} x '
                              '${formatRupiah(booking.items[index].unitPrice)}',
                              style: theme.textTheme.bodySmall,
                            ),
                          ],
                        ),
                      ),
                      Text(
                        booking.items[index].subtotal == 0
                            ? 'Gratis'
                            : formatRupiah(booking.items[index].subtotal),
                        style: theme.textTheme.bodyMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                ],
                const Divider(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Total',
                        style: theme.textTheme.titleSmall
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                    Text(
                      booking.totalAmount == 0
                          ? 'Gratis'
                          : formatRupiah(booking.totalAmount),
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
        const SizedBox(height: 12),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Informasi Pesanan',
                  style: theme.textTheme.titleSmall
                      ?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                _DetailLine(
                  label: 'Dibuat',
                  value: formatEventDate(booking.createdAt),
                ),
                if (booking.expiresAt != null)
                  _DetailLine(
                    label: 'Kedaluwarsa',
                    value: formatEventDate(booking.expiresAt!),
                  ),
              ],
            ),
          ),
        ),
        if (booking.payment != null) ...[
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Pembayaran',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  _DetailLine(
                    label: 'Metode',
                    value: _paymentMethodLabel(
                      booking.payment!.paymentMethod,
                    ),
                  ),
                  _DetailLine(
                    label: 'Status',
                    value: booking.payment!.status == 'SUCCESS'
                        ? 'Berhasil'
                        : booking.payment!.status,
                  ),
                  if (booking.payment!.transactionReference != null)
                    _DetailLine(
                      label: 'Referensi',
                      value: booking.payment!.transactionReference!,
                    ),
                  if (booking.payment!.paidAt != null)
                    _DetailLine(
                      label: 'Dibayar',
                      value: formatEventDate(booking.payment!.paidAt!),
                    ),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget? _buildBottomBar(Booking booking) {
    if (booking.status == 'PENDING') {
      return Container(
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
          child: Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: OutlinedButton(
                    onPressed: _cancelling ? null : _cancel,
                    child: _cancelling
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2.5),
                          )
                        : const Text('Batalkan Pemesanan'),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: SizedBox(
                  height: 48,
                  child: FilledButton(
                    onPressed: _cancelling ? null : () => _pay(booking),
                    child: const Text('Bayar Sekarang'),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (booking.status == 'PAID') {
      return Container(
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
              onPressed: _viewTickets,
              child: const Text('Lihat Tiket'),
            ),
          ),
        ),
      );
    }

    return null;
  }
}

String _paymentMethodLabel(String method) {
  switch (method) {
    case 'BANK_TRANSFER':
      return 'Transfer Bank';
    case 'E_WALLET':
      return 'E-Wallet';
    case 'QRIS':
      return 'QRIS';
    default:
      return method;
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(
          icon,
          size: 16,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
        ),
        const SizedBox(width: 6),
        Expanded(child: Text(text)),
      ],
    );
  }
}

class _DetailLine extends StatelessWidget {
  const _DetailLine({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 96,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});

  final String message;
  final Future<void> Function() onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.wifi_off_rounded,
              size: 48,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 12),
            Text(
              message,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: () => onRetry(),
              child: const Text('Coba Lagi'),
            ),
          ],
        ),
      ),
    );
  }
}
