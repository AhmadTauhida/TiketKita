import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tiketkita/core/network/api_client.dart';
import 'package:tiketkita/core/storage/token_storage.dart';
import 'package:tiketkita/core/theme/app_theme.dart';
import 'package:tiketkita/screens/main_shell.dart';
import 'package:tiketkita/services/auth_service.dart';
import 'package:tiketkita/services/booking_service.dart';
import 'package:tiketkita/services/event_service.dart';
import 'package:tiketkita/services/payment_service.dart';
import 'package:tiketkita/services/ticket_service.dart';
import 'package:tiketkita/state/auth_state.dart';

void main() {
  testWidgets('menampilkan Bottom Navigation Bar dengan empat tab', (
    tester,
  ) async {
    final httpClient = MockClient((request) async {
      return http.Response(
        '{"success":true,"message":"ok","data":{"items":[],'
        '"pagination":{"page":1,"limit":10,"totalItems":0,"totalPages":0}}}',
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final tokenStorage = TokenStorage();
    final apiClient = ApiClient(
      baseUrl: 'http://localhost/api/v1',
      tokenStorage: tokenStorage,
      httpClient: httpClient,
    );
    final authState = AuthState(
      AuthService(apiClient),
      tokenStorage,
      apiClient,
    );

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          Provider<EventService>.value(value: EventService(apiClient)),
          Provider<BookingService>.value(value: BookingService(apiClient)),
          Provider<PaymentService>.value(value: PaymentService(apiClient)),
          Provider<TicketService>.value(value: TicketService(apiClient)),
          ChangeNotifierProvider<AuthState>.value(value: authState),
        ],
        child: MaterialApp(
          theme: AppTheme.light,
          home: const MainShell(),
        ),
      ),
    );

    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Explore'), findsOneWidget);
    expect(find.text('My Tickets'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });
}
