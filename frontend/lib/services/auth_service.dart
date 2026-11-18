import '../core/network/api_client.dart';
import '../models/auth_session.dart';
import '../models/user.dart';

class AuthService {
  AuthService(this._api);

  final ApiClient _api;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final data = await _api.post(
      '/auth/login',
      body: {'email': email, 'password': password},
    ) as Map<String, dynamic>;

    return AuthSession.fromJson(data);
  }

  Future<User> register({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    final data = await _api.post(
      '/auth/register',
      body: {
        'name': name,
        'email': email,
        'phone': phone,
        'password': password,
      },
    ) as Map<String, dynamic>;

    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<User> getProfile() async {
    final data = await _api.get('/users/profile') as Map<String, dynamic>;
    return User.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<User> updateProfile({
    required String name,
    required String phone,
    String? profileImage,
  }) async {
    final data = await _api.put(
      '/users/profile',
      body: {
        'name': name,
        'phone': phone,
        'profileImage': profileImage,
      },
    ) as Map<String, dynamic>;

    return User.fromJson(data['user'] as Map<String, dynamic>);
  }
}
