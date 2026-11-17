# DECISIONS

Catatan keputusan dan asumsi implementasi TiketKita. PRD TiketKita v2.0 adalah sumber kebenaran produk; dokumen ini mencatat hal yang tidak diatur eksplisit atau bergantung pada lingkungan.

## Versi Terpasang (D-27)

| Komponen | Versi |
|---|---|
| Node.js (lokal) | 24.19.0 (target PRD: 22 LTS) |
| npm | 11.17.0 |
| Express | 5.3.0 |
| Prisma CLI | 7.10.1 |
| @prisma/client | 7.10.1 |
| Zod | 4.6.7 |
| bcryptjs | 3.0.3 |
| jsonwebtoken | 9.0.3 |
| dotenv | 18.0.10 |
| helmet | 8.3.0 |
| cors | 2.8.6 |
| morgan | 1.12.1 |
| Vitest | 5.1.0 |
| supertest | 7.3.2 |
| nodemon | 3.1.14 |
| Flutter | 3.47.0 (stable) |
| Dart | 3.13.0 |
| http | 1.6.0 |
| flutter_secure_storage | 11.2.0 |
| qr_flutter | 4.1.0 |
| intl | 0.20.3 |
| provider | 6.1.5+1 |

`package-lock.json` dan `pubspec.lock` dikunci di repositori.

## [2026-11-17] Node.js lokal 24.19.0, target 22 LTS
- **Konteks:** PRD 10.3 dan `engines` meminta Node.js 22 LTS, tetapi lingkungan pengembangan hanya menyediakan Node.js 24.19.0.
- **Pilihan:** `engines` tetap `"node": "22.x"` sesuai PRD; kode hanya memakai API yang tersedia pada Node.js 22. Verifikasi Fase 0 dilakukan pada Node.js 24.19.0.
- **Alasan:** Tidak ada akses untuk memasang runtime lain; kode tetap kompatibel dengan target PRD.
- **Dampak:** `.nvmrc`/runtime Vercel harus memakai Node.js 22. Sebelum responsi, jalankan ulang verifikasi pada Node.js 22.
- **Status:** menunggu pemilik produk (pasang Node.js 22 atau setujui Node.js 24).

## [2026-11-17] Prisma dikunci ke 7.10.1
- **Konteks:** `npm install prisma@latest` memasang `8.0.0-rc.34` karena tag `latest` CLI saat ini menunjuk ke rilis kandidat, sedangkan `@prisma/client@latest` adalah `7.10.1`. PRD 10.2 mewajibkan versi mayor yang sama dan D-27 meminta versi stabil terbaru.
- **Pilihan:** `prisma` dan `@prisma/client` sama-sama `7.10.1`.
- **Alasan:** Menghindari ketidakcocokan mayor dan rilis kandidat.
- **Dampak:** `backend/package.json` dan `package-lock.json`.
- **Status:** diputuskan agent.

## [2026-11-17] Persetujuan install script Prisma
- **Konteks:** npm 11 memblokir install script dependensi secara default sehingga `prisma` dan `@prisma/engines` tidak menyelesaikan postinstall.
- **Pilihan:** Menambahkan `allowScripts` untuk `prisma@7.10.1` dan `@prisma/engines@7.10.1` di `backend/package.json`.
- **Alasan:** Engine Prisma dibutuhkan untuk `prisma generate` dan migrasi.
- **Dampak:** `backend/package.json`.
- **Status:** diputuskan agent.

## [2026-11-17] Identitas Android dan konfigurasi jaringan
- **Konteks:** PRD 7.5, 10.7, dan 19.3 menentukan nama aplikasi, akses HTTP debug, serta izin internet, tetapi tidak menentukan application id atau `minSdk`.
- **Pilihan:** `applicationId = com.tiketkita.tiketkita`, `minSdk = 23`, label "TiketKita", `INTERNET` di manifest utama, dan `usesCleartextTraffic` hanya di manifest debug.
- **Alasan:** `minSdk 23` memenuhi syarat `flutter_secure_storage`; HTTP hanya untuk pengembangan lokal.
- **Dampak:** `frontend/android/app/build.gradle.kts`, manifest Android.
- **Status:** diputuskan agent.

## [2026-11-17] Fondasi Flutter Fase 0
- **Konteks:** Fase 0 meminta `flutter create`, paket PRD 10.1, dan struktur `lib/`. Layar lengkap baru dikerjakan pada Fase 7.
- **Pilihan:** `main.dart` berisi bootstrap sederhana (tema Material 3, `initializeDateFormatting('id_ID')`, branding), konstanta `API_BASE_URL` lewat `--dart-define` dengan default emulator, dan direktori `lib/` sesuai PRD 11.1 disiapkan dengan `.gitkeep`.
- **Alasan:** Memberi fondasi yang dapat dianalisis dan dijalankan tanpa mendahului fitur.
- **Dampak:** `frontend/lib/`, `frontend/test/widget_test.dart`.
- **Status:** diputuskan agent.

## [2026-11-17] Kredensial database belum tersedia
- **Konteks:** Fase 1 membutuhkan `DATABASE_URL` dan `DIRECT_URL` Supabase. Pemilik produk belum memberikan kredensial.
- **Pilihan:** Fase 0 tidak membuat `.env`; hanya `.env.example` dan `.env.test.example` dengan placeholder.
- **Alasan:** Dilarang menaruh kredensial di repositori.
- **Dampak:** Fase 1 (schema, migration, seed) disiapkan tanpa dijalankan sampai kredensial tersedia.
- **Status:** menunggu pemilik produk.
