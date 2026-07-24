import React, { useState } from "react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { Plus, Trash2, Edit } from "lucide-react";

export default function DaftarModul() {
  const { state, addItem, updateItem, deleteItem } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nama, setNama] = useState("");
  const [temaBentukId, setTemaBentukId] = useState("");
  const [alokasiWaktu, setAlokasiWaktu] = useState(0);

  const temaBentuk = state.agmp_tema_bentuk || [];
  const dimensiLulusan = state.agmp_dimensi || [];

  const handleSave = async () => {
    if (!nama || !temaBentukId || alokasiWaktu <= 0) return;

    if (editingId) {
      await updateItem("agmp_modul_kokurikuler", editingId, { nama, temaBentukId, alokasiWaktu });
    } else {
      await addItem("agmp_modul_kokurikuler", {
        id: generateId(),
        nama,
        temaBentukId,
        alokasiWaktu
      });
    }

    setIsAdding(false);
    setEditingId(null);
    setNama("");
    setTemaBentukId("");
    setAlokasiWaktu(0);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setNama(item.nama);
    setTemaBentukId(item.temaBentukId);
    setAlokasiWaktu(item.alokasiWaktu);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus modul ini?")) {
      await deleteItem("agmp_modul_kokurikuler", id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daftar Modul Kokurikuler</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola modul kokurikuler beserta alokasi waktunya.
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setNama(""); setTemaBentukId(""); setAlokasiWaktu(0); }}
          className="flex items-center gap-2 bg-[#007AFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
          Tambah Modul
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Nama Modul</label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Gaya Hidup Berkelanjutan"
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Tema & Bentuk</label>
              <select
                value={temaBentukId}
                onChange={(e) => setTemaBentukId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50"
              >
                <option value="">-- Pilih Tema --</option>
                {temaBentuk.map((tb: any) => {
                  const dim = dimensiLulusan.find((d: any) => d.id === tb.dimensiId);
                  return (
                    <option key={tb.id} value={tb.id}>
                      {dim ? dim.nama : "Tanpa Dimensi"} - {tb.bentuk}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Alokasi Waktu (JP)</label>
              <input
                type="number"
                min="0"
                value={alokasiWaktu || ""}
                onChange={(e) => setAlokasiWaktu(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={!nama || !temaBentukId || alokasiWaktu <= 0}
              className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition disabled:opacity-50"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Nama Modul</th>
                <th className="px-6 py-4 font-semibold">Tema & Bentuk</th>
                <th className="px-6 py-4 font-semibold">Alokasi Waktu (JP)</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(state.agmp_modul_kokurikuler || []).map((item: any) => {
                const tb = temaBentuk.find((t: any) => t.id === item.temaBentukId);
                let temaDesc = "Tema Tidak Ditemukan";
                if (tb) {
                  const dim = dimensiLulusan.find((d: any) => d.id === tb.dimensiId);
                  temaDesc = `${dim ? dim.nama : "Tanpa Dimensi"} - ${tb.bentuk}`;
                }
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {item.nama}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {temaDesc}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.alokasiWaktu} JP
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {(!state.agmp_modul_kokurikuler || state.agmp_modul_kokurikuler.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                    Belum ada data modul.
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
