export type TemaBentuk = {
  id: string;
  dimensiId: string;
  bentuk: "Pembelajaran Kolaboratif Lintas Disiplin" | "Gerakan 7KAIH" | "Cara Lainnya";
  deskripsi?: string;
};
export type ModulKokurikuler = {
  id: string;
  nama: string;
  temaBentukId: string;
  alokasiWaktu: number;
};
export type Fasilitator = {
  id: string;
  modulId: string;
  kelasId: string;
  guruIds: string[];
};
export type SubDimensi = {
  id: string;
  nama: string;
};
export type Dimensi = {
  id: string;
  nama: string;
  subDimensi: SubDimensi[];
};
export type Mapel = {
  id: string;
  kode: string;
  nama: string;
};
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
  skalaPenilaian?: string[];
  deskripsiSkala?: string[];
  ekivalenSkala?: string[] | number[];
};
export type Rubrik = {
  id: string;
  tpId: string;
  jenisKKTP?: KKTPType;
  level1?: string;
  level2?: string;
  level3?: string;
  level4?: string;
  skalaPenilaian?: string[];
  aspekPenilaian?: AspekRubrik[];
  aturanKetuntasan?: Record<string, number>;
  syaratKetuntasanDaftarCeklis?: number;
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
  records: Record<string, AbsensiStatus>;
  catatan?: Record<string, string>;
};
export type AbsensiKokurikuler = {
  id: string;
  taId: string;
  tanggal: string;
  kelasId: string;
  kegiatanId: string;
  records: Record<string, AbsensiStatus>;
  catatan?: Record<string, string>;
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
  level: number;
  nilai: number;
  catatan: string;
  status: "TUNTAS" | "BELUM TUNTAS";
  buktiUrl?: string;
  tesTulisScores?: Record<number, number>;
  rubrikScores?: Record<string, number>;
  ceklistScores?: Record<string, boolean>;
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
  records: Record<string, SumatifRecord>;
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
  rubrikScoresBaru?: Record<string, number>;
  ceklistScoresBaru?: Record<string, boolean>;
  tesTulisScoresBaru?: Record<string, number>;
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

// Kokurikuler Types
export type BentukKegiatan = "Pembelajaran Kolaboratif Lintas Disiplin" | "Gerakan 7KAIH" | "Cara Lainnya";

export type TemaKokurikuler = {
  id: string;
  nama: string;
  bentukKegiatan?: BentukKegiatan | string;
  deskripsi?: string;
};
export type CapaianProfil = {
  dimensiId: string;
  subDimensiIds: string[];
};
export type KegiatanKokurikuler = {
  id: string;
  temaId: string;
  kelasIds: string[];
  noUrut: number;
  nama: string;
  tujuanAkhir: string;
  capaianProfil: CapaianProfil[];
};
export type AsesmenFormatifKoku = {
  id: string;
  kegiatanId: string;
  kelasId: string;
  siswaId: string;
  dimensiId: string;
  tanggal: string;
  catatan: string;
  statusProgres: "Muncul" | "Belum Muncul";
  umpanBalik?: string;
  refleksiMurid?: string;
  taId: string;
};
export type AsesmenSumatifKoku = {
  id: string;
  kegiatanId: string;
  kelasId: string;
  // to be defined further if needed
};

export type RubrikKokurikuler = {
  id: string;
  kegiatanId?: string;
  dimensiNama: string;
  subDimensiNama: string;
  deskripsiSB: string; // SB = Tahap Mahir (M)
  deskripsiB: string;  // B  = Tahap Cakap (C - Standar)
  deskripsiC: string;  // C  = Tahap Berkembang (B)
  deskripsiK: string;  // K  = Tahap Menuju / Belum Berkembang
  standarKelulusan?: "SB" | "B" | "C" | "K"; // default B
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
  agmp_mapel: Mapel[];
  agmp_dimensi: Dimensi[];
  agmp_tema_bentuk: TemaBentuk[];
  agmp_modul_kokurikuler: ModulKokurikuler[];
  agmp_fasilitator: Fasilitator[];
  agmp_pengaturan: {
    guruNama: string;
    mapel: string;
    mapelId?: string;
    kelasIds?: string[];
    sekolah: string;
  };
  agmp_tema_kokurikuler: TemaKokurikuler[];
  agmp_kegiatan_kokurikuler: KegiatanKokurikuler[];
  agmp_asesmen_formatif_koku: AsesmenFormatifKoku[];
  agmp_asesmen_sumatif_koku: AsesmenSumatifKoku[];
  agmp_rubrik_kokurikuler: RubrikKokurikuler[];
  agmp_absensi_kokurikuler: AbsensiKokurikuler[];
};
