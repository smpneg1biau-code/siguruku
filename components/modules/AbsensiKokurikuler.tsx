import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { AbsensiStatus } from '@/lib/types';
import { generateId, getInitials } from '@/lib/utils';
import { CheckCircle2, Download, X, QrCode } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function AbsensiKokurikuler() {
  const { state, addItem, updateItem, showToast , filteredKelas } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [tanggal, setTanggal] = useState(new Date().toISOString().split('T')[0]);
  
  const kegiatanList = state.agmp_kegiatan_kokurikuler || [];
  const [kegiatanId, setKegiatanId] = useState(kegiatanList[0]?.id || '');
  
  const selectedKegiatan = kegiatanList.find(k => k.id === kegiatanId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const availableKelasIds = selectedKegiatan?.kelasIds || [];
  const kelasList = filteredKelas.filter(k => availableKelasIds.includes(k.id));
  
  const [kelasId, setKelasId] = useState(kelasList[0]?.id || '');
  
  useEffect(() => {
    if (kelasList.length > 0 && !availableKelasIds.includes(kelasId)) {
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setKelasId(kelasList[0].id);
    } else if (kelasList.length === 0) {
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
      setKelasId('');
    }
  }, [kegiatanId, kelasList, availableKelasIds, kelasId]);

  const [isScanning, setIsScanning] = useState(false);
  
  // Find or create record for today & class & kegiatan
  const existingRecord = state.agmp_absensi_kokurikuler?.find(a => 
    a.tanggal === tanggal && 
    a.kelasId === kelasId && 
    a.kegiatanId === kegiatanId &&
    (activeTaId ? (a.taId === activeTaId || !a.taId) : true)
  );

  const [localRecords, setLocalRecords] = useState<Record<string, AbsensiStatus>>({});

  useEffect(() => {
    if (!existingRecord && kelasId && kegiatanId && activeTaId) {
       // Initialize all to Hadir if doesn't exist when we load this view
       const siswaList = state.agmp_siswa.filter(s => s.kelasId === kelasId);
       if(siswaList.length > 0) {
           const records: Record<string, AbsensiStatus> = {};
           siswaList.forEach(s => records[s.id] = 'HADIR');
           addItem('agmp_absensi_kokurikuler', { id: generateId(), taId: activeTaId, tanggal, kelasId, kegiatanId, records }, true);
           
           // eslint-disable-next-line react-hooks/set-state-in-effect
           setLocalRecords(records);
       }
    } else if (existingRecord) {
       
       // eslint-disable-next-line react-hooks/set-state-in-effect
       setLocalRecords(existingRecord.records || {});
    }
  }, [tanggal, kelasId, kegiatanId, existingRecord, addItem, state.agmp_siswa, activeTaId]);

  const siswaList = state.agmp_siswa.filter(s => s.kelasId === kelasId);
  const sortedSiswaList = [...siswaList].sort((a, b) => a.nama.localeCompare(b.nama));
  const currentRecords = localRecords;

  const handleToggle = (siswaId: string) => {
    if (!existingRecord) return;
    const currentStatus = currentRecords[siswaId] || 'HADIR';
    const cycle: Record<AbsensiStatus, AbsensiStatus> = {
      'HADIR': 'SAKIT', 'SAKIT': 'IZIN', 'IZIN': 'ALPA', 'ALPA': 'BOLOS', 'BOLOS': 'HADIR'
    };
    const newRecords = { ...currentRecords, [siswaId]: cycle[currentStatus] };
    setLocalRecords(newRecords);
  };

  const setAllHadir = () => {
    if (!existingRecord) return;
    const newRecords: Record<string, AbsensiStatus> = {};
    siswaList.forEach(s => newRecords[s.id] = 'HADIR');
    setLocalRecords(newRecords);
  };

  const simpanAbsensi = () => {
    if (!existingRecord) return;
    updateItem('agmp_absensi_kokurikuler', existingRecord.id, { records: localRecords }, false);
    showToast('Kehadiran kokurikuler berhasil disimpan', 'success');
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
     const colors = ['bg-orange-100 text-orange-700', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-pink-100 text-pink-700'];
     const idx = sId.charCodeAt(sId.length-1) % colors.length;
     return colors[idx];
  };

  const counts = { HADIR: 0, SAKIT: 0, IZIN: 0, ALPA: 0, BOLOS: 0 };
  Object.values(currentRecords).forEach(val => counts[val]++);

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
      const scannedNISN = detectedCodes[0].rawValue;
      const siswa = siswaList.find(s => s.nisn === scannedNISN);
      if (siswa) {
        setLocalRecords(prev => ({ ...prev, [siswa.id]: 'HADIR' }));
        showToast(`Berhasil mencatat kehadiran: ${siswa.nama}`, 'success');
      } else {
        showToast(`Siswa dengan NISN ${scannedNISN} tidak ditemukan di kelas ini.`, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kehadiran Kokurikuler</h2>
          <p className="text-sm text-gray-500 mt-1">Pilih kegiatan dan kelas untuk mencatat kehadiran kokurikuler.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsScanning(!isScanning)}
            className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
              isScanning ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
             {isScanning ? <><X className="w-4 h-4" /> Tutup Scanner</> : <><QrCode className="w-4 h-4" /> Mode Scan QR</>}
          </button>
        </div>
      </header>

      {isScanning && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-gray-800">Scan QR Code Siswa</h3>
            <p className="text-sm text-gray-500">Arahkan kamera ke QR Code (NISN) siswa untuk mencatat kehadiran.</p>
          </div>
          <div className="w-full max-w-sm rounded-xl overflow-hidden border-4 border-gray-100">
            <Scanner onScan={handleScan} />
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input type="date" className="px-3 py-2 border rounded-lg text-sm bg-gray-50 min-w-[140px]" value={tanggal} onChange={e => setTanggal(e.target.value)} />
        
        <select className="px-3 py-2 border rounded-lg text-sm bg-gray-50 flex-1 min-w-[200px]" value={kegiatanId} onChange={e => setKegiatanId(e.target.value)}>
          {kegiatanList.length === 0 && <option value="">Belum ada Kegiatan</option>}
          {kegiatanList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>

        <select className="px-3 py-2 border rounded-lg text-sm bg-gray-50 min-w-[120px]" value={kelasId} onChange={e => setKelasId(e.target.value)}>
          {kelasList.length === 0 && <option value="">Pilih Kegiatan Dulu</option>}
          {kelasList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
        </select>
        
        <div className="flex gap-2 ml-auto">
          <button onClick={setAllHadir} className="flex items-center gap-1.5 text-sm font-semibold bg-[#34C759]/10 text-[#34C759] px-4 py-2 rounded-lg whitespace-nowrap">
             <CheckCircle2 className="w-4 h-4" /> Tandai Semua Hadir
          </button>
          <button onClick={simpanAbsensi} className="flex items-center gap-1.5 text-sm font-semibold bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 whitespace-nowrap">
             Simpan Kehadiran
          </button>
        </div>
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
          
          return (
            <div 
              key={s.id} 
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm transition-all"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${getAvatarColor(s.id, s.id)}`}
              >
                {getInitials(s.nama)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                   <p className="font-semibold text-sm text-gray-900 truncate">{s.nama}</p>
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
         <div className="text-center py-10 text-gray-500">Pilih kegiatan dan kelas yang memiliki murid.</div>
      )}
    </div>
  );
}
