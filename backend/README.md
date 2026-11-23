# TiketKita Backend

REST API TiketKita: Node.js 22 + Express 5 (ES Modules) + Prisma + PostgreSQL (Supabase), di-deploy ke Vercel.

Semua perhitungan harga, stok, total, dan status dilakukan di backend. Akses database hanya lewat Prisma; proyek ini tidak memakai `supabase-js`, Data API Supabase, RLS, atau Docker.

## Status

Fase 6 selesai: seluruh endpoint MVP, tes backend, koleksi Postman, konfigurasi Vercel, dan README ini.

## Perluasan scope: upload foto profil (Fase 1–4 selesai; bucket nyata terverifikasi)

Upload foto profil disetujui pemilik produk pada 2026-11-23. **Fase 1–4 selesai**; endpoint dan UI Flutter tersedia. `npm test` 83 lulus. Upload nyata ke bucket `media` sudah diverifikasi dengan `service_role` legacy dan secret key baru (`sb_secret_...`): object dapat diunggah, URL publik merespons 200, dan object dapat dihapus. Endpoint Vercel masih 404 sampai perubahan di-commit/di-push dan di-redeploy. Uji perangkat juga masih menunggu pemilik produk. Rencana yang sudah diputuskan:

- Endpoint `POST /api/v1/users/profile/photo`, privat, `multipart/form-data`, field `photo`.
- Respons memakai envelope yang sama dan mengembalikan `data.user` terbaru.
- `PUT /api/v1/users/profile` tetap tersedia untuk nama, telepon, dan `profileImage` URL.
- File disimpan di bucket Supabase Storage publik `media`:
  - `avatars/{userId}/{uuid}.{ext}`
  - `events/{eventId}/{uuid}.{ext}` (disiapkan untuk poster event, belum dipakai)
- MIME yang diizinkan: `image/jpeg`, `image/png`, `image/webp`.
- Batas backend: avatar 2 MB, poster event 4 MB. Batas bucket 5 MB.
- Validasi memakai MIME dan magic bytes. Nama file dibuat server.
- Upload hanya dari backend memakai service-role key. Tidak memakai `supabase-js`, Data API `/rest/v1`, RLS, atau policy baru.

Env yang diperlukan untuk bucket nyata:

```env
SUPABASE_URL="https://<project-ref>.supabase.co"
SUPABASE_SECRET_KEY="sb_secret_..."
SUPABASE_MEDIA_BUCKET="media"
STORAGE_DRIVER="supabase"
```

`SUPABASE_SECRET_KEY` adalah secret key baru dari **Settings → API Keys → Publishable and secret API keys**. Ini pengganti `service_role`; `SUPABASE_SERVICE_ROLE_KEY` lama masih didukung sebagai fallback sampai awal 2027. Gunakan `STORAGE_DRIVER=memory` untuk tes atau pengembangan tanpa bucket nyata. Jangan menaruh nilai asli di `.env.example` atau repositori. Setelah kredensial diisi, uji `POST /api/v1/users/profile/photo` dengan file JPEG/PNG/WebP < 2 MB, lalu pastikan object muncul di `media/avatars/{userId}/`. Detail keputusan ada di `../DECISIONS.md`.

## Prasyarat

- Node.js 22 LTS dan npm (lingkungan pengembangan saat ini memakai Node.js 24.19.0; lihat `../DECISIONS.md`)
- Project Supabase (PostgreSQL) untuk schema `public` dan schema `test`
- Postman (opsional, untuk mencoba endpoint)

## Struktur

```text
backend/
├── prisma/            schema, migrations, seed
├── src/
│   ├── config/        env dan Prisma Client
│   ├── middlewares/   auth JWT, validasi Zod, error handler
│   ├── modules/       auth, users, categories, events, bookings, payments, tickets
│   ├── routes/        penggabungan route /api/v1
│   ├── utils/         response, serializer, error, kode acak, lazy expiry
│   ├── app.js
│   └── server.js
├── tests/             Vitest + supertest
├── postman/           koleksi dan environment
├── vercel.json
├── .env.example
└── .env.test.example
```

