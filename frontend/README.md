# TiketKita Frontend

Aplikasi Flutter (Android) untuk TiketKita: menjelajah acara, memesan tiket, membayar secara simulasi, dan menampilkan tiket digital berkode QR.

## Fitur

- Splash, Login, Register, dan mode tamu (D-03).
- Home: sapaan, pencarian, acara unggulan, kategori, acara terdekat.
- Explore: pencarian dengan debounce 400 ms, filter kategori, infinite scroll.
- Event Detail: informasi acara, stepper tiket dibatasi stok, total pratinjau.
- Checkout dan Payment: pembuatan booking, hitung mundur 15 menit, tiga metode pembayaran simulasi.
- Payment Success.
- My Tickets: sub-tab Tiket (QR) dan Pesanan (riwayat booking).
- Booking Detail: bayar, batalkan, atau lihat tiket sesuai status.
- Ticket Detail: QR Code dari `qrToken` backend.
- Profile, Edit Profile (URL foto), About, dan Logout.

## Prasyarat

- Flutter stable channel (proyek ini diuji pada Flutter 3.47.0 / Dart 3.13.0)
- Android SDK dan emulator/perangkat Android
- JDK yang kompatibel dengan Android Gradle Plugin (Java 21-25)
- Backend TiketKita berjalan atau API Vercel aktif

## Menjalankan

```bash
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Emulator Android wajib memakai `10.0.2.2`, bukan `localhost`. Untuk API produksi:

```bash
flutter run --dart-define=API_BASE_URL=https://tiketkita-three.vercel.app/api/v1
```

## Pemeriksaan

```bash
flutter analyze
flutter test
```

Status terakhir: `flutter analyze` bersih, `flutter test` 10 tes lulus, dan build APK rilis dengan URL produksi berhasil.

## Build APK

```bash
flutter build apk --release --dart-define=API_BASE_URL=https://tiketkita-three.vercel.app/api/v1
```

Konfigurasi rilis saat ini memakai debug signing key. APK tidak di-commit.

## Arsitektur

```text
lib/
├── main.dart              bootstrap, provider, MaterialApp
├── core/
│   ├── constants/         AppConstants (nama, versi, API_BASE_URL)
│   ├── network/           ApiClient dan ApiException
│   ├── storage/           TokenStorage (flutter_secure_storage)
│   ├── theme/             AppColors dan AppTheme
│   └── utils/             formatter harga/tanggal/countdown, validator
├── models/                User, Category, Event, Booking, Payment, Ticket
├── services/              auth, event, booking, payment, ticket
├── state/                 AuthState (provider)
├── screens/               splash, auth, home, explore, event_detail, checkout,
│                          payment, tickets, bookings, profile
├── widgets/               kartu, badge, avatar, form error, stepper
└── routes/                AppRoutes dengan onGenerateRoute
```

- Panggilan HTTP hanya lewat `services` dan `ApiClient`; tidak ada HTTP di widget.
- `AuthState` menyimpan sesi; layar lain memakai `setState`/`FutureBuilder`.
- Token disimpan di secure storage. 401 menghapus token dan kembali ke Login.
- Semua nominal final berasal dari backend; total di Event Detail/Checkout hanya pratinjau.
- Gambar jaringan memakai `errorBuilder` dan placeholder.

## Catatan

- `API_BASE_URL` wajib lewat `--dart-define`; tidak ada URL hardcode selain default emulator di `AppConstants`.
- Fitur di luar MVP (admin event, upload poster, Supabase Storage, validasi QR, refund) belum tersedia.
- Uji manual end-to-end di emulator masih menjadi tugas pemilik produk sebelum responsi.
