import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('About')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 8),
          const Icon(
            Icons.confirmation_number_rounded,
            size: 80,
            color: AppColors.primary,
          ),
          const SizedBox(height: 16),
          Center(
            child: Text(
              AppConstants.appName,
              style: theme.textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.bold),
            ),
          ),
          const SizedBox(height: 4),
          Center(
            child: Text(
              'Versi ${AppConstants.appVersion}',
              style: theme.textTheme.bodySmall,
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'Tentang Aplikasi',
            style: theme.textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            'TiketKita adalah aplikasi untuk mencari acara, memesan tiket, '
            'melakukan pembayaran simulasi, dan menampilkan tiket digital '
            'berkode QR. Data acara, harga, stok, dan status transaksi '
            'dikelola oleh backend TiketKita.',
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          Card(
            child: Column(
              children: [
                const ListTile(
                  leading: Icon(Icons.code_rounded),
                  title: Text('Pengembang'),
                  subtitle: Text('Tim TiketKita'),
                ),
                const Divider(height: 1),
                const ListTile(
                  leading: Icon(Icons.phone_android_rounded),
                  title: Text('Platform'),
                  subtitle: Text('Android'),
                ),
                const Divider(height: 1),
                const ListTile(
                  leading: Icon(Icons.school_outlined),
                  title: Text('Konteks'),
                  subtitle: Text(
                    'Tugas Akhir Praktikum Pemrograman Perangkat Bergerak 2026',
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
