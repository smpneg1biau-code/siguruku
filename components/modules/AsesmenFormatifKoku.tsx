import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, ArrowLeft, MessageSquare, History, CheckCircle, Clock, FileText, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { AsesmenFormatifKoku as FormatifType } from "@/lib/types";

export default function AsesmenFormatifKoku() {
  const { state, addItem, updateItem, deleteItem, showToast, filteredKelas } = useStore();
  
  const activeTA = state.agmp_tahun_ajaran?.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';
  
  const temaList = state.agmp_tema_kokurikuler || [];
  const kegiatanList = state.agmp_kegiatan_kokurikuler || [];
  const kelasList = filteredKelas || [];
  const siswaList = state.agmp_siswa || [];
  const dimensiList = state.agmp_dimensi || [];
  const formatifList = state.agmp_asesmen_formatif_koku || [];

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTemaId, setSelectedTemaId] = useState("");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState("");
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [selectedSiswaId, setSelectedSiswaId] = useState("");
  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split('T')[0]);

  const filteredKegiatan = useMemo(() => {
    if (!selectedTemaId) return [];
    return kegiatanList.filter(k => k.temaId === selectedTemaId);
  }, [kegiatanList, selectedTemaId]);

  const kegiatanDetails = useMemo(() => {
    return kegiatanList.find(k => k.id === selectedKegiatanId);
  }, [kegiatanList, selectedKegiatanId]);

  const availableKelasIds = kegiatanDetails?.kelasIds || [];
  const validKelas = kelasList.filter(k => availableKelasIds.includes(k.id));

  const filteredSiswa = useMemo(() => {
    if (!selectedKelasId) return [];
    return siswaList.filter(s => s.kelasId === selectedKelasId).sort((a,b) => a.nama.localeCompare(b.nama));
  }, [siswaList, selectedKelasId]);

  const targetDimensiIds = useMemo(() => {
    if (!kegiatanDetails) return [];
    return kegiatanDetails.capaianProfil?.map(c => c.dimensiId) || [];
  }, [kegiatanDetails]);

  const targetDimensiList = dimensiList.filter(d => targetDimensiIds.includes(d.id));

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formDimensiId, setFormDimensiId] = useState("");
  const [formCatatan, setFormCatatan] = useState("");
  const [formStatus, setFormStatus] = useState<"Muncul" | "Belum Muncul">("Muncul");
  const [formUmpanBalik, setFormUmpanBalik] = useState("");
  const [formRefleksi, setFormRefleksi] = useState("");
  
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  const formatifSiswaList = useMemo(() => {
    if (!selectedSiswaId || !selectedKegiatanId) return [];
    return formatifList.filter(f => 
      f.siswaId === selectedSiswaId && 
      f.kegiatanId === selectedKegiatanId &&
      (activeTaId ? (f.taId === activeTaId || !f.taId) : true)
    ).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }, [formatifList, selectedSiswaId, selectedKegiatanId, activeTaId]);

  const handleNextStep1 = () => {
    if (!selectedTemaId || !selectedKegiatanId || !selectedKelasId) {
      showToast("Pilih Tema, Kegiatan, dan Kelas terlebih dahulu", "error");
      return;
    }
    setStep(2);
  };

  const handleSelectSiswa = (siswaId: string) => {
    setSelectedSiswaId(siswaId);
    setStep(3);
  };

  const resetForm = () => {
    setFormTanggal(selectedTanggal);
    setFormDimensiId("");
    setFormCatatan("");
    setFormStatus("Muncul");
    setFormUmpanBalik("");
    setFormRefleksi("");
    setEditingId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsInputModalOpen(true);
  };

  const handleOpenEdit = (f: FormatifType) => {
    setFormTanggal(f.tanggal);
    setFormDimensiId(f.dimensiId);
    setFormCatatan(f.catatan);
    setFormStatus(f.statusProgres || "Muncul");
    setFormUmpanBalik(f.umpanBalik || "");
    setFormRefleksi(f.refleksiMurid || "");
    setEditingId(f.id);
    setIsInputModalOpen(true);
  };

  const handleSaveFormatif = async () => {
    if (!formTanggal || !formDimensiId || !formCatatan) {
      showToast("Tanggal, Dimensi, dan Catatan wajib diisi", "error");
      return;
    }

    const payload = {
      kegiatanId: selectedKegiatanId,
      kelasId: selectedKelasId,
      siswaId: selectedSiswaId,
      dimensiId: formDimensiId,
      tanggal: formTanggal,
      catatan: formCatatan,
      statusProgres: formStatus,
      umpanBalik: formUmpanBalik,
      refleksiMurid: formRefleksi,
      taId: activeTaId || ""
    };

    try {
      if (editingId) {
        await updateItem("agmp_asesmen_formatif_koku", editingId, payload);
        showToast("Asesmen berhasil diperbarui", "success");
      } else {
        await addItem("agmp_asesmen_formatif_koku", { id: generateId(), ...payload });
        showToast("Asesmen berhasil ditambahkan", "success");
      }
      setIsInputModalOpen(false);
      resetForm();
    } catch (error) {
      // handled by store
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus catatan observasi ini?")) {
      await deleteItem("agmp_asesmen_formatif_koku", id);
    }
  };
  
  const generateDraft = () => {
    if (formatifSiswaList.length === 0) return "Belum ada data observasi formatif.";
    
    // Group by Dimensi
    const dimGroups: Record<string, FormatifType[]> = {};
    formatifSiswaList.forEach(f => {
      if (!dimGroups[f.dimensiId]) dimGroups[f.dimensiId] = [];
      dimGroups[f.dimensiId].push(f);
    });
    
    let draft = "";
    Object.keys(dimGroups).forEach(dimId => {
      const dim = dimensiList.find(d => d.id === dimId);
      const records = dimGroups[dimId];
      const munculCount = records.filter(r => r.statusProgres === "Muncul").length;
      
      draft += `Terkait Dimensi ${dim?.nama || 'Unknown'}:\n`;
      if (munculCount > 0) {
        draft += `Murid menunjukkan perkembangan positif dan indikator mulai muncul secara konsisten dalam aktivitas. `;
      } else {
        draft += `Murid masih membutuhkan bimbingan lebih lanjut untuk memunculkan indikator profil ini. `;
      }
      draft += `Hal ini terlihat dari beberapa catatan observasi: ${records.slice(0, 2).map(r => r.catatan).join("; ")}.\n\n`;
    });
    
    return draft;
  };

  const selectedSiswa = siswaList.find(s => s.id === selectedSiswaId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asesmen Formatif</h2>
          <p className="text-sm text-gray-500 mt-1">Pemantauan dan jurnal observasi kegiatan kokurikuler.</p>
        </div>
      </header>

      {/* Breadcrumb / Step Indicator */}
      <div className="flex items-center gap-2 text-sm text-gray-500 font-medium bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm overflow-x-auto whitespace-nowrap">
        <button 
          onClick={() => setStep(1)} 
          className={`${step === 1 ? 'text-blue-600' : 'hover:text-gray-900'}`}
        >
          1. Pilih Modul
        </button>
        <span>/</span>
        <button 
          onClick={() => step > 1 ? setStep(2) : null} 
          className={`${step === 2 ? 'text-blue-600' : step > 2 ? 'hover:text-gray-900' : 'text-gray-400 cursor-not-allowed'}`}
          disabled={step < 2}
        >
          2. Pilih Murid
        </button>
        <span>/</span>
        <span className={`${step === 3 ? 'text-blue-600' : 'text-gray-400'}`}>
          3. Observasi
        </span>
      </div>

      {step === 1 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-lg font-bold text-gray-900">Pilih Modul Aktif</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
              <select
                value={selectedTemaId}
                onChange={(e) => {
                  setSelectedTemaId(e.target.value);
                  setSelectedKegiatanId("");
                  setSelectedKelasId("");
                }}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Pilih Tema --</option>
                {temaList.map(t => <option key={t.id} value={t.id}>{t.nama}</option>)}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kegiatan</label>
              <select
                value={selectedKegiatanId}
                onChange={(e) => {
                  setSelectedKegiatanId(e.target.value);
                  setSelectedKelasId("");
                }}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                disabled={!selectedTemaId}
              >
                <option value="">-- Pilih Kegiatan --</option>
                {filteredKegiatan.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Kelas</label>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                disabled={!selectedKegiatanId}
              >
                <option value="">-- Pilih Kelas --</option>
                {validKelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
          </div>
          
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={handleNextStep1}
              className="bg-[#007AFF] text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
            >
              Lanjut Pilih Murid
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Daftar Murid</h3>
              <p className="text-sm text-gray-500">Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama || '-'}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} /> Kembali
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSiswa.map(siswa => {
              const studentRecords = formatifList.filter(f => 
                f.siswaId === siswa.id && 
                f.kegiatanId === selectedKegiatanId &&
                (activeTaId ? (f.taId === activeTaId || !f.taId) : true)
              );
              const recordCount = studentRecords.length;
              const hasRecordToday = studentRecords.some(f => f.tanggal === selectedTanggal);
              
              return (
                <div 
                  key={siswa.id} 
                  onClick={() => handleSelectSiswa(siswa.id)}
                  className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group bg-gray-50 hover:bg-blue-50/30"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{siswa.nama}</h4>
                    <p className="text-xs text-gray-500">NISN: {siswa.nisn}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasRecordToday ? (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock size={10} /> Belum
                      </span>
                    )}
                    {recordCount > 0 && (
                      <span className="text-[10px] text-gray-500 font-medium">Total: {recordCount} Obs</span>
                    )}
                  </div>
                </div>
              );
            })}
            {filteredSiswa.length === 0 && (
              <div className="col-span-full py-10 text-center text-gray-500">
                Belum ada data murid di kelas ini.
              </div>
            )}
          </div>
        </div>
      )}

      {step === 3 && selectedSiswa && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{selectedSiswa.nama}</h3>
                <p className="text-sm text-gray-500">NISN: {selectedSiswa.nisn} | Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsDraftModalOpen(true)}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <FileText size={16} /> Draft Rapor
              </button>
              <button
                onClick={handleOpenAdd}
                className="flex items-center gap-2 bg-[#007AFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} /> Input Observasi
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
              <History size={18} className="text-blue-500" /> Linimasa Jurnal Observasi (Catatan Anekdotal)
            </h4>
            
            {formatifSiswaList.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">Belum ada catatan observasi.</p>
                <p className="text-sm text-gray-400 mt-1">Mulai lakukan observasi pada murid ini saat kegiatan berlangsung.</p>
              </div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
                {formatifSiswaList.map((f, i) => {
                  const dim = dimensiList.find(d => d.id === f.dimensiId);
                  return (
                    <div key={f.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-blue-100 text-blue-600 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 absolute left-0 md:left-1/2 -translate-x-1/2">
                        <Clock size={16} />
                      </div>
                      
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ml-12 md:ml-0">
                        <div className="flex justify-between items-start mb-2">
                          <div className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                            {new Date(f.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => handleOpenEdit(f)} className="text-gray-400 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
                            <button onClick={() => handleDelete(f.id)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <span className="inline-block bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 mb-1">
                            {dim?.nama || "Dimensi Tidak Diketahui"}
                          </span>
                          <span className={`ml-2 inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${f.statusProgres === 'Muncul' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                            {f.statusProgres}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-800 font-medium leading-relaxed mb-3 bg-blue-50/50 p-3 rounded-lg border border-blue-50/50">
                          &quot;{f.catatan}&quot;
                        </div>
                        
                        {(f.umpanBalik || f.refleksiMurid) && (
                          <div className="space-y-2 mt-3 pt-3 border-t border-gray-100 text-xs">
                            {f.umpanBalik && (
                              <div className="bg-amber-50 p-2 rounded flex gap-2 text-amber-900 border border-amber-100">
                                <MessageSquare size={12} className="shrink-0 mt-0.5" />
                                <div><span className="font-bold">Umpan Balik:</span> {f.umpanBalik}</div>
                              </div>
                            )}
                            {f.refleksiMurid && (
                              <div className="bg-emerald-50 p-2 rounded flex gap-2 text-emerald-900 border border-emerald-100">
                                <History size={12} className="shrink-0 mt-0.5" />
                                <div><span className="font-bold">Refleksi Murid:</span> {f.refleksiMurid}</div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Input Observasi */}
      {isInputModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? "Edit Observasi" : "Input Jurnal Observasi / Kebiasaan"}</h2>
              <button onClick={() => setIsInputModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              {targetDimensiList.length === 0 && (
                <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm border border-orange-200">
                  ⚠️ Peringatan: Anda belum menentukan target Capaian Profil/Dimensi untuk kegiatan ini. 
                  Silakan atur di menu &quot;Kegiatan Kokurikuler&quot; -&gt; &quot;Profil Lulusan&quot; terlebih dahulu.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Observasi</label>
                  <input
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dimensi Profil P3</label>
                  <select
                    value={formDimensiId}
                    onChange={(e) => setFormDimensiId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Pilih Dimensi --</option>
                    {targetDimensiList.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                    {targetDimensiList.length === 0 && dimensiList.map(d => <option key={d.id} value={d.id}>{d.nama} (Tidak ditargetkan)</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Anekdotal (Guru)</label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                  placeholder="Catat perilaku atau kejadian spesifik yang diamati..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status Progres saat ini</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer bg-green-50 px-4 py-2 border border-green-200 rounded-xl hover:bg-green-100 transition-colors">
                    <input type="radio" checked={formStatus === 'Muncul'} onChange={() => setFormStatus('Muncul')} className="text-green-600 focus:ring-green-500 w-4 h-4" />
                    <span className="text-sm font-bold text-green-800">Muncul</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer bg-orange-50 px-4 py-2 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors">
                    <input type="radio" checked={formStatus === 'Belum Muncul'} onChange={() => setFormStatus('Belum Muncul')} className="text-orange-600 focus:ring-orange-500 w-4 h-4" />
                    <span className="text-sm font-bold text-orange-800">Belum Muncul</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 space-y-4">
                <h4 className="font-bold text-gray-800 text-sm">Opsi Tindak Lanjut (Opsional)</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Umpan Balik Guru</label>
                  <textarea
                    value={formUmpanBalik}
                    onChange={(e) => setFormUmpanBalik(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl bg-amber-50/50 focus:ring-2 focus:ring-amber-500 min-h-[60px] text-sm"
                    placeholder="Saran atau pertanyaan pemantik yang diberikan kepada murid..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Refleksi Murid</label>
                  <textarea
                    value={formRefleksi}
                    onChange={(e) => setFormRefleksi(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl bg-emerald-50/50 focus:ring-2 focus:ring-emerald-500 min-h-[60px] text-sm"
                    placeholder="Catatan dari respons murid setelah diberi umpan balik..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => setIsInputModalOpen(false)}
                className="px-6 py-2 text-sm font-medium text-gray-600 bg-white border hover:bg-gray-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveFormatif}
                className="px-6 py-2 text-sm font-medium text-white bg-[#007AFF] hover:bg-blue-600 rounded-xl transition-colors"
              >
                Simpan Observasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Draft Rapor */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-blue-500" /> Draft Deskripsi Rapor
              </h2>
              <button onClick={() => setIsDraftModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/50">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-sm text-blue-800 mb-2">
                💡 Draft ini di-generate secara otomatis berdasarkan kumpulan catatan anekdotal dan status progres murid selama kegiatan ini. Gunakan sebagai referensi saat mengisi rapor sumatif.
              </div>
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[200px] whitespace-pre-wrap text-sm leading-relaxed font-medium text-gray-700">
                {generateDraft()}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end bg-white rounded-b-2xl">
              <button
                onClick={() => setIsDraftModalOpen(false)}
                className="px-6 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-xl transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
