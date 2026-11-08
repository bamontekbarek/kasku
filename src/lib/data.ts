/**
 * Mock data that mirrors the design canvas. Replace with Supabase queries
 * once the backend is wired up — shapes here are what the screens expect.
 */

export const user = {
  name: "Budi Santoso",
  initials: "BS",
  email: "budi@email.com",
};

export type Category = {
  name: string;
  short: string;
  color: string;
  locked?: boolean;
  monthCount: number;
};

export const categories: Category[] = [
  { name: "Makanan & Minuman", short: "Makanan", color: "#FCD535", monthCount: 28 },
  { name: "Belanja Harian", short: "Belanja", color: "#F5913E", monthCount: 9 },
  { name: "Transportasi", short: "Transportasi", color: "#4C8DF6", monthCount: 12 },
  { name: "Tagihan", short: "Tagihan", color: "#A88BFA", monthCount: 4 },
  { name: "Kesehatan", short: "Kesehatan", color: "#2EBD85", monthCount: 3 },
  { name: "Hiburan", short: "Hiburan", color: "#F06BA8", monthCount: 2 },
  { name: "Lainnya", short: "Lainnya", color: "#5E6673", monthCount: 5, locked: true },
];

export const categoryNames = categories.map((c) => c.name);

export const categoryPalette: Array<[string, string]> = [
  ["#FCD535", "Kuning"],
  ["#F5913E", "Oranye"],
  ["#FF5C70", "Merah"],
  ["#F06BA8", "Merah muda"],
  ["#A88BFA", "Ungu"],
  ["#4C8DF6", "Biru"],
  ["#2EBD85", "Hijau"],
  ["#5E6673", "Abu-abu"],
];

/** Quick-pick payment methods on the add form. */
export const paymentMethods = ["Tunai", "Debit", "QRIS", "Kartu", "E-wallet"];
/** Full payment list used in selects (review / edit). */
export const paymentOptions = ["Tunai", "Debit", "QRIS", "Kartu kredit", "E-wallet"];

export const DAILY_SCAN_QUOTA = 20;

export type Period = "harian" | "mingguan" | "bulanan" | "tahunan";

export const periodStats: Record<
  Period,
  {
    label: string;
    caption: string;
    total: number;
    delta: string;
    up: boolean;
    prev: string;
    count: string;
    max: string;
    series: Array<[string, number]>;
  }
> = {
  harian: {
    label: "Harian", caption: "Hari ini", total: 312900, delta: "8,2%", up: false, prev: "kemarin", count: "4", max: "Rp 187.400",
    series: [["31/10", 245000], ["1/11", 410000], ["2/11", 180000], ["3/11", 520000], ["4/11", 290000], ["5/11", 341000], ["6/11", 312900]],
  },
  mingguan: {
    label: "Mingguan", caption: "Minggu ini", total: 1462300, delta: "20,9%", up: true, prev: "minggu lalu", count: "18", max: "Rp 487.000",
    series: [["29 Sep", 1120000], ["6 Okt", 980000], ["13 Okt", 1340000], ["20 Okt", 1050000], ["27 Okt", 1210000], ["3 Nov", 1462300]],
  },
  bulanan: {
    label: "Bulanan", caption: "November 2026", total: 4286400, delta: "12,4%", up: true, prev: "Oktober", count: "63", max: "Rp 1.250.000",
    series: [["Jun", 3950000], ["Jul", 4420000], ["Agu", 3780000], ["Sep", 4110000], ["Okt", 3813000], ["Nov", 4286400]],
  },
  tahunan: {
    label: "Tahunan", caption: "2026 (s.d. Nov)", total: 40912600, delta: "17,5%", up: false, prev: "2025", count: "702", max: "Rp 3.400.000",
    series: [["2022", 41200000], ["2023", 45800000], ["2024", 47100000], ["2025", 49600000], ["2026", 40912600]],
  },
};

export const topCategories = [
  { name: "Makanan & Minuman", pct: 36, amount: 1542300, color: "#FCD535" },
  { name: "Belanja Harian", pct: 24, amount: 1028700, color: "#F5913E" },
  { name: "Transportasi", pct: 15, amount: 642900, color: "#4C8DF6" },
  { name: "Tagihan", pct: 14, amount: 600100, color: "#A88BFA" },
  { name: "Lainnya", pct: 11, amount: 472400, color: "#5E6673" },
];

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

