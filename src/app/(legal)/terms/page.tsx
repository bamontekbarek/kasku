import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { LegalCard, LegalLayout, LegalList, LegalSection } from "../LegalLayout";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getTranslations("meta"))("terms") };
}

export default function TermsPage() {
  return (
    <LegalLayout kind="terms">
      <p className="m-0">
        Syarat &amp; Ketentuan ini mengatur penggunaan aplikasi Kasku yang dikelola oleh [NAMA PERUSAHAAN / PENGELOLA]. Dengan membuat akun atau menggunakan Kasku, kamu menyetujui seluruh ketentuan di bawah ini.
      </p>

      <LegalSection title="1. Akun">
        <LegalList>
          <li>Kamu wajib mendaftar dengan email yang valid dan milikmu sendiri.</li>
          <li>Kamu bertanggung jawab menjaga kerahasiaan kata sandi dan semua aktivitas di akunmu.</li>
          <li>Segera hubungi kami jika kamu menduga akunmu diakses orang lain.</li>
          <li>Kasku ditujukan untuk pengguna berusia minimal [USIA MINIMUM] tahun.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="2. Penggunaan layanan">
        <p className="m-0">Kasku adalah alat bantu mencatat pengeluaran pribadi. Kamu setuju untuk tidak:</p>
        <LegalList className="mt-1.5">
          <li>mengunggah gambar selain struk atau bukti transaksi, terutama konten yang melanggar hukum;</li>
          <li>mencoba mengakses data pengguna lain atau mengganggu sistem kami;</li>
          <li>menggunakan Kasku untuk kegiatan yang melanggar hukum di Indonesia.</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="3. Fitur scan struk dengan AI">
        <p className="m-0">
          Foto struk yang kamu unggah diproses oleh layanan AI untuk mengisi form secara otomatis. Hasil pembacaan AI bisa keliru, misalnya pada struk yang buram, terlipat, atau memakai format tidak umum. Kamu bertanggung jawab memeriksa dan memperbaiki data sebelum menyimpannya.
        </p>
      </LegalSection>

      <LegalSection title="4. Data milikmu">
        <p className="m-0">
          Catatan pengeluaran dan foto struk tetap milikmu. Kami hanya memprosesnya untuk menjalankan layanan, sesuai{" "}
          <Link href="/privacy" className="font-medium no-underline">Kebijakan Privasi</Link>. Kamu bisa mengekspor atau menghapus datamu kapan saja.
        </p>
      </LegalSection>

      <LegalSection title="5. Bukan nasihat keuangan">
        <p className="m-0">Ringkasan, grafik, dan anggaran di Kasku hanya informasi pendukung. Kasku tidak memberikan nasihat keuangan, pajak, maupun investasi.</p>
      </LegalSection>

      <LegalSection title="6. Ketersediaan layanan">
        <p className="m-0">
          Kami berusaha menjaga Kasku tetap berjalan, tetapi layanan disediakan &quot;sebagaimana adanya&quot;. Fitur bisa berubah, dan sesekali layanan dapat terhenti untuk pemeliharaan atau karena gangguan di luar kendali kami.
        </p>
      </LegalSection>

      <LegalSection title="7. Batasan tanggung jawab">
        <p className="m-0">
          Sejauh diizinkan hukum, kami tidak bertanggung jawab atas kerugian yang timbul dari keputusan yang kamu ambil berdasarkan data di Kasku, kesalahan pembacaan struk yang tidak kamu periksa, atau penggunaan akun oleh pihak yang mengetahui kata sandimu.
        </p>
      </LegalSection>

      <LegalSection title="8. Penutupan akun">
        <p className="m-0">Kamu bisa menghapus akun kapan saja dari menu Akun. Kami dapat menangguhkan atau menutup akun yang melanggar ketentuan ini, dengan pemberitahuan lebih dulu bila memungkinkan.</p>
      </LegalSection>

      <LegalSection title="9. Perubahan ketentuan">
        <p className="m-0">Jika ada perubahan penting, kami akan memberi tahu lewat aplikasi atau email sebelum perubahan berlaku. Dengan tetap menggunakan Kasku setelah itu, kamu dianggap menyetujui ketentuan yang baru.</p>
      </LegalSection>

      <LegalSection title="10. Hukum yang berlaku">
        <p className="m-0">Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan akan diselesaikan secara musyawarah lebih dulu.</p>
      </LegalSection>

      <LegalCard title="Ada pertanyaan?">
        <p className="m-0">
          Hubungi kami di <a href="mailto:[EMAIL DUKUNGAN]" className="font-medium no-underline">[EMAIL DUKUNGAN]</a>.
        </p>
      </LegalCard>
    </LegalLayout>
  );
}
