import { useState, useMemo } from 'react';
import { Target, BookOpen, AlertTriangle, Save, Info, Plus, Trash2 } from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateId, getInitials } from '@/lib/utils';
import { TP, Siswa } from '@/lib/types';

export default function Formatif() {
  const { state, addItem, updateItem, showToast } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [activeTab, setActiveTab] = useState<'awal' | 'tengah'>('awal');
  const [kelasId, setKelasId] = useState(state.agmp_kelas[0]?.id || '');
  const [tpIdState, setTpIdState] = useState('');
  
  const [teknikAwal, setTeknikAwal] = useState('Pertanyaan Pemantik');
  const [teknikTengah, setTeknikTengah] = useState('Exit Ticket');

  const siswaList = state.agmp_siswa.filter(s => s.kelasId === kelasId).sort((a,b) => a.nama.localeCompare(b.nama));
  const tpList = state.agmp_tp.filter(t => t.kelasIds.includes(kelasId));

  // Determine actual selected TP id (resolving ESLint direct setState loop)
  const tpId = tpList.find(t => t.id === tpIdState) ? tpIdState : (tpList[0]?.id || '');

  // Cari existing formatif record for this TP and type
  const existingFormatif = state.agmp_formatif.find(
    f => f.jurnalId === `${kelasId}_${tpId}` && f.jenis === (activeTab === 'awal' ? 'AWAL' : 'TENGAH') && (activeTaId ? f.taId === activeTaId : true)
  );

  // Derive initial values from existing record
  const initialHasil = existingFormatif?.hasil || {};
  
  // Local state for results
  const [hasilState, setHasilState] = useState<Record<string, { status: string; catatan: string; anekdots?: { id: string, kategori: string, teks: string, tanggal?: string }[] }>>({});
  const [editedRecordId, setEditedRecordId] = useState<string | null>(null);

  // Sync edits if different record
  const currentRecordId = existingFormatif?.id || `${kelasId}_${tpId}_${activeTab}`;
  const hasil = currentRecordId === editedRecordId ? hasilState : initialHasil;

  const handleSetHasil = (updater: any) => {
    if (currentRecordId !== editedRecordId) {
      setEditedRecordId(currentRecordId);
      setHasilState(updater(initialHasil));
    } else {
      setHasilState(updater);
    }
  };

  const handleSetStatus = (siswaId: string, status: string) => {
    handleSetHasil((prev: any) => ({
      ...prev,
      [siswaId]: {
        ...prev[siswaId],
        status
      }
    }));
  };

  const handleSetCatatan = (siswaId: string, catatan: string) => {
    handleSetHasil((prev: any) => ({
      ...prev,
      [siswaId]: {
        ...(prev[siswaId] || {}),
        catatan,
        status: prev[siswaId]?.status || ''
      }
    }));
  };

  const handleAddAnekdot = (siswaId: string) => {
    handleSetHasil((prev: any) => {
      const studentData = prev[siswaId] || { status: '', catatan: '' };
      const currentAnekdots = studentData.anekdots || [];
      const today = new Date().toISOString().split("T")[0];
      return {
        ...prev,
        [siswaId]: {
          ...studentData,
          anekdots: [...currentAnekdots, { id: generateId(), kategori: 'Akademik', teks: '', tanggal: today }]
        }
      };
    });
  };

  const handleUpdateAnekdot = (siswaId: string, idx: number, key: 'kategori' | 'teks' | 'tanggal', val: string) => {
    handleSetHasil((prev: any) => {
      const studentData = prev[siswaId];
      if (!studentData || !studentData.anekdots) return prev;
      const newAnekdots = [...studentData.anekdots];
      newAnekdots[idx] = { ...newAnekdots[idx], [key]: val };
      return {
        ...prev,
        [siswaId]: {
          ...studentData,
          anekdots: newAnekdots
        }
      };
    });
  };

  const handleRemoveAnekdot = (siswaId: string, idx: number) => {
    handleSetHasil((prev: any) => {
      const studentData = prev[siswaId];
      if (!studentData || !studentData.anekdots) return prev;
      const newAnekdots = [...studentData.anekdots];
      newAnekdots.splice(idx, 1);
      return {
        ...prev,
        [siswaId]: {
          ...studentData,
          anekdots: newAnekdots
        }
      };
    });
  };

  const handleSave = () => {
    if (!tpId) return;
    if (!activeTaId) {
      showToast('Tidak ada Tahun Ajaran yang aktif!', 'error');
      return;
    }
    
    if (existingFormatif) {
      updateItem('agmp_formatif', existingFormatif.id, { 
        hasil: hasil,
        teknik: activeTab === 'awal' ? teknikAwal : teknikTengah
      });
    } else {
      addItem('agmp_formatif', {
        id: generateId(),
        taId: activeTaId,
        jurnalId: `${kelasId}_${tpId}`, // Using combination as JurnalId for now
        jenis: activeTab === 'awal' ? 'AWAL' : 'TENGAH',
        teknik: activeTab === 'awal' ? teknikAwal : teknikTengah,
        hasil: hasil
      });
    }
    showToast('Penilaian formatif berhasil disimpan!', 'success');
  };

  const awalOptions = [
    { label: 'Perlu Bimbingan', value: 'Perlu Bimbingan', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', active: 'bg-yellow-500 text-white' },
    { label: 'Siap Belajar', value: 'Siap Belajar', color: 'bg-green-100 text-green-700 border-green-200', active: 'bg-green-500 text-white' }
  ];

  const tengahOptions = [
    { label: '😟 1', value: '1', color: 'bg-gray-100 text-gray-700', active: 'bg-red-500 text-white' },
    { label: '😐 2', value: '2', color: 'bg-gray-100 text-gray-700', active: 'bg-orange-500 text-white' },
    { label: '🙂 3', value: '3', color: 'bg-gray-100 text-gray-700', active: 'bg-blue-500 text-white' },
    { label: '🤩 4', value: '4', color: 'bg-gray-100 text-gray-700', active: 'bg-green-500 text-white' }
  ];

  // Stats calculation
  const totalSiswa = siswaList.length;
  let kesiapanPersen = 0;
  if (activeTab === 'awal' && totalSiswa > 0) {
    const siapBelajar = Object.values(hasil).filter((h: any) => h.status === 'Siap Belajar').length;
    kesiapanPersen = Math.round((siapBelajar / totalSiswa) * 100);
  }

  let persenBaik = 0;
  let persenPerhatian = 0;
  if (activeTab === 'tengah' && totalSiswa > 0) {
    const tingkat34 = Object.values(hasil).filter((h: any) => h.status === '3' || h.status === '4').length;
    const tingkat12 = Object.values(hasil).filter((h: any) => h.status === '1' || h.status === '2').length;
    persenBaik = Math.round((tingkat34 / totalSiswa) * 100);
    persenPerhatian = Math.round((tingkat12 / totalSiswa) * 100);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asesmen Formatif (Low Stake)</h2>
          <p className="text-sm text-gray-500 mt-1">Cek penguasaan kognitif tiap siswa tanpa nilai di rapor.</p>
        </div>
        <button onClick={handleSave} className="flex items-center gap-1.5 text-sm bg-[#007AFF] text-white px-4 py-2 rounded-lg hover:bg-blue-600 shadow-sm transition-colors">
           <Save className="w-4 h-4" /> Simpan Data
        </button>
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <select 
          className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[200px]"
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value)}
        >
          {state.agmp_kelas.map(k => <option key={k.id} value={k.id}>Kelas {k.nama}</option>)}
        </select>
        
        <select 
          className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[200px]"
          value={tpId}
          onChange={(e) => setTpIdState(e.target.value)}
        >
          <option value="" disabled>Pilih TP</option>
          {tpList.map(t => <option key={t.id} value={t.id}>TP {t.kode}</option>)}
        </select>
      </div>

      <div className="flex bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('awal')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'awal' ? 'bg-white shadow-sm text-[#007AFF]' : 'text-gray-500'}`}
        >
          <Target className="w-4 h-4" /> Cek Awal (Diagnostic)
        </button>
        <button
          onClick={() => setActiveTab('tengah')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'tengah' ? 'bg-white shadow-sm text-[#007AFF]' : 'text-gray-500'}`}
        >
          <BookOpen className="w-4 h-4" /> Cek Tengah (Monitoring)
        </button>
      </div>

      {activeTab === 'awal' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
           <div>
             <h3 className="font-bold text-gray-900 mb-2">Pilih Teknik Evaluasi</h3>
             <div className="flex flex-wrap gap-2">
               {['Pertanyaan Pemantik', 'Kuis Singkat', 'Observasi Kesiapan'].map(tek => (
                 <button
                   key={tek}
                   onClick={() => setTeknikAwal(tek)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${teknikAwal === tek ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                 >
                   {tek}
                 </button>
               ))}
             </div>
             
             {teknikAwal === 'Pertanyaan Pemantik' && <p className="text-xs text-gray-500 mt-2 italic">Gunakan 3 pertanyaan lisan tentang materi sebelumnya untuk cek ingatan siswa.</p>}
             {teknikAwal === 'Kuis Singkat' && <p className="text-xs text-gray-500 mt-2 italic">Berikan 3 soal pilihan ganda atau format benar/salah secara lisan/tulisan.</p>}
             {teknikAwal === 'Observasi Kesiapan' && <p className="text-xs text-gray-500 mt-2 italic">Ceklis cepat dari meja guru: bawa buku materi, fokus pandangan, dan gestur siap belajar.</p>}
           </div>

           <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
             <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-gray-700">Persentase Kesiapan Kelas ({totalSiswa} Siswa)</span>
                <span className={`text-xl font-bold ${kesiapanPersen >= 50 ? 'text-green-600' : 'text-orange-500'}`}>{kesiapanPersen}%</span>
             </div>
             <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div className={`h-2.5 rounded-full transition-all ${kesiapanPersen >= 50 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${kesiapanPersen}%` }}></div>
             </div>
             
             {kesiapanPersen < 50 && totalSiswa > 0 && Object.keys(hasil).length > 0 && (
                <div className="mt-3 bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-orange-800">Warning</p>
                    <p className="text-xs text-orange-700">Lebih dari separuh kelas belum siap. Pertimbangkan strategi diferensiasi, ice breaking, atau ulas ulang materi prasyarat.</p>
                  </div>
                </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'tengah' && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
           <div>
             <h3 className="font-bold text-gray-900 mb-2">Pilih Teknik Evaluasi</h3>
             <div className="flex flex-wrap gap-2">
               {['Exit Ticket', 'Minute Paper', 'Muddiest Point', 'Catatan Anekdot', 'Self/Peer Assessment'].map(tek => (
                 <button
                   key={tek}
                   onClick={() => setTeknikTengah(tek)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${teknikTengah === tek ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                 >
                   {tek}
                 </button>
               ))}
             </div>
           </div>

           {teknikTengah === 'Exit Ticket' && (
             <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                <h4 className="text-sm font-bold text-purple-900 flex items-center gap-2 mb-2"><Info className="w-4 h-4" /> Instruksi Exit Ticket (Tampilkan di Papan Tulis)</h4>
                <ul className="text-xs text-purple-800 space-y-1 list-disc pl-4">
                  <li>Pertanyaan 1: &quot;Apa yang paling kamu pahami hari ini?&quot;</li>
                  <li>Pertanyaan 2: &quot;Bagian mana yang masih membuatmu bingung?&quot;</li>
                  <li>Pertanyaan 3: &quot;Berapa tingkat kepercayaan dirimu pada materi ini? (Pilih 1-4)&quot;</li>
                </ul>
                <p className="text-xs text-purple-600 mt-2 italic">*Kumpulkan jawaban siswa dan catat tingkat kepercayaan mereka di bawah.</p>
             </div>
           )}

           <div className="flex gap-4">
             <div className="flex-1 bg-green-50 border border-green-100 p-3 rounded-xl flex items-center gap-3">
                <div className="text-2xl font-bold text-green-700">{persenBaik}%</div>
                <div className="text-xs text-green-800 leading-tight">Murid paham materi<br/>& percaya diri (Level 3-4).</div>
             </div>
             <div className="flex-1 bg-red-50 border border-red-100 p-3 rounded-xl flex items-center gap-3">
                <div className="text-2xl font-bold text-red-700">{persenPerhatian}%</div>
                <div className="text-xs text-red-800 leading-tight">Perlu bantuan intensif<br/>pada pertemuan berikutnya (Level 1-2).</div>
             </div>
           </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-900">
            Input {activeTab === 'awal' ? 'Kesiapan Belajar' : 'Tingkat Pemahaman'}
          </h3>
          <span className="text-[10px] text-gray-500 font-medium uppercase tracking-widest bg-white px-2 py-1 rounded border">Tidak Masuk Rapor</span>
        </div>
        
        <div className="divide-y divide-gray-100">
          {siswaList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Tidak ada siswa di kelas ini.</div>
          ) : !tpId ? (
            <div className="p-8 text-center text-gray-500">Silakan pilih TP terlebih dahulu.</div>
          ) : (
            siswaList.map(s => {
              const currentStatus = hasil[s.id]?.status;
              const currentCatatan = hasil[s.id]?.catatan || '';
              const options = activeTab === 'awal' ? awalOptions : tengahOptions;

              return (
                <div key={s.id} className="p-4 sm:flex items-start gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3 w-48 shrink-0 mb-3 sm:mb-0">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-[#007AFF] flex items-center justify-center text-xs font-bold shrink-0">
                      {getInitials(s.nama)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{s.nama}</p>
                      <p className="text-[10px] text-gray-500 truncate">{s.nisn}</p>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    {!(activeTab === 'tengah' && teknikTengah === 'Catatan Anekdot') ? (
                      <div className="flex flex-wrap gap-2">
                         {options.map(opt => (
                           <button
                             key={opt.value}
                             onClick={() => handleSetStatus(s.id, opt.value)}
                             className={`px-3 py-1.5 border rounded-lg text-xs font-bold transition-colors ${currentStatus === opt.value ? opt.active : opt.color}`}
                           >
                             {opt.label}
                           </button>
                         ))}
                      </div>
                    ) : null}
                    
                    {activeTab === 'tengah' && teknikTengah === 'Catatan Anekdot' ? (
                      <div className="space-y-2">
                        {(hasil[s.id]?.anekdots || []).map((anekdot: any, idx: number) => (
                          <div key={anekdot.id} className="flex gap-2 items-center">
                            <input 
                              type="date"
                              className="text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white"
                              value={anekdot.tanggal || ''}
                              onChange={(e) => handleUpdateAnekdot(s.id, idx, 'tanggal', e.target.value)}
                            />
                            <select 
                              className="text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white"
                              value={anekdot.kategori}
                              onChange={(e) => handleUpdateAnekdot(s.id, idx, 'kategori', e.target.value)}
                            >
                              <option value="Akademik">Akademik</option>
                              <option value="Sikap">Sikap</option>
                              <option value="Kehadiran">Kehadiran</option>
                            </select>
                            <input 
                              type="text" 
                              placeholder="Ketik catatan..."
                              className="flex-1 text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 bg-white" 
                              value={anekdot.teks}
                              onChange={(e) => handleUpdateAnekdot(s.id, idx, 'teks', e.target.value)}
                            />
                            <button onClick={() => handleRemoveAnekdot(s.id, idx)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        <button 
                          onClick={() => handleAddAnekdot(s.id)} 
                          className="flex items-center gap-1 text-xs text-[#007AFF] font-medium hover:bg-blue-50 px-2 py-1 rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" /> Tambah Catatan
                        </button>
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={activeTab === 'awal' ? "Catatan kesiapan (opsional)..." : "Catatan: Bagian yang membingungkan / catatan (opsional)..."}
                        className="w-full text-xs px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-300 focus:ring-1 focus:ring-blue-300 transition-shadow bg-white"
                        value={currentCatatan}
                        onChange={(e) => handleSetCatatan(s.id, e.target.value)}
                      />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

