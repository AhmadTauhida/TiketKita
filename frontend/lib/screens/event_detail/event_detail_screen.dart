import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_exception.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../models/booking_draft.dart';
import '../../models/event_detail.dart';
import '../../models/ticket_type.dart';
import '../../routes/app_routes.dart';
import '../../services/event_service.dart';
import '../../state/auth_state.dart';
import '../../widgets/quantity_stepper.dart';

class EventDetailScreen extends StatefulWidget {
  const EventDetailScreen({super.key, required this.eventId});

  final String eventId;

  @override
  State<EventDetailScreen> createState() => _EventDetailScreenState();
}

class _EventDetailScreenState extends State<EventDetailScreen> {
  final Map<String, int> _quantities = {};

  EventDetail? _event;
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
      final event = await context.read<EventService>().getEventDetail(
        widget.eventId,
      );

      if (!mounted) {
        return;
      }

      setState(() {
        _event = event;
        _quantities.clear();
      });
    } catch (error) {
      if (!mounted) {
        return;
      }

      setState(() {
        _error = error is ApiException
            ? error.message
            : 'Terjadi kesalahan saat memuat data.';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  int get _totalQuantity =>
      _quantities.values.fold(0, (total, quantity) => total + quantity);

  int get _totalAmount {
    final event = _event;

    if (event == null) {
      return 0;
    }

    return event.ticketTypes.fold(0, (total, type) {
      return total + (_quantities[type.id] ?? 0) * type.price;
    });
  }

  String get _totalLabel {
    if (_totalQuantity == 0) {
      return formatRupiah(0);
    }

    return _totalAmount == 0 ? 'Gratis' : formatRupiah(_totalAmount);
  }

  static const ColorFilter _greyscale = ColorFilter.matrix(<double>[
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0.2126,
    0.7152,
    0.0722,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
  ]);

  Color _statusColor(EventDetail event) {
    if (event.isCancelled) {
      return AppColors.error;
    }

    if (event.isOngoing) {
      return AppColors.success;
    }

    return const Color(0xFF4B5563);
  }

  String _disabledLabel(EventDetail event) {
    switch (event.status) {
      case 'CANCELLED':
        return 'Acara Dibatalkan';
      case 'COMPLETED':
        return 'Acara Selesai';
      case 'ONGOING':
        return 'Acara Sedang Berlangsung';
      default:
        return 'Acara Selesai';
    }
  }

  Future<void> _proceed() async {
    final event = _event;

    if (event == null || _totalQuantity == 0) {
      return;
    }

    if (!context.read<AuthState>().isLoggedIn) {
      final result = await Navigator.of(context).pushNamed(AppRoutes.login);

      if (!mounted || result != true) {
        return;
      }

      final currentEvent = _event;

      if (currentEvent == null || _totalQuantity == 0) {
        return;
      }

      _openCheckout(currentEvent);
      return;
    }

    _openCheckout(event);
  }

  void _openCheckout(EventDetail event) {
    Navigator.of(context).pushNamed(
      AppRoutes.checkout,
      arguments: BookingDraft(
        event: event,
        quantities: Map<String, int>.from(_quantities),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final event = _event;

    return Scaffold(
      appBar: AppBar(title: const Text('Detail Acara')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? _ErrorState(message: _error!, onRetry: _load)
          : event == null
          ? const SizedBox.shrink()
          : _buildContent(event),
      bottomNavigationBar: event == null || _loading || _error != null
          ? null
          : _buildBottomBar(event),
    );
  }

  Widget _buildContent(EventDetail event) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.only(bottom: 24),
      children: [
        AspectRatio(
          aspectRatio: 16 / 9,
          child: Stack(
            fit: StackFit.expand,
            children: [
              if (event.isUnavailable)
                ColorFiltered(
                  colorFilter: _greyscale,
                  child: _Poster(imageUrl: event.imageUrl),
                )
              else
                _Poster(imageUrl: event.imageUrl),
              if (event.isUnavailable)
                ColoredBox(color: Colors.black.withValues(alpha: 0.12)),
              if (event.statusLabel != null)
                Positioned(
                  top: 12,
                  left: 12,
                  child: _StatusPill(
                    label: event.statusLabel!,
                    color: _statusColor(event),
                  ),
                ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                event.title,
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text(
                      event.category.name,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  if (event.statusLabel != null)
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: _statusColor(event).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        event.statusLabel!,
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: _statusColor(event),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              _InfoRow(icon: Icons.business_rounded, text: event.organizer),
              const SizedBox(height: 6),
              _InfoRow(
                icon: Icons.calendar_today_rounded,
                text: formatEventDate(event.eventDate),
              ),
              const SizedBox(height: 6),
              _InfoRow(icon: Icons.location_on_outlined, text: event.location),
              if (event.address != null && event.address!.isNotEmpty) ...[
                const SizedBox(height: 6),
                Padding(
                  padding: const EdgeInsets.only(left: 22),
                  child: Text(event.address!, style: theme.textTheme.bodySmall),
                ),
              ],
              const SizedBox(height: 16),
              Text(event.description, style: theme.textTheme.bodyMedium),
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              Text(
                'Pilih Tiket',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              if (event.ticketTypes.isEmpty)
                Text(
                  'Belum ada jenis tiket untuk acara ini.',
                  style: theme.textTheme.bodySmall,
                )
              else
                ...event.ticketTypes.map(
                  (type) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TicketTypeCard(
                      ticketType: type,
                      quantity: _quantities[type.id] ?? 0,
                      enabled: event.canBook,
                      onChanged: (quantity) {
                        setState(() => _quantities[type.id] = quantity);
                      },
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBottomBar(EventDetail event) {
    final canSubmit = event.canBook && _totalQuantity > 0;
    final label = event.canBook ? 'Pesan Tiket' : _disabledLabel(event);

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
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Total', style: Theme.of(context).textTheme.bodySmall),
                Text(
                  _totalLabel,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: SizedBox(
                height: 48,
                child: FilledButton(
                  onPressed: canSubmit ? _proceed : null,
                  child: Text(label),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.label, required this.color});

  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall
            ?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
      ),
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

class _TicketTypeCard extends StatelessWidget {
  const _TicketTypeCard({
    required this.ticketType,
    required this.quantity,
    required this.enabled,
    required this.onChanged,
  });

  final TicketType ticketType;
  final int quantity;
  final bool enabled;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final soldOut = ticketType.availableStock == 0;
    final maxQuantity = ticketType.availableStock < 10
        ? ticketType.availableStock
        : 10;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        ticketType.name,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (ticketType.description != null &&
                          ticketType.description!.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          ticketType.description!,
                          style: theme.textTheme.bodySmall,
                        ),
                      ],
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  ticketType.price == 0
                      ? 'Gratis'
                      : formatRupiah(ticketType.price),
                  style: theme.textTheme.titleSmall?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  soldOut ? 'Habis' : 'Sisa ${ticketType.availableStock} tiket',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: soldOut ? theme.colorScheme.onSurfaceVariant : null,
                    fontWeight: soldOut ? FontWeight.bold : null,
                  ),
                ),
                const Spacer(),
                QuantityStepper(
                  value: quantity,
                  max: maxQuantity,
                  enabled: enabled && !soldOut,
                  onChanged: onChanged,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _Poster extends StatelessWidget {
  const _Poster({required this.imageUrl});

  final String? imageUrl;

  @override
  Widget build(BuildContext context) {
    final placeholder = Container(
      color: AppColors.primary.withValues(alpha: 0.08),
      alignment: Alignment.center,
      child: const Icon(
        Icons.image_outlined,
        size: 48,
        color: AppColors.primary,
      ),
    );

    if (imageUrl == null || imageUrl!.isEmpty) {
      return placeholder;
    }

    return Image.network(
      imageUrl!,
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => placeholder,
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
