# TiketKita

Aplikasi Android untuk mencari acara, memesan tiket, membayar secara simulasi, dan menampilkan tiket digital berkode QR.

- **Frontend:** Flutter (Android)
- **Backend:** Node.js 22 + Express 5 (ES Modules) + Prisma
- **Database:** PostgreSQL di Supabase (akses hanya lewat Prisma)
- **Hosting API:** Vercel

## Struktur Repositori

```text
tiketkita/
├── backend/    REST API (routes, controllers, services, Prisma)
├── frontend/   Aplikasi Flutter
├── README.md
└── DECISIONS.md
```

## Status

Fase 0 selesai: kerangka monorepo, backend berjalan dengan `GET /health`, dan proyek Flutter lolos `flutter analyze`.

## Prasyarat

- Node.js 22 LTS dan npm
- Flutter stable channel
- Android Studio / Android SDK dan emulator
- Project Supabase (untuk fase database)
- Postman

## Menjalankan Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Server berjalan di `http://localhost:3000`. Verifikasi: `GET /health` menghasilkan `{ "status": "ok" }`.

## Menjalankan Frontend

```bash
cd frontend
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:3000/api/v1
```

Emulator Android tidak dapat memakai `localhost`; gunakan `10.0.2.2`.

## Dokumentasi

- [README backend](backend/README.md)
- [README frontend](frontend/README.md)
- [Keputusan teknis](DECISIONS.md)

## API

URL produksi: `https://<proyek>.vercel.app/api/v1` (diisi setelah deploy pada Fase 8).

Jangan menaruh kredensial (connection string, `JWT_SECRET`, kunci Supabase) di repositori. Konfigurasi hanya lewat environment variable.
