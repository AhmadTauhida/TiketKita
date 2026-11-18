import 'package:flutter/material.dart';

import '../../models/booking_draft.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key, required this.draft});

  final BookingDraft draft;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Checkout')),
      body: Center(
        child: Text(
          '${draft.event.title} — ${draft.totalQuantity} tiket',
        ),
      ),
    );
  }
}
