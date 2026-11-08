import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LegalCard, LegalLayout, LegalList, LegalSection } from "../LegalLayout";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("privacy") };
}

function B({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-fg">{children}</span>;
}

export default function PrivacyPage() {
  return (
    <LegalLayout kind="privacy">
      <div className="flex flex-col gap-2 rounded-xl bg-surface p-3.5">
        <h2 className="m-0 text-[15px] font-semibold text-fg">Ringkasnya</h2>
        <LegalList>
          <li>Kami tidak menjual datamu.</li>
          <li>Foto struk hanya diproses untuk mengisi form pengeluaran.</li>
          <li>Kamu bisa mengekspor dan menghapus datamu kapan saja.</li>
        </LegalList>
      </div>

      <p className="m-0">
        Kebijakan ini menjelaskan data apa yang dikumpulkan [NAMA PERUSAHAAN / PENGELOLA] saat kamu memakai Kasku, untuk apa data itu dipakai, dan hak-hakmu sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
      </p>

      <LegalSection title="1. Data yang kami kumpulkan">
        <LegalList>
          <li><B>Data akun:</B> nama, email, dan kata sandi (disimpan dalam bentuk terenkripsi satu arah, tidak bisa dibaca siapa pun).</li>
          <li><B>Catatan pengeluaran:</B> jumlah, toko, tanggal, kategori, metode pembayaran, catatan, dan anggaran.</li>
          <li><B>Foto struk</B> yang kamu ambil atau pilih dari galeri.</li>
          <li><B>Data teknis:</B> jenis perangkat dan browser, bahasa, serta log error untuk perbaikan aplikasi.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Cara kami menggunakan data">
        <LegalList>
          <li>Menjalankan akunmu dan menyimpan catatan pengeluaran.</li>
          <li>Membaca foto struk untuk mengisi form otomatis.</li>
          <li>Menampilkan ringkasan, grafik, dan pengingat anggaran.</li>
          <li>Mengirim email penting, seperti verifikasi akun dan reset kata sandi.</li>
          <li>Menjaga keamanan layanan dan memperbaiki masalah teknis.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Pemrosesan foto struk oleh AI">
        <p className="m-0">
          Saat kamu memakai fitur scan, foto struk dikirim ke penyedia model AI pihak ketiga ([NAMA PENYEDIA AI]) untuk membaca teks di dalamnya. Pemrosesan di pihak penyedia tunduk pada kebijakan mereka. Hasil pembacaan disimpan di akunmu. Foto struk disimpan [SELAMA AKUN AKTIF / DIHAPUS SETELAH X HARI], dan bisa kamu hapus kapan saja.
        </p>
      </LegalSection>

      <LegalSection title="4. Penyimpanan & keamanan">
        <p className="m-0">
          Data disimpan di layanan cloud database dan penyimpanan file kami ([LOKASI SERVER]). Koneksi dienkripsi dengan HTTPS, dan akses data dibatasi sehingga setiap pengguna hanya bisa melihat datanya sendiri. Tidak ada sistem yang 100% aman, tetapi kami terus menjaga dan memperbarui perlindungannya.
        </p>
      </LegalSection>

      <LegalSection title="5. Berbagi data">
        <p className="m-0">Kami tidak menjual atau menyewakan datamu. Data hanya dibagikan kepada:</p>
        <LegalList className="mt-1.5">
          <li>penyedia layanan yang membantu menjalankan Kasku (hosting, database, pengiriman email, dan AI), sebatas yang diperlukan;</li>
          <li>pihak berwenang, jika diwajibkan oleh hukum yang berlaku.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="6. Hak kamu">
        <LegalList>
          <li>Melihat dan memperbarui data akunmu.</li>
          <li>Mengekspor catatan pengeluaran (CSV/PDF).</li>
          <li>Menghapus transaksi, foto struk, atau seluruh akun.</li>
          <li>Menarik persetujuan pemrosesan data dengan menghapus akun.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Penyimpanan data & penghapusan akun">
        <p className="m-0">Data disimpan selama akunmu aktif. Setelah akun dihapus, data dan foto struk akan dihapus permanen dalam [X] hari, kecuali yang wajib kami simpan menurut hukum.</p>
      </LegalSection>

      <LegalSection title="8. Penyimpanan lokal di perangkat">
        <p className="m-0">
          Sebagai aplikasi web progresif (PWA), Kasku menyimpan sesi login dan sebagian data di perangkatmu agar lebih cepat dan bisa dibuka saat koneksi lemah. Data ini terhapus saat kamu keluar dari akun atau menghapus data browser.
        </p>
      </LegalSection>

      <LegalSection title="9. Perubahan kebijakan">
        <p className="m-0">Jika ada perubahan penting, kami akan memberi tahu lewat aplikasi atau email sebelum perubahan berlaku.</p>
      </LegalSection>

      <LegalCard title="Hubungi kami">
        <p className="m-0">
          Untuk pertanyaan atau permintaan terkait data pribadi, kirim email ke{" "}
          <a href="mailto:[EMAIL PRIVASI]" className="font-medium no-underline">[EMAIL PRIVASI]</a>. Lihat juga{" "}
          <Link href="/terms" className="font-medium no-underline">Syarat &amp; Ketentuan</Link>.
        </p>
      </LegalCard>
    </LegalLayout>
  );
}
