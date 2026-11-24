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
| multer | 2.5.0 |
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
| image_picker | 1.2.4 |

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

## [2026-11-18] Fase 7 increment 3: halaman Event Detail
- **Konteks:** PRD 7.1 dan 7.4 meminta detail acara dengan poster, informasi lengkap, stepper tiket 0-10 dibatasi stok, total, tombol "Pesan Tiket", serta label nonaktif sesuai status acara.
- **Pilihan:** Menambahkan model `EventDetail`, `TicketType`, `BookingDraft`, widget `QuantityStepper`, dan `EventService.getEventDetail`. Total dihitung lokal hanya untuk tampilan; angka final tetap dari `POST /bookings`. Tamu yang menekan "Pesan Tiket" mendapat snackbar sampai halaman Login dibuat. Pengguna login diarahkan ke Checkout (placeholder) dengan `BookingDraft`.
- **Alasan:** Memenuhi perilaku Event Detail tanpa mengubah kontrak API dan menyiapkan data yang dibutuhkan Checkout.
- **Dampak:** `frontend/lib/models`, `frontend/lib/services/event_service.dart`, `frontend/lib/widgets/quantity_stepper.dart`, `frontend/lib/screens/event_detail`, `frontend/lib/screens/checkout`, `frontend/lib/routes/app_routes.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 3 tes formatter lulus).

## [2026-11-18] Fase 7 increment 4: Auth (Login dan Register)
- **Konteks:** PRD 7.1, 7.4, dan D-03/D-08 meminta Login, Register, auto-login setelah register, permintaan login saat memesan atau membuka tab privat, serta penanganan 401.
- **Pilihan:** Menambahkan validasi klien bersama, `AuthSession`, `AuthService.login/register`, dan `AuthState.login/register`. Login/Register memakai hasil `Navigator.pop(true)` sebagai pengganti `redirectTo` agar layar pemanggil dapat melanjutkan alur. Event Detail langsung membuka Checkout setelah login tanpa kehilangan pilihan jumlah. Tab My Tickets/Profile membuka Login lalu berpindah tab bila berhasil. 401 global memakai `AppRoutes.navigatorKey` untuk membersihkan stack dan membuka Login dengan pesan sesi berakhir.
- **Alasan:** Memenuhi alur autentikasi PRD tanpa menambah dependensi dan tanpa mengubah kontrak API.
- **Dampak:** `frontend/lib/core/utils/validators.dart`, `frontend/lib/models/auth_session.dart`, `frontend/lib/services/auth_service.dart`, `frontend/lib/state/auth_state.dart`, `frontend/lib/screens/auth`, `frontend/lib/routes/app_routes.dart`, `frontend/lib/main.dart`, `frontend/lib/screens/main_shell.dart`, `frontend/lib/screens/event_detail/event_detail_screen.dart`, `frontend/test/validators_test.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 7 tes lulus).

## [2026-11-18] Fase 7 increment 5: halaman Checkout
- **Konteks:** PRD 7.1 dan 7.4 meminta ringkasan acara, rincian tiket, total, tombol "Lanjutkan", lalu `POST /bookings` dan Checkout diganti Payment.
- **Pilihan:** Menambahkan model `Booking`, `Payment`, dan `BookingService.createBooking`; total Checkout hanya pratinjau dari `BookingDraft`. Setelah booking sukses, `pushReplacementNamed` membawa `Booking` hasil server ke Payment (placeholder). Payment nanti memakai `booking.totalAmount` sebagai nominal.
- **Alasan:** Memenuhi alur Checkout tanpa menghitung ulang harga di client dan menyiapkan data untuk Payment.
- **Dampak:** `frontend/lib/models/booking.dart`, `frontend/lib/models/payment.dart`, `frontend/lib/services/booking_service.dart`, `frontend/lib/screens/checkout/checkout_screen.dart`, `frontend/lib/screens/payment/payment_screen.dart`, `frontend/lib/routes/app_routes.dart`, `frontend/lib/main.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 7 tes lulus).

## [2026-11-18] Fase 7 increment 6: Payment dan Payment Success
- **Konteks:** PRD 7.1, 7.3, 7.4, dan 13.4 meminta hitung mundur 15 menit, pilihan metode, pembayaran simulasi, penanganan 409, serta layar sukses dengan aksi ke tiket/beranda.
- **Pilihan:** Menambahkan `PaymentService`, `BookingService.getBooking`, dan `formatCountdown`. Metode default `BANK_TRANSFER`. Saat countdown habis, booking dimuat ulang dari server agar status `EXPIRED` ditentukan backend. 409 "Pemesanan sudah dibayar" memuat ulang booking lalu langsung ke Payment Success. Payment Success mengarah ke MainShell tab My Tickets (`arguments: 2`) atau tab Home (`arguments: 0`).
- **Alasan:** Memenuhi alur pembayaran dan idempotensi dari sisi UI tanpa menghitung nominal di client.
- **Dampak:** `frontend/lib/services/payment_service.dart`, `frontend/lib/services/booking_service.dart`, `frontend/lib/core/utils/formatters.dart`, `frontend/lib/screens/payment`, `frontend/lib/screens/main_shell.dart`, `frontend/lib/routes/app_routes.dart`, `frontend/lib/main.dart`, `frontend/test/widget_test.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 8 tes lulus).