export type Transaction = {
  id: string;
  name: string;
  /** Short category label as shown in history filters. */
  category: string;
  payment: string;
  time: string;
  amount: number;
  scanned: boolean;
  items: string[];
};

export const transactionDays: Array<{ day: string; rows: Transaction[] }> = [
  {
    day: "Hari ini · Jumat, 6 Nov",
    rows: [
      { id: "t1", name: "Toko Maju Jaya", category: "Belanja", payment: "Debit", time: "19:42", amount: 187400, scanned: true, items: ["Beras 5 kg", "Minyak goreng 2 L", "Telur ayam 1 kg", "Sabun cuci piring", "Gula pasir 1 kg"] },
      { id: "t2", name: "Makan siang", category: "Makanan", payment: "QRIS", time: "12:30", amount: 69000, scanned: false, items: [] },
      { id: "t3", name: "Kopi pagi", category: "Makanan", payment: "QRIS", time: "08:15", amount: 32000, scanned: true, items: ["Kopi susu", "Roti bakar"] },
      { id: "t4", name: "Ojek online", category: "Transportasi", payment: "E-wallet", time: "07:50", amount: 24500, scanned: false, items: [] },
    ],
  },
  {
    day: "Kamis, 5 Nov",
    rows: [
      { id: "t5", name: "Token listrik", category: "Tagihan", payment: "Debit", time: "20:10", amount: 200000, scanned: false, items: [] },
      { id: "t6", name: "Makan malam", category: "Makanan", payment: "Tunai", time: "19:05", amount: 81000, scanned: true, items: ["Nasi ayam bakar", "Es teh manis"] },
      { id: "t7", name: "Bensin", category: "Transportasi", payment: "Tunai", time: "08:30", amount: 60000, scanned: true, items: ["Bensin 6 L"] },
    ],
  },
  {
    day: "Rabu, 4 Nov",
    rows: [
      { id: "t8", name: "Kebutuhan rumah", category: "Belanja", payment: "Debit", time: "18:20", amount: 160000, scanned: true, items: ["Deterjen 1 kg", "Sapu", "Lampu LED 10 W"] },
      { id: "t9", name: "Apotek", category: "Kesehatan", payment: "QRIS", time: "16:45", amount: 85000, scanned: true, items: ["Paracetamol 500 mg", "Vitamin C"] },
      { id: "t10", name: "Makan siang", category: "Makanan", payment: "QRIS", time: "12:15", amount: 45000, scanned: false, items: [] },
    ],
  },
];

export const historyFilters = ["Semua", "Makanan", "Belanja", "Transportasi", "Tagihan", "Kesehatan"];

export function colorForShort(short: string): string {
  return categories.find((c) => c.short === short)?.color ?? "#5E6673";
}

export const recentTransactions = [
  { name: "Toko Maju Jaya", category: "Belanja Harian", time: "19:42", amount: 187400, icon: "bag", scanned: true, color: "#F5913E" },
  { name: "Makan siang", category: "Makanan & Minuman", time: "12:30", amount: 69000, icon: "food", scanned: false, color: "#FCD535" },
  { name: "Kopi pagi", category: "Makanan & Minuman", time: "08:15", amount: 32000, icon: "food", scanned: true, color: "#FCD535" },
  { name: "Ojek online", category: "Transportasi", time: "07:50", amount: 24500, icon: "car", scanned: false, color: "#4C8DF6" },
] as const;

export const scannedReceipt = {
  amount: 187400,
  merchant: "Toko Maju Jaya",
  date: "2026-11-06",
  time: "19:42",
  category: "Belanja Harian",
  payment: "Debit",
  items: [
    { id: 1, name: "Beras 5 kg", price: 74500, low: false },
    { id: 2, name: "Minyak goreng 2 L", price: 38900, low: false },
    { id: 3, name: "Telur ayam 1 kg", price: 31000, low: false },
    { id: 4, name: "Sabun cuci piring", price: 25500, low: true },
    { id: 5, name: "Gula pasir 1 kg", price: 17500, low: false },
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
