import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Printer } from 'lucide-react';

export default function RekapJurnal() {
  const { state , filteredKelas } = useStore();
  const [kelasId, setKelasId] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);

  const filteredJurnal = useMemo(() => {
    if (!startDate || !endDate) return [];
    return state.agmp_jurnal
      .filter(j => {
        const matchDate = j.tanggal >= startDate && j.tanggal <= endDate;
        const matchKelas = kelasId === 'ALL' || j.kelasId === kelasId;
        return matchDate && matchKelas;
      })
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [state.agmp_jurnal, kelasId, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const getKelasNama = (kId: string) => {
    return filteredKelas.find(k => k.id === kId)?.nama || '-';
  };

  const getTpKode = (tId: string) => {
    const tp = state.agmp_tp.find(t => t.id === tId);
    return tp ? tp.kode : '-';
  };
  
  const getTpDeskripsi = (tId: string) => {
    const tp = state.agmp_tp.find(t => t.id === tId);
    return tp ? tp.deskripsi : '-';
  };

  return (
    <div className="space-y-6">
      {/* Non-print Header & Filters */}
      <div className="print:hidden space-y-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rekap Jurnal</h2>
            <p className="text-sm text-gray-500 mt-1">
              Filter dan cetak rekapitulasi jurnal mengajar guru.
            </p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={!startDate || !endDate}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak / Print
          </button>
        </header>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Pilih Kelas</label>
            <select 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              value={kelasId} 
              onChange={e => setKelasId(e.target.value)}
            >
              <option value="ALL">Semua Kelas</option>
              {filteredKelas.map(k => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Mulai Tanggal</label>
            <input 
              type="date" 
              className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50"
              value={startDate} 
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 w-full">
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
      {startDate && endDate && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0 print:m-0">
          <style>{`
            @media print {
              @page { size: landscape; margin: 1cm; }
              body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              main { padding: 0 !important; }
            }
          `}</style>
          
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold uppercase">
              REKAP JURNAL MENGAJAR {kelasId !== 'ALL' ? `KELAS ${getKelasNama(kelasId)}` : ''}
            </h2>
            <h3 className="text-sm font-semibold uppercase text-gray-700">
              RENTANG TANGGAL: {new Date(startDate).toLocaleDateString('id-ID')} - {new Date(endDate).toLocaleDateString('id-ID')}
            </h3>
            {activeTA && (
              <p className="text-xs text-gray-500 mt-1">
                Tahun Ajaran: {activeTA.nama} | Semester: {activeTA.semester}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-xs text-left">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-100">
                  <th className="border border-gray-300 px-2 py-2 w-10 text-center">No</th>
                  <th className="border border-gray-300 px-2 py-2 min-w-[90px]">Tanggal</th>
                  {kelasId === 'ALL' && <th className="border border-gray-300 px-2 py-2">Kelas</th>}
                  <th className="border border-gray-300 px-3 py-2 min-w-[150px]">Tujuan Pembelajaran</th>
                  <th className="border border-gray-300 px-3 py-2 min-w-[150px]">Materi</th>
                  <th className="border border-gray-300 px-3 py-2 min-w-[200px]">Kegiatan</th>
                  <th className="border border-gray-300 px-3 py-2 min-w-[150px]">Refleksi</th>
                  <th className="border border-gray-300 px-2 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredJurnal.length > 0 ? (
                  filteredJurnal.map((jurnal, idx) => (
                    <tr key={jurnal.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-2 py-2 text-center align-top">{idx + 1}</td>
                      <td className="border border-gray-300 px-2 py-2 align-top">
                        {new Date(jurnal.tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      {kelasId === 'ALL' && (
                        <td className="border border-gray-300 px-2 py-2 align-top text-center font-bold">
                          {getKelasNama(jurnal.kelasId)}
                        </td>
                      )}
                      <td className="border border-gray-300 px-3 py-2 align-top">
                        <span className="font-bold">{getTpKode(jurnal.tpId)}</span><br/>
                        {getTpDeskripsi(jurnal.tpId)}
                      </td>
                      <td className="border border-gray-300 px-3 py-2 align-top whitespace-pre-wrap">{jurnal.materi}</td>
                      <td className="border border-gray-300 px-3 py-2 align-top whitespace-pre-wrap">{jurnal.kegiatan}</td>
                      <td className="border border-gray-300 px-3 py-2 align-top whitespace-pre-wrap">{jurnal.refleksi || '-'}</td>
                      <td className="border border-gray-300 px-2 py-2 text-center align-top font-bold">
                        {jurnal.status === 'TUNTAS' ? (
                           <span className="text-green-600">{jurnal.status}</span>
                        ) : (
                           <span className="text-red-600">{jurnal.status}</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={kelasId === 'ALL' ? 8 : 7} className="border border-gray-300 px-3 py-6 text-center text-gray-500 italic">
                      Tidak ada data jurnal pada rentang tanggal tersebut.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="mt-8 flex justify-end print:block break-inside-avoid">
              <div className="w-48 text-center text-sm">
                <p className="mb-16">Mengetahui,<br/>Guru Mata Pelajaran</p>
                <p className="font-bold underline">{state.agmp_pengaturan.guruNama || '.............................'}</p>
                <p className="text-xs">NIP. .............................</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
