/**
 * Mock data that mirrors the design canvas. Replace with Supabase queries
 * once the backend is wired up — shapes here are what the screens expect.
 */

export const user = {
  name: "Budi Santoso",
  initials: "BS",
  email: "budi@email.com",
};

export const budget = {
  month: "November 2026",
  total: 5000000,
  used: 4286400,
  daysLeft: 24,
  perCategory: [
    { name: "Makanan & Minuman", used: 1542300, limit: 1500000, color: "#FCD535", lastMonth: 1450000 },
    { name: "Belanja Harian", used: 1028700, limit: 1200000, color: "#F5913E", lastMonth: 1080000 },
    { name: "Transportasi", used: 642900, limit: 700000, color: "#4C8DF6", lastMonth: 640000 },
    { name: "Tagihan", used: 600100, limit: 800000, color: "#A88BFA", lastMonth: 590000 },
    { name: "Lainnya", used: 472400, limit: 800000, color: "#5E6673", lastMonth: 53000 },
  ],
};

export type NotificationKind = "over" | "budget" | "remind" | "summary" | "account";

export const notificationKinds: Record<NotificationKind, { tile: string; fg: string; type: string; icon: "alertTriangle" | "wallet" | "receiptAdd" | "chart" | "lock" }> = {
  over: { tile: "#2A1519", fg: "#FF5C70", type: "Anggaran", icon: "alertTriangle" },
  budget: { tile: "#2E2A12", fg: "#FCD535", type: "Anggaran", icon: "wallet" },
  remind: { tile: "#14233D", fg: "#4C8DF6", type: "Pengingat", icon: "receiptAdd" },
  summary: { tile: "#12291F", fg: "#2EBD85", type: "Ringkasan", icon: "chart" },
  account: { tile: "#241D3A", fg: "#A88BFA", type: "Akun", icon: "lock" },
};

export const notifications: Array<{
  id: number;
  group: "Hari ini" | "Kemarin" | "Sebelumnya";
  kind: NotificationKind;
  time: string;
  unread: boolean;
  href: string;
  title: string;
  body: string;
}> = [
  { id: 1, group: "Hari ini", kind: "over", time: "19:43", unread: true, href: "/budget", title: "Makanan & Minuman lewat batas", body: "Terpakai Rp 1.542.300 dari batas Rp 1.500.000 bulan ini." },
  { id: 2, group: "Hari ini", kind: "budget", time: "19:43", unread: true, href: "/budget", title: "Anggaran bulan ini sudah 86%", body: "Sisa Rp 713.600 untuk 24 hari, sekitar Rp 29.700 per hari." },
  { id: 3, group: "Kemarin", kind: "budget", time: "08:31", unread: true, href: "/budget", title: "Transportasi sudah lewat 80%", body: "Terpakai Rp 618.400 dari Rp 700.000. Sisa Rp 81.600." },
  { id: 4, group: "Sebelumnya", kind: "summary", time: "Sen, 2 Nov", unread: false, href: "/dashboard", title: "Ringkasan minggu lalu", body: "26 Okt – 1 Nov: Rp 1.210.000, naik 15% dari minggu sebelumnya." },
  { id: 5, group: "Sebelumnya", kind: "summary", time: "Min, 1 Nov", unread: false, href: "/dashboard", title: "Laporan Oktober siap", body: "Total Rp 3.813.000, turun 7% dari September. Terbesar: Makanan & Minuman." },
  { id: 6, group: "Sebelumnya", kind: "remind", time: "Kam, 29 Okt", unread: false, href: "/add", title: "Belum ada catatan hari ini", body: "Ada struk yang belum discan? Catat sekarang biar tidak lupa." },
  { id: 7, group: "Sebelumnya", kind: "account", time: "Rab, 28 Okt", unread: false, href: "/forgot-password", title: "Kata sandi berhasil diubah", body: "Bukan kamu? Segera reset kata sandi untuk mengamankan akun." },
];
