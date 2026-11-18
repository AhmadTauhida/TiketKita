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
| @prisma/adapter-pg | 7.10.1 |
| pg (transitif) | 8.23.1 |
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
- **Status:** selesai (kredensial tersedia 2026-11-18; lihat entri koneksi database).

## [2026-11-18] Prisma 7: config eksternal dan driver adapter
- **Konteks:** Prisma 7 tidak lagi mengizinkan `url` di `datasource` schema, mewajibkan `prisma7.config.ts`, dan `PrismaClient` memerlukan driver adapter. Generator baru `prisma-client` hanya menghasilkan TypeScript, sedangkan backend ini JavaScript ESM (PRD 9.5, D-27).
- **Pilihan:** Memakai `prisma-client-js` (masih didukung di Prisma 7, output JS ke `node_modules`), `prisma7.config.ts` dengan `datasource.url = DIRECT_URL`, dan `@prisma/adapter-pg` untuk koneksi runtime.
- **Alasan:** Menjaga backend tetap JavaScript tanpa build step TypeScript dan tetap sesuai dokumentasi versi Prisma terpasang.
- **Dampak:** `backend/prisma7.config.ts`, `backend/prisma/schema.prisma`, `backend/package.json`, `@prisma/client`, `config/database.js` (Fase 2).
- **Status:** diputuskan agent.

## [2026-11-18] Migrasi awal tanpa shadow database
- **Konteks:** `prisma migrate dev` membutuhkan shadow database yang belum tentu dapat dibuat pada Supabase (PRD 9.5).
- **Pilihan:** Migration awal dibuat dengan `prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script`, ditambah migration check constraint manual, lalu diterapkan dengan `prisma migrate deploy`.
- **Alasan:** `migrate deploy` tidak membutuhkan shadow database dan tetap tercatat di `_prisma_migrations`.
- **Dampak:** `backend/prisma/migrations/20261118000000_init`, `20261118000100_add_check_constraints`. Perubahan skema berikutnya memakai alur yang sama atau konfigurasi `shadowDatabaseUrl` bila tersedia.
- **Status:** diputuskan agent.

## [2026-11-18] DIRECT_URL memakai session pooler
- **Konteks:** Host direct Supabase (`db.<ref>.supabase.co`) hanya memiliki record IPv6, sedangkan jaringan pengembangan tidak memiliki rute IPv6 (koneksi `ENETUNREACH`).
- **Pilihan:** `DIRECT_URL` memakai session pooler Supabase pada port 5432 dengan user `postgres.<ref>`; `DATABASE_URL` memakai transaction pooler port 6543 dengan `pgbouncer=true`.
- **Alasan:** Session pooler dapat diakses lewat IPv4 dan mendukung migrasi serta transaksi.
- **Dampak:** `.env`, `.env.test` (lokal, tidak di-commit).
- **Status:** diputuskan agent.

## [2026-11-18] Fase 1 dijalankan pada schema public
- **Konteks:** Migration dan seed Fase 1 dijalankan pada schema `public` sesuai tujuan aplikasi. Tes otomatis tetap wajib memakai schema `test` (PRD 18.1).
- **Pilihan:** `prisma migrate deploy` dan seed dijalankan sekali pada schema `public`; `SEED_CONFIRM=yes` dipakai saat menjalankan seed.
- **Alasan:** Menyiapkan data demo untuk pengembangan sebelum tes otomatis dibuat.
- **Dampak:** Database Supabase schema `public` (8 tabel + `_prisma_migrations`).
- **Status:** diputuskan agent.

## [2026-11-18] Isolasi schema test pada Prisma 7 driver adapter
- **Konteks:** Prisma 7 memakai driver adapter, sehingga parameter `?schema=test` pada URL tidak otomatis menjadi `search_path`. Query bertipe Prisma memakai `schemaName` dari opsi adapter, tetapi raw SQL tanpa kualifikasi tetap mengarah ke `public` (PRD 18.1).
- **Pilihan:** `config/database.js` memisahkan parameter `schema` dari URL dan meneruskannya sebagai `new PrismaPg(url, { schema })`. Setup tes menolak berjalan bila `DATABASE_URL`/`DIRECT_URL` tidak memuat `schema=test`, dan seluruh pembersihan tes memakai operasi Prisma bertipe (`deleteMany`) sehingga hanya menyentuh schema `test`.
- **Alasan:** Menjamin tes tidak pernah membaca atau menghapus data schema `public`.
- **Dampak:** `src/config/database.js`, `tests/load-env.js`, `tests/global-setup.js`, `tests/setup.js`. Raw SQL pada tes wajib mengualifikasikan schema secara eksplisit.
- **Status:** diputuskan agent.

## [2026-11-18] Konfigurasi Vitest
- **Konteks:** Tes backend membutuhkan migrasi schema `test` sekali di awal dan pembersihan data antar-tes tanpa paralelisme yang dapat saling mengganggu.
- **Pilihan:** `vitest.config.js` memakai `globalSetup` untuk `prisma migrate deploy` dengan `PRISMA_ENV_FILE=.env.test`, `setupFiles` untuk memuat `.env.test` dan truncate, serta `fileParallelism: false`.
- **Alasan:** Menghindari race condition antar berkas tes dan memastikan environment tes konsisten.
- **Dampak:** `backend/vitest.config.js`, `backend/tests/`.
- **Status:** diputuskan agent.

## [2026-11-18] Fase 2 selesai
- **Konteks:** Implementasi fondasi backend, Auth, dan Users beserta tes 18.1 butir 1 dan 2.
- **Pilihan:** Envelope respons dan status code mengikuti PRD 14; pesan error Bahasa Indonesia sesuai PRD 16; 12 tes Vitest dijalankan pada schema `test`.
- **Alasan:** Memenuhi Definition of Done Fase 2 tanpa menyentuh schema `public`.
- **Dampak:** `src/config`, `src/middlewares`, `src/modules/auth`, `src/modules/users`, `src/utils`, `tests/`.
- **Status:** diputuskan agent (terverifikasi: `npm test` 12 lulus).
