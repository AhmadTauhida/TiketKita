# AGENTS.md: Panduan Kerja AI Agent untuk TiketKita

Letakkan file ini di **root repositori** (`tiketkita/AGENTS.md`). Baca seluruh file ini sebelum menulis kode, lalu baca `PRD-TiketKita-v2.0.md` sampai selesai.

---

## 1. Sumber Kebenaran

1. **`PRD-TiketKita-v2.0.md` adalah sumber kebenaran tunggal.** Dokumen lama (PRD v1.0, Addendum v1.1 dan v1.2) sudah tidak berlaku. Jika file itu ada di repositori, abaikan.
2. Jika PRD dan file ini bertentangan, **PRD menang** untuk isi produk (fitur, API, database, aturan bisnis). File ini menang untuk cara kerja (urutan, kualitas, pelaporan).
3. Jangan mengubah isi PRD. Jika menemukan kesalahan atau celah di PRD, catat di `DECISIONS.md` (bagian 4) dan lanjutkan dengan asumsi paling masuk akal.
4. Konteks: ini proyek **Tugas Akhir praktikum** satu orang, tenggat **24 November 2026**, responsi 25-28 November. Prioritaskan alur yang berjalan dan dapat didemokan daripada kesempurnaan.

## 2. Ringkasan Proyek

TiketKita adalah aplikasi Android (Flutter) untuk mencari acara, memesan tiket, membayar secara simulasi, dan menampilkan tiket QR. Backend: Node.js 22 + Express 5 (ES Modules) + Prisma + PostgreSQL di Supabase, di-deploy ke Vercel. Struktur: monorepo `backend/` dan `frontend/`.

---

## 3. Aturan Keras (tidak boleh dilanggar)

### 3.1 Wajib
- Semua perhitungan harga, stok, total, dan status dilakukan **di backend** dari data database. Jangan percaya angka dari Flutter.
- Operasi booking, pembayaran, pembatalan, dan kedaluwarsa memakai `prisma.$transaction`. Pengurangan stok memakai `updateMany` bersyarat `availableStock >= quantity` (PRD 13.3). Dilarang pola "baca stok lalu tulis nilai baru".
- Perubahan status booking selalu memakai `updateMany` dengan syarat status saat ini (`status: 'PENDING'`) sebagai penjaga idempotensi.
- Akses data milik pengguna lain dijawab **404**, bukan 403.
- Format respons, status code, dan nama field **persis** sesuai PRD bagian 14. JSON `camelCase`, nominal uang berupa number (lewat satu serializer), waktu ISO 8601 UTC.
- Pesan error untuk pengguna dalam **Bahasa Indonesia** sesuai PRD bagian 16.
- Semua kode, nama variabel, dan komentar kode ditulis dalam bahasa Inggris. Teks yang tampil ke pengguna dan dokumentasi dalam Bahasa Indonesia.
- Setiap keputusan yang tidak tertulis di PRD dicatat di `DECISIONS.md`.

### 3.2 Dilarang
- **Dilarang mengaktifkan RLS**, membuat policy, atau menulis `ENABLE ROW LEVEL SECURITY` di migration, seed, atau kode. Jangan menyarankan perubahan pengaturan dashboard Supabase di dalam kode (PRD 15.4, D-25).
- **Dilarang memakai `supabase-js`** atau memanggil Data API Supabase (`.../rest/v1/`). Satu-satunya jalur data adalah Prisma (D-24).
- **Dilarang memakai Docker** atau membuat `docker-compose.yml` (D-26).
- **Dilarang menaruh kredensial** (connection string, `JWT_SECRET`, kunci Supabase) di source code, README, Postman environment, atau commit. Hanya placeholder di `.env.example`.
- **Dilarang menjalankan tes atau seed pada schema `public`** tanpa pengaman (PRD 17.1 dan 18.1).
- **Dilarang mengerjakan fitur di luar MVP** (PRD 3.2): payment gateway, dashboard admin, validasi QR, refund, push notification, upload file, rate limiting, refresh token, role Admin.
- Dilarang menambah dependensi di luar daftar PRD bagian 10 tanpa alasan kuat. Jika perlu, catat di `DECISIONS.md` beserta alasannya.
- Dilarang menghapus atau melemahkan tes agar lulus. Perbaiki penyebabnya.
- Dilarang menjalankan perintah yang menghapus data (`prisma migrate reset`, `db push --force-reset`, seed) terhadap database kecuali memang diminta tahapnya dan sesuai pengaman PRD.