## [2026-11-18] Fase 7 increment 7: My Tickets
- **Konteks:** PRD 7.1 dan 7.2 meminta dua sub-tab (Tiket dan Pesanan), kartu ringkas dengan badge status, serta empty state tamu.
- **Pilihan:** Menambahkan `EventBrief` bersama, `TicketSummary`, `TicketService.listTickets`, `BookingService.listBookings`, kartu tiket/pesanan, dan `StatusBadge`. Kedua tab memuat maksimal 50 data terbaru tanpa infinite scroll; detail Booking/Ticket masih placeholder. Tamu melihat empty state dengan tombol Masuk dan daftar dimuat ulang setelah `AuthState` berubah.
- **Alasan:** Data MVP sedikit, sehingga satu halaman cukup; pagination UI dapat ditambahkan tanpa mengubah kontrak API.
- **Dampak:** `frontend/lib/models/event_brief.dart`, `frontend/lib/models/ticket.dart`, `frontend/lib/models/booking.dart`, `frontend/lib/services/ticket_service.dart`, `frontend/lib/services/booking_service.dart`, `frontend/lib/widgets/status_badge.dart`, `frontend/lib/widgets/ticket_card.dart`, `frontend/lib/widgets/booking_card.dart`, `frontend/lib/screens/tickets`, `frontend/lib/screens/bookings`, `frontend/lib/routes/app_routes.dart`, `frontend/lib/main.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 8 tes lulus).

## [2026-11-18] Fase 7 increment 8: Booking Detail dan Ticket Detail
- **Konteks:** PRD 7.1, 7.3, 7.4, FR-18, dan FR-19 meminta detail pesanan dengan aksi sesuai status, serta detail tiket dengan QR Code.
- **Pilihan:** Booking Detail memuat ulang `GET /bookings/:id`, menampilkan hitung mundur untuk PENDING, aksi "Bayar Sekarang"/"Batalkan Pemesanan" dengan dialog, dan "Lihat Tiket" untuk PAID. Pembatalan sukses mengembalikan pengguna ke daftar Pesanan dan memuat ulang daftar. Ticket Detail memakai `GET /tickets/:id` dan `QrImageView` berisi `qrToken` (220 dp, latar putih). `BookingService.cancelBooking` dan `TicketService.getTicket` ditambahkan.
- **Alasan:** Menutup alur utama MVP (pesan → bayar → tiket + QR → batal) sesuai PRD tanpa dependensi baru.
- **Dampak:** `frontend/lib/models/ticket_detail.dart`, `frontend/lib/services/booking_service.dart`, `frontend/lib/services/ticket_service.dart`, `frontend/lib/screens/bookings/booking_detail_screen.dart`, `frontend/lib/screens/tickets/ticket_detail_screen.dart`, `frontend/lib/screens/tickets/my_tickets_screen.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 8 tes lulus).

## [2026-11-18] Fase 7 increment 9: Profile, Edit Profile, dan About
- **Konteks:** PRD 7.1, FR-04, FR-05, FR-21, dan FR-22 meminta profil, edit profil, About, dan logout.
- **Pilihan:** Profil menampilkan avatar (URL atau inisial), nama, email, telepon, serta menu Edit Profil/About/Logout dengan dialog konfirmasi. Logout membersihkan token dan kembali ke MainShell sebagai tamu. Edit Profil memakai `PUT /users/profile`; email read-only dan URL foto opsional dengan validasi http/https. About menampilkan nama, versi, deskripsi, platform, dan konteks; identitas pengembang diisi "Tim TiketKita" dan dapat diganti pemilik produk.
- **Alasan:** Menutup seluruh layar Fase 7 tanpa menambah dependensi.
- **Dampak:** `frontend/lib/core/utils/validators.dart`, `frontend/lib/services/auth_service.dart`, `frontend/lib/state/auth_state.dart`, `frontend/lib/widgets/user_avatar.dart`, `frontend/lib/screens/profile`, `frontend/lib/routes/app_routes.dart`, `frontend/test/validators_test.dart`, `frontend/test/navigation_test.dart`.
- **Status:** diputuskan agent (terverifikasi: `flutter analyze` bersih, 10 tes lulus, termasuk widget test Bottom Navigation Bar).

