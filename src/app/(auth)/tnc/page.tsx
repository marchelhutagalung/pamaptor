import Link from "next/link";

export default function TncPage() {
  return (
    <div className="text-white">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Syarat & Ketentuan</h1>
        <p className="text-gray-400 text-sm">Berlaku sejak 1 Januari 2025</p>
      </div>

      <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
        <section>
          <h2 className="text-white font-semibold text-base mb-2">1. Ketentuan Umum</h2>
          <p>
            Pamaptor adalah platform pelaporan masyarakat yang dikelola di bawah
            koordinasi Kepolisian Republik Indonesia (Polri). Dengan mendaftar dan
            menggunakan aplikasi ini, Anda menyatakan telah membaca, memahami, dan
            menyetujui seluruh syarat dan ketentuan yang tercantum di sini.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">2. Tujuan Aplikasi</h2>
          <p>
            Pamaptor bertujuan untuk memfasilitasi komunikasi antara masyarakat dan
            aparat kepolisian dalam rangka:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Pelaporan kejadian atau situasi yang memerlukan perhatian kepolisian</li>
            <li>Pemantauan tindak lanjut laporan oleh petugas yang berwenang</li>
            <li>Mendukung keamanan dan ketertiban lingkungan masyarakat</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">3. Kewajiban Pengguna</h2>
          <p>Sebagai pengguna Pamaptor, Anda wajib:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>
              Memberikan informasi yang <strong className="text-white">akurat, jujur, dan dapat dipertanggungjawabkan</strong> dalam setiap laporan
            </li>
            <li>
              Tidak menyampaikan laporan palsu, hoaks, atau informasi yang menyesatkan
            </li>
            <li>Tidak menggunakan aplikasi untuk tujuan yang melanggar hukum</li>
            <li>Menjaga kerahasiaan kredensial akun Anda (email dan password)</li>
            <li>Segera melaporkan kepada kami jika terjadi penyalahgunaan akun</li>
          </ul>
          <p className="mt-2 text-yellow-400 text-xs">
            Pelaporan palsu dapat dikenakan sanksi hukum sesuai peraturan perundang-undangan
            yang berlaku di Indonesia.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">4. Privasi dan Data Pribadi</h2>
          <p>
            Kami mengumpulkan data pribadi yang Anda berikan saat registrasi (nama,
            email, nomor telepon) serta data yang terkandung dalam laporan (foto,
            deskripsi, dan lokasi). Data ini digunakan untuk:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Memproses dan menindaklanjuti laporan Anda</li>
            <li>Mengirimkan notifikasi terkait status laporan</li>
            <li>Keperluan verifikasi dan keamanan akun</li>
          </ul>
          <p className="mt-2">
            Data Anda tidak akan dijual, disewakan, atau dibagikan kepada pihak
            ketiga di luar keperluan penanganan laporan oleh aparat berwenang.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">5. Data Lokasi</h2>
          <p>
            Pamaptor dapat meminta akses terhadap data lokasi perangkat Anda saat
            membuat laporan. Data lokasi digunakan semata-mata untuk menentukan
            titik kejadian yang dilaporkan dan membantu petugas merespons secara tepat.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">6. Konten dan Laporan</h2>
          <p>
            Setiap konten yang Anda unggah (foto, teks) menjadi tanggung jawab penuh
            Anda. Anda menjamin bahwa:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Konten tidak melanggar hak cipta pihak lain</li>
            <li>Konten tidak mengandung unsur SARA, pornografi, atau ujaran kebencian</li>
            <li>Foto yang diunggah adalah dokumentasi nyata dari kejadian yang dilaporkan</li>
          </ul>
          <p className="mt-2">
            Kami berhak menghapus konten yang melanggar ketentuan ini tanpa pemberitahuan sebelumnya.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">7. Ketentuan Khusus Petugas</h2>
          <p>
            Bagi pengguna yang mendaftar sebagai <strong className="text-white">Petugas</strong>, berlaku
            ketentuan tambahan:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Akun petugas hanya boleh digunakan oleh personel yang berwenang</li>
            <li>Kode akses petugas bersifat rahasia dan tidak boleh disebarluaskan</li>
            <li>
              Tindak lanjut laporan harus dilakukan sesuai prosedur operasional
              standar (SOP) yang berlaku
            </li>
            <li>
              Penyalahgunaan akun petugas dapat dikenakan sanksi disipliner dan/atau
              hukum
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">8. Pembatasan Tanggung Jawab</h2>
          <p>
            Pamaptor dan pengelolanya tidak bertanggung jawab atas kerugian yang
            timbul akibat keterlambatan respons laporan, gangguan teknis, atau
            penyalahgunaan aplikasi oleh pihak yang tidak berwenang.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">9. Perubahan Ketentuan</h2>
          <p>
            Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan
            akan diberitahukan melalui aplikasi atau email. Penggunaan berkelanjutan
            setelah perubahan dianggap sebagai persetujuan terhadap ketentuan baru.
          </p>
        </section>

        <section>
          <h2 className="text-white font-semibold text-base mb-2">10. Hukum yang Berlaku</h2>
          <p>
            Syarat dan ketentuan ini tunduk pada hukum Negara Kesatuan Republik
            Indonesia. Setiap sengketa diselesaikan melalui jalur hukum yang berlaku
            di wilayah hukum Indonesia.
          </p>
        </section>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10">
        <Link
          href="/register"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          &larr; Kembali ke halaman pendaftaran
        </Link>
      </div>
    </div>
  );
}
