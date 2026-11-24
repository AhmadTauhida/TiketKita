import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:intl/date_symbol_data_local.dart';
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
import 'package:tiketkita/widgets/category_item.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting('id_ID');
  });

  testWidgets('menampilkan Bottom Navigation Bar dengan empat tab', (
    tester,
  ) async {
    await _pumpMainShell(
      tester,
      MockClient(
        (_) async => _response({
          'items': <Object>[],
          'pagination': {
            'page': 1,
            'limit': 10,
            'totalItems': 0,
            'totalPages': 0,
          },
        }),
      ),
    );
    await _pumpUi(tester);

    expect(find.byType(NavigationBar), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Explore'), findsOneWidget);
    expect(find.text('My Tickets'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);
  });

  testWidgets('pintasan kategori membuka Explore dengan filter terpilih', (
    tester,
  ) async {
    final eventRequests = <Uri>[];
    final httpClient = MockClient((request) async {
      if (request.url.path.endsWith('/categories')) {
        return _response({
          'items': [
            {'id': 'category-seminar', 'name': 'Seminar', 'icon': 'school'},
          ],
        });
      }

      if (request.url.path.endsWith('/events/featured')) {
        return _response({'items': <Object>[]});
      }

      if (request.url.path.endsWith('/events')) {
        eventRequests.add(request.url);
        final categorySelected =
            request.url.queryParameters['categoryId'] == 'category-seminar';
        final items = categorySelected
            ? [
                {
                  'id': 'event-seminar',
                  'title': 'Seminar Demo',
                  'category': {'id': 'category-seminar', 'name': 'Seminar'},
                  'organizer': 'Panitia',
                  'location': 'Jakarta',
                  'eventDate': '2026-12-12T03:00:00.000Z',
                  'status': 'UPCOMING',
                  'minPrice': 0,
                  'isSoldOut': false,
                },
              ]
            : <Object>[];
        return _response({
          'items': items,
          'pagination': {
            'page': 1,
            'limit': 10,
            'totalItems': items.length,
            'totalPages': items.isEmpty ? 0 : 1,
          },
        });
      }

      return _response({'items': <Object>[]});
    });

    await _pumpMainShell(tester, httpClient);
    await _pumpUi(tester);

    await tester.tap(find.text('Explore').first);
    await _pumpUi(tester);
    await tester.enterText(find.byType(TextField), 'kata lama');
    await tester.pump(const Duration(milliseconds: 500));
    await _pumpUi(tester);

    expect(
      eventRequests.any((uri) => uri.queryParameters['q'] == 'kata lama'),
      isTrue,
      reason: 'Event requests: $eventRequests',
    );

    await tester.tap(find.text('Home').first);
    await _pumpUi(tester);
    await tester.tap(find.byType(CategoryItem));
    await _pumpUi(tester);

    expect(
      tester.widget<NavigationBar>(find.byType(NavigationBar)).selectedIndex,
      1,
    );
    expect(
      tester
          .widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'Seminar'))
          .selected,
      isTrue,
    );
    expect(
      tester.widget<TextField>(find.byType(TextField)).controller!.text,
      isEmpty,
    );
    expect(find.text('Seminar Demo'), findsOneWidget);

    final filteredRequest = eventRequests.lastWhere(
      (uri) => uri.queryParameters['categoryId'] == 'category-seminar',
    );
    expect(filteredRequest.queryParameters.containsKey('q'), isFalse);
  });
}

Future<void> _pumpMainShell(WidgetTester tester, http.Client httpClient) async {
  final tokenStorage = _TestTokenStorage();
  final apiClient = ApiClient(
    baseUrl: 'http://localhost/api/v1',
    tokenStorage: tokenStorage,
    httpClient: httpClient,
  );
  final authState = AuthState(AuthService(apiClient), tokenStorage, apiClient);

  await tester.pumpWidget(
    MultiProvider(
      providers: [
        Provider<EventService>.value(value: EventService(apiClient)),
        Provider<BookingService>.value(value: BookingService(apiClient)),
        Provider<PaymentService>.value(value: PaymentService(apiClient)),
        Provider<TicketService>.value(value: TicketService(apiClient)),
        ChangeNotifierProvider<AuthState>.value(value: authState),
      ],
      child: MaterialApp(theme: AppTheme.light, home: const MainShell()),
    ),
  );
}

Future<void> _pumpUi(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 500));
}

http.Response _response(Object data) {
  return http.Response(
    jsonEncode({'success': true, 'message': 'ok', 'data': data}),
    200,
    headers: {'content-type': 'application/json'},
  );
}

class _TestTokenStorage extends TokenStorage {
  @override
  Future<String?> readToken() async => null;

  @override
  Future<void> saveToken(String token) async {}

  @override
  Future<void> clearToken() async {}
}
