import { useState, useMemo } from "react";
import { Plus, Edit2, Trash2, Settings, X, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { KegiatanKokurikuler as KegiatanType, CapaianProfil, Dimensi, SubDimensi } from "@/lib/types";

export default function KegiatanKokurikuler() {
  const { state, addItem, updateItem, deleteItem, showToast } = useStore();
  const temaList = state.agmp_tema_kokurikuler || [];
  const kelasList = state.agmp_kelas || [];
  const dimensiList = state.agmp_dimensi || [];
  const kegiatanList = state.agmp_kegiatan_kokurikuler || [];

  const [selectedTemaId, setSelectedTemaId] = useState<string>("");
  const [selectedKelasIds, setSelectedKelasIds] = useState<string[]>([]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [noUrut, setNoUrut] = useState<number>(1);
  const [nama, setNama] = useState("");
  const [tujuanAkhir, setTujuanAkhir] = useState("");

  const [isProfilModalOpen, setIsProfilModalOpen] = useState(false);
  const [currentProfilKegiatan, setCurrentProfilKegiatan] = useState<KegiatanType | null>(null);
  const [capaianProfil, setCapaianProfil] = useState<CapaianProfil[]>([]);

  const filteredKegiatan = useMemo(() => {
    if (!selectedTemaId) return [];
    return (state.agmp_kegiatan_kokurikuler || []).filter(k => k.temaId === selectedTemaId);
  }, [state.agmp_kegiatan_kokurikuler, selectedTemaId]);

  const toggleKelas = (id: string) => {
    if (selectedKelasIds.includes(id)) {
      setSelectedKelasIds(selectedKelasIds.filter(k => k !== id));
    } else {
      setSelectedKelasIds([...selectedKelasIds, id]);
    }
  };

  const resetForm = () => {
    setNoUrut(filteredKegiatan.length + 1);
    setNama("");
    setTujuanAkhir("");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!nama || !tujuanAkhir || !noUrut) {
      showToast("Semua field harus diisi", "error");
      return;
    }
    if (selectedKelasIds.length === 0) {
      showToast("Pilih minimal satu kelas sasaran", "error");
      return;
    }

    try {
      if (editingId) {
        await updateItem("agmp_kegiatan_kokurikuler", editingId, { 
          noUrut, nama, tujuanAkhir, temaId: selectedTemaId, kelasIds: selectedKelasIds 
        });
        showToast("Kegiatan berhasil diperbarui", "success");
      } else {
        await addItem("agmp_kegiatan_kokurikuler", { id: generateId(), 
          noUrut, nama, tujuanAkhir, temaId: selectedTemaId, kelasIds: selectedKelasIds, capaianProfil: [] 
        });
        showToast("Kegiatan berhasil ditambahkan", "success");
      }
      resetForm();
    } catch (e) {
      showToast("Terjadi kesalahan", "error");
    }
  };

  const handleEdit = (kegiatan: KegiatanType) => {
    setNoUrut(kegiatan.noUrut);
    setNama(kegiatan.nama);
    setTujuanAkhir(kegiatan.tujuanAkhir);
    setSelectedKelasIds(kegiatan.kelasIds || []);
    setEditingId(kegiatan.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
      await deleteItem("agmp_kegiatan_kokurikuler", id);
      showToast("Kegiatan berhasil dihapus", "success");
    }
  };

  // Profil Lulusan Handlers
  const openProfilModal = (kegiatan: KegiatanType) => {
    setCurrentProfilKegiatan(kegiatan);
    setCapaianProfil(kegiatan.capaianProfil ? JSON.parse(JSON.stringify(kegiatan.capaianProfil)) : []);
    setIsProfilModalOpen(true);
  };

  const addDimensiToProfil = (dimensiId: string) => {
    if (!capaianProfil.find(c => c.dimensiId === dimensiId)) {
      setCapaianProfil([...capaianProfil, { dimensiId, subDimensiIds: [] }]);
    }
  };

  const removeDimensiFromProfil = (dimensiId: string) => {
    setCapaianProfil(capaianProfil.filter(c => c.dimensiId !== dimensiId));
  };

  const toggleSubDimensi = (dimensiId: string, subDimensiId: string) => {
    setCapaianProfil(capaianProfil.map(c => {
      if (c.dimensiId === dimensiId) {
        const hasSub = c.subDimensiIds.includes(subDimensiId);
        return {
          ...c,
          subDimensiIds: hasSub 
            ? c.subDimensiIds.filter(id => id !== subDimensiId)
            : [...c.subDimensiIds, subDimensiId]
        };
      }
      return c;
    }));
  };

  const saveProfil = async () => {
    if (!currentProfilKegiatan) return;
    try {
      await updateItem("agmp_kegiatan_kokurikuler", currentProfilKegiatan.id, { capaianProfil });
      showToast("Profil lulusan berhasil diperbarui", "success");
      setIsProfilModalOpen(false);
    } catch (e) {
      showToast("Gagal memperbarui profil lulusan", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Kegiatan Kokurikuler</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola kegiatan dan profil lulusan.</p>
        </div>
      </header>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tema Kokurikuler</label>
          <select 
            value={selectedTemaId} 
            onChange={(e) => {
              setSelectedTemaId(e.target.value);
              setIsAdding(false);
            }}
            className="w-full md:w-1/2 px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-gray-50"
          >
            <option value="">-- Pilih Tema --</option>
            {temaList.map(t => (
              <option key={t.id} value={t.id}>{t.nama}</option>
            ))}
          </select>
        </div>

        {selectedTemaId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Kelas Sasaran (Cek Box)</label>
            <div className="flex flex-wrap gap-3">
              {kelasList.map(k => (
                <label key={k.id} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-3 py-2 rounded-lg border hover:bg-gray-100">
                  <input 
                    type="checkbox" 
                    checked={selectedKelasIds.includes(k.id)}
                    onChange={() => toggleKelas(k.id)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800">{k.nama}</span>
                </label>
              ))}
              {kelasList.length === 0 && <span className="text-sm text-gray-500 italic">Belum ada data kelas</span>}
            </div>
          </div>
        )}
      </div>

      {selectedTemaId && selectedKelasIds.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">Daftar Kegiatan</h3>
            {!isAdding && (
              <button
                onClick={() => {
                  setNoUrut(filteredKegiatan.length + 1);
                  setIsAdding(true);
                }}
                className="flex items-center gap-2 bg-[#007AFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                <Plus size={18} />
                Tambah Kegiatan
              </button>
            )}
          </div>

          {isAdding && (
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold mb-4">{editingId ? "Edit Kegiatan" : "Tambah Kegiatan"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">No Urut</label>
                  <input
                    type="number"
                    value={noUrut}
                    onChange={(e) => setNoUrut(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kegiatan</label>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Contoh: Pembuatan Kompos"
                  />
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan Akhir Kegiatan</label>
                  <input
                    type="text"
                    value={tujuanAkhir}
                    onChange={(e) => setTujuanAkhir(e.target.value)}
                    className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Tujuan akhir kegiatan ini"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-4 border-t">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#007AFF] hover:bg-blue-600 rounded-xl"
                >
                  Simpan
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-semibold border-b border-gray-100 w-16">No</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-100">Nama Kegiatan</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-100">Tujuan Akhir</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Kelas Sasaran</th>
                    <th className="px-6 py-4 font-semibold border-b border-gray-100 text-right">Opsi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredKegiatan.sort((a,b) => a.noUrut - b.noUrut).map((kegiatan) => (
                    <tr key={kegiatan.id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 text-gray-900 font-medium">{kegiatan.noUrut}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{kegiatan.nama}</td>
                      <td className="px-6 py-4 text-gray-600 text-sm whitespace-normal min-w-[200px]">{kegiatan.tujuanAkhir}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {kegiatan.kelasIds?.length || 0} Kelas
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openProfilModal(kegiatan)}
                            className="px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <Settings size={14} />
                            Profil Lulusan
                          </button>
                          <button
                            onClick={() => handleEdit(kegiatan)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit Kegiatan"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(kegiatan.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Kegiatan"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredKegiatan.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                        Belum ada kegiatan untuk tema ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ubah Profil Lulusan */}
      {isProfilModalOpen && currentProfilKegiatan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Ubah Profil Lulusan</h2>
                <p className="text-sm text-gray-500">{currentProfilKegiatan.nama}</p>
              </div>
              <button onClick={() => setIsProfilModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="space-y-4">
                <h3 className="font-bold text-gray-900">Tambah Capaian Dimensi</h3>
                <div className="flex gap-2">
                  <select 
                    className="flex-1 px-4 py-2 border rounded-xl bg-gray-50 focus:ring-2 focus:ring-blue-500"
                    onChange={(e) => {
                      if (e.target.value) {
                        addDimensiToProfil(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>-- Pilih Dimensi --</option>
                    {dimensiList.filter(d => !capaianProfil.find(c => c.dimensiId === d.id)).map(d => (
                      <option key={d.id} value={d.id}>{d.nama}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                {capaianProfil.map(cp => {
                  const dim = dimensiList.find(d => d.id === cp.dimensiId);
                  if (!dim) return null;
                  
                  return (
                    <div key={dim.id} className="border rounded-xl p-4 space-y-3 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-900">{dim.nama}</h4>
                        <button 
                          onClick={() => removeDimensiFromProfil(dim.id)}
                          className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 pl-2">
                        <p className="text-sm font-medium text-gray-600 mb-2">Pilih Sub Dimensi:</p>
                        {dim.subDimensi && dim.subDimensi.length > 0 ? (
                          dim.subDimensi.map(sub => (
                            <label key={sub.id} className="flex items-start gap-3 cursor-pointer p-2 hover:bg-white rounded-lg border border-transparent hover:border-gray-200 transition-colors">
                              <input 
                                type="checkbox"
                                checked={cp.subDimensiIds.includes(sub.id)}
                                onChange={() => toggleSubDimensi(dim.id, sub.id)}
                                className="mt-1 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-800">{sub.nama}</span>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">Belum ada sub dimensi untuk dimensi ini.</p>
                        )}
                      </div>
                    </div>
                  );
                })}
                {capaianProfil.length === 0 && (
                  <div className="text-center p-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500">Belum ada capaian dimensi. Silakan tambah di atas.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => setIsProfilModalOpen(false)}
                className="px-6 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={saveProfil}
                className="px-6 py-2.5 text-sm font-bold text-white bg-[#007AFF] hover:bg-blue-600 rounded-xl transition-colors flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Simpan Profil Lulusan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