## [2026-11-19] Fase 8: verifikasi integrasi dan finalisasi
- **Konteks:** Fase 8 meminta uji end-to-end, perbaikan bug, README final, pemeriksaan rahasia, dan build APK. Pengujian APK di perangkat diserahkan ke pemilik produk.
- **Pilihan/verifikasi:** `npm test` 58 lulus; `flutter analyze` bersih; `flutter test` 10 lulus; API produksi diuji 13/13 untuk katalog, featured, gratis, stok 3, sold out, CANCELLED, COMPLETED, 404, dan 401; pembayaran sukses + tiket + QR + pembayaran ganda diuji sebelumnya; pemindaian riwayat Git tidak menemukan kredensial nyata (hanya placeholder di `.env.example`/PRD); `flutter build apk --release` dengan URL produksi berhasil (≈53 MB) memakai JBR 25.
- **Catatan build:** Flutter 3.47 otomatis memigrasikan `minSdk = 23` menjadi `flutter.minSdkVersion` (24) saat build; nilai 24 tetap memenuhi kebutuhan `flutter_secure_storage`.
- **Dampak:** `README.md`, `frontend/README.md`, `frontend/android/app/build.gradle.kts`. APK berada di `frontend/build/` dan tidak di-commit.
- **Status:** diputuskan agent; menunggu pemilik produk untuk uji manual emulator/perangkat, uji APK, dan asistensi/responsi.

## [2026-11-23] Perluasan scope: upload foto profil
- **Konteks:** PRD 3.2 butir 10, D-12, dan D-23 menetapkan foto profil hanya berupa URL dan upload file di luar MVP. Pemilik produk menyetujui upload foto profil masuk scope pada 2026-11-23.
- **Pilihan:** Menambah endpoint privat `POST /api/v1/users/profile/photo` dengan `multipart/form-data` dan field `photo`. `PUT /api/v1/users/profile` tetap dipertahankan untuk nama, telepon, dan kompatibilitas `profileImage` berupa URL. Flutter berhenti mengirim `profileImage` saat hanya mengubah nama/telepon agar foto hasil upload tidak tertimpa `null`.
- **Alasan:** Pengguna dapat mengganti foto tanpa mencari URL eksternal, sementara kontrak `PUT` lama dan tes/Postman yang sudah ada tetap berjalan.
- **Dampak:** `backend/src/modules/users`, `backend/src/middlewares`, `backend/src/services/storage.js`, `backend/src/config/env.js`, `backend/.env.example`, `backend/tests`, koleksi Postman, `frontend/lib/core/network/api_client.dart`, `frontend/lib/services/auth_service.dart`, `frontend/lib/state/auth_state.dart`, `frontend/lib/screens/profile/edit_profile_screen.dart`, `frontend/lib/widgets/user_avatar.dart`, `frontend/pubspec.yaml`, README.
- **Status:** diputuskan pemilik produk. PRD bagian 3.2, D-12, D-23, 10.1, 10.2, 14.2, 14.4, 14.5, 16, 18.1, dan 19.1 masih perlu direvisi pemilik produk; agent tidak mengubah isi PRD.

## [2026-11-23] Penyimpanan media: satu bucket publik `media`
- **Konteks:** Foto profil dan poster event bersifat publik, sedangkan bukti pembayaran nantinya privat. Vercel tidak menyediakan filesystem permanen untuk menyimpan file upload.
- **Pilihan:** Memakai satu bucket Supabase Storage publik `media` dengan prefix `avatars/{userId}/...` dan `events/{eventId}/...`. Bucket privat terpisah (misalnya `private-media`) hanya dibuat jika fitur file privat disetujui. Upload hanya dari backend memakai service-role key dari environment; tidak memakai `supabase-js`, Data API `/rest/v1`, RLS, atau policy baru.
- **Alasan:** Kedua aset sama-sama publik, ditulis lewat backend, dan dapat memakai CDN yang sama. Satu bucket mengurangi konfigurasi, sedangkan prefix menjaga pemisahan logis dan menyiapkan poster event tanpa mengunci bucket ke avatar.
- **Dampak:** Bucket Supabase `media`, env `SUPABASE_MEDIA_BUCKET`, adapter storage backend, README backend, dan environment Vercel.
- **Status:** diputuskan pemilik produk. Bucket `media` sudah dibuat dan diverifikasi melalui metadata storage: publik, prefix root `avatars/` dan `events/`, MIME `image/jpeg`, `image/png`, `image/webp`, serta public read HTTP 200.

## [2026-11-23] Kebijakan file media publik
- **Konteks:** Perlu batas format, ukuran, dan penamaan yang konsisten antara bucket Supabase Storage, backend, dan Flutter.
- **Pilihan:** MIME yang diizinkan `image/jpeg`, `image/png`, dan `image/webp`; menolak SVG, GIF, HEIC, BMP, TIFF, dan `application/octet-stream`. Batas bucket 5 MB; backend menegakkan 2 MB untuk avatar dan 4 MB untuk poster event karena body request Vercel dibatasi sekitar 4,5 MB. Validasi memakai MIME dan magic bytes. Nama object dibuat server dengan pola `{purpose}/{ownerId}/{uuid}.{ext}`.
- **Alasan:** SVG berisiko XSS, file non-gambar dapat menyamar lewat MIME, dan nama unik mencegah cache basi saat foto diganti.
- **Dampak:** Middleware upload, adapter storage, `env.js`, pengaturan bucket, README, dan tes backend.
- **Status:** diputuskan agent berdasarkan bucket yang sudah diverifikasi; batas ukuran per jenis masih dapat diubah pemilik produk.

