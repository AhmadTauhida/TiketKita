import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';

import '../../core/network/api_exception.dart';
import '../../core/utils/formatters.dart';
import '../../models/ticket_detail.dart';
import '../../services/ticket_service.dart';
import '../../widgets/status_badge.dart';

class TicketDetailScreen extends StatefulWidget {
  const TicketDetailScreen({super.key, required this.ticketId});

  final String ticketId;

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  TicketDetail? _ticket;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final ticket =
          await context.read<TicketService>().getTicket(widget.ticketId);

      if (!mounted) {
        return;
      }

      setState(() => _ticket = ticket);
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error is ApiException
            ? error.message
            : 'Terjadi kesalahan saat memuat tiket.';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final ticket = _ticket;

    return Scaffold(
      appBar: AppBar(title: const Text('Detail Tiket')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ticket == null
              ? _ErrorState(
                  message: _error ?? 'Tiket tidak ditemukan.',
                  onRetry: _load,
                )
              : _buildContent(ticket),
    );
  }

  Widget _buildContent(TicketDetail ticket) {
    final theme = Theme.of(context);
    final summary = ticket.summary;
    final event = summary.event;

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
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        event.title,
                        style: theme.textTheme.titleLarge
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 8),
                    StatusBadge(status: summary.status, isTicket: true),
                  ],
                ),
                const SizedBox(height: 8),
                _InfoRow(
                  icon: Icons.calendar_today_rounded,
                  text: formatEventDate(event.eventDate),
                ),
                const SizedBox(height: 4),
                _InfoRow(
                  icon: Icons.location_on_outlined,
                  text: event.location,
                ),
                if (ticket.address != null && ticket.address!.isNotEmpty) ...[
                  const SizedBox(height: 4),
                  _InfoRow(
                    icon: Icons.map_outlined,
                    text: ticket.address!,
                  ),
                ],
                const Divider(height: 28),
                _DetailLine(label: 'Pemilik', value: ticket.ownerName),
                _DetailLine(
                  label: 'Jenis Tiket',
                  value: summary.ticketTypeName,
                ),
                _DetailLine(
                  label: 'Kode Tiket',
                  value: summary.ticketCode,
                ),
                _DetailLine(
                  label: 'Kode Booking',
                  value: summary.bookingCode,
                ),
                if (ticket.usedAt != null)
                  _DetailLine(
                    label: 'Dipakai',
                    value: formatEventDate(ticket.usedAt!),
                  ),
                const SizedBox(height: 16),
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: theme.colorScheme.outlineVariant,
                      ),
                    ),
                    child: QrImageView(
                      data: ticket.qrToken,
                      version: QrVersions.auto,
                      size: 220,
                      backgroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Center(
                  child: Text(
                    'Tunjukkan QR ini di pintu masuk acara.',
                    textAlign: TextAlign.center,
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Center(
          child: Text(
            'Diterbitkan ${formatEventDate(summary.issuedAt)}',
            style: theme.textTheme.bodySmall,
          ),
        ),
      ],
    );
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
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
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