## Environment

Salin contoh lalu isi nilainya:

```bash
cp .env.example .env
cp .env.test.example .env.test
```

`.env` (runtime):

- `DATABASE_URL`: connection pooler Supabase mode transaction, port 6543, dengan `pgbouncer=true`
- `DIRECT_URL`: direct connection atau session pooler port 5432, dipakai migrasi
- `JWT_SECRET`: minimal 32 karakter acak
- `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `BOOKING_EXPIRY_MINUTES`, `CORS_ORIGIN`
- `STORAGE_DRIVER`: `memory` (default, tanpa bucket) atau `supabase`. Mode supabase memerlukan `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (atau `SUPABASE_SERVICE_ROLE_KEY` legacy), dan `SUPABASE_MEDIA_BUCKET`

`.env.test` (tes):

- `DATABASE_URL` dan `DIRECT_URL` **wajib** memuat `schema=test`
- Setup tes menolak berjalan bila penanda itu tidak ada, sehingga data schema `public` tidak tersentuh
- Gunakan `BCRYPT_ROUNDS=4` agar tes lebih cepat

Jangan pernah meng-commit `.env` atau `.env.test`. Kata sandi database dengan karakter khusus harus di-URL-encode. Prisma 7 memakai `prisma7.config.ts` untuk konfigurasi koneksi dan `@prisma/adapter-pg` untuk runtime.

## Instalasi dan Database

```bash
npm install
npm run prisma:deploy
SEED_CONFIRM=yes npm run db:seed
```

- `npm install` menjalankan `prisma generate` lewat `postinstall`.
- `npm run prisma:deploy` menerapkan migration yang ada. Untuk pengembangan schema, gunakan `npm run prisma:migrate`.
- Seed **menghapus seluruh data aplikasi** lalu mengisi 5 kategori, 15 acara, dan 2 akun demo. Seed menolak berjalan tanpa `SEED_CONFIRM=yes` dan mencetak host database tujuan sebelum menghapus.

PowerShell:

```powershell
$env:SEED_CONFIRM="yes"; npm run db:seed
```

Akun demo:

| Email | Password |
|---|---|
| `demo@tiketkita.test` | `Demo1234` |
| `user2@tiketkita.test` | `Demo1234` |

## Menjalankan Server

```bash
npm run dev
```

- `GET /health` → `{ "status": "ok" }`
- `GET /` → `{ "name": "TiketKita API", "version": "1.0.0" }`
- Base URL API: `http://localhost:3000/api/v1`

Server mendengarkan di `0.0.0.0` dan tidak memanggil `listen` saat berjalan di Vercel.

## Perintah

| Tujuan | Perintah |
|---|---|
| Server dev | `npm run dev` |
| Server produksi lokal | `npm start` |
| Tes | `npm test` |
| Migrasi (dev) | `npm run prisma:migrate` |
| Migrasi (deploy) | `npm run prisma:deploy` |
| Prisma Studio | `npm run prisma:studio` |
| Seed | `SEED_CONFIRM=yes npm run db:seed` |

## Tes

```bash
npm test
```

Tes berjalan pada schema `test`, menjalankan `prisma migrate deploy` sekali di awal, dan mengosongkan tabel antar-tes. Saat ini 83 tes mencakup seluruh skenario wajib PRD 18.1 (autentikasi, users, categories, events, bookings, konkurensi stok, pembayaran paralel, pembatalan, kedaluwarsa, tiket, dan isolasi data), fondasi storage upload, dan endpoint foto profil. Tes selalu memakai driver storage `memory` meskipun `.env` memakai Supabase.

## Endpoint