## [2026-11-23] Kontrak respons upload foto
- **Konteks:** PRD 14.2 belum memuat status code untuk upload file. Respons harus tetap memakai envelope dan pesan Bahasa Indonesia.
- **Pilihan:** File tidak ada, format tidak didukung, atau ukuran berlebih dijawab **422** dengan `errors[]` (field `photo`). Kegagalan storage dijawab **502** dengan pesan `Gagal mengunggah foto, coba lagi`. Tanpa token tetap **401**. Status 413/415 tidak dipakai agar peta status code tetap kecil.
- **Alasan:** 422 konsisten dengan pola validasi yang sudah ada, sedangkan 502 membedakan kegagalan layanan storage dari bug internal 500.
- **Dampak:** `errors.js`, `middlewares/error.js`, controller/service users, PRD 14.2 dan 16 (perlu revisi pemilik produk), koleksi Postman, tes.
- **Status:** diputuskan agent; menunggu revisi PRD oleh pemilik produk.

## [2026-11-23] Dependensi upload foto
- **Konteks:** Express belum menangani `multipart/form-data`, dan Flutter belum memiliki pemilih gambar. PRD 10.1/10.2 belum mencantumkan paket ini.
- **Pilihan:** Menambahkan `multer` di backend dan `image_picker` di Flutter. Versi stabil terbaru akan dikunci di `package-lock.json`/`pubspec.lock` dan dicatat di tabel versi setelah instalasi. Tidak menambahkan `supabase-js` atau SDK storage lain; upload Supabase memakai REST Storage API lewat `fetch` bawaan Node.js.
- **Alasan:** Kedua paket adalah pilihan minimal untuk kebutuhan masing-masing platform tanpa menambah SDK besar.
- **Dampak:** `backend/package.json`, `backend/package-lock.json`, `frontend/pubspec.yaml`, `frontend/pubspec.lock`, tabel versi DECISIONS, PRD 10.1/10.2 (perlu revisi pemilik produk).
- **Status:** diputuskan agent; belum terpasang.

## [2026-11-23] Manajemen event admin dan poster event belum masuk scope
- **Konteks:** Pemilik produk menanyakan kemungkinan admin melakukan CRUD event dan upload poster. Fitur ini masih di luar MVP (PRD 3.2 butir 2 dan 3) dan role Admin masih dilarang.
- **Pilihan:** Struktur bucket `media/events/` disiapkan agar siap dipakai, tetapi admin CRUD, role Admin, dan endpoint upload poster belum diimplementasikan.
- **Alasan:** Menghindari mengerjakan fitur di luar MVP tanpa keputusan scope terpisah. Desain bucket tidak sama dengan persetujuan fitur admin.
- **Dampak:** Tidak ada kode; hanya desain bucket dan catatan ini.
- **Status:** menunggu pemilik produk (perlu persetujuan scope dan revisi PRD terpisah).

