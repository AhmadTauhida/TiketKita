# TiketKita

Aplikasi Android untuk mencari acara, memesan tiket, membayar secara simulasi, dan menampilkan tiket digital berkode QR.

- **Frontend:** Flutter (Android)
- **Backend:** Node.js 22 + Express 5 (ES Modules) + Prisma
- **Database:** PostgreSQL di Supabase (akses hanya lewat Prisma)
- **Hosting API:** Vercel

## Status

MVP selesai dan teruji:

- Backend: seluruh endpoint PRD 14.4, 8 tabel, migration + check constraint, seed 5 kategori/15 acara/2 akun demo.
- Backend test: `npm test` → 83 tes lulus (auth, events, bookings, konkurensi stok, payments, tickets, isolasi data, fondasi storage upload, endpoint foto profil).
- Frontend: 16 layar Fase 7 selesai; `flutter analyze` bersih dan `flutter test` 15 tes lulus.
- Deployment: API Vercel sudah diuji untuk health, katalog, login, booking, pembayaran sukses, tiket + QR, pembatalan, dan kasus tepi seed.
- Build APK rilis dengan URL produksi berhasil dibuat (≈53,6 MB, debug signing).
- Belum diverifikasi: uji manual end-to-end di emulator/perangkat dan uji APK di perangkat fisik (dilakukan pemilik produk).

### Perluasan scope (disetujui 2026-11-23)

Upload foto profil disetujui masuk scope. **Fase 1–4 selesai**; Fase 5 sudah memverifikasi upload nyata ke bucket `media` (upload, URL publik 200, hapus object), endpoint produksi Vercel setelah merge ke `main` (upload sukses, URL publik 200, profil cocok), `npm test` 83 lulus, `flutter analyze` bersih, `flutter test` 15 lulus, smoke upload mode `memory` berhasil, dan APK rilis berhasil dibangun. **Uji emulator/perangkat masih menunggu pemilik produk** karena tidak ada perangkat ADB. Detail ada di [DECISIONS.md](DECISIONS.md). PRD masih menyebut upload file di luar MVP sampai pemilik produk merevisinya.

## API Produksi

- Base URL: `https://tiketkita-three.vercel.app/api/v1`
- Health check: `https://tiketkita-three.vercel.app/health`
- Collection Postman: `backend/postman/TiketKita_API.postman_collection.json` dengan environment Local dan Vercel.

## Struktur Repositori

```text
tiketkita/
├── backend/    REST API (routes, controllers, services, Prisma, Postman)
├── frontend/   Aplikasi Flutter (Android)
├── PRD.md      Sumber kebenaran produk
├── DECISIONS.md
└── README.md
```

## Prasyarat

- Node.js 22 LTS dan npm (lingkungan pengembangan saat ini memakai Node.js 24.19.0; lihat `DECISIONS.md`)
- Flutter stable channel
- Android Studio / Android SDK, emulator atau perangkat Android
- JDK yang kompatibel dengan Android Gradle Plugin (Java 21-25)
- Project Supabase untuk schema `public` dan `test`
- Postman (opsional)

## Menjalankan Backend

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:deploy
SEED_CONFIRM=yes npm run db:seed
npm run dev
```

- `GET /health` → `{ "status": "ok" }`
- `GET /` → `{ "name": "TiketKita API", "version": "1.0.0" }`
- Seed **menghapus seluruh data aplikasi** dan menolak berjalan tanpa `SEED_CONFIRM=yes`.

Detail environment, migrasi, tes, Postman, dan deployment ada di [README backend](backend/README.md).

## Menjalankan Frontend

```bash
cd frontend
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Emulator Android tidak dapat memakai `localhost`; gunakan `10.0.2.2`. Untuk API produksi:

```bash
flutter run --dart-define=API_BASE_URL=https://tiketkita-three.vercel.app/api/v1
```

Detail layar, arsitektur, dan catatan pengembangan ada di [README frontend](frontend/README.md).

## Akun Demo (hasil seed)

| Email | Password |
|---|---|
| `demo@tiketkita.test` | `Demo1234` |
| `user2@tiketkita.test` | `Demo1234` |

## Tes

```bash
cd backend && npm test
cd frontend && flutter analyze && flutter test
```

Tes backend berjalan pada schema `test` dan menolak berjalan bila URL tidak memuat `schema=test`. Tes frontend mencakup format harga/tanggal, validasi form, dan Bottom Navigation Bar.

## Build APK

```bash
cd frontend
flutter build apk --release --dart-define=API_BASE_URL=https://tiketkita-three.vercel.app/api/v1
```

Konfigurasi rilis saat ini memakai debug signing key. APK tidak di-commit; gunakan GitHub Releases bila ingin melampirkan.

## Keamanan

Jangan menaruh kredensial (connection string, `JWT_SECRET`, kunci Supabase) di repositori. Konfigurasi hanya lewat environment variable. Akses data hanya lewat Prisma; proyek tidak memakai `supabase-js`, Data API Supabase, RLS, atau Docker pada MVP.

Untuk rencana upload foto, bucket `media` bersifat publik untuk dibaca. Penulisan hanya dilakukan backend memakai secret key Supabase (`sb_secret_...`; legacy `service_role` masih didukung) dari environment; Flutter tidak memegang kunci storage. File privat (misalnya bukti pembayaran) akan memakai bucket terpisah jika fiturnya nanti disetujui.

## Dokumentasi

- [PRD TiketKita v2.0](PRD.md)
- [README backend](backend/README.md)
- [README frontend](frontend/README.md)
- [Keputusan teknis](DECISIONS.md)