---

## 4. Penanganan Ambiguitas dan `DECISIONS.md`

**Prinsip: jangan berhenti, tulis asumsi, lanjutkan.** Berhenti dan bertanya hanya jika kondisi di 4.3 terpenuhi.

### 4.1 Kapan memutuskan sendiri
Detail implementasi yang tidak mengubah kontrak PRD: nama file, struktur internal, nama fungsi, library kecil yang setara, tata letak UI yang tidak ditentukan, teks pesan yang belum ada di PRD.

### 4.2 Format catatan
Buat `DECISIONS.md` di root repositori. Tiap entri:

```markdown
## [YYYY-MM-DD] Judul singkat
- **Konteks:** apa yang tidak jelas / bertentangan (rujuk bagian PRD)
- **Pilihan:** apa yang diputuskan
- **Alasan:** satu atau dua kalimat
- **Dampak:** file/fitur yang terpengaruh (atau "tidak ada")
- **Status:** diputuskan agent | menunggu pemilik produk
```

Di bagian paling atas `DECISIONS.md`, catat juga **versi terpasang** Node.js, Express, Prisma, Zod, dan paket utama Flutter (PRD D-27).

### 4.3 Kapan berhenti dan bertanya ke pemilik produk
Hanya untuk hal berikut, dan **hanya pada bagian itu** (kerjakan bagian lain yang tidak bergantung):
1. Butuh kredensial atau akses akun (Supabase, Vercel, GitHub).
2. Keputusan yang tidak dapat dibatalkan dan bisa mengarah ke dua jawaban yang sama-sama masuk akal (misalnya menghapus data nyata).
3. Perubahan yang akan melanggar aturan keras di bagian 3.
4. Konflik di PRD yang mengubah kontrak API atau skema database dan tidak bisa diselesaikan dengan asumsi aman.

Tulis permintaannya jelas dan singkat (apa yang dibutuhkan, mengapa, apa yang sementara dikerjakan), dan catat di `DECISIONS.md` dengan status "menunggu pemilik produk".

---

## 5. Urutan Pengerjaan

Kerjakan **berurutan**. Jangan memulai fase berikutnya sebelum Definition of Done fase sebelumnya terpenuhi. Prioritas: P0 dulu (PRD 3.1). Jadwal tanggal mengikuti PRD bagian 21.

### Fase 0: Setup monorepo
- Buat struktur `backend/` dan `frontend/` sesuai PRD 11.1, `README.md`, `DECISIONS.md`, `.gitignore`.
- Backend: `npm init`, pasang dependensi PRD 10.2, `"type": "module"`, `engines`, scripts PRD 10.5, `.env.example`, `.env.test.example`.
- Flutter: `flutter create`, tambah paket PRD 10.1, struktur `lib/` PRD 11.1.
- **DoD:** `npm run dev` menyalakan server dan `GET /health` menjawab. `flutter analyze` bersih. Tidak ada rahasia di Git.

### Fase 1: Database
- `schema.prisma` dari Lampiran A PRD (tambahkan `generator` dan `datasource` sesuai dokumentasi Prisma versi terpasang), migration awal, migration check constraint (PRD 12.6).
- `prisma/seed.js` sesuai PRD bagian 17 dengan pengaman `SEED_CONFIRM`.
- **Membutuhkan pemilik produk:** `DATABASE_URL` dan `DIRECT_URL` Supabase di `.env`. Jika belum ada, kerjakan `schema.prisma`, seed, dan check constraint tanpa menjalankannya, catat "menunggu pemilik produk".
- **DoD:** migration berhasil, delapan tabel dan check constraint ada, seed menghasilkan 5 kategori, 15 acara, dan 2 akun demo, seed menolak berjalan tanpa `SEED_CONFIRM=yes`.