## [2026-11-23] Rencana fase pengembangan upload foto profil
- **Konteks:** Scope upload foto profil sudah disetujui dan bucket `media` sudah siap. Implementasi perlu dipecah agar backend, frontend, dan verifikasi tidak saling menunggu, serta tetap bisa diuji tanpa kredensial storage nyata.
- **Pilihan:** Lima fase berikut dikerjakan berurutan.

  1. **Fase 1 — Konfigurasi dan fondasi storage backend**
     - Tambah env `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_MEDIA_BUCKET`, dan `STORAGE_DRIVER` (`supabase`/`memory`).
     - Buat adapter `storage.js` dengan operasi upload, public URL, dan delete. Mode `memory` dipakai tes; mode `supabase` memakai REST Storage API lewat `fetch`, bukan `supabase-js`/Data API.
     - Tambah `multer` memory storage, limit ukuran, filter MIME, dan validasi magic bytes.
     - Tambah error 422/502 dan pemetaan error multer.
     - **DoD:** unit test adapter storage (mock/memory) lulus; `env.js` tidak mewajibkan kredensial storage saat tes; tidak ada kredensial di repo.

  2. **Fase 2 — Endpoint upload foto profil**
     - Tambah `POST /api/v1/users/profile/photo` (privat, field `photo`).
     - Upload object ke `media/avatars/{userId}/{uuid}.{ext}`, simpan URL publik ke `users.profile_image`, kembalikan `data.user`.
     - Hapus object lama secara best-effort jika berasal dari bucket yang sama.
     - Tambah tes: sukses, tanpa token, tanpa file, format salah, ukuran berlebih, magic bytes salah, dan penggantian foto.
     - Tambah request Postman multipart.
     - **DoD:** `npm test` hijau; tidak perlu migration database; respons dan status code sesuai keputusan 2026-11-23.

  3. **Fase 3 — Fondasi network dan state Flutter**
     - Tambah `image_picker` dan method multipart di `ApiClient` dengan timeout upload terpisah (60 detik).
     - Tambah `AuthService.uploadProfilePhoto` dan `AuthState.uploadProfilePhoto`.
     - Ubah `updateProfile` agar tidak mengirim `profileImage` kecuali sedang menghapus foto.
     - **DoD:** `flutter analyze` bersih; tes unit untuk pemetaan respons/401 jika memungkinkan.

  4. **Fase 4 — UI Edit Profil**
     - Ganti input URL dengan avatar + tombol “Ubah Foto”.
     - Pilih dari galeri, kompres via `image_picker` (`maxWidth`/`maxHeight` 1024, quality 85), validasi ukuran 2 MB, tampilkan preview lokal.
     - Saat “Simpan”: validasi form, upload foto lebih dulu, lalu `PUT` nama/telepon bila berubah. Jika upload gagal, data teks tidak dikirim. Jika `PUT` gagal setelah upload sukses, tampilkan pesan bahwa foto sudah tersimpan.
     - Tambah aksi “Hapus Foto” lewat `PUT` dengan `profileImage: null`.
     - Kamera tidak dimasukkan pada fase ini; galeri saja untuk menghindari izin tambahan.
     - **DoD:** alur pilih → preview → simpan berfungsi, loading/error/empty state ada, tombol nonaktif saat request, dan 401 kembali ke Login.

  5. **Fase 5 — Integrasi, verifikasi, dan dokumentasi**
     - Isi kredensial storage di `.env` lokal dan environment Vercel (tidak di-commit).
     - Uji upload nyata ke bucket `media`, penggantian foto, hapus foto, file invalid, dan file >2 MB.
     - Uji end-to-end: Login → Edit Profil → upload → kembali ke Profile → avatar berubah → logout/login ulang tetap tampil.
     - Perbarui README, Postman, tabel versi dependensi, dan status DECISIONS.
     - **DoD:** `npm test` hijau, `flutter analyze` bersih, `flutter test` lulus, `flutter build apk --release` berhasil, dan bucket berisi object `avatars/{userId}/...` yang dapat dibaca publik.
- **Alasan:** Memisahkan fondasi storage dari endpoint dan UI membuat setiap fase dapat diverifikasi sendiri. Tes tidak bergantung pada bucket nyata, sehingga pengembangan tidak terblokir kredensial.
- **Dampak:** `backend/src/config`, `backend/src/middlewares`, `backend/src/services`, `backend/src/modules/users`, `backend/tests`, `backend/postman`, `backend/.env.example`, `backend/README.md`, `frontend/lib/core/network`, `frontend/lib/services/auth_service.dart`, `frontend/lib/state/auth_state.dart`, `frontend/lib/screens/profile/edit_profile_screen.dart`, `frontend/lib/widgets/user_avatar.dart`, `frontend/test`, `frontend/pubspec.yaml`, `frontend/README.md`, `README.md`.
- **Status:** diputuskan agent. Fase 1 dan 2 dapat dimulai tanpa service-role key dengan mode `memory`; verifikasi bucket nyata menunggu `SUPABASE_SERVICE_ROLE_KEY` di `backend/.env`. Revisi PRD oleh pemilik produk tetap diperlukan sebelum fitur dinyatakan selesai.

## [2026-11-23] Fase 1 upload foto profil selesai
- **Konteks:** Fase 1 mencakup konfigurasi storage, adapter `memory`/`supabase`, validasi gambar, middleware upload, error 502, dan tes tanpa bucket nyata.
- **Pilihan:** Menambahkan `multer` 2.5.0, env `STORAGE_DRIVER`/`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_MEDIA_BUCKET`, adapter `src/services/storage.js` dengan REST Storage API lewat `fetch`, deteksi magic bytes JPEG/PNG/WebP di `src/utils/image.js`, serta middleware `uploadAvatar`/`validateAvatar` dan `uploadEventPoster`/`validateEventPoster` di `src/middlewares/upload.js`. `BadGatewayError` (502) ditambahkan untuk kegagalan storage.
- **Verifikasi:** `npx vitest run tests/storage.test.js` → 16 tes lulus; `npm test` → 74 tes lulus (58 tes lama + 16 tes baru); `git diff --check` bersih.
- **Dampak:** `backend/package.json`, `backend/package-lock.json`, `backend/src/config/env.js`, `backend/src/services/storage.js`, `backend/src/utils/image.js`, `backend/src/middlewares/upload.js`, `backend/src/utils/errors.js`, `backend/.env.example`, `backend/.env.test.example`, `backend/tests/storage.test.js`, `backend/README.md`.
- **Status:** diputuskan agent (Fase 1 selesai). Endpoint `POST /users/profile/photo` dan UI belum dibuat (Fase 2–4). Verifikasi bucket nyata tetap menunggu `SUPABASE_SERVICE_ROLE_KEY` di `backend/.env`.

