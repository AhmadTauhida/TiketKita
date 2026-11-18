import 'package:flutter/foundation.dart';

import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/storage/token_storage.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthState extends ChangeNotifier {
  AuthState(
    this._authService,
    this._tokenStorage,
    this._apiClient, [
    this._onSessionExpired,
  ]) {
    _apiClient.onUnauthorized = _handleUnauthorized;
  }

  final AuthService _authService;
  final TokenStorage _tokenStorage;
  final ApiClient _apiClient;
  final void Function()? _onSessionExpired;

  User? _user;
  bool _initializing = true;
  bool _redirectingToLogin = false;

  User? get user => _user;
  bool get isLoggedIn => _user != null;
  bool get isInitializing => _initializing;

  Future<void> initialize() async {
    try {
      final token = await _tokenStorage.readToken();

      if (token != null && token.isNotEmpty) {
        try {
          _user = await _authService.getProfile();
        } on ApiException catch (error) {
          if (error.statusCode == 401) {
            await _tokenStorage.clearToken();
          }
          _user = null;
        }
      }
    } catch (_) {
      _user = null;
    } finally {
      _initializing = false;
      notifyListeners();
    }
  }

  Future<void> login({required String email, required String password}) async {
    final session = await _authService.login(
      email: email,
      password: password,
    );

    await _tokenStorage.saveToken(session.token);
    _user = session.user;
    _redirectingToLogin = false;
    notifyListeners();
  }

  Future<void> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    await _authService.register(
      name: name,
      email: email,
      phone: phone,
      password: password,
    );

    await login(email: email, password: password);
  }

  Future<void> _handleUnauthorized() async {
    await _tokenStorage.clearToken();
    _user = null;
    notifyListeners();

    if (_initializing || _redirectingToLogin) {
      return;
    }

    _redirectingToLogin = true;
    _onSessionExpired?.call();
  }

  Future<void> logout() async {
    await _tokenStorage.clearToken();
    _user = null;
    notifyListeners();
  }

  Future<void> updateProfile({
    required String name,
    required String phone,
    String? profileImage,
  }) async {
    _user = await _authService.updateProfile(
      name: name,
      phone: phone,
      profileImage: profileImage,
    );
    notifyListeners();
  }
}
