import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Printer, Filter } from 'lucide-react';
import { AbsensiStatus } from '@/lib/types';

export default function RekapAbsensi() {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const mapelAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);
  const [kelasId, setKelasId] = useState(state.agmp_kelas[0]?.id || '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);

  const selectedKelas = state.agmp_kelas.find(k => k.id === kelasId);
  const siswaList = state.agmp_siswa
    .filter(s => s.kelasId === kelasId)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const filteredAbsensi = useMemo(() => {
    if (!kelasId || !startDate || !endDate) return [];
    return mapelAbsensi
      .filter(a => a.kelasId === kelasId && a.tanggal >= startDate && a.tanggal <= endDate)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }, [mapelAbsensi, kelasId, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const statusAbbreviation = (status: AbsensiStatus) => {
    switch (status) {
      case 'HADIR': return 'H';
      case 'SAKIT': return 'S';
      case 'IZIN': return 'I';
      case 'ALPA': return 'A';
      case 'BOLOS': return 'B';
      default: return '-';
    }
  };

  return (
    <div className="space-y-6">
      {/* Non-print Header & Filters */}
      <div className="print:hidden space-y-4">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rekap Absensi</h2>
            <p className="text-sm text-gray-500 mt-1">
              Filter dan cetak rekapitulasi kehadiran siswa.
            </p>
          </div>
          <button 
            onClick={handlePrint}
            disabled={!kelasId || !startDate || !endDate}
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
              {state.agmp_kelas.map(k => (
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
      {kelasId && startDate && endDate && (
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
              REKAP ABSENSI KELAS {selectedKelas?.nama || ''}
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
                  <th className="border border-gray-300 px-3 py-2 min-w-[150px]">Nama Siswa</th>
                  <th className="border border-gray-300 px-2 py-2 text-center w-10">L/P</th>
                  {filteredAbsensi.map(ab => (
                    <th key={ab.id} className="border border-gray-300 px-1 py-2 text-center whitespace-nowrap text-[10px]">
                      {new Date(ab.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit' })}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold bg-green-50 print:bg-green-50">H</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold bg-yellow-50 print:bg-yellow-50">S</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold bg-orange-50 print:bg-orange-50">I</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold bg-red-50 print:bg-red-50">A</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-bold bg-gray-50 print:bg-gray-50">B</th>
                </tr>
              </thead>
              <tbody>
                {siswaList.length > 0 ? (
                  siswaList.map((siswa, idx) => {
                    let h = 0, s = 0, i = 0, a = 0, b = 0;
                    
                    return (
                      <tr key={siswa.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{idx + 1}</td>
                        <td className="border border-gray-300 px-3 py-1.5">{siswa.nama}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center">{siswa.jk}</td>
                        
                        {filteredAbsensi.map(ab => {
                          const status = ab.records?.[siswa.id];
                          if (status === 'HADIR') h++;
                          if (status === 'SAKIT') s++;
                          if (status === 'IZIN') i++;
                          if (status === 'ALPA') a++;
                          if (status === 'BOLOS') b++;
                          
                          return (
                            <td key={ab.id} className="border border-gray-300 px-1 py-1.5 text-center text-[10px] font-medium">
                              {status ? statusAbbreviation(status) : '-'}
                            </td>
                          );
                        })}
                        
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-green-50/30 print:bg-green-50/30">{h}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-yellow-50/30 print:bg-yellow-50/30">{s}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-orange-50/30 print:bg-orange-50/30">{i}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-red-50/30 print:bg-red-50/30">{a}</td>
                        <td className="border border-gray-300 px-2 py-1.5 text-center font-bold bg-gray-50/50 print:bg-gray-50/50">{b}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={filteredAbsensi.length + 8} className="border border-gray-300 px-3 py-6 text-center text-gray-500 italic">
                      Belum ada data siswa di kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            
            {filteredAbsensi.length === 0 && siswaList.length > 0 && (
              <div className="text-center text-sm text-gray-500 italic mt-4">
                Tidak ada data absensi untuk rentang tanggal yang dipilih.
              </div>
            )}
            
            <div className="mt-8 flex justify-end print:block">
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