## [2026-11-23] Fase 2 upload foto profil selesai
- **Konteks:** Fase 2 mencakup endpoint upload foto profil, penyimpanan URL ke database, pembersihan foto lama, tes endpoint, dan request Postman.
- **Pilihan:** Menambahkan `POST /api/v1/users/profile/photo` dengan urutan `authenticate → uploadAvatar → validateAvatar → controller`. Service memverifikasi pengguna, membuat path `avatars/{userId}/{uuid}.{ext}`, mengunggah ke storage, menyimpan URL ke `users.profile_image`, menghapus file baru jika update database gagal, dan menghapus file lama secara best-effort. `PUT /users/profile` tidak berubah. Request Postman memakai `form-data` field `photo`.
- **Verifikasi:** `npx vitest run tests/users.test.js` → 11 tes lulus; `npm test` → 81 tes lulus (74 tes lama + 7 tes endpoint baru); koleksi Postman valid sebagai JSON; `git diff --check` bersih.
- **Dampak:** `backend/src/modules/users/service.js`, `backend/src/modules/users/controller.js`, `backend/src/modules/users/routes.js`, `backend/tests/users.test.js`, `backend/postman/TiketKita_API.postman_collection.json`, `backend/README.md`, `README.md`.
- **Status:** diputuskan agent (Fase 2 selesai). UI Flutter belum dibuat (Fase 3–4). Verifikasi bucket nyata tetap menunggu `SUPABASE_SERVICE_ROLE_KEY` di `backend/.env` pada Fase 5.

## [2026-11-23] Fase 3 upload foto profil selesai
- **Konteks:** Fase 3 mencakup fondasi Flutter untuk memilih, mengirim, dan menyimpan hasil upload foto profil sebelum UI Edit Profil diubah.
- **Pilihan:** Menambahkan `image_picker` 1.2.4. `ApiClient` mendapat `uploadFile` berbasis `MultipartRequest` dengan timeout 60 detik, header Authorization, dan content type JPEG/PNG/WebP; respons 401/error memakai pemetaan yang sama dengan request JSON. `AuthService` dan `AuthState` mendapat `uploadProfilePhoto`. `updateProfile` sekarang hanya mengirim `profileImage` jika diisi atau `clearProfileImage: true`, sehingga update nama/telepon tidak menghapus foto hasil upload.
- **Verifikasi:** `flutter analyze` bersih; `flutter test` → 15 tes lulus (5 tes baru di `test/auth_service_test.dart`, termasuk multipart, 401, error 422, pemetaan user, dan perilaku `updateProfile`).
- **Dampak:** `frontend/pubspec.yaml`, `frontend/pubspec.lock`, `frontend/lib/core/network/api_client.dart`, `frontend/lib/services/auth_service.dart`, `frontend/lib/state/auth_state.dart`, `frontend/test/auth_service_test.dart`, `frontend/README.md`, `README.md`.
- **Status:** diputuskan agent (Fase 3 selesai). UI Edit Profil dan upload nyata belum dibuat (Fase 4–5).

## [2026-11-23] Fase 4 upload foto profil selesai
- **Konteks:** Fase 4 mencakup UI Edit Profil untuk memilih, melihat pratinjau, mengunggah, dan menghapus foto profil.
- **Pilihan:** Input URL foto dihapus dan diganti avatar + tombol “Ubah Foto”/“Hapus Foto”. Galeri memakai `image_picker` dengan kompresi maksimal 1024 px dan quality 85; file divalidasi maksimal 2 MB dan ditampilkan lewat preview lokal. Saat Simpan, foto diunggah lebih dulu, lalu `PUT /users/profile` hanya jika nama/telepon berubah atau foto dihapus. Kegagalan upload tidak mengirim data teks; kegagalan `PUT` setelah upload sukses menampilkan pesan bahwa foto sudah tersimpan. Tombol dinonaktifkan selama request. `UserAvatar` mendukung `ImageProvider` untuk preview lokal. `validateProfileImage` dihapus karena input URL tidak dipakai lagi.
- **Verifikasi:** `flutter analyze` bersih; `flutter test` → 15 tes lulus, termasuk tes widget Edit Profil yang memastikan input URL tidak ada dan tombol “Ubah Foto” tersedia; `flutter build apk --debug` berhasil (plugin `image_picker` terdaftar).
- **Dampak:** `frontend/lib/screens/profile/edit_profile_screen.dart`, `frontend/lib/widgets/user_avatar.dart`, `frontend/lib/core/utils/validators.dart`, `frontend/test/validators_test.dart`, `frontend/test/edit_profile_screen_test.dart`, `frontend/README.md`, `README.md`.
- **Status:** diputuskan agent (Fase 4 selesai). Upload nyata ke bucket `media`, uji end-to-end di emulator, dan build APK menunggu Fase 5 serta `SUPABASE_SERVICE_ROLE_KEY` di `backend/.env`.

