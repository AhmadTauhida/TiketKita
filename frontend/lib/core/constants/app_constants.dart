class AppConstants {
  static const String appName = 'TiketKita';
  static const String appVersion = '1.0.0';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:3000/api/v1',
  );
}
