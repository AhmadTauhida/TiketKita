import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:tiketkita/core/network/api_client.dart';
import 'package:tiketkita/core/network/api_exception.dart';
import 'package:tiketkita/core/storage/token_storage.dart';
import 'package:tiketkita/services/auth_service.dart';

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

const _user = {
  'id': '11111111-1111-4111-8111-111111111111',
  'name': 'Demo User',
  'email': 'demo@tiketkita.test',
  'phone': '081234567890',
  'profileImage': null,
  'createdAt': '2026-11-23T03:00:00.000Z',
};

String _successBody({Map<String, dynamic>? user}) {
  return jsonEncode({
    'success': true,
    'message': 'ok',
    'data': {'user': user ?? _user},
  });
}

void main() {
  late Directory tempDir;
  late File jpegFile;

  setUp(() async {
    tempDir = await Directory.systemTemp.createTemp('tiketkita_upload_test_');
    jpegFile = File('${tempDir.path}/avatar.jpg');
    await jpegFile.writeAsBytes([
      0xff,
      0xd8,
      0xff,
      0xe0,
      ...utf8.encode('fake-jpeg-payload'),
    ]);
  });

  tearDown(() async {
    await tempDir.delete(recursive: true);
  });

  test('uploadFile mengirim multipart dengan token dan tipe gambar', () async {
    late http.Request captured;
    final httpClient = MockClient((request) async {
      captured = request;

      return http.Response(
        _successBody(),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final api = ApiClient(
      baseUrl: 'http://localhost/api/v1',
      tokenStorage: _FakeTokenStorage('token-123'),
      httpClient: httpClient,
    );

    final data = await api.uploadFile(
      '/users/profile/photo',
      field: 'photo',
      filePath: jpegFile.path,
      filename: 'avatar.jpg',
    );

    expect(captured.method, 'POST');
    expect(
      captured.url.toString(),
      'http://localhost/api/v1/users/profile/photo',
    );
    expect(captured.headers['Authorization'], 'Bearer token-123');
    expect(captured.headers['content-type'], contains('multipart/form-data'));

    final body = latin1.decode(captured.bodyBytes);
    expect(body, contains('name="photo"'));
    expect(body, contains('filename="avatar.jpg"'));
    expect(body, contains('content-type: image/jpeg'));
    expect((data as Map<String, dynamic>)['user']['email'], _user['email']);
  });

  test('uploadFile memanggil onUnauthorized saat respons 401', () async {
    var unauthorized = false;
    final httpClient = MockClient((request) async {
      return http.Response(
        '{"success":false,"message":"Sesi berakhir","data":null}',
        401,
        headers: {'content-type': 'application/json'},
      );
    });
    final api = ApiClient(
      baseUrl: 'http://localhost/api/v1',
      tokenStorage: _FakeTokenStorage('token-123'),
      httpClient: httpClient,
    );
    api.onUnauthorized = () async {
      unauthorized = true;
    };

    await expectLater(
      api.uploadFile(
        '/users/profile/photo',
        field: 'photo',
        filePath: jpegFile.path,
        filename: 'avatar.jpg',
      ),
      throwsA(
        isA<ApiException>()
            .having((error) => error.statusCode, 'statusCode', 401)
            .having((error) => error.message, 'message', 'Sesi berakhir'),
      ),
    );
    expect(unauthorized, isTrue);
  });

  test('uploadFile memetakan field error 422', () async {
    final httpClient = MockClient((request) async {
      return http.Response(
        '{"success":false,"message":"Validasi gagal","data":null,'
        '"errors":[{"field":"photo","message":"Format foto harus JPEG, PNG, atau WebP"}]}',
        422,
        headers: {'content-type': 'application/json'},
      );
    });
    final api = ApiClient(
      baseUrl: 'http://localhost/api/v1',
      tokenStorage: _FakeTokenStorage('token-123'),
      httpClient: httpClient,
    );

    await expectLater(
      api.uploadFile(
        '/users/profile/photo',
        field: 'photo',
        filePath: jpegFile.path,
        filename: 'avatar.jpg',
      ),
      throwsA(
        isA<ApiException>()
            .having((error) => error.statusCode, 'statusCode', 422)
            .having((error) => error.errors.first.field, 'field', 'photo'),
      ),
    );
  });

  test('updateProfile hanya mengirim profileImage saat diperlukan', () async {
    final bodies = <Map<String, dynamic>>[];
    final httpClient = MockClient((request) async {
      bodies.add(jsonDecode(request.body) as Map<String, dynamic>);

      return http.Response(
        _successBody(),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final service = AuthService(
      ApiClient(
        baseUrl: 'http://localhost/api/v1',
        tokenStorage: _FakeTokenStorage('token-123'),
        httpClient: httpClient,
      ),
    );

    await service.updateProfile(name: 'Nama Baru', phone: '081298765432');
    await service.updateProfile(
      name: 'Nama Baru',
      phone: '081298765432',
      clearProfileImage: true,
    );
    await service.updateProfile(
      name: 'Nama Baru',
      phone: '081298765432',
      profileImage: 'https://example.com/avatar.png',
    );

    expect(bodies[0].containsKey('profileImage'), isFalse);
    expect(bodies[1].containsKey('profileImage'), isTrue);
    expect(bodies[1]['profileImage'], isNull);
    expect(bodies[2]['profileImage'], 'https://example.com/avatar.png');
  });

  test('uploadProfilePhoto mengembalikan user dari respons server', () async {
    final httpClient = MockClient((request) async {
      return http.Response(
        _successBody(
          user: {
            ..._user,
            'profileImage': 'https://example.supabase.co/storage/v1/object/public/media/avatars/user/photo.jpg',
          },
        ),
        200,
        headers: {'content-type': 'application/json'},
      );
    });
    final service = AuthService(
      ApiClient(
        baseUrl: 'http://localhost/api/v1',
        tokenStorage: _FakeTokenStorage('token-123'),
        httpClient: httpClient,
      ),
    );

    final user = await service.uploadProfilePhoto(
      filePath: jpegFile.path,
      filename: 'avatar.jpg',
    );

    expect(user.email, _user['email']);
    expect(user.profileImage, contains('/storage/v1/object/public/media/'));
  });
}