### Fase 2: Fondasi backend + Auth + Users
- `app.js`, `server.js` (export default `app`, `listen` hanya jika bukan Vercel), middleware (auth JWT, Zod validate, error), util (`api-response`, `serializer`, `errors`, `generate-code`).
- Endpoint: `POST /auth/register`, `POST /auth/login`, `GET/PUT /users/profile`.
- **DoD:** PRD 18.1 butir 1 dan 2 lulus. Format respons dan error sesuai PRD 14.1 dan 14.2.

### Fase 3: Categories dan Events
- `GET /categories`, `GET /events`, `GET /events/featured` (didaftarkan sebelum `/:id`), `GET /events/:id`.
- Sweep kedaluwarsa global sebelum `GET /events/:id` ditambahkan di Fase 4 setelah fungsinya ada.
- **DoD:** butir 3 pada PRD 18.1 lulus. `minPrice`, `isSoldOut`, `canBook` benar untuk seluruh kasus seed (sold out, CANCELLED, COMPLETED, gratis).

### Fase 4: Bookings dan lazy expiry
- `POST /bookings`, `GET /bookings`, `GET /bookings/:id`, `PATCH /bookings/:id/cancel`, fungsi `expireOverdueBookings`.
- Terapkan urutan pemeriksaan PRD 13.8 persis.
- **DoD:** butir 4, 5, 7, 8 PRD 18.1 lulus, termasuk tes konkurensi stok.

### Fase 5: Payments dan Tickets
- `POST /payments/:bookingId`, `GET /payments/:bookingId`, `GET /tickets`, `GET /tickets/:id`.
- Terapkan langkah PRD 13.4 persis.
- **DoD:** butir 6 dan 9 PRD 18.1 lulus. Dua request bayar paralel menghasilkan tepat satu sukses.

### Fase 6: Penutupan backend
- Seluruh tes wajib PRD 18.1 hijau dengan satu perintah `npm test`.
- Koleksi Postman (PRD 19.2), `vercel.json`, `backend/README.md`.
- **DoD:** `npm test` hijau. Koleksi Postman mencakup semua endpoint dengan contoh request dan respons. README menjelaskan setup, env, migrasi, seed, tes, dan impor Postman.

### Fase 7: Flutter
Dapat dimulai paralel sejak Fase 2 dengan data tiruan, lalu disambung ke API nyata setelah endpoint tersedia. Urutan layar:
1. Fondasi: tema (PRD 7.5), `ApiClient`, secure storage, `AuthState` (provider), `app_routes`, MainShell dengan Bottom Navigation Bar, Splash.
2. Auth: Login, Register.
3. Penjelajahan: Home, Explore, Event Detail.
4. Transaksi: Checkout, Payment, Payment Success.
5. Pasca-transaksi: My Tickets (sub-tab Tiket dan Pesanan), Booking Detail, Ticket Detail (QR).
6. Akun: Profile, Edit Profile, About.
- **DoD:** seluruh alur navigasi PRD 7.4 berfungsi, mode tamu berfungsi (D-03), `flutter analyze` bersih, semua layar punya loading, empty, dan error state, uji manual alur PRD 18.2 berhasil di emulator.

### Fase 8: Integrasi dan finalisasi
- Uji end-to-end seluruh kasus seed. Perbaiki bug.
- README root, README frontend, rapikan repositori, pastikan tidak ada rahasia di riwayat Git.
- **Dilakukan pemilik produk (agent hanya menyiapkan konfigurasi dan dokumentasi):** deploy Vercel, uji URL produksi, uji APK di perangkat fisik, asistensi, RLS (Lampiran B PRD).
- **DoD:** seluruh kriteria PRD bagian 20 terpenuhi. `flutter build apk --release --dart-define=API_BASE_URL=...` berhasil.

