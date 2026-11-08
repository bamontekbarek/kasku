# Kasku

Expense tracker PWA ("Catat pengeluaran lebih cepat — cukup foto struknya"), built from the
**Expense Tracker – UI Mockup** design canvas. Next.js (App Router) + TypeScript + Tailwind CSS v4.

The UI is complete and interactive on mock data (`src/lib/data.ts`). The backend is not wired up yet:
search for `TODO` to find the points where Supabase (auth, database, storage) and the receipt-reading
AI route plug in.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck
```

## Structure

```
src/
  app/
    (auth)/     login, register, forgot-password(/sent), verify-email, reset-password
    (legal)/    terms, privacy
    (app)/      dashboard, welcome, transactions(/[id], /export), add,
                scan(/crop, /processing, /review, /error), budget(/edit),
                notifications, settings(/categories, /password, /notifications,
                /delete-account, /install)
    globals.css design tokens (@theme) — colors, fonts, animations
  components/   Icon, ui (buttons, fields, badges, switch, segmented…), BottomNav,
                Sheet, LangToggle, Receipt illustration, PasswordRules, ResendButton
  lib/          data (mock), format (Rp formatting), i18n (ID/EN context)
```

## Design notes

- **Forced mobile view**: every screen sits in a centered column (`max-width: 430px`, `min-height: 100dvh`);
  the area outside it is a plain dark background. There is no separate desktop layout.
- The mockup's fake status bar / home indicator are replaced by `env(safe-area-inset-*)` padding.
- Language toggle (ID/EN) is wired on Login, Register, Settings and the bottom nav; it persists in `localStorage`.

## Preview states

The design's tweakable states are reachable through query params:

| Screen | URL |
| --- | --- |
| Login error | `/login?error=1` |
| Dashboard offline banner | `/dashboard?offline=1` |
| New user dashboard | `/welcome` |
| Scan quota used up | `/add?quota=0` |
| Blurry / dark photo | `/scan/crop?quality=blur`, `/scan/crop?quality=dark` |
| Scan errors | `/scan/error?kind=notReceipt\|failed\|tooFast\|uploadFailed` |
| Expired reset link | `/reset-password?expired=1` |

## Scan flow (to implement)

Camera / gallery → upload to Supabase Storage → API route sends the image to the AI model →
JSON `{ amount, merchant, date, category, items }` → prefill the review form. Fields filled by AI carry an
**AI** badge, low-confidence fields a **Cek lagi** badge, and edited fields **Diubah**, so the user checks
before saving.
