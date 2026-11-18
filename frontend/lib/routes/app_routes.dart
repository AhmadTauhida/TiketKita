import 'package:flutter/material.dart';

import '../models/booking.dart';
import '../models/booking_draft.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/checkout/checkout_screen.dart';
import '../screens/event_detail/event_detail_screen.dart';
import '../screens/main_shell.dart';
import '../screens/payment/payment_screen.dart';
import '../screens/splash/splash_screen.dart';

class AppRoutes {
  static final GlobalKey<NavigatorState> navigatorKey =
      GlobalKey<NavigatorState>();

  static const String splash = '/';
  static const String main = '/main';
  static const String login = '/login';
  static const String register = '/register';
  static const String eventDetail = '/event-detail';
  static const String checkout = '/checkout';
  static const String payment = '/payment';

  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return MaterialPageRoute(
          builder: (_) => const SplashScreen(),
          settings: settings,
        );
      case login:
        return MaterialPageRoute(
          builder: (_) => LoginScreen(
            sessionExpired: settings.arguments == true,
          ),
          settings: settings,
        );
      case register:
        return MaterialPageRoute(
          builder: (_) => const RegisterScreen(),
          settings: settings,
        );
      case eventDetail:
        final eventId = settings.arguments as String? ?? '';
        return MaterialPageRoute(
          builder: (_) => EventDetailScreen(eventId: eventId),
          settings: settings,
        );
      case checkout:
        final draft = settings.arguments as BookingDraft?;

        if (draft == null) {
          return MaterialPageRoute(
            builder: (_) => const MainShell(),
            settings: settings,
          );
        }

        return MaterialPageRoute(
          builder: (_) => CheckoutScreen(draft: draft),
          settings: settings,
        );
      case payment:
        final booking = settings.arguments as Booking?;

        if (booking == null) {
          return MaterialPageRoute(
            builder: (_) => const MainShell(),
            settings: settings,
          );
        }

        return MaterialPageRoute(
          builder: (_) => PaymentScreen(booking: booking),
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
