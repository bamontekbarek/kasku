# Kasku

PWA pencatat pengeluaran (mobile-only) dengan scan struk memakai AI. Kebutuhan lengkap ada di
[`docs/PRD.md`](docs/PRD.md), aturan kerja di [`CLAUDE.md`](CLAUDE.md).

Next.js 15 (App Router) + TypeScript, Tailwind CSS v4, next-intl, React Hook Form + Zod, Supabase (cloud).

## Status

| Milestone | Isi | Status |
| --- | --- | --- |
| M0 Fondasi | Supabase (`supabase/`), migrasi, lint/typecheck/test, CI + deploy otomatis | selesai |
| M1 Akun | Register, login, verifikasi email, lupa/buat/ubah kata sandi, logout, ID/EN, legal, PWA | selesai |
| M2 Pencatatan inti | Kategori, input manual, Riwayat (cari, filter, bulan, edit, hapus), Dashboard | selesai |
| M3 Scan struk AI | Kamera/galeri, cek kualitas + crop + kompres di browser, upload, API scan DeepSeek, kuota, Periksa Hasil Scan | selesai |
| M4 Anggaran, notifikasi, export | Atur/pantau anggaran (salin otomatis tiap bulan), notifikasi dalam aplikasi + jadwal pg_cron (pengingat, ringkasan mingguan/bulanan, peringatan anggaran), export CSV | selesai |
| Berikutnya | Hapus akun (ACC-06, layar masih data contoh di `src/lib/data.ts`), SMTP sendiri, push ke HP (fase 2) | belum |

## Setup (Supabase cloud, tanpa Docker)

1. Salin `.env.example` ke `.env.local`, isi `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API) dan `DEEPSEEK_API_KEY`.
   Dua kunci terakhir hanya untuk server; isi juga di Vercel → Environment Variables (Production).
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

`supabase config push` menimpa pengaturan Auth di project. Production: https://kasku-eosin.vercel.app. Jika domain berubah, ganti
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
    api/receipts/      upload foto struk + [id]/scan (kuota, DeepSeek, simpan hasil mentah)
    api/export/        export CSV (HIS-04)
    actions/           server action: bahasa, transaksi, kategori, anggaran, notifikasi (RLS sebagai user yang login)
    offline/           halaman cadangan service worker
    pwa-icon/[size]/   ikon PNG untuk manifest
  components/          ui, form (TextField, PasswordField, …), PasswordRules, …
  i18n/                konfigurasi next-intl (tanpa prefix locale di URL)
  lib/
    supabase/          client browser, server, middleware (refresh sesi + guard rute)
    auth/              helper auth, guard rute, data akun
    expenses/          skema Zod transaksi/kategori, query server, helper tanggal (zona waktu user), ringkasan
    ai/                scanReceipt.ts (satu-satunya pemanggil DeepSeek), receipt.ts (skema + label Cek lagi)
    image/             cek kualitas, deteksi kertas, crop, resize, grayscale, kompres (tanpa library)
    scan/              kuota/env, client API scan, store foto antar layar
    budget/            status anggaran (RPC get_budget_status), level Aman/Hampir habis/Lewat batas
    notifications/     query, render teks notifikasi dari type + params (ikut bahasa user)
    export/            format CSV (BOM, anti formula), query export berhalaman
    validation/        skema Zod akun
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
| Dashboard user baru | `/welcome` (otomatis di `/dashboard` selama belum ada transaksi) |
| Jenis error scan | `/scan/error?kind=notReceipt\|failed\|tooFast\|uploadFailed\|quota\|paused` |
| Link reset kedaluwarsa | `/reset-password?expired=1` |