| Method | Endpoint | Akses |
|---|---|---|
| GET | `/health` | Publik |
| POST | `/api/v1/auth/register` | Publik |
| POST | `/api/v1/auth/login` | Publik |
| GET | `/api/v1/users/profile` | Privat |
| PUT | `/api/v1/users/profile` | Privat |
| POST | `/api/v1/users/profile/photo` | Privat, multipart field `photo` |
| GET | `/api/v1/categories` | Publik |
| GET | `/api/v1/events` | Publik |
| GET | `/api/v1/events/featured` | Publik |
| GET | `/api/v1/events/:id` | Publik |
| POST | `/api/v1/bookings` | Privat |
| GET | `/api/v1/bookings` | Privat |
| GET | `/api/v1/bookings/:id` | Privat |
| PATCH | `/api/v1/bookings/:id/cancel` | Privat |
| POST | `/api/v1/payments/:bookingId` | Privat |
| GET | `/api/v1/payments/:bookingId` | Privat |
| GET | `/api/v1/tickets` | Privat |
| GET | `/api/v1/tickets/:id` | Privat |

Respons sukses memakai envelope `{ "success": true, "message": "...", "data": ... }`, respons gagal `{ "success": false, "message": "...", "data": null }`, dan validasi 422 menambahkan `errors[]`. Nominal uang berupa number dan waktu ISO 8601 UTC.

## Postman

Impor tiga file dari `postman/`:

- `TiketKita_API.postman_collection.json`
- `TiketKita_Local.postman_environment.json`
- `TiketKita_Vercel.postman_environment.json`

Langkah:

1. Pilih environment **TiketKita Local** (atau **TiketKita Vercel** setelah deploy).
2. Jalankan request **1. Auth → Login**. Test script menyimpan `token` ke environment secara otomatis.
3. Isi collection variable saat menjelajah alur: `eventId`, `ticketTypeId`, `bookingId`, `ticketId` (ambil `id` dari respons sebelumnya).
4. Urutan alur utama: Login → List Events → Event Detail → Create Booking → Create Payment → List Tickets → Ticket Detail.

Environment Vercel masih memakai placeholder `https://<nama-proyek>.vercel.app`; ganti dengan domain Vercel yang sebenarnya. Jangan menyimpan kredensial asli atau token produksi di file environment yang di-commit.

## Deployment Vercel

1. Buat project Vercel dari repositori ini dengan **Root Directory** `backend`.
2. Tambahkan environment variable Production dan Preview:
   - Runtime utama: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `BCRYPT_ROUNDS`, `BOOKING_EXPIRY_MINUTES`, `CORS_ORIGIN`. `DIRECT_URL` tidak diperlukan runtime.
   - Storage upload: `STORAGE_DRIVER=supabase`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (`sb_secret_...`), dan `SUPABASE_MEDIA_BUCKET=media`.
   - Jika masih memakai kunci legacy, ganti `SUPABASE_SECRET_KEY` dengan `SUPABASE_SERVICE_ROLE_KEY`. Jangan mengisi keduanya jika tidak perlu; kode memprioritaskan `SUPABASE_SECRET_KEY`.
3. Build memakai `postinstall` untuk `prisma generate`. Migration **tidak** dijalankan saat build; jalankan `npm run prisma:deploy` dari komputer lokal.
4. `vercel.json` mengarahkan seluruh request ke `src/server.js`.
5. Verifikasi setelah deploy: `GET /health`, `GET /api/v1/categories`, `GET /api/v1/events`, alur register, login, booking, dan pembayaran, lalu `POST /api/v1/users/profile/photo` dengan file JPEG/PNG/WebP < 2 MB.

Project Supabase gratis dapat dijeda bila lama tidak aktif; aktifkan kembali dan uji API sebelum asistensi atau responsi.

## Catatan Keamanan

- Password di-hash bcrypt; JWT memakai secret dari environment.
- Endpoint privat memeriksa token dan kepemilikan data. Data milik pengguna lain dijawab 404.
- Harga, stok, subtotal, dan total selalu dibaca dari database, tidak dari client.
- Stok dikurangi dengan `updateMany` bersyarat di dalam transaksi; status booking diubah dengan penjaga `status = 'PENDING'`.
- RLS dan Data API Supabase tidak dipakai pada MVP. Lihat PRD Lampiran B untuk tahap akhir.
