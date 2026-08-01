import React, { useState, useEffect } from "react";
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { Plus, Trash2, Edit } from "lucide-react";

export default function Fasilitator() {
  const { state, addItem, updateItem, deleteItem , filteredKelas } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [modulId, setModulId] = useState("");
  const [kelasId, setKelasId] = useState("");
  const [guruIds, setGuruIds] = useState<string[]>([]);

  const modul = state.agmp_kegiatan_kokurikuler || [];
  const kelas = filteredKelas || [];
  
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const usersRef = collection(db, 'app_users');
    const unsub = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!modulId || !kelasId || guruIds.length === 0) return;

    if (editingId) {
      await updateItem("agmp_fasilitator", editingId, { modulId, kelasId, guruIds });
    } else {
      await addItem("agmp_fasilitator", {
        id: generateId(),
        modulId,
        kelasId,
        guruIds
      });
    }

    setIsAdding(false);
    setEditingId(null);
    setModulId("");
    setKelasId("");
    setGuruIds([]);
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setModulId(item.modulId);
    setKelasId(item.kelasId);
    setGuruIds(item.guruIds || []);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus fasilitator ini?")) {
      await deleteItem("agmp_fasilitator", id);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Fasilitator Kokurikuler</h2>
          <p className="text-sm text-gray-500 mt-1">
            Mengatur Guru yang mengampu modul tertentu pada kelas tertentu.
          </p>
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditingId(null); setModulId(""); setKelasId(""); setGuruIds([]); }}
          className="flex items-center gap-2 bg-[#007AFF] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          <Plus size={18} />
          Tambah Fasilitator
        </button>
      </header>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Kegiatan (Modul)</label>
              <select
                value={modulId}
                onChange={(e) => setModulId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50"
              >
                <option value="">-- Pilih Kegiatan --</option>
                {modul.map((m: any) => (
                  <option key={m.id} value={m.id}>{m.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Kelas</label>
              <select
                value={kelasId}
                onChange={(e) => setKelasId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50"
              >
                <option value="">-- Pilih Kelas --</option>
                {kelas.map((k: any) => (
                  <option key={k.id} value={k.id}>{k.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Guru (Fasilitator)</label>
              <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-xl bg-gray-50 text-sm">
                {users.length === 0 && <span className="text-gray-400 italic">Belum ada pengguna.</span>}
                {users.map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guruIds.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGuruIds([...guruIds, u.id]);
                        } else {
                          setGuruIds(guruIds.filter(id => id !== u.id));
                        }
                      }}
                      className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                    />
                    <span>{u.name} <span className="text-gray-500 text-xs">({u.email})</span></span>
                  </label>
                ))}
              </div>
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
              disabled={!modulId || !kelasId || guruIds.length === 0}
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
                <th className="px-6 py-4 font-semibold">Guru (Fasilitator)</th>
                <th className="px-6 py-4 font-semibold">Kegiatan (Modul)</th>
                <th className="px-6 py-4 font-semibold">Kelas</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(state.agmp_fasilitator || []).map((item: any) => {
                const md = modul.find((m: any) => m.id === item.modulId);
                const kl = kelas.find((k: any) => k.id === item.kelasId);
                const gurus = (item.guruIds || []).map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {gurus.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {gurus.map((g: any) => (
                            <span key={g.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">Guru Tidak Ditemukan</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {md ? md.nama : "Modul Tidak Ditemukan"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {kl ? kl.nama : "Kelas Tidak Ditemukan"}
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
              {(!state.agmp_fasilitator || state.agmp_fasilitator.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 italic">
                    Belum ada data fasilitator.
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
