export type Kelas = {
  id: string;
  nama: string;
  fase: string;
  tahunAjaran: string;
  waliKelas: string;
};

export type Siswa = {
  id: string;
  nisn: string;
  nama: string;
  jk: "L" | "P";
  kelasId: string;
};

export type TP = {
  id: string;
  kode: string;
  deskripsi: string;
  fase: string;
  kelasIds: string[];
  semester: string;
};

export type KKTP = {
  id: string;
  tpId: string;
  urutan: number;
  deskripsi: string;
  bobot?: number;
};

export type KKTPType = "Daftar Ceklist" | "Rubrik Deskripsi" | "Interval Nilai" | "Persentase";

export type AspekRubrik = {
  id: string;
  nama: string;
};

export type Rubrik = {
  id: string;
  tpId: string;
  jenisKKTP?: KKTPType;
  level1?: string; // Baru Berkembang
  level2?: string; // Layak
  level3?: string; // Cakap
  level4?: string; // Mahir
  
  // Rubrik Deskripsi specific
  skalaPenilaian?: string[];
  aspekPenilaian?: AspekRubrik[];
  aturanKetuntasan?: Record<string, number>; // Maps aspekId to minimum skala index required
  // Daftar Ceklist specific
  syaratKetuntasanDaftarCeklis?: number; // Minimal indikator/kriteria yang harus tercapai
};

export type Jurnal = {
  id: string;
  taId: string;
  tanggal: string;
  kelasId: string;
  tpId: string;
  materi: string;
  kegiatan: string;
  refleksi: string;
  status: "TUNTAS" | "BELUM TUNTAS";
  cekAwalDone: boolean;
  cekTengahDone: boolean;
  isClosed: boolean;
};

export type AbsensiStatus = "HADIR" | "SAKIT" | "IZIN" | "ALPA" | "BOLOS";

export type Absensi = {
  id: string;
  taId: string;
  tanggal: string;
  kelasId: string;
  records: Record<string, AbsensiStatus>; // key: siswaId
  catatan?: Record<string, string>; // key: siswaId
};

export type Anekdot = {
  id: string;
  taId: string;
  siswaId: string;
  tanggal: string;
  teks: string;
};

export type Formatif = {
  id: string;
  taId: string;
  jurnalId: string;
  jenis: "AWAL" | "TENGAH";
  teknik: string;
  hasil: any;
};

export type SumatifRecord = {
  level: number; // 1, 2, 3, 4
  nilai: number; // 0-100
  catatan: string;
  status: "TUNTAS" | "BELUM TUNTAS";
  buktiUrl?: string;
  tesTulisScores?: Record<number, number>;
  rubrikScores?: Record<string, number>; // Maps aspekId to selected skala index
  ceklistScores?: Record<string, boolean>; // Maps aspekId to boolean (tercapai atau belum)
};

export type AuditLogEntry = {
  tanggal: string;
  user: string;
  action: string;
  ip: string;
};

export type TesTulisConfig = {
  id: number;
  bobotMaksimal: number;
};

export type Sumatif = {
  id: string;
  taId: string;
  tpId: string;
  kelasId: string;
  teknik: string;
  isLocked: boolean;
  records: Record<string, SumatifRecord>; // key: siswaId
  auditLog?: AuditLogEntry[];
  tesTulisConfig?: TesTulisConfig[];
};

export type Remedial = {
  id: string;
  taId: string;
  sumatifId: string;
  siswaId: string;
  kelasId?: string;
  tpId: string;
  jenis: string;
  jadwal: string;
  pic: string;
  target: string;
  status: "Direncanakan" | "Berlangsung" | "Selesai" | "Dibatalkan";
  levelBaru?: number;
  nilaiBaru?: number;
  statusBaru?: "TUNTAS" | "BELUM TUNTAS";
};

export type Rapor = {
  id: string;
  siswaId: string;
  semester: string;
  tahunAjaran: string;
  deskripsi: string;
};

export type TahunAjaran = {
  id: string;
  nama: string;
  semester: "Ganjil" | "Genap";
  isActive: boolean;
};

export type AppState = {
  agmp_tahun_ajaran: TahunAjaran[];
  agmp_kelas: Kelas[];
  agmp_siswa: Siswa[];
  agmp_tp: TP[];
  agmp_kktp: KKTP[];
  agmp_rubrik: Rubrik[];
  agmp_jurnal: Jurnal[];
  agmp_absensi: Absensi[];
  agmp_formatif: Formatif[];
  agmp_sumatif: Sumatif[];
  agmp_remedial: Remedial[];
  agmp_rapor: Rapor[];
  agmp_anekdot: Anekdot[];
  agmp_pengaturan: {
    guruNama: string;
    mapel: string;
    sekolah: string;
  };
};
