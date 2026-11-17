import 'package:flutter/material.dart';

class AppColors {
  static const Color primary = Color(0xFF4F46E5);
  static const Color accent = Color(0xFFF59E0B);
  static const Color background = Color(0xFFF8FAFC);
  static const Color success = Color(0xFF16A34A);
  static const Color error = Color(0xFFDC2626);
}

class AppTheme {
  static ThemeData get light {
    final ColorScheme colorScheme = ColorScheme.fromSeed(
      seedColor: AppColors.primary,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: AppColors.background,
    );
  }
}
