import { useState } from "react";
import { Plus, Edit2, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { TemaKokurikuler as TemaType } from "@/lib/types";

export default function TemaKokurikuler() {
  const { state, addItem, updateItem, deleteItem, showToast } = useStore();
  const temaList = state.agmp_tema_kokurikuler || [];

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [nama, setNama] = useState("");
  const [bentukKegiatan, setBentukKegiatan] = useState<string>("Pembelajaran Kolaboratif Lintas Disiplin");

  const resetForm = () => {
    setNama("");
    setBentukKegiatan("Pembelajaran Kolaboratif Lintas Disiplin");
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!nama) {
      showToast("Nama tema harus diisi", "error");
      return;
    }

    try {
      if (editingId) {
        await updateItem("agmp_tema_kokurikuler", editingId, { nama, bentukKegiatan });
        showToast("Tema berhasil diperbarui", "success");
      } else {
        await addItem("agmp_tema_kokurikuler", { id: generateId(), nama, bentukKegiatan });
        showToast("Tema berhasil ditambahkan", "success");
      }
      resetForm();
    } catch (e) {
      showToast("Terjadi kesalahan", "error");
    }
  };

  const handleEdit = (tema: TemaType) => {
    setNama(tema.nama);
    setBentukKegiatan(tema.bentukKegiatan || tema.deskripsi || "Pembelajaran Kolaboratif Lintas Disiplin");
    setEditingId(tema.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus tema ini?")) {
      await deleteItem("agmp_tema_kokurikuler", id);
      showToast("Tema berhasil dihapus", "success");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daftar Tema Kokurikuler</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola tema untuk kegiatan kokurikuler.</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#007AFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            <Plus size={18} />
            Tambah Tema
          </button>
        )}
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold mb-4">{editingId ? "Edit Tema" : "Tambah Tema"}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Tema</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama tema"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bentuk Kegiatan</label>
              <select
                value={bentukKegiatan}
                onChange={(e) => setBentukKegiatan(e.target.value)}
                className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="Pembelajaran Kolaboratif Lintas Disiplin">Pembelajaran Kolaboratif Lintas Disiplin</option>
                <option value="Gerakan 7KAIH">Gerakan 7KAIH</option>
                <option value="Cara Lainnya">Cara Lainnya</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
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
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">No</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Nama Tema</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 w-1/2">Bentuk Kegiatan</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {temaList.map((tema, idx) => (
                <tr key={tema.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 text-gray-500 text-sm">{idx + 1}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{tema.nama}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      {tema.bentukKegiatan || tema.deskripsi || "Pembelajaran Kolaboratif Lintas Disiplin"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEdit(tema)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(tema.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {temaList.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                    Belum ada tema.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
