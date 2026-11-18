import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:http/http.dart' as http;

import '../storage/token_storage.dart';
import 'api_exception.dart';

class ApiClient {
  ApiClient({
    required this.baseUrl,
    required this.tokenStorage,
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client();

  final String baseUrl;
  final TokenStorage tokenStorage;
  final http.Client _http;

  static const Duration _timeout = Duration(seconds: 15);
  static const String _networkMessage =
      'Tidak dapat terhubung ke server. Periksa koneksi Anda.';

  Future<void> Function()? onUnauthorized;

  Future<dynamic> get(String path, {Map<String, String>? query}) {
    return _send('GET', path, query: query);
  }

  Future<dynamic> post(String path, {Object? body}) {
    return _send('POST', path, body: body);
  }

  Future<dynamic> put(String path, {Object? body}) {
    return _send('PUT', path, body: body);
  }

  Future<dynamic> patch(String path, {Object? body}) {
    return _send('PATCH', path, body: body);
  }

  Future<dynamic> _send(
    String method,
    String path, {
    Map<String, String>? query,
    Object? body,
  }) async {
    Uri uri = Uri.parse('$baseUrl$path');

    if (query != null && query.isNotEmpty) {
      uri = uri.replace(queryParameters: query);
    }

    final headers = <String, String>{'Accept': 'application/json'};
    final token = await tokenStorage.readToken();

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    if (body != null) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      final http.Response response;

      switch (method) {
        case 'POST':
          response = await _http
              .post(uri, headers: headers, body: jsonEncode(body))
              .timeout(_timeout);
          break;
        case 'PUT':
          response = await _http
              .put(uri, headers: headers, body: jsonEncode(body))
              .timeout(_timeout);
          break;
        case 'PATCH':
          response = await _http
              .patch(uri, headers: headers, body: jsonEncode(body))
              .timeout(_timeout);
          break;
        default:
          response = await _http.get(uri, headers: headers).timeout(_timeout);
      }

      if (response.statusCode == 401) {
        await onUnauthorized?.call();
      }

      final decoded = response.body.isEmpty
          ? null
          : jsonDecode(response.body) as Map<String, dynamic>;

      if (response.statusCode >= 200 && response.statusCode < 300) {
        return decoded?['data'];
      }

      final errors = (decoded?['errors'] as List?)
              ?.whereType<Map<String, dynamic>>()
              .map(ApiFieldError.fromJson)
              .toList() ??
          const <ApiFieldError>[];

      throw ApiException(
        decoded?['message'] as String? ?? 'Terjadi kesalahan pada server',
        statusCode: response.statusCode,
        errors: errors,
      );
    } on ApiException {
      rethrow;
    } on TimeoutException {
      throw const ApiException(_networkMessage);
    } on SocketException {
      throw const ApiException(_networkMessage);
    } on http.ClientException {
      throw const ApiException(_networkMessage);
    } on FormatException {
      throw const ApiException('Respons server tidak valid');
    }
  }
}
