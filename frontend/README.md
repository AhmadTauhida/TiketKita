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
- Profile, Edit Profile (upload foto dari galeri), About, dan Logout.

### Perluasan scope: upload foto profil (Fase 1–4 selesai, verifikasi nyata menunggu Fase 5)

Upload foto profil dari galeri disetujui pemilik produk pada 2026-11-23. **Fase 3 (fondasi network/state) dan Fase 4 (UI Edit Profil) selesai**; upload ke bucket nyata sudah diverifikasi lewat adapter backend. Yang sudah tersedia:

- `image_picker` 1.2.4 terpasang.
- `ApiClient.uploadFile` mengirim `multipart/form-data` dengan timeout upload 60 detik, header Authorization, dan content type JPEG/PNG/WebP.
- `AuthService.uploadProfilePhoto` dan `AuthState.uploadProfilePhoto` tersedia.
- Edit Profil memakai avatar + tombol “Ubah Foto”/“Hapus Foto”, memilih dari galeri, mengompres maksimal 1024 px, memvalidasi maksimal 2 MB, dan menampilkan preview lokal.
- Saat “Simpan”: upload foto lebih dulu, lalu `PUT /users/profile` bila nama/telepon berubah. Jika upload gagal, data teks tidak dikirim.
- `updateProfile` hanya mengirim `profileImage` jika diisi atau `clearProfileImage: true`; update nama/telepon tidak menghapus foto hasil upload.
- Tes mencakup multipart, 401, error 422, pemetaan user, perilaku `updateProfile`, dan tampilan Edit Profil tanpa input URL.

Status Fase 5: `flutter analyze` bersih, `flutter test` 15 tes lulus, smoke upload backend mode `memory` berhasil, upload nyata ke bucket `media` berhasil (URL publik 200 dan object bisa dihapus), endpoint produksi Vercel sudah diverifikasi setelah merge ke `main`, dan APK rilis berhasil dibangun (≈53,6 MB). Uji end-to-end di emulator/perangkat masih menunggu perangkat yang terhubung.

Detail keputusan ada di `../DECISIONS.md`.

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

Status terakhir: `flutter analyze` bersih, `flutter test` 15 tes lulus, dan build APK rilis dengan URL produksi berhasil.

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
- Fitur di luar MVP (admin event, upload poster, validasi QR, refund) belum tersedia. Upload foto profil sudah diimplementasikan sampai UI, bucket nyata dan endpoint produksi sudah diverifikasi; uji perangkat masih menunggu.
- Uji manual end-to-end di emulator masih menjadi tugas pemilik produk sebelum responsi.
