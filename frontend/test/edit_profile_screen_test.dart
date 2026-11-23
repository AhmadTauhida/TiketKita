import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:provider/provider.dart';
import 'package:tiketkita/core/network/api_client.dart';
import 'package:tiketkita/core/storage/token_storage.dart';
import 'package:tiketkita/core/theme/app_theme.dart';
import 'package:tiketkita/screens/profile/edit_profile_screen.dart';
import 'package:tiketkita/services/auth_service.dart';
import 'package:tiketkita/state/auth_state.dart';

class _FakeTokenStorage extends TokenStorage {
  _FakeTokenStorage(this._token);

  String? _token;

  @override
  Future<String?> readToken() async => _token;

  @override
  Future<void> saveToken(String token) async {
    _token = token;
  }

  @override
  Future<void> clearToken() async {
    _token = null;
  }
}

void main() {
  testWidgets('Edit Profil memakai tombol foto, bukan input URL', (
    tester,
  ) async {
    final tokenStorage = _FakeTokenStorage('token-123');
    final httpClient = MockClient((request) async {
      return http.Response(
        jsonEncode({
          'success': true,
          'message': 'ok',
          'data': {
            'user': {
              'id': '11111111-1111-4111-8111-111111111111',
              'name': 'Demo User',
              'email': 'demo@tiketkita.test',
              'phone': '081234567890',
              'profileImage': null,
              'createdAt': '2026-11-23T03:00:00.000Z',
            },
          },
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
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
    await authState.initialize();

    await tester.pumpWidget(
      ChangeNotifierProvider<AuthState>.value(
        value: authState,
        child: MaterialApp(
          theme: AppTheme.light,
          home: const EditProfileScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Ubah Foto'), findsOneWidget);
    expect(find.text('Hapus Foto'), findsNothing);
    expect(find.text('URL foto profil (opsional)'), findsNothing);
    expect(find.text('JPG, PNG, atau WebP • maksimal 2 MB'), findsOneWidget);
    expect(find.text('Nama lengkap'), findsOneWidget);
    expect(find.text('Nomor telepon'), findsOneWidget);
    expect(find.text('Simpan'), findsOneWidget);
  });
}
