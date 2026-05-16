import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AbsensiStatus } from '@/lib/types';
import { generateId, getInitials } from '@/lib/utils';
import { CheckCircle2, Download, MessageSquare, X, Plus } from 'lucide-react';

export default function Absensi() {
  const { state, addItem, updateItem } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [kelasId, setKelasId] = useState(state.agmp_kelas[0]?.id || '');
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  
  // Find or create record for today & class
  const existingRecord = state.agmp_absensi.find(a => a.tanggal === tanggal && a.kelasId === kelasId && (activeTaId ? a.taId === activeTaId : true));
  
  useEffect(() => {
    if (!existingRecord && kelasId && activeTaId) {
       // Initialize all to Hadir if doesn't exist when we load this view
       const siswaList = state.agmp_siswa.filter(s => s.kelasId === kelasId);
       if(siswaList.length > 0) {
           const records: Record<string, AbsensiStatus> = {};
           siswaList.forEach(s => records[s.id] = 'HADIR');
           addItem('agmp_absensi', { id: generateId(), taId: activeTaId, tanggal, kelasId, records });
       }
    }
  }, [tanggal, kelasId, existingRecord, addItem, state.agmp_siswa, activeTaId]);

  const siswaList = state.agmp_siswa.filter(s => s.kelasId === kelasId);
  const sortedSiswaList = [...siswaList].sort((a, b) => a.nama.localeCompare(b.nama));
  const currentRecords = existingRecord?.records || {};
  const currentNotes = existingRecord?.catatan || {};

  const handleToggle = (siswaId: string) => {
    if (!existingRecord) return;
    const currentStatus = currentRecords[siswaId] || 'HADIR';
    const cycle: Record<AbsensiStatus, AbsensiStatus> = {
      'HADIR': 'SAKIT', 'SAKIT': 'IZIN', 'IZIN': 'ALPA', 'ALPA': 'BOLOS', 'BOLOS': 'HADIR'
    };
    const newRecords = { ...currentRecords, [siswaId]: cycle[currentStatus] };
    updateItem('agmp_absensi', existingRecord.id, { records: newRecords });
  };

  const setAllHadir = () => {
    if (!existingRecord) return;
    const newRecords: Record<string, AbsensiStatus> = {};
    siswaList.forEach(s => newRecords[s.id] = 'HADIR');
    updateItem('agmp_absensi', existingRecord.id, { records: newRecords });
  };

  const getStatusColor = (status: AbsensiStatus) => {
    switch (status) {
      case 'HADIR': return 'bg-[#34C759] text-white';
      case 'SAKIT': return 'bg-[#5856D6] text-white';
      case 'IZIN': return 'bg-[#FF9500] text-white';
      case 'ALPA': return 'bg-[#FF3B30] text-white';
      case 'BOLOS': return 'bg-[#3A3A3C] text-white';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getAvatarColor = (id: string, sId: string) => {
     // rudimentary hashing for stable colors
     const colors = ['bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'];
     const idx = sId.charCodeAt(sId.length-1) % colors.length;
     return colors[idx];
  };

  const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALPA: 0, BOLOS: 0 };
  Object.values(currentRecords).forEach(val => counts[val]++);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Absensi Kelas</h2>
          <p className="text-sm text-gray-500 mt-1">Tap status untuk mengubah. Tap nama untuk menambah catatan/anekdot. {activeTA ? `(TA: ${activeTA.nama} - Smt ${activeTA.semester})` : ''}</p>
        </div>
        <button className="flex items-center gap-1.5 text-sm bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-200">
           <Download className="w-4 h-4" /> Export CSV
        </button>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <input type="date" className="px-3 py-2 border rounded-lg text-sm bg-gray-50" value={tanggal} onChange={e => setTanggal(e.target.value)} />
        <select className="px-3 py-2 border rounded-lg text-sm bg-gray-50" value={kelasId} onChange={e => setKelasId(e.target.value)}>
          {state.agmp_kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        <button onClick={setAllHadir} className="ml-auto flex items-center gap-1.5 text-sm font-semibold bg-[#34C759]/10 text-[#34C759] px-4 py-2 rounded-lg">
           <CheckCircle2 className="w-4 h-4" /> Tandai Semua Hadir
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar text-xs font-semibold">
        <div className="px-3 py-1.5 rounded-full bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20">{counts.HADIR} Hadir</div>
        <div className="px-3 py-1.5 rounded-full bg-[#5856D6]/10 text-[#5856D6] border border-[#5856D6]/20">{counts.SAKIT} Sakit</div>
        <div className="px-3 py-1.5 rounded-full bg-[#FF9500]/10 text-[#FF9500] border border-[#FF9500]/20">{counts.IZIN} Izin</div>
        <div className="px-3 py-1.5 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20">{counts.ALPA} Alpa</div>
        <div className="px-3 py-1.5 rounded-full bg-[#3A3A3C]/10 text-[#3A3A3C] border border-[#3A3A3C]/20">{counts.BOLOS} Bolos</div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sortedSiswaList.map(s => {
          const status = currentRecords[s.id] || 'HADIR';
          const hasAbsenNote = !!(existingRecord?.catatan?.[s.id]);
          const anekdotCount = state.agmp_anekdot.filter(a => a.siswaId === s.id).length;
          
          return (
            <div 
              key={s.id} 
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm transition-all"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 cursor-pointer ${getAvatarColor(s.id, s.id)}`}
                onClick={() => setSelectedSiswaId(s.id)}
              >
                {getInitials(s.nama)}
              </div>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelectedSiswaId(s.id)}>
                <div className="flex items-center gap-1.5">
                   <p className="font-semibold text-sm text-gray-900 truncate">{s.nama}</p>
                   {(hasAbsenNote || anekdotCount > 0) && <MessageSquare className="w-3 h-3 text-blue-500" />}
                </div>
                <p className="text-[10px] text-gray-500">{s.nisn}</p>
              </div>
              <button 
                onClick={() => handleToggle(s.id)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide active:scale-95 transition-transform ${getStatusColor(status)}`}
              >
                {status}
              </button>
            </div>
          )
        })}
      </div>
      {siswaList.length === 0 && (
         <div className="text-center py-10 text-gray-500">Pilih kelas yang memiliki murid.</div>
      )}

      {/* Modal / Slider for Detail Siswa */}
      {selectedSiswaId && (
        <DetailSiswaModal 
           siswaId={selectedSiswaId} 
           onClose={() => setSelectedSiswaId(null)} 
           existingRecord={existingRecord}
        />
      )}
    </div>
  );
}

function DetailSiswaModal({ siswaId, onClose, existingRecord }: { siswaId: string, onClose: () => void, existingRecord: any }) {
  const { state, updateItem, addItem, showToast } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const siswa = state.agmp_siswa.find(s => s.id === siswaId);
  const anekdotHistory = state.agmp_anekdot.filter(a => a.siswaId === siswaId && (a.taId === activeTaId || !a.taId)).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  
  const [absenNote, setAbsenNote] = useState(existingRecord?.catatan?.[siswaId] || '');
  const [anekdotBaru, setAnekdotBaru] = useState('');

  const saveAbsenNote = () => {
    if (!existingRecord) return;
    const newNotes = { ...(existingRecord.catatan || {}), [siswaId]: absenNote };
    updateItem('agmp_absensi', existingRecord.id, { catatan: newNotes });
    showToast('Catatan absensi tersimpan.', 'success');
  };

  const saveAnekdot = () => {
    if (!anekdotBaru.trim()) return;
    if (!activeTaId) {
      showToast('Tidak ada Tahun Ajaran yang aktif!', 'error');
      return;
    }
    addItem('agmp_anekdot', {
      id: generateId(),
      taId: activeTaId,
      siswaId,
      tanggal: new Date().toISOString(),
      teks: anekdotBaru
    });
    setAnekdotBaru('');
  };

  if (!siswa) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right">
        <div className="flex justify-between items-center p-4 border-b">
           <div>
             <h3 className="font-bold text-gray-900">{siswa.nama}</h3>
             <p className="text-xs text-gray-500">Detail & Catatan</p>
           </div>
           <button onClick={onClose} className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200">
             <X className="w-4 h-4" />
           </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
           <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Catatan Kehadiran Hari Ini</h4>
             <textarea 
                className="w-full text-sm p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-100 outline-none"
                rows={2}
                placeholder="Misal: Datang terlambat 15 menit..."
                value={absenNote}
                onChange={e => setAbsenNote(e.target.value)}
             />
             <div className="flex justify-end mt-2">
               <button onClick={saveAbsenNote} className="text-xs bg-blue-100 text-blue-700 font-bold px-3 py-1.5 rounded-lg hover:bg-blue-200">Simpan Catatan</button>
             </div>
           </div>

           <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100">
             <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Catatan Anekdot (Sikap/Perilaku)</h4>
             <textarea 
                className="w-full text-sm p-3 border rounded-lg resize-none focus:ring-2 focus:ring-orange-100 outline-none"
                rows={3}
                placeholder="Tulis catatan sikap positif/negatif siswa hari ini..."
                value={anekdotBaru}
                onChange={e => setAnekdotBaru(e.target.value)}
             />
             <div className="flex justify-end mt-2">
               <button onClick={saveAnekdot} disabled={!anekdotBaru.trim()} className="flex items-center gap-1 text-xs bg-orange-500 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                 <Plus className="w-3 h-3" /> Tambah Anekdot
               </button>
             </div>
           </div>

           <div>
             <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Riwayat Catatan Anekdot {activeTA ? `(TA: ${activeTA.nama})` : ''}</h4>
             <div className="space-y-3">
               {anekdotHistory.length === 0 ? (
                 <p className="text-xs text-gray-400 italic text-center py-4 bg-gray-50 rounded-lg">Belum ada catatan anekdot.</p>
               ) : (
                 anekdotHistory.map(a => (
                   <div key={a.id} className="p-3 border rounded-xl bg-white shadow-sm">
                     <p className="text-[10px] text-gray-400 font-medium mb-1">{new Date(a.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit'})}</p>
                     <p className="text-sm text-gray-700">{a.teks}</p>
                   </div>
                 ))
               )}
             </div>
           </div>
        </div>
      </div>
    </div>
  )
}