---

## 6. Definition of Done

### 6.1 Per endpoint backend
- [ ] Route, controller, service, dan validasi Zod terpisah.
- [ ] Respons sesuai envelope dan objek PRD 14.3. Tidak ada field `password` yang bocor.
- [ ] Status code sesuai PRD 14.2. Pesan error sesuai PRD 16.
- [ ] Endpoint privat memeriksa token **dan** kepemilikan data.
- [ ] Ada tes yang mencakup jalur sukses dan setidaknya satu jalur gagal.
- [ ] Contoh request/respons ada di koleksi Postman.

### 6.2 Per layar Flutter
- [ ] Sesuai deskripsi layar PRD 7.1 dan aksi PRD 7.3.
- [ ] Ada loading, empty, dan error state (dengan tombol "Coba Lagi" untuk error jaringan).
- [ ] 401 ditangani (hapus token, kembali ke Login).
- [ ] Teks Bahasa Indonesia. Harga `Rp 150.000` atau "Gratis". Tanggal dalam WIB.
- [ ] Tombol aksi dinonaktifkan selama request berjalan (mencegah dobel tap).
- [ ] Tidak ada nilai hardcode untuk URL API (memakai `--dart-define`).

### 6.3 Per fase
- [ ] Seluruh DoD fase terpenuhi dan diverifikasi dengan menjalankan perintahnya, bukan hanya membaca kode.
- [ ] `DECISIONS.md` diperbarui.
- [ ] Commit dibuat dengan pesan jelas (bagian 8).

### 6.4 Sebelum menyatakan pekerjaan selesai
- [ ] `npm test` hijau. `flutter analyze` bersih.
- [ ] Alur utama berhasil end-to-end: daftar → login → pilih acara → booking → bayar → tiket + QR.
- [ ] Kasus tepi seed teruji: stok 3 (konkurensi), sold out, CANCELLED, COMPLETED, gratis, booking kedaluwarsa.
- [ ] `git grep` tidak menemukan connection string, `JWT_SECRET`, atau kunci Supabase.
- [ ] Tidak ada `TODO` yang menyembunyikan fitur P0.

---

## 7. Konvensi Kode

### 7.1 Backend
- Lapisan: **routes → middleware → controller → service → Prisma**. Controller hanya mengurus HTTP. Service berisi logika bisnis dan transaksi. Query Prisma hanya di service.
- Error domain: `NotFoundError` (404), `ConflictError` (409), `UnauthorizedError` (401), `ValidationError` (422). Service melempar error ini. Error middleware yang memetakan ke respons.
- Satu helper respons (`api-response.js`) untuk envelope sukses dan gagal. Satu `serializer.js` untuk konversi `Decimal` ke number dan bentuk objek bersama (PRD 14.3).
- Validasi Zod untuk body, query, dan params. Aturan dari PRD 14.5.
- Kode acak (booking, tiket, token, referensi) memakai `crypto` sesuai PRD 13.2.
- ES Modules (`import`/`export`), `async/await`, tanpa `var`. Express 5 meneruskan error async ke error middleware, jadi tidak perlu try/catch di setiap controller.
- Jangan log data sensitif (password, token, connection string).
- Satu instance `PrismaClient` bersama di `config/database.js`.

### 7.2 Flutter
- Lapisan: `screens` (UI) → `services` (panggilan API) → `models` (`fromJson` manual) → `core/network/ApiClient`.
- Tidak ada panggilan HTTP di dalam widget. Selalu lewat `services`.
- State sesi di `AuthState` (provider). Layar lain `setState` dan `FutureBuilder`.
- Routing dengan `onGenerateRoute` di `app_routes.dart`.
- Widget yang dipakai ulang (`event_card`, `status_badge`, dan sebagainya) ditaruh di `widgets/`.
- Dilarang menaruh logika harga atau total sebagai sumber kebenaran. Flutter hanya menampilkan total dari server. Pratinjau total di Checkout boleh dihitung lokal untuk tampilan, tetapi angka dari `POST /bookings` yang dipakai.

