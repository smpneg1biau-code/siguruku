export type KokuRubrikStandard = {
  dimensiNama: string;
  subDimensiList: {
    nama: string;
    M: string; // SB - Sangat Baik (Mahir)
    C: string; // B - Baik (Cakap - Standar Kelulusan)
    B: string; // C - Cukup (Berkembang)
    K: string; // K - Kurang (Belum / Menuju Berkembang)
  }[];
};

export const KOKU_RUBRIK_STANDARD_FASE_D: KokuRubrikStandard[] = [
  {
    dimensiNama: "Keimanan & Ketakwaan terhadap Tuhan YME",
    subDimensiList: [
      {
        nama: "Hubungan dengan Tuhan",
        M: "Kesadaran diri mendalam & mengajak orang lain",
        C: "Berdasarkan kesadaran diri",
        B: "Memahami ajaran berdasarkan perintah",
        K: "Belum memahami ajaran agama/kepercayaan secara utuh dan butuh bimbingan penuh"
      },
      {
        nama: "Hubungan sesama",
        M: "Konsisten & menjadi teladan bagi sesama",
        C: "Kasih sayang & jujur secara konsisten",
        B: "Akhlak mulia namun belum konsisten",
        K: "Belum konsisten menunjukkan akhlak mulia kepada sesama"
      },
      {
        nama: "Hubungan lingkungan",
        M: "Menjaga alam bersama-sama orang lain secara aktif",
        C: "Menjaga alam dengan pengetahuan",
        B: "Sadar menjaga alam",
        K: "Belum memiliki kesadaran untuk menjaga kelestarian alam lingkungan sekitar"
      }
    ]
  },
  {
    dimensiNama: "Kewargaan",
    subDimensiList: [
      {
        nama: "Lokal",
        M: "Berperilaku sesuai norma secara mandiri & mengajak orang lain",
        C: "Berperilaku sesuai norma dengan bimbingan",
        B: "Sadar aturan masyarakat",
        K: "Belum memahami norma dan aturan dalam masyarakat lokal/sekitar"
      },
      {
        nama: "Nasional",
        M: "Berinisiatif menjaga NKRI & mengajak orang lain",
        C: "Menjaga NKRI & menghargai budaya",
        B: "Tertarik keragaman budaya",
        K: "Belum menunjukkan kepedulian terhadap kebudayaan dan persatuan nasional"
      },
      {
        nama: "Global",
        M: "Menghargai keragaman global & mengajak orang lain",
        C: "Menghargai keragaman tanpa hilang identitas diri",
        B: "Tertarik budaya global",
        K: "Belum terbuka terhadap keragaman budaya global"
      }
    ]
  },
  {
    dimensiNama: "Penalaran Kritis",
    subDimensiList: [
      {
        nama: "Argumentasi",
        M: "Argumen logis berbasis data/bukti & menghargai argumen orang lain",
        C: "Argumen logis alasan kuat",
        B: "Argumen logis alasan sederhana",
        K: "Belum mampu menyampaikan argumen secara logis"
      },
      {
        nama: "Keputusan",
        M: "Mandiri & mempertimbangkan dampak jangka panjang",
        C: "Membandingkan info secara mandiri",
        B: "Membandingkan info dengan bimbingan",
        K: "Belum mampu membandingkan informasi untuk mengambil keputusan"
      },
      {
        nama: "Masalah",
        M: "Solusi logis & tepat secara mandiri",
        C: "Solusi logis & tepat dengan bimbingan",
        B: "Solusi logis namun kurang tepat",
        K: "Belum mampu memberikan alternatif solusi atas masalah"
      }
    ]
  },
  {
    dimensiNama: "Kreativitas",
    subDimensiList: [
      {
        nama: "Gagasan",
        M: "Inovatif untuk masalah lingkungan luas",
        C: "Inovatif untuk masalah sekitar",
        B: "Inovatif dari contoh",
        K: "Belum menghasilkan gagasan inovatif secara mandiri"
      },
      {
        nama: "Fleksibilitas",
        M: "Mengevaluasi berbagai alternatif solusi",
        C: "Menemukan alternatif solusi & memberi umpan balik",
        B: "Menemukan solusi sekitar",
        K: "Belum fleksibel dalam mencari alternatif penyelesaian masalah"
      },
      {
        nama: "Karya",
        M: "Mengevaluasi dampak karya bagi lingkungan",
        C: "Karya kompleks & analisis dampaknya bagi orang lain",
        B: "Karya kreatif & sadar dampaknya bagi diri",
        K: "Belum mampu menghasilkan karya kreatif yang berdampak"
      }
    ]
  },
  {
    dimensiNama: "Kolaborasi",
    subDimensiList: [
      {
        nama: "Peduli",
        M: "Mengajak orang lain untuk peduli",
        C: "Peduli secara konsisten",
        B: "Menunjukkan kepedulian",
        K: "Belum menunjukkan rasa peduli dalam kegiatan kelompok"
      },
      {
        nama: "Berbagi",
        M: "Berinisiatif berbagi untuk saling memberdayakan",
        C: "Berbagi sumber daya secara konsisten",
        B: "Berbagi sumber daya namun belum konsisten",
        K: "Belum terbiasa berbagi sumber daya dalam kegiatan bersama"
      },
      {
        nama: "Kerja sama",
        M: "Inisiatif bekerja sama dengan pihak luar sekolah",
        C: "Bekerja sama secara konsisten",
        B: "Bekerja sama dalam sekolah",
        K: "Belum dapat bekerja sama secara aktif dalam tim"
      }
    ]
  },
  {
    dimensiNama: "Kemandirian",
    subDimensiList: [
      {
        nama: "Tanggung Jawab",
        M: "Target belajar bimbingan minimal",
        C: "Target belajar bimbingan",
        B: "Target belajar bimbingan penuh",
        K: "Memerlukan pengawasan dan bimbingan penuh untuk menyelesaikan target belajar"
      },
      {
        nama: "Kepemimpinan",
        M: "Mengorganisasi teman untuk mencapai target tuntas",
        C: "Regulasi diri konsisten",
        B: "Memotivasi diri sendiri",
        K: "Belum mampu memotivasi dan mengatur regulasi diri sendiri"
      },
      {
        nama: "Pengembangan Diri",
        M: "Adaptif terhadap perubahan & tantangan bimbingan minimal",
        C: "Aktualisasi rencana pengembangan diri bimbingan",
        B: "Identifikasi potensi bimbingan penuh",
        K: "Belum mengenali potensi dan merencanakan pengembangan diri"
      }
    ]
  },
  {
    dimensiNama: "Kesehatan",
    subDimensiList: [
      {
        nama: "Hidup Bersih",
        M: "Mengajak orang lain hidup bersih",
        C: "Konsisten jaga kebersihan diri & keluarga",
        B: "Jaga kebersihan diri",
        K: "Belum terbiasa menjaga kebersihan diri secara rutin"
      },
      {
        nama: "Kebugaran",
        M: "Mengajak orang lain pola hidup sehat bimbingan minimal",
        C: "Olahraga & makan sehat mandiri",
        B: "Olahraga bimbingan penuh",
        K: "Belum rutin berolahraga dan menjaga pola makan sehat"
      },
      {
        nama: "Lingkungan",
        M: "Mengajak masyarakat luas jaga lingkungan",
        C: "Aktif jaga lingkungan sekolah",
        B: "Aktif jaga lingkungan sekolah bimbingan penuh",
        K: "Belum peduli terhadap kebersihan dan kesehatan lingkungan sekolah"
      }
    ]
  },
  {
    dimensiNama: "Komunikasi",
    subDimensiList: [
      {
        nama: "Menyimak",
        M: "Memberi tanggapan relevan & kritis",
        C: "Memberi tanggapan sederhana",
        B: "Mendapat info eksplisit/implisit",
        K: "Belum dapat menyimak dan menangkap informasi secara akurat"
      },
      {
        nama: "Berbicara",
        M: "Menanggapi secara benar, tepat, lancar, & efektif",
        C: "Menanggapi dengan cukup tepat & efektif",
        B: "Menanggapi info namun belum lancar",
        K: "Belum berani atau belum lancar berbicara dalam menanggapi informasi"
      },
      {
        nama: "Membaca",
        M: "Memberi tanggapan relevan & kritis",
        C: "Memberi tanggapan sederhana",
        B: "Memahami info eksplisit/implisit",
        K: "Belum mampu membaca dan memahami informasi secara utuh"
      },
      {
        nama: "Menulis",
        M: "Menulis secara benar, tepat, lancar, & efektif",
        C: "Menulis dengan cukup tepat & lancar",
        B: "Menulis info belum lancar",
        K: "Belum lancar menuangkan gagasan dalam bentuk tulisan"
      }
    ]
  }
];

export const PREDIKAT_MAPPING_INFO = [
  { code: "SB", predikat: "Sangat Baik", level: "Tahap Mahir (M)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { code: "B", predikat: "Baik", level: "Tahap Cakap (C) - Standar Kelulusan", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { code: "C", predikat: "Cukup", level: "Tahap Berkembang (B)", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { code: "K", predikat: "Kurang", level: "Tahap Menuju Berkembang / Belum Berkembang", color: "bg-rose-50 text-rose-700 border-rose-200" },
];
