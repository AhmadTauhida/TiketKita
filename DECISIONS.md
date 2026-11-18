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

## [2026-11-18] Validasi query di Express 5
- **Konteks:** Express 5 mendefinisikan `req.query` sebagai getter sehingga tidak dapat ditimpa hasil parsing Zod.
- **Pilihan:** Middleware `validate(schema, 'query')` menyimpan hasil validasi ke `req.validatedQuery`; body dan params tetap ditimpa seperti biasa.
- **Alasan:** Menghindari `TypeError: Cannot set property query` pada Express 5 tanpa mengubah konfigurasi bawaan.
- **Dampak:** `src/middlewares/validate.js`, `src/modules/events/controller.js`.
- **Status:** diputuskan agent.

## [2026-11-18] `isSoldOut` untuk acara tanpa jenis tiket
- **Konteks:** PRD 14.3 mendefinisikan `isSoldOut = true` bila semua jenis tiket stok 0, tetapi tidak mengatur acara tanpa jenis tiket.
- **Pilihan:** `isSoldOut = true` hanya bila acara memiliki minimal satu jenis tiket dan semuanya `availableStock = 0`; acara tanpa jenis tiket menghasilkan `false` dan `minPrice = null`.
- **Alasan:** Menghindari klaim "habis" pada acara yang belum memiliki data tiket, sesuai asumsi PRD 23.2 bahwa setiap acara memiliki minimal satu jenis tiket.
- **Dampak:** `src/utils/serializer.js`.
- **Status:** diputuskan agent.

## [2026-11-18] Fase 3 selesai
- **Konteks:** Implementasi Categories dan Events beserta tes 18.1 butir 3.
- **Pilihan:** `GET /categories`, `GET /events` (search, filter, pagination), `GET /events/featured` (didaftarkan sebelum `/:id`), `GET /events/:id`; ID bukan UUID dijawab 404. Sweep kedaluwarsa global ditunda ke Fase 4 setelah `expireOverdueBookings` tersedia.
- **Alasan:** Memenuhi DoD Fase 3; data seed `public` terverifikasi untuk kasus gratis, stok 3, sold out, CANCELLED, dan COMPLETED.
- **Dampak:** `src/modules/categories`, `src/modules/events`, `src/utils/serializer.js`, `src/routes/index.js`, `tests/`.
- **Status:** diputuskan agent (terverifikasi: `npm test` 24 lulus).

## [2026-11-18] Retry kode booking di tingkat transaksi
- **Konteks:** Pelanggaran unique `booking_code` (P2002) membatalkan transaksi PostgreSQL, sehingga retry `create` di dalam transaksi yang sama tidak dapat dilanjutkan.
- **Pilihan:** `createBooking` mengulang seluruh `prisma.$transaction` maksimal 5 kali; setiap percobaan membuat kode baru. Hanya P2002 pada `booking_code` yang diulang, error lain langsung dilempar.
- **Alasan:** Perubahan stok dari percobaan yang gagal ikut rollback, sehingga retry aman dan sesuai PRD 13.2.
- **Dampak:** `src/modules/bookings/service.js`, `src/utils/generate-code.js`.
- **Status:** diputuskan agent.

## [2026-11-18] Lazy expiry terpusat dan cakupan sweep
- **Konteks:** PRD 13.6 mewajibkan sweep pada beberapa endpoint dengan cakupan pengguna/booking, serta sweep global pada pembuatan booking dan detail acara.
- **Pilihan:** Satu fungsi `expireOverdueBookings(tx, { userId?, bookingId? })`; transisi memakai `updateMany` bersyarat `status: 'PENDING'`, dan stok dikembalikan hanya bila `count === 1`. Dipanggil pada create/list/detail/cancel booking dan `GET /events/:id` (global).
- **Alasan:** Mencegah pengembalian stok ganda saat dua request membaca booking kedaluwarsa bersamaan.
- **Dampak:** `src/utils/expire-bookings.js`, `src/modules/bookings/service.js`, `src/modules/events/service.js`.
- **Status:** diputuskan agent.

