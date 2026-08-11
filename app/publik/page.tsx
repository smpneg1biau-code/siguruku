'use client';

import { useState } from 'react';
import { Search, Loader2, BookOpen, User, CheckCircle, XCircle, AlertCircle, Calendar, FileText, Activity } from 'lucide-react';
import { collectionGroup, query, where, getDocs, doc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Siswa, TP, Sumatif, Remedial, Absensi, Anekdot, Formatif } from '@/lib/types';
import Link from 'next/link';

export default function PublikPage() {
  const [nisn, setNisn] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nisn.trim()) return;

    setLoading(true);
    setError('');
    setStudentData(null);
    setResults([]);

    try {
      const q = collectionGroup(db, 'agmp_siswa');
      const querySnapshot = await getDocs(q);
      
      const studentDocs = querySnapshot.docs.filter(doc => doc.data().nisn === nisn.trim());

      if (studentDocs.length === 0) {
        setError('Data siswa dengan NISN tersebut tidak ditemukan.');
        setLoading(false);
        return;
      }

      // We might find the student in multiple teachers' classes
      // studentDocs already filtered above
      
      // Assume the student details (name, nisn) are the same across all records
      const firstSiswa = studentDocs[0].data() as Siswa;
      setStudentData({
        nama: firstSiswa.nama,
        nisn: firstSiswa.nisn,
        jk: firstSiswa.jk,
      });

      const mapelResults = [];

      for (const studentDoc of studentDocs) {
        const siswa = studentDoc.data() as Siswa;
        const userId = studentDoc.ref.parent.parent?.id;
        
        if (!userId) continue;

        // Get teacher info
        const userDocRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const mapel = userData?.agmp_pengaturan?.mapel || 'Mata Pelajaran';
        const guruNama = userData?.agmp_pengaturan?.guruNama || 'Guru';

        // Get TPs
        const tpRef = collection(db, 'users', userId, 'agmp_tp');
        const tpSnap = await getDocs(tpRef);
        const tps = tpSnap.docs.map(d => d.data() as TP).filter(tp => tp.kelasIds.includes(siswa.kelasId));
        
        // Sort TPs
        tps.sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));

        // Get Sumatif
        const sumatifRef = collection(db, 'users', userId, 'agmp_sumatif');
        const sumatifSnap = await getDocs(sumatifRef);
        const sumatifs = sumatifSnap.docs.map(d => d.data() as Sumatif).filter(s => s.kelasId === siswa.kelasId);

        // Get Remedial
        const remedialRef = collection(db, 'users', userId, 'agmp_remedial');
        const remedialSnap = await getDocs(remedialRef);
        const remedials = remedialSnap.docs.map(d => d.data() as Remedial).filter(r => r.siswaId === siswa.id);

        // Calculate TP Statuses
        const tpStatuses = tps.map(tp => {
          const sumatifRecord = sumatifs.find(s => s.tpId === tp.id);
          const record = sumatifRecord?.records?.[siswa.id];
          
          let status = 'BELUM DINILAI';
          let nilai = 0;
          let isRemedial = false;

          if (record) {
            nilai = record.nilai;
            status = record.status || 'BELUM TUNTAS';
            
            // Check Remedial
            const rem = remedials.find(r => r.sumatifId === sumatifRecord?.id);
            if (rem && rem.status === 'Selesai') {
              if (rem.nilaiBaru !== undefined) nilai = rem.nilaiBaru;
              if (rem.statusBaru) status = rem.statusBaru;
            }

            // Fallback check logic (similar to RekapAkhir)
            if (record.status === 'BELUM TUNTAS' && status === 'TUNTAS' && rem && rem.status === 'Selesai') {
              status = 'TUNTAS REMEDIAL';
            }
          }

          return {
            tp,
            status,
            nilai
          };
        });

        // Get Formatif
        const formatifRef = collection(db, 'users', userId, 'agmp_formatif');
        const formatifSnap = await getDocs(formatifRef);
        const formatifs = formatifSnap.docs.map(d => ({ ...(d.data() as Formatif), id: d.id })).filter(f => f.hasil && f.hasil[siswa.id]);

        // Get Anekdot
        const anekdotRef = collection(db, 'users', userId, 'agmp_anekdot');
        const anekdotSnap = await getDocs(anekdotRef);
        const anekdots = anekdotSnap.docs.map(d => ({ ...(d.data() as Anekdot), sumber: 'Perilaku' })).filter(a => a.siswaId === siswa.id);

        // Extract formatif details and anekdots stored inside formatif
        const formatifSummaries: any[] = [];
        formatifs.forEach(f => {
          const res = f.hasil[siswa.id];
          if (res) {
            formatifSummaries.push({
              id: f.id,
              jenis: f.jenis,
              teknik: f.teknik,
              tanggal: f.tanggal || '',
              status: res.status || '',
              catatan: res.catatan || '',
              anekdots: res.anekdots || []
            });

            if (res.anekdots && Array.isArray(res.anekdots)) {
              res.anekdots.forEach((an: any) => {
                if (an.teks) {
                  anekdots.push({
                    id: an.id || Math.random().toString(),
                    taId: f.taId || '',
                    siswaId: siswa.id,
                    tanggal: an.tanggal || f.tanggal || new Date().toISOString(),
                    teks: `${an.kategori ? `[${an.kategori}] ` : ''}${an.teks}`,
                    sumber: 'Formatif'
                  });
                }
              });
            }
          }
        });

        // Sort combined anekdots descending by date
        anekdots.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
        // Sort formatif summaries descending by date
        formatifSummaries.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        // Get Absensi
        const absensiRef = collection(db, 'users', userId, 'agmp_absensi');
        const absensiSnap = await getDocs(absensiRef);
        const absensis = absensiSnap.docs.map(d => d.data() as Absensi).filter(a => a.kelasId === siswa.kelasId);

        let hadir = 0, sakit = 0, izin = 0, alpa = 0, bolos = 0;
        const catatanKehadiran: {tanggal: string, catatan: string}[] = [];
        absensis.forEach(ab => {
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
        
        catatanKehadiran.sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

        const totalPertemuan = absensis.length;
        const persentaseHadir = totalPertemuan > 0 ? Math.round((hadir / totalPertemuan) * 100) : 100;

        mapelResults.push({
          mapel,
          guruNama,
          tpStatuses,
          formatifs: formatifSummaries,
          kehadiran: {
            hadir, sakit, izin, alpa, bolos, totalPertemuan, persentaseHadir
          },
          anekdots,
          catatanKehadiran
        });
      }

      setResults(mapelResults);

    } catch (err) {
      console.error(err);
      setError('Terjadi kesalahan saat mencari data. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
              A
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 leading-tight">Portal Publik</h1>
              <p className="text-xs text-gray-500 font-medium">Informasi Perkembangan Siswa</p>
            </div>
          </div>
          <Link href="/" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            Login Admin &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-600 mb-6">
              <Search className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Cari Data Siswa</h2>
            <p className="text-sm text-gray-500 mb-8">
              Masukkan Nomor Induk Siswa Nasional (NISN) untuk melihat rekap kehadiran dan nilai akhir sumatif.
            </p>
            
            <form onSubmit={handleSearch} className="flex gap-3">
              <input 
                type="text" 
                placeholder="Masukkan NISN..." 
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium text-gray-900"
                required
              />
              <button 
                type="submit" 
                disabled={loading}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Cari Data"}
              </button>
            </form>

            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 text-sm font-medium rounded-xl flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        {studentData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Student Profile Card */}
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-md p-6 text-white flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-bold mb-1">{studentData.nama}</h3>
                <p className="text-blue-100 font-medium">NISN: {studentData.nisn} • {studentData.jk === 'L' ? 'Laki-Laki' : 'Perempuan'}</p>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 px-2 mt-8 mb-4 border-b pb-2">
              Rekapitulasi per Mata Pelajaran
            </h3>

            {results.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center text-gray-500">
                Belum ada data mata pelajaran untuk siswa ini.
              </div>
            ) : (
              <div className="grid gap-6">
                {results.map((res, idx) => (
                  <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-600" />
                          {res.mapel}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">Guru: {res.guruNama}</p>
                      </div>
                      
                      {/* Rekap & Detail Persentase Kehadiran */}
                      <div className="flex flex-col items-start sm:items-end gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 font-medium">Persentase Kehadiran:</span>
                          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${res.kehadiran.persentaseHadir >= 80 ? 'bg-green-50 text-green-700 border-green-200' : res.kehadiran.persentaseHadir >= 70 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                            {res.kehadiran.persentaseHadir}%
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          <span title="Hadir" className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 font-semibold">H: {res.kehadiran.hadir}</span>
                          <span title="Sakit" className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-100 font-semibold">S: {res.kehadiran.sakit}</span>
                          <span title="Izin" className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-100 font-semibold">I: {res.kehadiran.izin}</span>
                          <span title="Alpa" className="bg-red-50 text-red-700 px-2 py-0.5 rounded border border-red-100 font-semibold">A: {res.kehadiran.alpa}</span>
                          <span title="Bolos" className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-100 font-semibold">B: {res.kehadiran.bolos}</span>
                          <span title="Total Pertemuan" className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium border border-gray-200">Total: {res.kehadiran.totalPertemuan}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Sumatif / TP Statuses */}
                    <div className="p-5">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Capaian Tujuan Pembelajaran (TP)</h5>
                      {res.tpStatuses.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Belum ada data TP yang dinilai.</p>
                      ) : (
                        <div className="space-y-3">
                          {res.tpStatuses.map((tpStat: any, i: number) => (
                            <div key={i} className="flex items-start sm:items-center justify-between gap-4 p-3 rounded-xl border border-gray-100 bg-gray-50/30">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">{tpStat.tp.kode}</p>
                                <p className="text-xs text-gray-600 truncate" title={tpStat.tp.deskripsi}>{tpStat.tp.deskripsi}</p>
                              </div>
                              <div className="shrink-0 flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                <span className="text-xs font-bold text-gray-900 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                                  {tpStat.nilai}
                                </span>
                                {tpStat.status === 'TUNTAS' || tpStat.status === 'TUNTAS REMEDIAL' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-600 border border-green-100">
                                    <CheckCircle className="w-3 h-3" />
                                    {tpStat.status === 'TUNTAS REMEDIAL' ? 'TUNTAS (R)' : 'TUNTAS'}
                                  </span>
                                ) : tpStat.status === 'BELUM TUNTAS' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-600 border border-red-100">
                                    <XCircle className="w-3 h-3" />
                                    BELUM TUNTAS
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200">
                                    -
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Section Rekap Data Formatif Secara Umum */}
                    <div className="p-5 border-t border-gray-100 bg-purple-50/10">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-purple-600" />
                        Rekapitulasi Penilaian Formatif Secara Umum
                      </h5>
                      {!res.formatifs || res.formatifs.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">Belum ada data evaluasi formatif untuk mata pelajaran ini.</p>
                      ) : (
                        <div className="space-y-3">
                          {res.formatifs.map((f: any, i: number) => {
                            let statusBadge = null;
                            if (f.status === 'Siap Belajar') {
                              statusBadge = <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">Siap Belajar</span>;
                            } else if (f.status === 'Perlu Bimbingan') {
                              statusBadge = <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">Perlu Bimbingan</span>;
                            } else if (f.status === '1') {
                              statusBadge = <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-200">Level 1 (Sangat Perlu Bimbingan)</span>;
                            } else if (f.status === '2') {
                              statusBadge = <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-orange-200">Level 2 (Perlu Perhatian)</span>;
                            } else if (f.status === '3') {
                              statusBadge = <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">Level 3 (Paham)</span>;
                            } else if (f.status === '4') {
                              statusBadge = <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-green-200">Level 4 (Sangat Paham)</span>;
                            } else if (f.status) {
                              statusBadge = <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">{f.status}</span>;
                            }

                            return (
                              <div key={`form-${i}`} className="p-3.5 rounded-xl border border-purple-100 bg-white shadow-xs space-y-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${f.jenis === 'AWAL' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                      {f.jenis === 'AWAL' ? 'Diagnostic (Awal)' : 'Monitoring (Proses)'}
                                    </span>
                                    <span className="text-xs font-semibold text-gray-700">Teknik: {f.teknik}</span>
                                  </div>
                                  {f.tanggal && (
                                    <span className="text-xs text-gray-500 font-medium">
                                      {new Date(f.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                  )}
                                </div>

                                {statusBadge && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-gray-500 font-medium">Hasil Kesiapan/Pemahaman:</span>
                                    {statusBadge}
                                  </div>
                                )}

                                {f.catatan && (
                                  <p className="text-xs text-gray-700 italic bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                                    &quot;{f.catatan}&quot;
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Section Catatan Kehadiran & Anekdot (Terintegrasi dari Absensi dan Formatif) */}
                    <div className="p-5 border-t border-gray-100">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        Catatan Kehadiran & Anekdot (Sikap / Formatif / Perilaku)
                      </h5>
                      <div className="space-y-4">
                        {(!res.catatanKehadiran || res.catatanKehadiran.length === 0) && (!res.anekdots || res.anekdots.length === 0) ? (
                          <p className="text-sm text-gray-500 italic">Belum ada catatan kehadiran maupun anekdot.</p>
                        ) : (
                          <>
                            {res.catatanKehadiran && res.catatanKehadiran.length > 0 && (
                              <div className="space-y-2">
                                <h6 className="text-xs font-semibold text-gray-700">Catatan Kehadiran</h6>
                                {res.catatanKehadiran.map((ck: any, i: number) => (
                                  <div key={`ck-${i}`} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                    <p className="text-[10px] text-gray-500 font-medium mb-1">
                                      {new Date(ck.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                    </p>
                                    <p className="text-sm text-gray-700">{ck.catatan}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {res.anekdots && res.anekdots.length > 0 && (
                              <div className="space-y-2 mt-4">
                                <h6 className="text-xs font-semibold text-gray-700">Catatan Anekdot (Perilaku / Penilaian Formatif)</h6>
                                {res.anekdots.map((an: any, i: number) => (
                                  <div key={`an-${i}`} className="p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <p className="text-[10px] text-gray-500 font-medium">
                                        {new Date(an.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'})}
                                      </p>
                                      {an.sumber && (
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${an.sumber === 'Formatif' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'}`}>
                                          Catatan {an.sumber}
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm text-gray-700">{an.teks}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
