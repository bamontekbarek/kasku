# Kasku – panduan untuk Claude Code

Kasku adalah PWA pencatat pengeluaran (mobile-only) dengan scan struk memakai AI. Target pengguna utama di Papua, jadi aplikasi harus ringan dan tahan sinyal lemah.

**Sumber kebenaran:** `docs/PRD.md` (kebutuhan, model data, alur AI, deploy) dan mockup dari Claude Design (dikirim lewat "Hand off to Claude Code"). Jika PRD dan mockup berbeda, ikuti PRD lalu tanyakan.

## Tech stack

- Next.js (App Router) + TypeScript, Tailwind CSS, `next-intl`, React Hook Form + Zod
- Supabase: Postgres + RLS, Auth (email/password), Storage, pg_cron + Edge Functions
- AI: DeepSeek `deepseek-flash` lewat OpenAI SDK (base URL `https://api.deepseek.com`), hanya dipanggil dari server
- Deploy: Vercel lewat GitHub Actions (`.github/workflows/deploy.yml`), satu repo untuk Next.js dan `supabase/`

## Aturan kerja

- **Database:** setiap perubahan lewat file di `supabase/migrations/` (`supabase migration new <nama>`). Jangan ubah skema lewat dashboard. Uji dengan `supabase db reset`, lalu `supabase gen types typescript --local > types/database.ts`.
- **Migrasi kompatibel ke belakang:** tambah dulu, hapus di rilis berikutnya. Migrasi jalan sebelum deploy Vercel.
- **RLS wajib** di setiap tabel milik user (`user_id = auth.uid()`). Service role key hanya di server.
- **Uang:** Rupiah disimpan `bigint` tanpa desimal. Tampilan `Rp 4.286.400` (titik ribuan).
- **Waktu:** simpan `timestamptz`, hitung hari/minggu/bulan di zona waktu user (default `Asia/Jayapura`, WIT).
- **Teks:** semua teks UI lewat `messages/id.json` dan `messages/en.json`. Bahasa default Indonesia.
- **Tampilan:** mobile-only, `max-width: 430px; margin: 0 auto`. Tema gelap: latar `#0B0E11`, kartu `#1E2329`, garis `#2B3139`, teks `#EAECEF`, teks redup `#848E9C`, aksen `#FCD535`, hijau `#2EBD85`, merah `#FF5C70`, oranye `#F5913E`. Font IBM Plex Sans. Target sentuh ≥ 44 px, kontras ≥ 4.5:1.
- **AI scan:** ikuti PRD bagian 7. Optimasi gambar di browser (7.1), kuota dicek di server sebelum memanggil DeepSeek (7.2), thinking mode dimatikan, nama model dari env `AI_RECEIPT_MODEL`. Hasil AI tidak pernah disimpan tanpa konfirmasi user.
- **Ringan:** hindari library besar (misalnya OpenCV.js). JS awal < 200 KB gzip.
- **Rujuk ID kebutuhan** (misalnya `SCAN-02`, `HIS-04`) di nama branch, commit, dan pull request.
- `package.json` wajib punya script `lint`, `typecheck`, `test` (dipakai CI).

## Perintah

```bash
supabase start            # Postgres, Auth, Storage lokal (butuh Docker)
npm run dev               # Next.js
supabase db reset         # jalankan ulang semua migrasi + seed
npm run lint && npm run typecheck && npm test
```

## Urutan pengerjaan

Ikuti milestone di PRD bagian 9: M0 Fondasi → M1 Akun → M2 Pencatatan inti → M3 Scan struk AI → M4 Anggaran, notifikasi, export → M5 Beta.
