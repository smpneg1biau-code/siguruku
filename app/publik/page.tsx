'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Loader2,
  BookOpen,
  User,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Activity,
  Award,
  Clock,
  Printer,
  ChevronRight,
  GraduationCap,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { collectionGroup, getDocs, doc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Siswa, TP, Sumatif, Remedial, Absensi, Anekdot, Formatif } from '@/lib/types';
import Link from 'next/link';

interface RemedialDetail {
  id: string;
  jenis: string;
  jadwal: string;
  pic: string;
  target: string;
  status: 'Direncanakan' | 'Berlangsung' | 'Selesai' | 'Dibatalkan';
  nilaiAwal: number;
  nilaiBaru?: number;
  levelBaru?: number;
  statusAwal: string;
  statusBaru?: string;
}

interface FormatifDetail {
  id: string;
  jenis: 'AWAL' | 'TENGAH';
  teknik: string;
  tanggal: string;
  status: string;
  catatan: string;
  anekdots: any[];
  tpKode: string;
  tpDeskripsi: string;
}

interface TPStatusDetail {
  tp: TP;
  status: string;
  nilai: number;
  level: number;
  catatanSumatif: string;
  teknik: string;
  remedial: RemedialDetail | null;
}

interface GlobalAnekdotItem {
  id: string;
  tanggal: string;
  mapel: string;
  guruNama: string;
  kategori: string;
  teks: string;
  sumber: 'Perilaku' | 'Formatif';
}

interface MapelResult {
  mapel: string;
  guruNama: string;
  kelasNama: string;
  tpStatuses: TPStatusDetail[];
  formatifs: FormatifDetail[];
  kehadiran: {
    hadir: number;
    sakit: number;
    izin: number;
    alpa: number;
    bolos: number;
    totalPertemuan: number;
    persentaseHadir: number;
  };
  catatanKehadiran: { tanggal: string; catatan: string }[];
}