## [2026-11-18] Fase 4 selesai
- **Konteks:** Implementasi Bookings dan lazy expiry beserta tes 18.1 butir 4, 5, 7, dan 8.
- **Pilihan:** Booking atomik dengan `updateMany` bersyarat, total via `Prisma.Decimal`, pembatalan hanya PENDING, 404 untuk data pengguna lain, dan pesan status sesuai PRD 16.
- **Alasan:** Memenuhi DoD Fase 4 tanpa menyentuh schema `public`.
- **Dampak:** `src/modules/bookings`, `src/utils/expire-bookings.js`, `src/utils/generate-code.js`, `src/utils/serializer.js`, `tests/bookings.test.js`.
- **Status:** diputuskan agent (terverifikasi: `npm test` 39 lulus; uji konkurensi 5 request pada stok 3 menghasilkan 3 sukses dan 2 gagal 409).

## [2026-11-18] Komit sweep kedaluwarsa saat pembayaran ditolak
- **Konteks:** PRD 13.4 menjalankan sweep kedaluwarsa di dalam transaksi pembayaran, lalu menjawab 409 bila booking sudah EXPIRED. Melempar error dari dalam `$transaction` akan me-rollback transisi EXPIRED dan pengembalian stok.
- **Pilihan:** Setelah sweep, bila status booking bukan PENDING, transaksi mengembalikan penanda `{ conflict: status }` sehingga perubahan sweep ter-commit; controller/service melempar `ConflictError` sesuai PRD 16 setelah transaksi selesai.
- **Alasan:** Status EXPIRED dan stok yang dikembalikan tetap tersimpan, sementara respons tetap 409.
- **Dampak:** `src/modules/payments/service.js`, `tests/payments.test.js`.
- **Status:** diputuskan agent.

## [2026-11-18] Idempotensi pembayaran paralel
- **Konteks:** Dua request `POST /payments/:bookingId` paralel dapat menabrak unique `payments.booking_id` atau lolos pemeriksaan status secara bersamaan.
- **Pilihan:** Penjaga utama tetap `updateMany` dengan syarat `status = 'PENDING'`. Pelanggaran `P2002` ditangani dengan membaca ulang status booking: bila sudah PAID dijawab 409 "Pemesanan sudah dibayar"; bila belum, transaksi diulang maksimal 5 kali untuk tabrakan kode tiket/referensi transaksi.
- **Alasan:** Menghasilkan tepat satu pembayaran sukses tanpa menggandakan tiket, termasuk saat metadata target `P2002` tidak tersedia dari driver adapter.
- **Dampak:** `src/modules/payments/service.js`, `tests/payments.test.js`.
- **Status:** diputuskan agent.

## [2026-11-18] Fase 5 selesai
- **Konteks:** Implementasi Payments dan Tickets beserta tes 18.1 butir 6 dan 9.
- **Pilihan:** `POST/GET /payments/:bookingId`, `GET /tickets`, `GET /tickets/:id`; kepemilikan payment dicek lewat booking dan tiket lewat `ticket → bookingDetail → booking.userId`; `ticketCount` = jumlah baris tiket yang diterbitkan; `bookingInclude` diekspor dari modul bookings agar bentuk respons booking konsisten.
- **Alasan:** Memenuhi DoD Fase 5 tanpa mengubah skema database atau menyentuh schema `public`.
- **Dampak:** `src/modules/payments`, `src/modules/tickets`, `src/utils/generate-code.js`, `src/utils/serializer.js`, `src/modules/bookings/service.js`, `src/routes/index.js`, `tests/payments.test.js`, `tests/tickets.test.js`.
- **Status:** diputuskan agent (terverifikasi: `npm test` 58 lulus, termasuk pembayaran paralel dan isolasi data).