## [2026-11-23] Fase 5 verifikasi upload foto profil
- **Konteks:** Fase 5 meminta integrasi bucket nyata, uji end-to-end, dokumentasi, dan build APK.
- **Pilihan/verifikasi:** Bucket `media` diverifikasi lewat metadata storage: publik, limit 5 MB, MIME `image/jpeg`/`image/png`/`image/webp`, prefix root `avatars/` dan `events/`. Upload nyata lewat adapter `STORAGE_DRIVER=supabase` berhasil: object `avatars/{uuid}/{uuid}.jpg` dapat diunggah, URL publik merespons HTTP 200, object dapat dihapus, dan bucket kembali hanya berisi placeholder. `npm test` → 83 tes lulus. `flutter analyze` bersih; `flutter test` → 15 tes lulus. Smoke test HTTP dengan `STORAGE_DRIVER=memory` pada schema `test` berhasil: register → login → upload multipart → URL tersimpan di profil. `flutter build apk --release --dart-define=API_BASE_URL=https://tiketkita-three.vercel.app/api/v1` berhasil (≈53,6 MB).
- **Tambahan verifikasi produksi:** Setelah merge ke `main` dan redeploy Vercel, endpoint `POST /api/v1/users/profile/photo` merespons 401 tanpa token (route tersedia). Uji nyata memakai user sementara di produksi berhasil: register → login → upload → URL publik 200 → `GET /users/profile` cocok. Object dan user sementara dihapus; bucket kembali hanya berisi placeholder dan tidak ada user uji tersisa.
- **Belum terverifikasi:** Uji end-to-end di emulator/perangkat belum dilakukan karena tidak ada perangkat ADB yang terhubung.
- **Dampak:** `README.md`, `frontend/README.md`, `DECISIONS.md`.
- **Status:** backend dan integrasi produksi terverifikasi; menunggu uji perangkat oleh pemilik produk.

## [2026-11-23] Tes storage tidak boleh menyentuh bucket nyata
- **Konteks:** `.env` lokal sudah memakai `STORAGE_DRIVER=supabase`, sedangkan `.env.test` tidak memuat variabel itu. Karena `dotenv` tidak mengosongkan variabel yang tidak ada, tes sempat memakai bucket nyata dan meninggalkan dua object uji.
- **Pilihan:** `env.js` memaksa `storageDriver = memory` bila `NODE_ENV=test`, apa pun nilai `STORAGE_DRIVER` di `.env`. Dua object uji di `media/avatars/` dihapus lewat adapter storage, dan bucket diverifikasi kembali hanya berisi placeholder.
- **Alasan:** Tes tidak boleh menulis ke data/bucket nyata (PRD 18.1).
- **Dampak:** `backend/src/config/env.js`, `backend/tests/storage.test.js`.
- **Status:** diputuskan agent (terverifikasi: `npm test` 83 lulus; bucket bersih).

## [2026-11-23] Dukungan secret key Supabase baru
- **Konteks:** Supabase akan memensiunkan `anon`/`service_role` legacy pada awal 2027 dan mendorong publishable/secret key baru. `service_role` masih berfungsi sampai saat itu.
- **Pilihan:** Backend menerima `SUPABASE_SECRET_KEY` (`sb_secret_...`) sebagai preferensi dan tetap menerima `SUPABASE_SERVICE_ROLE_KEY` sebagai fallback legacy. Adapter Storage mengirim kunci selalu lewat header `apikey`; header `Authorization: Bearer` hanya ditambahkan untuk kunci legacy berformat JWT (`eyJ...`) karena secret key baru bukan JWT. Publishable key tidak dipakai untuk upload karena tidak punya hak tulis elevated.
- **Alasan:** Secret key baru adalah pengganti resmi `service_role`, dapat dirotasi terpisah, dan tetap server-side. Mempertahankan fallback mencegah deployment lama rusak.
- **Dampak:** `backend/src/config/env.js`, `backend/src/services/storage.js`, `backend/tests/storage.test.js`, `backend/.env.example`, `backend/README.md`, `README.md`.
- **Status:** diputuskan agent. Unit test header legacy dan secret key baru lulus. Upload nyata ke bucket berhasil memakai service_role legacy dan, setelah migrasi, memakai `sb_secret_...` (hanya header `apikey`). Jika Storage REST menolak secret key hanya dengan `apikey`, alternatif berikutnya adalah kredensial S3-compatible dari Supabase Storage.

## [2026-11-23] Verifikasi secret key Supabase baru
- **Konteks:** Pemilik produk sudah membuat secret key baru, mengganti environment, dan melakukan redeploy Vercel.
- **Verifikasi:** `.env` lokal dan environment Vercel memakai `STORAGE_DRIVER=supabase` serta `SUPABASE_SECRET_KEY` bertipe `sb_secret_...`. Adapter storage lokal berhasil mengunggah object, URL publik merespons HTTP 200, object berhasil dihapus, dan bucket kembali hanya berisi placeholder. Setelah merge ke `main` dan redeploy, endpoint produksi tidak lagi 404: upload nyata lewat Vercel berhasil, URL publik merespons 200, profil mengembalikan URL yang sama, lalu object dan user sementara dibersihkan.
- **Alasan:** Memastikan secret key baru dan environment produksi benar-benar bekerja.
- **Dampak:** Tidak ada perubahan kode; hanya verifikasi.
- **Status:** secret key dan deployment produksi terverifikasi. Sisa: uji end-to-end di emulator/perangkat.

