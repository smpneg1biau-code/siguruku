import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, ArrowLeft, MessageSquare, History, CheckCircle, Clock, FileText, X, Award, Upload, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { AsesmenSumatifKoku as SumatifType, AsesmenFormatifKoku as FormatifType } from "@/lib/types";

export default function AsesmenSumatifKoku() {
  const { state, addItem, updateItem, deleteItem, showToast, filteredKelas } = useStore();
  
  const activeTA = state.agmp_tahun_ajaran?.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';
  
  const temaList = state.agmp_tema_kokurikuler || [];
  const kegiatanList = state.agmp_kegiatan_kokurikuler || [];
  const kelasList = filteredKelas || [];
  const siswaList = state.agmp_siswa || [];
  const dimensiList = state.agmp_dimensi || [];
  const formatifList = state.agmp_asesmen_formatif_koku || [];
  const sumatifList = state.agmp_asesmen_sumatif_koku || [];
  const rubrikList = state.agmp_rubrik_kokurikuler || [];

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTemaId, setSelectedTemaId] = useState("");
  const [selectedKegiatanId, setSelectedKegiatanId] = useState("");
  const [selectedKelasId, setSelectedKelasId] = useState("");
  const [selectedSiswaId, setSelectedSiswaId] = useState("");

  const filteredKegiatan = useMemo(() => {
    if (!selectedTemaId) return [];
    return kegiatanList.filter(k => k.temaId === selectedTemaId);
  }, [kegiatanList, selectedTemaId]);

  const kegiatanDetails = useMemo(() => {
    return kegiatanList.find(k => k.id === selectedKegiatanId);
  }, [kegiatanList, selectedKegiatanId]);

  const availableKelasIds = useMemo(() => kegiatanDetails?.kelasIds || [], [kegiatanDetails]);
  const validKelas = useMemo(() => kelasList.filter(k => availableKelasIds.includes(k.id)), [kelasList, availableKelasIds]);

  const filteredSiswa = useMemo(() => {
    if (!selectedKelasId) return [];
    return siswaList.filter(s => s.kelasId === selectedKelasId).sort((a,b) => a.nama.localeCompare(b.nama));
  }, [siswaList, selectedKelasId]);

  const targetDimensiIds = useMemo(() => {
    if (!kegiatanDetails) return [];
    return kegiatanDetails.capaianProfil?.map(c => c.dimensiId) || [];
  }, [kegiatanDetails]);

  const targetDimensiList = useMemo(() => dimensiList.filter(d => targetDimensiIds.includes(d.id)), [dimensiList, targetDimensiIds]);

  const [formTanggal, setFormTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [formNilaiDimensi, setFormNilaiDimensi] = useState<Record<string, "SB" | "B" | "C" | "K">>({});
  const [formDeskripsi, setFormDeskripsi] = useState("");
  const [formBukti, setFormBukti] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const selectedSiswa = siswaList.find(s => s.id === selectedSiswaId);
  const currentSumatif = useMemo(() => {
    return sumatifList.find(s => 
      s.siswaId === selectedSiswaId && 
      s.kegiatanId === selectedKegiatanId &&
      (activeTaId ? (s.taId === activeTaId || !s.taId) : true)
    );
  }, [sumatifList, selectedSiswaId, selectedKegiatanId, activeTaId]);

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

  const generateDraft = () => {
    if (formatifSiswaList.length === 0) return "Murid telah menyelesaikan kegiatan kokurikuler dengan baik.";
    
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
      const predikat = formNilaiDimensi[dimId];
      
      let predikatTeks = "";
      if (predikat === "SB") predikatTeks = "Sangat Baik (SB)";
      else if (predikat === "B") predikatTeks = "Baik (B) dan cakap";
      else if (predikat === "C") predikatTeks = "Cukup (C) dan sedang berkembang";
      else if (predikat === "K") predikatTeks = "Kurang (K) dan masih memerlukan bimbingan";
      else predikatTeks = "menunjukkan perkembangan";

      draft += `Dalam dimensi ${dim?.nama || 'Profil'}, murid terpantau ${predikatTeks}. `;
    });
    
    return draft;
  };

  const handleSelectSiswa = (siswaId: string) => {
    setSelectedSiswaId(siswaId);
    const sumatif = sumatifList.find(s => 
      s.siswaId === siswaId && 
      s.kegiatanId === selectedKegiatanId &&
      (activeTaId ? (s.taId === activeTaId || !s.taId) : true)
    );
    
    if (sumatif) {
      setEditingId(sumatif.id);
      setFormTanggal(sumatif.tanggal);
      const nd: Record<string, "SB" | "B" | "C" | "K"> = {};
      sumatif.nilaiDimensi.forEach(n => nd[n.dimensiId] = n.predikat);
      setFormNilaiDimensi(nd);
      setFormDeskripsi(sumatif.deskripsiRapor || "");
      setFormBukti(sumatif.buktiKaryaUrl || "");
    } else {
      setEditingId(null);
      setFormTanggal(new Date().toISOString().split('T')[0]);
      setFormNilaiDimensi({});
      setFormDeskripsi("");
      setFormBukti("");
    }
    setStep(3);
  };

  const handleGenerateDraft = () => {
    setFormDeskripsi(generateDraft());
  };

  const handleSaveSumatif = async () => {
    if (Object.keys(formNilaiDimensi).length < targetDimensiList.length) {
      showToast("Mohon lengkapi penilaian predikat untuk seluruh dimensi", "error");
      return;
    }
    if (!formDeskripsi) {
      showToast("Deskripsi rapor tidak boleh kosong", "error");
      return;
    }

    const nilaiDimensiArr = Object.entries(formNilaiDimensi).map(([dimensiId, predikat]) => ({ dimensiId, predikat }));

    const payload = {
      kegiatanId: selectedKegiatanId,
      kelasId: selectedKelasId,
      siswaId: selectedSiswaId,
      tanggal: formTanggal,
      nilaiDimensi: nilaiDimensiArr,
      deskripsiRapor: formDeskripsi,
      buktiKaryaUrl: formBukti,
      taId: activeTaId
    };

    try {
      if (editingId) {
        await updateItem("agmp_asesmen_sumatif_koku", editingId, payload);
        showToast("Asesmen Sumatif berhasil diperbarui", "success");
      } else {
        const newId = generateId();
        await addItem("agmp_asesmen_sumatif_koku", { id: newId, ...payload });
        setEditingId(newId);
        showToast("Asesmen Sumatif berhasil disimpan", "success");
      }
    } catch (error) {
      // handled
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asesmen Sumatif</h2>
          <p className="text-sm text-gray-500 mt-1">Penilaian akhir dan deskripsi rapor kegiatan kokurikuler.</p>
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
          3. Penilaian Rubrik & Rapor
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Kegiatan (Produk Akhir)</label>
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
              <h3 className="text-lg font-bold text-gray-900">Daftar Murid & Status Penilaian</h3>
              <p className="text-sm text-gray-500">Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama || '-'}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} /> Kembali
            </button>
            <button onClick={() => setStep(4)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">
              <Printer size={16} /> Rekap Rapor Kelas
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSiswa.map(siswa => {
              const isDone = sumatifList.some(s => 
                s.siswaId === siswa.id && 
                s.kegiatanId === selectedKegiatanId &&
                (activeTaId ? (s.taId === activeTaId || !s.taId) : true)
              );
              
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
                  <div className="flex items-center gap-2">
                    {isDone ? (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                        Belum Dinilai
                      </span>
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
            <div className="flex gap-2 text-sm font-medium">
               Tanggal Penilaian:
               <input type="date" value={formTanggal} onChange={e => setFormTanggal(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <Award size={18} className="text-blue-500" /> Penilaian Rubrik (Predikat)
                </h4>
                <p className="text-sm text-gray-500 mb-6">Pilih predikat capaian untuk setiap dimensi yang menjadi target kegiatan ini.</p>
                
                {targetDimensiList.length === 0 ? (
                  <div className="bg-orange-50 text-orange-800 p-4 rounded-xl text-sm border border-orange-200">
                    ⚠️ Peringatan: Belum ada target dimensi yang diatur untuk kegiatan ini.
                  </div>
                ) : (
                  <div className="space-y-6">
                    {targetDimensiList.map(dim => {
                      // Attempt to find rubric descriptions if any exist for this kegiatan + dimensi
                      // We'll just display standard predikat options if no specific text is found.
                      const rubricMatch = rubrikList.find(r => r.kegiatanId === selectedKegiatanId && r.dimensiNama.toLowerCase().includes(dim.nama.toLowerCase()));
                      
                      return (
                        <div key={dim.id} className="border border-gray-100 rounded-xl overflow-hidden">
                          <div className="bg-gray-50 p-3 border-b border-gray-100">
                            <span className="text-sm font-bold text-gray-900">{dim.nama}</span>
                          </div>
                          <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                            <label className={`cursor-pointer flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${formNilaiDimensi[dim.id] === 'SB' ? 'border-green-500 bg-green-50' : 'border-gray-100 hover:border-gray-300'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${formNilaiDimensi[dim.id] === 'SB' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'}`}>SB</span>
                                <input type="radio" name={`dim_${dim.id}`} className="w-4 h-4 text-green-600" checked={formNilaiDimensi[dim.id] === 'SB'} onChange={() => setFormNilaiDimensi(prev => ({...prev, [dim.id]: 'SB'}))} />
                              </div>
                              <span className="text-sm font-bold text-gray-800">Sangat Baik (Mahir)</span>
                              <span className="text-xs text-gray-500 leading-tight line-clamp-3">{rubricMatch?.deskripsiSB || 'Melampaui standar pencapaian yang diharapkan.'}</span>
                            </label>

                            <label className={`cursor-pointer flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${formNilaiDimensi[dim.id] === 'B' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-300'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${formNilaiDimensi[dim.id] === 'B' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>B</span>
                                <input type="radio" name={`dim_${dim.id}`} className="w-4 h-4 text-blue-600" checked={formNilaiDimensi[dim.id] === 'B'} onChange={() => setFormNilaiDimensi(prev => ({...prev, [dim.id]: 'B'}))} />
                              </div>
                              <span className="text-sm font-bold text-gray-800">Baik (Cakap)</span>
                              <span className="text-xs text-gray-500 leading-tight line-clamp-3">{rubricMatch?.deskripsiB || 'Telah mencapai standar kelulusan.'}</span>
                            </label>

                            <label className={`cursor-pointer flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${formNilaiDimensi[dim.id] === 'C' ? 'border-amber-500 bg-amber-50' : 'border-gray-100 hover:border-gray-300'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${formNilaiDimensi[dim.id] === 'C' ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-600'}`}>C</span>
                                <input type="radio" name={`dim_${dim.id}`} className="w-4 h-4 text-amber-600" checked={formNilaiDimensi[dim.id] === 'C'} onChange={() => setFormNilaiDimensi(prev => ({...prev, [dim.id]: 'C'}))} />
                              </div>
                              <span className="text-sm font-bold text-gray-800">Cukup (Berkembang)</span>
                              <span className="text-xs text-gray-500 leading-tight line-clamp-3">{rubricMatch?.deskripsiC || 'Sedang berkembang, namun belum mencapai standar.'}</span>
                            </label>

                            <label className={`cursor-pointer flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${formNilaiDimensi[dim.id] === 'K' ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-gray-300'}`}>
                              <div className="flex items-center justify-between">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${formNilaiDimensi[dim.id] === 'K' ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'}`}>K</span>
                                <input type="radio" name={`dim_${dim.id}`} className="w-4 h-4 text-red-600" checked={formNilaiDimensi[dim.id] === 'K'} onChange={() => setFormNilaiDimensi(prev => ({...prev, [dim.id]: 'K'}))} />
                              </div>
                              <span className="text-sm font-bold text-gray-800">Kurang (Menuju)</span>
                              <span className="text-xs text-gray-500 leading-tight line-clamp-3">{rubricMatch?.deskripsiK || 'Masih membutuhkan bimbingan intensif.'}</span>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" /> Deskripsi Rapor Kokurikuler
                  </h4>
                  <button 
                    onClick={handleGenerateDraft}
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Plus size={14} /> Auto-Generate
                  </button>
                </div>
                <p className="text-sm text-gray-500 mb-3">Tuliskan narasi singkat dan edukatif mengenai pencapaian murid.</p>
                <textarea
                  value={formDeskripsi}
                  onChange={e => setFormDeskripsi(e.target.value)}
                  className="w-full px-4 py-3 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 min-h-[120px] text-sm leading-relaxed"
                  placeholder="Misal: Putra sudah baik (B) dalam penalaran kritis saat merumuskan masalah..."
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <History size={18} className="text-blue-500" /> Rekam Jejak Formatif
                </h4>
                
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                  {formatifSiswaList.length === 0 ? (
                    <div className="text-center py-6 border border-dashed rounded-xl">
                      <p className="text-xs text-gray-500">Tidak ada catatan formatif.</p>
                    </div>
                  ) : (
                    formatifSiswaList.map(f => {
                      const dim = dimensiList.find(d => d.id === f.dimensiId);
                      return (
                        <div key={f.id} className="p-3 border rounded-xl bg-gray-50">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-500">{f.tanggal}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${f.statusProgres === 'Muncul' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{f.statusProgres}</span>
                          </div>
                          <p className="text-[10px] font-bold text-indigo-600 mb-1">{dim?.nama}</p>
                          <p className="text-xs text-gray-700 line-clamp-3">&quot;{f.catatan}&quot;</p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Upload size={18} className="text-blue-500" /> Portofolio / Karya (Opsional)
                </h4>
                <label className="block text-sm font-medium text-gray-700 mb-1">Link Bukti Karya</label>
                <input
                  type="url"
                  value={formBukti}
                  onChange={e => setFormBukti(e.target.value)}
                  className="w-full px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="https://drive.google.com/..."
                />
                <p className="text-[10px] text-gray-500 mt-2">Lampirkan URL foto produk, laporan, atau video presentasi murid.</p>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={handleSaveSumatif}
                  className="w-full bg-[#007AFF] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-600 transition-colors shadow-sm"
                >
                  Simpan Penilaian Sumatif
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-blue-500" /> Rekapitulasi Rapor Kokurikuler
              </h3>
              <p className="text-sm text-gray-500 mt-1">Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama || '-'} | Kegiatan: {kegiatanDetails?.nama}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeft size={16} /> Kembali
              </button>
              <button onClick={() => window.print()} className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm">
                <Printer size={16} /> Cetak Rekap
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-10 text-center border-r border-gray-200">No</th>
                  <th className="px-4 py-3 min-w-[150px] border-r border-gray-200">Nama Murid</th>
                  <th className="px-4 py-3 min-w-[200px] border-r border-gray-200">Capaian Dimensi (Predikat)</th>
                  <th className="px-4 py-3 min-w-[250px]">Deskripsi Rapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSiswa.map((siswa, idx) => {
                  const s = sumatifList.find(sum => 
                    sum.siswaId === siswa.id && 
                    sum.kegiatanId === selectedKegiatanId &&
                    (activeTaId ? (sum.taId === activeTaId || !sum.taId) : true)
                  );
                  return (
                    <tr key={siswa.id} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 text-center border-r border-gray-100 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="font-bold text-gray-900">{siswa.nama}</div>
                        <div className="text-xs text-gray-500">NISN: {siswa.nisn}</div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        {s ? (
                          <div className="space-y-1.5 flex flex-col items-start">
                            {s.nilaiDimensi.map(nd => {
                              const dimName = dimensiList.find(d => d.id === nd.dimensiId)?.nama || 'Dimensi';
                              let colorClass = 'bg-gray-100 text-gray-700';
                              if(nd.predikat === 'SB') colorClass = 'bg-green-100 text-green-700 border border-green-200';
                              if(nd.predikat === 'B') colorClass = 'bg-blue-100 text-blue-700 border border-blue-200';
                              if(nd.predikat === 'C') colorClass = 'bg-amber-100 text-amber-700 border border-amber-200';
                              if(nd.predikat === 'K') colorClass = 'bg-red-100 text-red-700 border border-red-200';
                              
                              return (
                                <span key={nd.dimensiId} className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded ${colorClass}`}>
                                  {nd.predikat} - {dimName}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum dinilai</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s ? (
                          <p className="text-xs text-gray-700 leading-relaxed">{s.deskripsiRapor}</p>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredSiswa.length === 0 && (
              <div className="p-8 text-center text-gray-500">Tidak ada murid.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