export default function PublikPage() {
  const [nisn, setNisn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState<{
    nama: string;
    nisn: string;
    jk: string;
    kelasNama?: string;
  } | null>(null);
  const [results, setResults] = useState<MapelResult[]>([]);
  const [globalAnekdots, setGlobalAnekdots] = useState<GlobalAnekdotItem[]>([]);
  const [activeTab, setActiveTab] = useState<'semua' | 'kehadiran' | 'sumatif' | 'formatif' | 'anekdot'>('semua');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) return;

    setLoading(true);
    setError('');
    setStudentData(null);
    setResults([]);
    setGlobalAnekdots([]);

    try {
      const q = collectionGroup(db, 'agmp_siswa');
      const querySnapshot = await getDocs(q);

      const studentDocs = querySnapshot.docs.filter((doc) => doc.data().nisn === nisn.trim());

      if (studentDocs.length === 0) {
        setError('Data siswa dengan NISN tersebut tidak ditemukan. Pastikan NISN sudah benar.');
        setLoading(false);
        return;
      }

      const firstSiswa = studentDocs[0].data() as Siswa;

      const mapelResults: MapelResult[] = [];
      const combinedGlobalAnekdots: GlobalAnekdotItem[] = [];
      let detectedKelasNama = '';

      for (const studentDoc of studentDocs) {
        const siswa = studentDoc.data() as Siswa;
        const userId = studentDoc.ref.parent.parent?.id;

        if (!userId) continue;

        // Get teacher / user info
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const mapel = userData?.agmp_pengaturan?.mapel || 'Mata Pelajaran';
        const guruNama = userData?.agmp_pengaturan?.guruNama || 'Guru Mata Pelajaran';

        // Get kelas name
        let kelasNama = '';
        try {
          const kelasRef = collection(db, 'users', userId, 'agmp_kelas');
          const kelasSnap = await getDocs(kelasRef);
          const kelasList = kelasSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
          const matchedKelas = kelasList.find((k) => k.id === siswa.kelasId);
          if (matchedKelas) {
            kelasNama = matchedKelas.nama;
            if (!detectedKelasNama) detectedKelasNama = matchedKelas.nama;
          }
        } catch {
          // ignore error
        }

        // Get TPs
        const tpRef = collection(db, 'users', userId, 'agmp_tp');
        const tpSnap = await getDocs(tpRef);
        const tps = tpSnap.docs
          .map((d) => d.data() as TP)
          .filter((tp) => tp.kelasIds && tp.kelasIds.includes(siswa.kelasId));

        tps.sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));

        // Get Sumatif
        const sumatifRef = collection(db, 'users', userId, 'agmp_sumatif');
        const sumatifSnap = await getDocs(sumatifRef);
        const sumatifs = sumatifSnap.docs
          .map((d) => ({ ...(d.data() as Sumatif), id: d.id }))
          .filter((s) => s.kelasId === siswa.kelasId);

        // Get Remedial
        const remedialRef = collection(db, 'users', userId, 'agmp_remedial');
        const remedialSnap = await getDocs(remedialRef);
        const remedials = remedialSnap.docs
          .map((d) => ({ ...(d.data() as Remedial), id: d.id }))
          .filter((r) => r.siswaId === siswa.id);

        // Calculate TP Statuses & Remedial Details
        const tpStatuses: TPStatusDetail[] = tps.map((tp) => {
          const sumatifRecord = sumatifs.find((s) => s.tpId === tp.id);
          const record = sumatifRecord?.records?.[siswa.id];

          let status = 'BELUM DINILAI';
          let nilai = 0;
          let level = 0;
          let catatanSumatif = '';
          const teknik = sumatifRecord?.teknik || 'Asesmen Sumatif';

          if (record) {
            nilai = record.nilai || 0;
            level = record.level || 0;
            status = record.status || 'BELUM TUNTAS';
            catatanSumatif = record.catatan || '';
          }

          // Check Remedial
          const rem = remedials.find(
            (r) => r.tpId === tp.id || (sumatifRecord && r.sumatifId === sumatifRecord.id)
          );
          let remedialData: RemedialDetail | null = null;

          if (rem) {
            const nilaiAwal = record?.nilai ?? 0;
            const statusAwal = record?.status ?? 'BELUM TUNTAS';

            if (rem.status === 'Selesai') {
              if (rem.nilaiBaru !== undefined) nilai = rem.nilaiBaru;
              if (rem.statusBaru) status = rem.statusBaru;
            }

            if (record?.status === 'BELUM TUNTAS' && status === 'TUNTAS' && rem.status === 'Selesai') {
              status = 'TUNTAS REMEDIAL';
            }

            remedialData = {
              id: rem.id,
              jenis: rem.jenis || 'Bimbingan & Tugas Remedial',
              jadwal: rem.jadwal || '-',
              pic: rem.pic || guruNama,
              target: rem.target || 'Ketercapaian Indikator TP',
              status: rem.status,
              nilaiAwal,
              nilaiBaru: rem.nilaiBaru,
              levelBaru: rem.levelBaru,
              statusAwal,
              statusBaru: rem.statusBaru,
            };
          }

          return {
            tp,
            status,
            nilai,
            level,
            catatanSumatif,
            teknik,
            remedial: remedialData,
          };
        });

        // Get Jurnal for linking formatif to TP
        let jurnals: any[] = [];
        try {
          const jurnalRef = collection(db, 'users', userId, 'agmp_jurnal');
          const jurnalSnap = await getDocs(jurnalRef);
          jurnals = jurnalSnap.docs.map((d) => ({ ...(d.data() as any), id: d.id }));
        } catch {
          // ignore
        }

        // Get Formatif
        const formatifRef = collection(db, 'users', userId, 'agmp_formatif');
        const formatifSnap = await getDocs(formatifRef);
        const formatifs = formatifSnap.docs
          .map((d) => ({ ...(d.data() as Formatif), id: d.id }))
          .filter((f) => f.hasil && f.hasil[siswa.id]);

        // Get Anekdot
        const anekdotRef = collection(db, 'users', userId, 'agmp_anekdot');
        const anekdotSnap = await getDocs(anekdotRef);
        const anekdotDocs = anekdotSnap.docs
          .map((d) => ({ ...(d.data() as Anekdot), id: d.id }))
          .filter((a) => a.siswaId === siswa.id);

        anekdotDocs.forEach((a) => {
          combinedGlobalAnekdots.push({
            id: a.id,
            tanggal: a.tanggal || new Date().toISOString(),
            mapel,
            guruNama,
            kategori: a.kategori || 'Sikap & Karakter',
            teks: a.teks,
            sumber: 'Perilaku',
          });
        });

        // Extract formatif details and anekdots stored inside formatif
        const formatifSummaries: FormatifDetail[] = [];
        formatifs.forEach((f) => {
          const res = f.hasil[siswa.id];
          if (res) {
            let matchedTpKode = '-';
            let matchedTpDeskripsi = '';

            const matchedJurnal = jurnals.find((j) => j.id === f.jurnalId);
            if (matchedJurnal) {
              const tp = tps.find((t) => t.id === matchedJurnal.tpId);
              if (tp) {
                matchedTpKode = tp.kode;
                matchedTpDeskripsi = tp.deskripsi;
              }
            }

            if (matchedTpKode === '-') {
              const tp = tps.find(
                (t) =>
                  f.jurnalId === t.id ||
                  f.jurnalId.endsWith(`_${t.id}`) ||
                  f.jurnalId.includes(`_${t.id}`) ||
                  f.jurnalId.includes(t.id)
              );
              if (tp) {
                matchedTpKode = tp.kode;
                matchedTpDeskripsi = tp.deskripsi;
              }
            }

            formatifSummaries.push({
              id: f.id,
              jenis: f.jenis,
              teknik: f.teknik || 'Observasi',
              tanggal: f.tanggal || '',
              status: res.status || '',
              catatan: res.catatan || '',
              anekdots: res.anekdots || [],
              tpKode: matchedTpKode,
              tpDeskripsi: matchedTpDeskripsi,
            });

            if (res.anekdots && Array.isArray(res.anekdots)) {
              res.anekdots.forEach((an: any) => {
                if (an.teks) {
                  combinedGlobalAnekdots.push({
                    id: an.id || Math.random().toString(),
                    tanggal: an.tanggal || f.tanggal || new Date().toISOString(),
                    mapel,
                    guruNama,
                    kategori: an.kategori || 'Formatif & Akademik',
                    teks: an.teks,
                    sumber: 'Formatif',
                  });
                }
              });
            }
          }
        });

        formatifSummaries.sort(
          (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

        // Get Absensi
        const absensiRef = collection(db, 'users', userId, 'agmp_absensi');
        const absensiSnap = await getDocs(absensiRef);
        const absensis = absensiSnap.docs
          .map((d) => d.data() as Absensi)
          .filter((a) => a.kelasId === siswa.kelasId);

        let hadir = 0,
          sakit = 0,
          izin = 0,
          alpa = 0,
          bolos = 0;
        const catatanKehadiran: { tanggal: string; catatan: string }[] = [];
        absensis.forEach((ab) => {
          const st = ab.records?.[siswa.id];
          if (st === 'HADIR') hadir++;
          else if (st === 'SAKIT') sakit++;
          else if (st === 'IZIN') izin++;
          else if (st === 'ALPA') alpa++;
          else if (st === 'BOLOS') bolos++;

          if (ab.catatan && ab.catatan[siswa.id]) {
            catatanKehadiran.push({ tanggal: ab.tanggal, catatan: ab.catatan[siswa.id] });
          }
        });

        catatanKehadiran.sort(
          (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );

        const totalPertemuan = absensis.length;
        const persentaseHadir =
          totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 100;

        mapelResults.push({
          mapel,
          guruNama,
          kelasNama,
          tpStatuses,
          formatifs: formatifSummaries,
          kehadiran: {
            hadir,
            sakit,
            izin,
            alpa,
            bolos,
            totalPertemuan,
            persentaseHadir,
          },
          catatanKehadiran,
        });
      }

      combinedGlobalAnekdots.sort(
        (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
      );

      setStudentData({
        nama: firstSiswa.nama,
        nisn: firstSiswa.nisn,
        jk: firstSiswa.jk,
        kelasNama: detectedKelasNama,
      });

      setResults(mapelResults);
      setGlobalAnekdots(combinedGlobalAnekdots);
    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat mencari data. Silakan coba beberapa saat lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Overall statistics
  const globalSummary = useMemo(() => {
    let hadir = 0,
      sakit = 0,
      izin = 0,
      alpa = 0,
      bolos = 0,
      totalPertemuan = 0;
    let totalTp = 0,
      totalTuntas = 0,
      totalScore = 0,
      scoredTp = 0,
      totalRemedial = 0;
    let totalFormatif = 0;

    results.forEach((r) => {
      hadir += r.kehadiran.hadir;
      sakit += r.kehadiran.sakit;
      izin += r.kehadiran.izin;
      alpa += r.kehadiran.alpa;
      bolos += r.kehadiran.bolos;
      totalPertemuan += r.kehadiran.totalPertemuan;

      totalFormatif += r.formatifs.length;

      r.tpStatuses.forEach((tp) => {
        totalTp++;
        if (tp.status === 'TUNTAS' || tp.status === 'TUNTAS REMEDIAL') {
          totalTuntas++;
        }
        if (tp.nilai > 0) {
          totalScore += tp.nilai;
          scoredTp++;
        }
        if (tp.remedial) {
          totalRemedial++;
        }
      });
    });

    const persentaseHadir =
      totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 100;
    const avgScore = scoredTp > 0 ? Math.round(totalScore / scoredTp) : 0;

    return {
      hadir,
      sakit,
      izin,
      alpa,
      bolos,
      totalPertemuan,
      persentaseHadir,
      totalTp,
      totalTuntas,
      avgScore,
      totalRemedial,
      totalFormatif,
      totalAnekdot: globalAnekdots.length,
    };
  }, [results, globalAnekdots]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-xs">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Portal Publik Siswa & Orang Tua
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Rekapitulasi Perkembangan Belajar Terpadu
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg"
          >
            Login Guru &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Search Section */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 md:p-8 text-center">
          <div className="max-w-lg mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mb-4 shadow-xs">
              <Search className="w-7 h-7" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1.5">
              Cek Rekap Perkembangan Siswa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              Masukkan Nomor Induk Siswa Nasional (NISN) untuk melihat rekap kehadiran, capaian formatif, catatan anekdot, dan nilai sumatif beserta rincian remedial.
            </p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan 10 digit NISN..."
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50 transition-all font-medium text-slate-900 text-sm"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="h-12 px-5 sm:px-7 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-all flex items-center justify-center disabled:opacity-70 text-sm shadow-sm cursor-pointer"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cari Data'}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-3.5 bg-red-50 text-red-700 text-xs sm:text-sm font-medium rounded-xl flex items-center justify-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {studentData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Student Profile Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl shadow-md p-6 sm:p-7 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shrink-0 shadow-inner">
                  {studentData.jk === 'L' ? '👦' : '👧'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl sm:text-2xl font-black">{studentData.nama}</h3>
                  </div>
                  <p className="text-blue-100 text-xs sm:text-sm font-medium mt-1">
                    NISN: <span className="font-bold text-white">{studentData.nisn}</span> •{' '}
                    {studentData.jk === 'L' ? 'Laki-Laki' : 'Perempuan'}{' '}
                    {studentData.kelasNama ? `• Kelas ${studentData.kelasNama}` : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 backdrop-blur-sm border border-white/20 self-stretch sm:self-auto justify-center cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Cetak / Simpan PDF
              </button>
            </div>

            {/* 1. GLOBAL EXECUTIVE OVERVIEW CARDS (4 Key Domains) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Presensi Kehadiran Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Kehadiran
                  </span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                      globalSummary.persentaseHadir >= 85
                        ? 'bg-emerald-100 text-emerald-800'
                        : globalSummary.persentaseHadir >= 75
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {globalSummary.persentaseHadir >= 85
                      ? 'Sangat Baik'
                      : globalSummary.persentaseHadir >= 75
                      ? 'Cukup'
                      : 'Kurang'}
                  </span>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-slate-900">
                      {globalSummary.persentaseHadir}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({globalSummary.hadir}/{globalSummary.totalPertemuan} Hadir)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        globalSummary.persentaseHadir >= 85
                          ? 'bg-emerald-500'
                          : globalSummary.persentaseHadir >= 75
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${globalSummary.persentaseHadir}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                  <span>S: {globalSummary.sakit}</span>
                  <span>I: {globalSummary.izin}</span>
                  <span>A: {globalSummary.alpa}</span>
                  <span>B: {globalSummary.bolos}</span>
                </div>
              </div>

              {/* Laporan Nilai Sumatif Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Ketuntasan TP
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800">
                    Sumatif
                  </span>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl sm:text-3xl font-black text-blue-600">
                      {globalSummary.totalTuntas}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">
                      / {globalSummary.totalTp} TP
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rata-rata Nilai: <span className="font-bold text-slate-800">{globalSummary.avgScore}</span>
                  </p>
                </div>
                <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span>Remedial: {globalSummary.totalRemedial} TP</span>
                  <span className="text-emerald-600 font-bold">
                    {globalSummary.totalTp > 0
                      ? Math.round((globalSummary.totalTuntas / globalSummary.totalTp) * 100)
                      : 0}
                    % Tuntas
                  </span>
                </div>
              </div>

              {/* Rekap Formatif Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Asesmen Formatif
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                    Proses
                  </span>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-purple-600">
                      {globalSummary.totalFormatif}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Evaluasi</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Diagnostik awal & pemantauan berkala
                  </p>
                </div>
                <div className="text-[10px] text-purple-700 font-semibold pt-1 border-t border-slate-100">
                  Mencakup umpan balik guru
                </div>
              </div>

              {/* Catatan Anekdot Card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Catatan Anekdot
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    Karakter
                  </span>
                </div>
                <div className="my-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl sm:text-3xl font-black text-amber-600">
                      {globalSummary.totalAnekdot}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Catatan</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Observasi sikap & perkembangan
                  </p>
                </div>
                <div className="text-[10px] text-amber-700 font-semibold pt-1 border-t border-slate-100">
                  Terintegrasi semua guru
                </div>
              </div>
            </div>

            {/* View Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl overflow-x-auto">
              {[
                { id: 'semua', label: 'Semua Rekap' },
                { id: 'kehadiran', label: '1. Presensi Kehadiran' },
                { id: 'sumatif', label: '2. Nilai Sumatif & Remedial' },
                { id: 'formatif', label: '3. Penilaian Formatif' },
                { id: 'anekdot', label: '4. Catatan Anekdot Global' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SECTION 4 (GLOBAL): CATATAN ANEKDOT GLOBAL SISWA */}
            {(activeTab === 'semua' || activeTab === 'anekdot') && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="text-base sm:text-lg font-bold text-slate-900">
                        Catatan Anekdot Global Siswa
                      </h4>
                      <p className="text-xs text-slate-500">
                        Rekaman observasi perilaku, kedisiplinan, sosial-emosional, dan dinamika belajar siswa dari seluruh mata pelajaran.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                    {globalAnekdots.length} Catatan
                  </span>
                </div>

                {globalAnekdots.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">Belum ada catatan anekdot khusus untuk siswa ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
                    {globalAnekdots.map((an) => (
                      <div
                        key={an.id}
                        className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 border border-amber-200/70 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              {an.kategori}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {new Date(an.tanggal).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal">
                            &quot;{an.teks}&quot;
                          </p>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-amber-100">
                          <span className="font-bold text-slate-700">
                            {an.mapel} • {an.guruNama}
                          </span>
                          <span className="text-[10px] bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium">
                            {an.sumber === 'Formatif' ? 'Observasi Formatif' : 'Buku Anekdot'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* PER-SUBJECT BREAKDOWN: 1. Kehadiran, 2. Formatif, 3. Sumatif & Remedial */}
            <div className="space-y-6">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  Rincian Capaian per Mata Pelajaran
                </h3>
                <span className="text-xs text-slate-500">
                  {results.length} Mata Pelajaran Terdata
                </span>
              </div>

              {results.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center text-slate-500">
                  Belum ada data mata pelajaran untuk siswa ini.
                </div>
              ) : (
                results.map((res, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-3xl shadow-sm border border-slate-200/90 overflow-hidden space-y-0"
                  >
                    {/* Subject Header */}
                    <div className="p-5 sm:p-6 bg-slate-50/80 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                            <BookOpen className="w-4 h-4" />
                          </span>
                          <h4 className="text-base sm:text-lg font-bold text-slate-900">
                            {res.mapel}
                          </h4>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Guru Pengampu: <span className="font-semibold text-slate-700">{res.guruNama}</span>
                        </p>
                      </div>

                      {/* Quick subject stats badge */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-xs">
                          Kehadiran: <span className="text-blue-600">{res.kehadiran.persentaseHadir}%</span>
                        </span>
                        <span className="text-xs font-bold px-3 py-1 bg-white border border-slate-200 rounded-xl text-slate-700 shadow-xs">
                          TP Tuntas:{' '}
                          <span className="text-emerald-600">
                            {res.tpStatuses.filter((t) => t.status === 'TUNTAS' || t.status === 'TUNTAS REMEDIAL').length}/
                            {res.tpStatuses.length}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* SUB-SECTION 1: DETAIL PERSENTASE KEHADIRAN */}
                    {(activeTab === 'semua' || activeTab === 'kehadiran') && (
                      <div className="p-5 sm:p-6 border-b border-slate-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                            1. Rekapitulasi Presensi Kehadiran Siswa
                          </h5>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-500 font-medium">Persentase:</span>
                            <span
                              className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                                res.kehadiran.persentaseHadir >= 80
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : res.kehadiran.persentaseHadir >= 70
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {res.kehadiran.persentaseHadir}%
                            </span>
                          </div>
                        </div>

                        {/* Visual Breakdown Cards (Hadir, Sakit, Izin, Alpa, Bolos, Total) */}
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Hadir</p>
                            <p className="text-xl font-black text-emerald-800">{res.kehadiran.hadir}</p>
                            <p className="text-[9px] text-emerald-600">Pertemuan</p>
                          </div>
                          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Sakit</p>
                            <p className="text-xl font-black text-blue-800">{res.kehadiran.sakit}</p>
                            <p className="text-[9px] text-blue-600">Surat/Ket</p>
                          </div>
                          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Izin</p>
                            <p className="text-xl font-black text-amber-800">{res.kehadiran.izin}</p>
                            <p className="text-[9px] text-amber-600">Pemberitahuan</p>
                          </div>
                          <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Alpa</p>
                            <p className="text-xl font-black text-rose-800">{res.kehadiran.alpa}</p>
                            <p className="text-[9px] text-rose-600">Tanpa Ket</p>
                          </div>
                          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Bolos</p>
                            <p className="text-xl font-black text-purple-800">{res.kehadiran.bolos}</p>
                            <p className="text-[9px] text-purple-600">Meninggalkan Kls</p>
                          </div>
                          <div className="p-3 bg-slate-100 border border-slate-200 rounded-2xl text-center">
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Total</p>
                            <p className="text-xl font-black text-slate-800">{res.kehadiran.totalPertemuan}</p>
                            <p className="text-[9px] text-slate-500">Pertemuan</p>
                          </div>
                        </div>

                        {/* Catatan Presensi dari Guru jika ada */}
                        {res.catatanKehadiran && res.catatanKehadiran.length > 0 && (
                          <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                            <span className="font-bold text-slate-700 block text-[11px]">
                              Catatan Khusus Presensi dari Guru:
                            </span>
                            {res.catatanKehadiran.slice(0, 3).map((ck, i) => (
                              <div key={i} className="text-slate-600 flex items-start gap-2 text-[11px]">
                                <span className="text-slate-400 font-medium">
                                  {new Date(ck.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}:
                                </span>
                                <span className="font-medium text-slate-800">{ck.catatan}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-SECTION 2: LAPORAN NILAI SUMATIF TERMASUK RINCIAN REMEDIAL */}
                    {(activeTab === 'semua' || activeTab === 'sumatif') && (
                      <div className="p-5 sm:p-6 border-b border-slate-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-blue-600" />
                            2. Laporan Nilai Sumatif & Rincian Remedial
                          </h5>
                          <span className="text-xs text-slate-400 font-medium">
                            Kriteria Ketuntasan TP (KKTP)
                          </span>
                        </div>

                        {res.tpStatuses.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Belum ada Tujuan Pembelajaran (TP) yang dinilai pada mata pelajaran ini.
                          </p>
                        ) : (
                          <div className="space-y-3.5">
                            {res.tpStatuses.map((tpStat, i) => {
                              const isRemedial = !!tpStat.remedial;
                              const rem = tpStat.remedial;

                              return (
                                <div
                                  key={i}
                                  className="p-4 rounded-2xl border border-slate-200/90 bg-white hover:border-blue-200 transition-all shadow-xs space-y-3"
                                >
                                  {/* TP Top Row */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                                          TP {tpStat.tp.kode}
                                        </span>
                                        <span className="text-xs font-semibold text-slate-800 truncate" title={tpStat.tp.deskripsi}>
                                          {tpStat.tp.deskripsi}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Nilai & Status Badge */}
                                    <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                                      <div className="text-right">
                                        <span className="text-xs text-slate-400 block font-medium">Nilai Akhir</span>
                                        <span className="text-lg font-black text-blue-600">
                                          {tpStat.nilai}
                                        </span>
                                      </div>

                                      {tpStat.status === 'TUNTAS' || tpStat.status === 'TUNTAS REMEDIAL' ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          {tpStat.status === 'TUNTAS REMEDIAL' ? 'TUNTAS (R)' : 'TUNTAS'}
                                        </span>
                                      ) : tpStat.status === 'BELUM TUNTAS' ? (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                                          <XCircle className="w-3.5 h-3.5" />
                                          BELUM TUNTAS
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-500 border border-slate-200">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Catatan Sumatif Guru */}
                                  {tpStat.catatanSumatif && (
                                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                      <span className="font-semibold not-italic text-slate-700">Catatan Guru: </span>
                                      &quot;{tpStat.catatanSumatif}&quot;
                                    </p>
                                  )}

                                  {/* RINCIAN REMEDIAL BOX (JIKA ADA REMEDIAL) */}
                                  {isRemedial && rem && (
                                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50/80 to-orange-50/50 border border-amber-200/90 space-y-2.5">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                                          <span className="text-xs font-black text-amber-900 uppercase tracking-wider">
                                            Rincian Program Remedial
                                          </span>
                                        </div>
                                        <span
                                          className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                            rem.status === 'Selesai'
                                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                              : rem.status === 'Berlangsung'
                                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                              : rem.status === 'Direncanakan'
                                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                                          }`}
                                        >
                                          Status: {rem.status}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                        <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                                          <span className="text-[10px] font-semibold text-slate-500 block">Bentuk Remedial:</span>
                                          <span className="font-bold text-slate-800">{rem.jenis}</span>
                                        </div>

                                        <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                                          <span className="text-[10px] font-semibold text-slate-500 block">Jadwal Pelaksanaan:</span>
                                          <span className="font-bold text-slate-800">{rem.jadwal}</span>
                                        </div>

                                        <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                                          <span className="text-[10px] font-semibold text-slate-500 block">Guru Pembimbing:</span>
                                          <span className="font-bold text-slate-800">{rem.pic}</span>
                                        </div>

                                        <div className="bg-white/80 p-2 rounded-xl border border-amber-100">
                                          <span className="text-[10px] font-semibold text-slate-500 block">Perkembangan Nilai:</span>
                                          <span className="font-bold text-slate-800 flex items-center gap-1">
                                            <span>{rem.nilaiAwal}</span>
                                            <ArrowRight className="w-3 h-3 text-amber-600" />
                                            <span className="text-emerald-600">
                                              {rem.nilaiBaru !== undefined ? rem.nilaiBaru : 'Belum dinilai'}
                                            </span>
                                          </span>
                                        </div>
                                      </div>

                                      {rem.target && (
                                        <div className="text-[11px] text-amber-950 font-medium">
                                          <span className="font-bold">Target Remedial: </span>
                                          {rem.target}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUB-SECTION 3: REKAP DETAIL PENILAIAN FORMATIF */}
                    {(activeTab === 'semua' || activeTab === 'formatif') && (
                      <div className="p-5 sm:p-6 space-y-3 bg-purple-50/15">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-purple-600" />
                            3. Rekap Detail Penilaian Formatif
                          </h5>
                          <span className="text-xs text-purple-700 font-bold bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                            {res.formatifs.length} Asesmen Terlaksana
                          </span>
                        </div>

                        {res.formatifs.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">
                            Belum ada asesmen formatif yang direkam untuk mata pelajaran ini.
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {res.formatifs.map((f, i) => {
                              let statusBadge = null;
                              if (f.status === 'Siap Belajar') {
                                statusBadge = (
                                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    Siap Belajar
                                  </span>
                                );
                              } else if (f.status === 'Perlu Bimbingan') {
                                statusBadge = (
                                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                                    Perlu Bimbingan
                                  </span>
                                );
                              } else if (f.status === '4') {
                                statusBadge = (
                                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                                    Level 4 (Mahir / Sangat Menguasai)
                                  </span>
                                );
                              } else if (f.status === '3') {
                                statusBadge = (
                                  <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    Level 3 (Cakap / Paham Mandiri)
                                  </span>
                                );
                              } else if (f.status === '2') {
                                statusBadge = (
                                  <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                                    Level 2 (Layak / Butuh Latihan Terbimbing)
                                  </span>
                                );
                              } else if (f.status === '1') {
                                statusBadge = (
                                  <span className="bg-rose-100 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                                    Level 1 (Baru Berkembang / Perlu Bimbingan Intensif)
                                  </span>
                                );
                              } else if (f.status) {
                                statusBadge = (
                                  <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-slate-200">
                                    {f.status}
                                  </span>
                                );
                              }

                              return (
                                <div
                                  key={f.id || i}
                                  className="p-4 rounded-2xl border border-purple-100 bg-white shadow-xs space-y-2.5"
                                >
                                  {/* Formatif Header */}
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${
                                          f.jenis === 'AWAL'
                                            ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                                        }`}
                                      >
                                        {f.jenis === 'AWAL' ? 'Diagnostik (Awal)' : 'Formatif (Monitoring)'}
                                      </span>
                                      <span className="text-xs font-bold text-slate-700">
                                        Teknik: {f.teknik}
                                      </span>
                                      {f.tpKode && f.tpKode !== '-' && (
                                        <span className="text-xs font-medium text-slate-500">
                                          (TP {f.tpKode})
                                        </span>
                                      )}
                                    </div>

                                    {f.tanggal && (
                                      <span className="text-xs text-slate-500 font-medium">
                                        {new Date(f.tanggal).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric',
                                        })}
                                      </span>
                                    )}
                                  </div>

                                  {/* Status / Level */}
                                  {statusBadge && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-slate-500 font-medium">Capaian:</span>
                                      {statusBadge}
                                    </div>
                                  )}

                                  {/* Catatan Guru */}
                                  {f.catatan && (
                                    <p className="text-xs text-slate-700 italic bg-purple-50/40 p-2.5 rounded-xl border border-purple-100/70">
                                      <span className="font-semibold not-italic text-slate-800">Evaluasi Guru: </span>
                                      &quot;{f.catatan}&quot;
                                    </p>
                                  )}

                                  {/* Formatif Anecdotes */}
                                  {f.anekdots && f.anekdots.length > 0 && (
                                    <div className="space-y-1.5 pt-1">
                                      <span className="text-[11px] font-bold text-slate-500 block">
                                        Observasi Pembelajaran:
                                      </span>
                                      {f.anekdots.map((an: any, aIdx: number) => (
                                        <div
                                          key={aIdx}
                                          className="text-xs p-2 rounded-lg bg-slate-50 text-slate-700 border border-slate-100 flex items-start gap-1.5"
                                        >
                                          {an.kategori && (
                                            <span className="font-bold text-purple-700">[{an.kategori}]</span>
                                          )}
                                          <span>{an.teks}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