### 7.3 Database
- Perubahan skema hanya lewat migration. Jangan mengedit tabel manual di dashboard.
- Jangan mengubah desain tabel untuk menghindari masalah tooling. Catat masalahnya di `DECISIONS.md`.

---

## 8. Git dan Commit

- Satu commit per unit kerja yang berarti (misalnya per endpoint atau per layar). Hindari commit raksasa.
- Format pesan: `<tipe>(<ruang>): <deskripsi singkat>`, contoh `feat(bookings): add atomic stock decrement`, `fix(payments): guard double payment`, `test(bookings): add concurrency test`, `docs: update README setup`.
- Tipe: `feat`, `fix`, `test`, `docs`, `chore`, `refactor`.
- Jangan pernah meng-commit `.env`, `.env.test`, `node_modules`, `.vercel`, dan APK.

---

## 9. Perintah Penting

Backend (jalankan dari `backend/`):

| Tujuan | Perintah |
|---|---|
| Server dev | `npm run dev` |
| Tes | `npm test` |
| Migrasi (dev) | `npm run prisma:migrate` |
| Migrasi (deploy / schema test) | `npm run prisma:deploy` |
| Prisma Studio | `npm run prisma:studio` |
| Seed | `SEED_CONFIRM=yes npm run db:seed` |

Catatan Windows (PowerShell): `$env:SEED_CONFIRM="yes"; npm run db:seed`.

Flutter (dari `frontend/`):

| Tujuan | Perintah |
|---|---|
| Analisis | `flutter analyze` |
| Jalankan di emulator | `flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1` |
| Build APK | `flutter build apk --release --dart-define=API_BASE_URL=https://<proyek>.vercel.app/api/v1` |

Emulator Android tidak dapat memakai `localhost`. Gunakan `10.0.2.2`.

---

## 10. Pelaporan

Setelah setiap fase, berikan laporan singkat (maksimal sekitar 10 baris):
1. Apa yang selesai (rujuk DoD fase).
2. Bukti verifikasi (perintah yang dijalankan dan hasilnya, misalnya `npm test`: 24 lulus).
3. Entri baru di `DECISIONS.md`.
4. Hal yang **menunggu pemilik produk** (jika ada) dan apa yang dikerjakan sementara.
5. Fase berikutnya.

Jangan merekap langkah-langkah kerja secara rinci. Jangan menyatakan "selesai" untuk sesuatu yang belum dijalankan dan diverifikasi.

---

## 11. Daftar Cepat Kesalahan yang Sering Terjadi

- Mendaftarkan `/events/:id` sebelum `/events/featured` sehingga "featured" dianggap ID.
- Mengirim `Decimal` Prisma langsung ke JSON (menjadi string) alih-alih number.
- Membaca stok lalu menulis nilai baru, bukan `updateMany` bersyarat.
- Lupa sweep kedaluwarsa sebelum membaca atau membayar booking.
- Tes berjalan di schema `public` (hapus data nyata). Setup tes wajib memeriksa `schema=test`.
- Prisma Client tidak dibuat saat build Vercel (butuh `postinstall: prisma generate`).
- Connection string dengan karakter khusus pada kata sandi tidak di-URL-encode.
- Memakai `localhost` di emulator Android alih-alih `10.0.2.2`.
- Lupa izin `INTERNET` di manifest utama (build rilis gagal terhubung).
- Lupa `initializeDateFormatting('id_ID')` sehingga format tanggal error.
- Mengembalikan 403 untuk data milik pengguna lain (seharusnya 404).
- Mengaktifkan RLS atau memakai `supabase-js` "karena lebih mudah" (dilarang).
