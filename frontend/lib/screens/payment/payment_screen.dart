import 'package:flutter/material.dart';

import '../../models/booking.dart';

class PaymentScreen extends StatelessWidget {
  const PaymentScreen({super.key, required this.booking});

  final Booking booking;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pembayaran')),
      body: Center(
        child: Text('${booking.bookingCode} — ${booking.totalQuantity} tiket'),
      ),
    );
  }
}
