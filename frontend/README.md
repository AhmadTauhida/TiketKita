# TiketKita Frontend

Aplikasi Flutter (Android) untuk TiketKita.

## Menjalankan

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Build APK:

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://<proyek>.vercel.app/api/v1
```

## Pemeriksaan

```bash
flutter analyze
flutter test
```

## Struktur

```text
lib/
├── main.dart
├── core/       (constants, theme, network, storage)
├── models/
├── services/
├── screens/    (auth, home, explore, event_detail, checkout, payment, bookings, tickets, profile)
├── widgets/
└── routes/
```

Dokumentasi layar dan alur menyusul pada fase Flutter.
