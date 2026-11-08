# Kasku

PWA pencatat pengeluaran (mobile-only) dengan scan struk memakai AI. Kebutuhan lengkap ada di
[`docs/PRD.md`](docs/PRD.md), aturan kerja di [`CLAUDE.md`](CLAUDE.md).

Next.js 15 (App Router) + TypeScript, Tailwind CSS v4, next-intl, React Hook Form + Zod, Supabase (cloud).

## Status

| Milestone | Isi | Status |
| --- | --- | --- |
| M0 Fondasi | Supabase (`supabase/`), migrasi pertama, lint/typecheck/test, CI + deploy workflow | selesai di kode, perlu project Supabase + Vercel + GitHub |
| M1 Akun | Register, login, verifikasi email, lupa/buat/ubah kata sandi, logout, ID/EN, legal, PWA | selesai di kode |
| M2–M4 | Layar sudah ada tapi masih memakai data contoh (`src/lib/data.ts`) | belum |

## Setup (Supabase cloud, tanpa Docker)

1. Salin `.env.example` ke `.env.local`, isi `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   (Supabase → Project Settings → API).
2. Hubungkan CLI ke project dan jalankan migrasi:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npx supabase db push                 # jalankan supabase/migrations
   npx supabase config push             # pengaturan Auth + template email dari supabase/config.toml
   npm run db:types                     # tulis ulang src/types/database.ts
   ```

3. `npm install && npm run dev` → http://localhost:3000

Project Supabase: **kasku** (`tqsijrdyczabruautqmi`). Login CLI di sini harus pakai token
(`npx supabase login --token sbp_…`) atau dari Terminal biasa.

`supabase config push` menimpa pengaturan Auth di project. Sesudah ada domain production, ganti
`site_url` dan `additional_redirect_urls` di `supabase/config.toml` lalu push lagi.

**Email:** free tier dengan email bawaan Supabase tidak bisa memakai template sendiri dan dibatasi ±2 email/jam.
Link di email bawaan memakai PKCE (`?code=`), jadi hanya berhasil di browser yang sama tempat user
mendaftar/meminta reset. Setelah SMTP sendiri (misalnya Resend) dipasang, aktifkan blok template di
`config.toml` agar link memakai `token_hash` dan bisa dibuka di perangkat mana pun.

## Perintah

```bash
npm run dev
npm run lint && npm run typecheck && npm test
npm run build
```

## Struktur

```
messages/              id.json, en.json (semua teks UI yang sudah tersambung)
src/
  app/
    (auth)/            masuk, daftar, verifikasi, lupa & buat kata sandi
    (legal)/           syarat, privasi
    (app)/             dashboard, riwayat, tambah, scan, anggaran, akun …
    auth/confirm/      target link email (verifikasi + reset), verifyOtp(token_hash)
    actions/locale.ts  ganti bahasa → cookie NEXT_LOCALE + profiles.locale
    offline/           halaman cadangan service worker
    pwa-icon/[size]/   ikon PNG untuk manifest
  components/          ui, form (TextField, PasswordField, …), PasswordRules, …
  i18n/                konfigurasi next-intl (tanpa prefix locale di URL)
  lib/
    supabase/          client browser, server, middleware (refresh sesi + guard rute)
    auth/              helper auth, guard rute, data akun
    validation/        skema Zod (dipakai form; nanti juga untuk JSON AI)
  middleware.ts
public/sw.js           service worker kecil tanpa library
supabase/
  config.toml          pengaturan Auth (verifikasi wajib, aturan kata sandi, template email)
  migrations/          skema database
  templates/           email verifikasi + reset (bahasa Indonesia)
.github/workflows/     ci.yml (PR), deploy.yml (main → migrasi Supabase → Vercel Production)
```

## Catatan desain

- Tampilan dipaksa mobile: satu kolom `max-width: 430px` di tengah layar.
- Bahasa tidak ada di URL. Pilihan bahasa disimpan di cookie dan `profiles.locale`, dan ikut terbawa saat login di perangkat lain.
- Link di email selalu mendarat di `/auth/confirm` pada origin yang dipakai (localhost, preview, production).
- `supabase-js` baru dimuat saat tombol auth ditekan, supaya JS awal layar auth ±163 KB (target < 200 KB).

## State pratinjau mockup

| Layar | URL |
| --- | --- |
| Dashboard offline banner | `/dashboard?offline=1` |
| Dashboard user baru | `/welcome` |
| Kuota scan habis | `/add?quota=0` |
| Foto buram / gelap | `/scan/crop?quality=blur`, `/scan/crop?quality=dark` |
| Jenis error scan | `/scan/error?kind=notReceipt\|failed\|tooFast\|uploadFailed` |
| Link reset kedaluwarsa | `/reset-password?expired=1` |
