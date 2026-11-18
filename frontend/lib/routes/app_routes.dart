import 'package:flutter/material.dart';

import '../screens/event_detail/event_detail_screen.dart';
import '../screens/main_shell.dart';
import '../screens/splash/splash_screen.dart';

class AppRoutes {
  static const String splash = '/';
  static const String main = '/main';
  static const String eventDetail = '/event-detail';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(
          builder: (_) => const SplashScreen(),
          settings: settings,
        );
      case eventDetail:
        final eventId = settings.arguments as String? ?? '';
        return MaterialPageRoute(
          builder: (_) => EventDetailScreen(eventId: eventId),
          settings: settings,
        );
      case main:
      default:
        return MaterialPageRoute(
          builder: (_) => const MainShell(),
          settings: settings,
        );
    }
  }
}
