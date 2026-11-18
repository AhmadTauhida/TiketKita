import 'package:flutter/foundation.dart';

import '../core/network/api_client.dart';
import '../core/network/api_exception.dart';
import '../core/storage/token_storage.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthState extends ChangeNotifier {
  AuthState(this._authService, this._tokenStorage, this._apiClient) {
    _apiClient.onUnauthorized = _handleUnauthorized;
  }

  final AuthService _authService;
  final TokenStorage _tokenStorage;
  final ApiClient _apiClient;

  User? _user;
  bool _initializing = true;

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

  Future<void> _handleUnauthorized() async {
    await _tokenStorage.clearToken();
    _user = null;
    notifyListeners();
  }

  Future<void> logout() async {
    await _tokenStorage.clearToken();
    _user = null;
    notifyListeners();
  }
}