## [2026-11-18] Cakupan `baseUrl` Postman
- **Konteks:** PRD 19.2 mewajibkan environment `baseUrl` dan `token`, serta folder `0. Health`. Endpoint `/health` dan `/` berada di luar `/api/v1` (PRD 10.6).
- **Pilihan:** `baseUrl` berisi origin (`http://localhost:3000` atau domain Vercel) tanpa `/api/v1`; request API menuliskan path `/api/v1/...` lengkap. ID dinamis (`eventId`, `ticketTypeId`, `bookingId`, `ticketId`) disimpan sebagai collection variable, bukan environment variable.
- **Alasan:** Satu environment dapat dipakai untuk health check sekaligus API, dan file environment tetap hanya memuat variabel yang diwajibkan PRD.
- **Dampak:** `backend/postman/`, `backend/README.md`.
- **Status:** diputuskan agent.

## [2026-11-18] Fase 6 selesai
- **Konteks:** Penutupan backend: koleksi Postman, konfigurasi Vercel, README, dan verifikasi seluruh tes wajib.
- **Pilihan:** Koleksi berisi 18 request pada 8 folder dengan satu contoh respons per request; Login menyimpan `token` otomatis; environment Local dan Vercel disediakan. `vercel.json` mengikuti PRD 19.1. README backend mencakup setup, env, migrasi, seed, tes, Postman, dan deployment.
- **Alasan:** Memenuhi DoD Fase 6 dan PRD 19 tanpa menambah dependensi atau mengubah kontrak API.
- **Dampak:** `backend/vercel.json`, `backend/postman/`, `backend/README.md`.
- **Status:** diputuskan agent (terverifikasi: `npm test` 58 lulus; smoke test `GET /health`, `GET /`, `GET /api/v1/categories` merespons 200).

## [2026-11-18] Fase 7 increment 1: fondasi Flutter dan Home
- **Konteks:** Frontend baru memiliki tema dan bootstrap; Home (PRD 7.1) membutuhkan ApiClient, model, service, sesi autentikasi, routing, dan MainShell.
- **Pilihan:** `ApiClient` terpusat dengan token dari secure storage dan penanganan 401; `AuthState` sebagai provider sesi; MainShell dengan Bottom Navigation dan placeholder Explore/My Tickets/Profile; tab privat menampilkan snackbar sampai halaman Login tersedia; Home memuat featured, kategori, dan acara terdekat secara paralel dengan loading, error + "Coba Lagi", empty state, dan pull-to-refresh; kartu acara membuka placeholder Event Detail.
- **Alasan:** Memenuhi tampilan dan perilaku Home tanpa mendahului halaman lain, sekaligus menyiapkan fondasi yang dipakai seluruh Fase 7.
- **Dampak:** `frontend/lib/core`, `models`, `services`, `state`, `routes`, `screens`, `widgets`, `main.dart`, `test/widget_test.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 3 tes formatter lulus).

## [2026-11-18] Fase 7 increment 2: halaman Explore
- **Konteks:** PRD 7.1 meminta Explore dengan search bar (debounce 400 ms), chip kategori termasuk "Semua", daftar acara dengan infinite scroll, dan empty state.
- **Pilihan:** `ExploreScreen` memuat kategori sekali dan daftar acara per halaman (`limit=10`); pencarian dan perubahan kategori mereset daftar; `_requestId` membuang respons lama; pagination dipicu `extentAfter < 300`; error pagination ditampilkan lewat snackbar; FocusNode dimiliki MainShell agar pencarian dari Home langsung fokus ke kolom Explore.
- **Alasan:** Memenuhi perilaku Explore tanpa menambah dependensi dan tanpa mengubah kontrak API.
- **Dampak:** `frontend/lib/screens/explore/explore_screen.dart`, `frontend/lib/screens/main_shell.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 3 tes formatter lulus).
