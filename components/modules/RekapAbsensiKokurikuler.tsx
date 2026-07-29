import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Printer } from 'lucide-react';
import { getInitials } from '@/lib/utils';

export default function RekapAbsensiKokurikuler() {
  const { state , filteredKelas } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // first day of month
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const kegiatanList = state.agmp_kegiatan_kokurikuler || [];
  const [kegiatanId, setKegiatanId] = useState(kegiatanList[0]?.id || '');
  
  const selectedKegiatan = kegiatanList.find(k => k.id === kegiatanId);
  
  const availableKelasIds = selectedKegiatan?.kelasIds || [];
  const kelasList = filteredKelas.filter(k => availableKelasIds.includes(k.id));
  const [kelasId, setKelasId] = useState(kelasList[0]?.id || '');

  
  useMemo(() => {
    if (kelasList.length > 0 && !availableKelasIds.includes(kelasId)) {
        // eslint-disable-next-line react-hooks/set-state-in-render
        setKelasId(kelasList[0].id);
    } else if (kelasList.length === 0) {
        // eslint-disable-next-line react-hooks/set-state-in-render
        setKelasId('');
    }
  }, [kelasList, availableKelasIds, kelasId]);

  const selectedKelas = filteredKelas.find(k => k.id === kelasId);

  const { dates, rekap, grandTotal } = useMemo(() => {
    if (!kelasId || !startDate || !endDate || !kegiatanId) return { dates: [], rekap: [], grandTotal: { HADIR:0, SAKIT:0, IZIN:0, ALPA:0, BOLOS:0 } };
    
    // Filter records by date range, kelas, kegiatan, and active TA
    const filteredRecords = (state.agmp_absensi_kokurikuler || []).filter(a => 
      a.kelasId === kelasId &&
      a.kegiatanId === kegiatanId &&
      a.tanggal >= startDate &&
      a.tanggal <= endDate &&
      (activeTaId ? (a.taId === activeTaId || !a.taId) : true)
    ).sort((a,b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    const dates = filteredRecords.map(r => r.tanggal);
    const siswaList = state.agmp_siswa.filter(s => s.kelasId === kelasId).sort((a,b) => a.nama.localeCompare(b.nama));
    
    const rekap = siswaList.map(siswa => {
      const row: Record<string, string> = {};
      const totals = { HADIR: 0, SAKIT: 0, IZIN: 0, ALPA: 0, BOLOS: 0 };
      
      filteredRecords.forEach(rec => {
        const status = rec.records[siswa.id] || 'HADIR';
        row[rec.tanggal] = status.charAt(0); // H, S, I, A, B
        totals[status]++;
      });
      
      return { siswa, row, totals };
    });

    const grandTotal = { HADIR:0, SAKIT:0, IZIN:0, ALPA:0, BOLOS:0 };
    rekap.forEach(r => {
      grandTotal.HADIR += r.totals.HADIR;
      grandTotal.SAKIT += r.totals.SAKIT;
      grandTotal.IZIN += r.totals.IZIN;
      grandTotal.ALPA += r.totals.ALPA;
      grandTotal.BOLOS += r.totals.BOLOS;
    });

    return { dates, rekap, grandTotal };
  }, [kelasId, startDate, endDate, state.agmp_absensi_kokurikuler, state.agmp_siswa, activeTaId, kegiatanId]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden space-y-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rekap Kehadiran Kokurikuler</h2>
            <p className="text-sm text-gray-500 mt-1">
              Filter dan cetak rekapitulasi kehadiran kokurikuler.
            </p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={!kelasId || !kegiatanId || !startDate || !endDate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak / Print
          </button>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Kegiatan</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              value={kegiatanId} 
              onChange={e => setKegiatanId(e.target.value)}
            >
              {kegiatanList.length === 0 && <option value="">Belum ada Kegiatan</option>}
              {kegiatanList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Kelas</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              value={kelasId} 
              onChange={e => setKelasId(e.target.value)}
            >
              {kelasList.length === 0 && <option value="">Pilih Kegiatan Dulu</option>}
              {kelasList.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mulai Tanggal</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
            />
          </div>

          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Sampai Tanggal</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              value={endDate} 
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Print View & Preview */}
      {kelasId && kegiatanId && startDate && endDate && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0">
          <style>{`
            @media print {
              @page { size: landscape; margin: 1cm; }
              body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              main { padding: 0 !important; }
            }
          `}</style>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase">
              REKAP KEHADIRAN KOKURIKULER KELAS {selectedKelas?.nama || ''}
            </h2>
            <h3 className="text-md font-semibold text-gray-800 mt-1">
              {selectedKegiatan?.nama || ''}
            </h3>
            <h3 className="text-sm font-semibold uppercase text-gray-700 mt-2">
              RENTANG TANGGAL: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
            </h3>
            {activeTA && (
              <p className="text-xs text-gray-500 mt-1">
                Tahun Ajaran: {activeTA.nama} | Semester: {activeTA.semester}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            {dates.length === 0 ? (
              <div className="text-center py-10 text-gray-500 border border-dashed border-gray-200 rounded-xl">
                Tidak ada data absensi untuk rentang tanggal ini.
              </div>
            ) : (
              <table className="w-full border-collapse text-xs border border-gray-800">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-800 px-2 py-2 w-10 text-center">NO</th>
                    <th className="border border-gray-800 px-3 py-2 text-left">NAMA SISWA</th>
                    {dates.map((d, idx) => (
                      <th key={d} className="border border-gray-800 px-1 py-2 text-center w-6" title={d}>
                        {idx + 1}
                      </th>
                    ))}
                    <th className="border border-gray-800 px-2 py-2 text-center text-[#34C759]">H</th>
                    <th className="border border-gray-800 px-2 py-2 text-center text-[#5856D6]">S</th>
                    <th className="border border-gray-800 px-2 py-2 text-center text-[#FF9500]">I</th>
                    <th className="border border-gray-800 px-2 py-2 text-center text-[#FF3B30]">A</th>
                    <th className="border border-gray-800 px-2 py-2 text-center text-[#3A3A3C]">B</th>
                  </tr>
                </thead>
                <tbody>
                  {rekap.map((row, idx) => (
                    <tr key={row.siswa.id} className="hover:bg-gray-50">
                      <td className="border border-gray-800 px-2 py-1.5 text-center">{idx + 1}</td>
                      <td className="border border-gray-800 px-3 py-1.5 font-medium whitespace-nowrap">
                        {row.siswa.nama}
                      </td>
                      {dates.map((d) => {
                         const val = row.row[d];
                         let color = '';
                         if (val === 'H') color = 'text-[#34C759]';
                         if (val === 'S') color = 'text-[#5856D6]';
                         if (val === 'I') color = 'text-[#FF9500]';
                         if (val === 'A') color = 'text-[#FF3B30]';
                         if (val === 'B') color = 'text-[#3A3A3C]';
                         return (
                           <td key={d} className={`border border-gray-800 px-1 py-1.5 text-center font-bold ${color}`}>
                             {val}
                           </td>
                         )
                      })}
                      <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[#34C759]">{row.totals.HADIR}</td>
                      <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[#5856D6]">{row.totals.SAKIT}</td>
                      <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[#FF9500]">{row.totals.IZIN}</td>
                      <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[#FF3B30]">{row.totals.ALPA}</td>
                      <td className="border border-gray-800 px-2 py-1.5 text-center font-bold text-[#3A3A3C]">{row.totals.BOLOS}</td>
                    </tr>
                  ))}
                  
                  {/* Footer Totals */}
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={dates.length + 2} className="border border-gray-800 px-3 py-2 text-right">
                      TOTAL KEHADIRAN KELAS:
                    </td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-[#34C759]">{grandTotal.HADIR}</td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-[#5856D6]">{grandTotal.SAKIT}</td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-[#FF9500]">{grandTotal.IZIN}</td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-[#FF3B30]">{grandTotal.ALPA}</td>
                    <td className="border border-gray-800 px-2 py-2 text-center text-[#3A3A3C]">{grandTotal.BOLOS}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="mt-12 flex justify-end print:block">
            <div className="w-48 text-center text-xs">
              <p>....................., {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</p>
              <p className="mt-1">Fasilitator Projek</p>
              <br /><br /><br /><br />
              <p className="font-bold underline">{state.agmp_pengaturan?.guruNama || 'NAMA GURU'}</p>
              <p>NIP. .......................................</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
