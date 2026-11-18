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
import 'services/event_service.dart';
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

  runApp(
    TiketKitaApp(
      tokenStorage: tokenStorage,
      apiClient: apiClient,
      authService: authService,
      eventService: eventService,
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
  });

  final TokenStorage tokenStorage;
  final ApiClient apiClient;
  final AuthService authService;
  final EventService eventService;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: apiClient),
        Provider<EventService>.value(value: eventService),
        ChangeNotifierProvider<AuthState>(
          create: (_) => AuthState(authService, tokenStorage, apiClient),
        ),
      ],
      child: MaterialApp(
        title: AppConstants.appName,
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        initialRoute: AppRoutes.splash,
        onGenerateRoute: AppRoutes.onGenerateRoute,
      ),
    );
  }
}
