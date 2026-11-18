import 'package:flutter/material.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import 'core/constants/app_constants.dart';
import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'core/theme/app_theme.dart';
import 'routes/app_routes.dart';
import 'services/auth_service.dart';
import 'services/booking_service.dart';
import 'services/event_service.dart';
import 'services/payment_service.dart';
import 'services/ticket_service.dart';
import 'state/auth_state.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Intl.defaultLocale = 'id_ID';
  await initializeDateFormatting('id_ID');

  final tokenStorage = TokenStorage();
  final apiClient = ApiClient(
    baseUrl: AppConstants.apiBaseUrl,
    tokenStorage: tokenStorage,
  );
  final authService = AuthService(apiClient);
  final eventService = EventService(apiClient);
  final bookingService = BookingService(apiClient);
  final paymentService = PaymentService(apiClient);
  final ticketService = TicketService(apiClient);

  runApp(
    TiketKitaApp(
      tokenStorage: tokenStorage,
      apiClient: apiClient,
      authService: authService,
      eventService: eventService,
      bookingService: bookingService,
      paymentService: paymentService,
      ticketService: ticketService,
    ),
  );
}

class TiketKitaApp extends StatelessWidget {
  const TiketKitaApp({
    super.key,
    required this.tokenStorage,
    required this.apiClient,
    required this.authService,
    required this.eventService,
    required this.bookingService,
    required this.paymentService,
    required this.ticketService,
  });

  final TokenStorage tokenStorage;
  final ApiClient apiClient;
  final AuthService authService;
  final EventService eventService;
  final BookingService bookingService;
  final PaymentService paymentService;
  final TicketService ticketService;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        Provider<EventService>.value(value: eventService),
        Provider<BookingService>.value(value: bookingService),
        Provider<PaymentService>.value(value: paymentService),
        Provider<TicketService>.value(value: ticketService),
        ChangeNotifierProvider<AuthState>(
          create: (_) => AuthState(
            authService,
            tokenStorage,
            apiClient,
            () {
              AppRoutes.navigatorKey.currentState?.pushNamedAndRemoveUntil(
                AppRoutes.login,
                (_) => false,
                arguments: true,
              );
            },
          ),
        ),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        navigatorKey: AppRoutes.navigatorKey,
        initialRoute: AppRoutes.splash,
        onGenerateRoute: AppRoutes.onGenerateRoute,
      ),
    );
  }
}
