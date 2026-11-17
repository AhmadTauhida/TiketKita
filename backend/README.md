# TiketKita Backend

REST API TiketKita: Node.js 22 + Express 5 (ES Modules) + Prisma + PostgreSQL (Supabase).

## Status

Fase 0 selesai: kerangka proyek, dependensi, konfigurasi environment, dan health check.

## Menjalankan

```bash
npm install
cp .env.example .env
npm run dev
```

`GET /health` mengembalikan `{ "status": "ok" }`.

## Perintah

| Tujuan | Perintah |
|---|---|
| Server dev | `npm run dev` |
| Tes | `npm test` |
| Migrasi (dev) | `npm run prisma:migrate` |
| Migrasi (deploy) | `npm run prisma:deploy` |
| Seed | `SEED_CONFIRM=yes npm run db:seed` |

Dokumentasi lengkap menyusul pada fase berikutnya.