## [2026-11-24] Rencana pintasan kategori dari Home ke Explore
- **Konteks:** Ikon kategori di Home saat ini hanya informatif, tetapi bentuknya memberi kesan dapat diketuk. Explore sudah menyediakan filter kategori berupa chip. PRD 7.1 dan 7.5 menetapkan daftar kategori berikon di Home serta filter kategori di Explore, tanpa melarang pintasan langsung.
- **Pilihan:** Pertahankan ikon kategori di Home dan jadikan tiap item tombol pintasan. Ketukan membuka tab Explore dengan kategori terkait sudah terpilih; filter chip di Explore tetap tersedia untuk mengganti kategori atau memilih “Semua”.
- **Alasan:** Perilaku ini memenuhi ekspektasi dari tampilan yang tampak interaktif dan memberi akses cepat tanpa menghilangkan kontrol filter yang sudah ada di Explore.
- **Rencana implementasi:**
  1. Tambahkan aksi ketuk pada `CategoryItem` dengan feedback interaksi dan semantik tombol yang dapat diakses.
  2. Teruskan ID kategori terpilih dari Home melalui `MainShell` ke `ExploreScreen`; navigasi harus bekerja walaupun Explore sudah pernah dibuka di `IndexedStack`.
  3. Saat pintasan dipakai, Explore memilih kategori tersebut, mengosongkan kata kunci pencarian lama agar tidak menyembunyikan hasil kategori, menutup fokus keyboard, lalu memuat ulang daftar dari halaman pertama. Chip kategori terpilih harus terlihat aktif.
  4. Pertahankan filter kategori di Explore agar pengguna dapat mengganti kategori atau kembali ke “Semua”.
  5. Verifikasi dengan tes bahwa mengetuk kategori menampilkan Explore dengan kategori yang benar dan hasil diperbarui; jalankan `flutter analyze` dan `flutter test`.
- **Dampak:** `frontend/lib/widgets/category_item.dart`, `frontend/lib/screens/home/home_screen.dart`, `frontend/lib/screens/main_shell.dart`, `frontend/lib/screens/explore/explore_screen.dart`, serta tes widget/navigasi terkait.
- **Status:** diputuskan pemilik produk dan selesai diimplementasikan. Pintasan memakai `CategoryShortcutRequest` dengan revision agar pilihan kategori baru tetap diterapkan pada `ExploreScreen` yang dipertahankan oleh `IndexedStack`; pencarian lama dikosongkan dan filter kategori di-apply ulang dari halaman pertama. Terverifikasi: `flutter analyze` bersih dan `flutter test` 16 lulus, termasuk alur ketuk kategori → Explore terfilter.

## [2026-11-24] Sinkronisasi status acara dan penanda visual kartu
- **Konteks:** PRD D-14 menyembunyikan `COMPLETED`/`CANCELLED` dari daftar default dan PRD 13.5 memakai `status = UPCOMING` + tanggal untuk `canBook`, tetapi tidak mengatur siapa yang memperbarui `Event.status` saat waktu berjalan. Data seed yang dibuat beberapa hari lalu bisa tetap `UPCOMING`/`ONGOING` walau tanggalnya sudah lewat, sehingga acara lampau masih tampil. PRD juga belum mengatur tampilan kartu untuk acara habis/lewat.
- **Pilihan:** Menambahkan `syncEventStatuses(tx)` yang dipanggil sebelum daftar acara, featured, dan detail: `UPCOMING`/`ONGOING` yang `endDate` (atau `eventDate` bila `endDate` null) sudah lewat menjadi `COMPLETED`; `UPCOMING` dengan `eventDate <= sekarang < endDate` menjadi `ONGOING`. Seed tidak diubah. Di Flutter, `EventSummary`/`EventDetail` mendapat status turunan, kartu dan poster detail diberi filter abu-abu serta label status (`Acara Selesai`, `Sedang Berlangsung`, `Acara Dibatalkan`, `Tiket Habis`), dan warna harga untuk acara tidak tersedia memakai warna netral, bukan merah.
- **Alasan:** Status tetap konsisten dengan waktu tanpa menunggu job terjadwal, daftar default kembali sesuai D-14, dan pengguna tetap dapat mengenali acara yang tidak dapat dipesan saat status ditampilkan eksplisit.
- **Dampak:** `backend/src/utils/sync-event-statuses.js`, `backend/src/modules/events/service.js`, `backend/tests/events.test.js`, `frontend/lib/models/event_summary.dart`, `frontend/lib/models/event_detail.dart`, `frontend/lib/widgets/event_card.dart`, `frontend/lib/screens/event_detail/event_detail_screen.dart`, `frontend/test/event_summary_test.dart`.
- **Status:** diputuskan agent.
