import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Shield, Check, X, User as UserIcon } from 'lucide-react';
import { useStore } from '@/lib/store';

type AppUser = {
  id: string;
  email: string;
  name: string;
  isAuthorized: boolean;
  isKoordinator?: boolean;
  createdAt: string;
  mapelId?: string;
};

export default function ManajemenPengguna() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const { showToast, state } = useStore();
  const mapels = state.agmp_mapel || [];

  useEffect(() => {
    const usersRef = collection(db, 'app_users');
    const unsub = onSnapshot(usersRef, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppUser[];
      setUsers(usersData);
    });

    return () => unsub();
  }, []);

  const assignMapel = async (userId: string, mapelId: string) => {
    try {
      const userRef = doc(db, 'app_users', userId);
      await updateDoc(userRef, { mapelId });
      showToast("Mata pelajaran berhasil diatur", "success");
    } catch (error) {
      console.error("Error updating user mapel", error);
      showToast("Gagal mengatur mata pelajaran", "error");
    }
  };

  const toggleKoordinator = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'app_users', userId);
      await updateDoc(userRef, { isKoordinator: !currentStatus });
      showToast(`Status Koordinator berhasil ${!currentStatus ? 'diberikan' : 'dicabut'}`, "success");
    } catch (error) {
      console.error("Error updating koordinator status", error);
      showToast("Gagal mengubah status Koordinator", "error");
    }
  };

  const toggleAuth = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'app_users', userId);
      await updateDoc(userRef, { isAuthorized: !currentStatus });
      showToast(`Akses pengguna berhasil ${!currentStatus ? 'diizinkan' : 'dicabut'}`, "success");
    } catch (error) {
      console.error("Error updating user auth status", error);
      showToast("Gagal mengubah status akses", "error");
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manajemen Pengguna</h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola akses pengguna yang dapat menggunakan aplikasi ini.
          </p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Pengguna</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Email</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100">Mata Pelajaran</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status Akses</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Koordinator</th>
                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <div className="font-semibold text-gray-900">{u.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{u.email}</td>
                  <td className="px-6 py-4">
                    <select
                      className="px-3 py-1.5 border rounded-lg text-sm bg-gray-50 focus:bg-white min-w-[150px]"
                      value={u.mapelId || ""}
                      onChange={(e) => assignMapel(u.id, e.target.value)}
                    >
                      <option value="">-- Pilih Mapel --</option>
                      {mapels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.kode} - {m.nama}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.email === 'smpneg1biau@gmail.com' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    ) : u.isAuthorized ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        <Check className="w-3 h-3" /> Diizinkan
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                        <X className="w-3 h-3" /> Menunggu Akses
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.email !== 'smpneg1biau@gmail.com' && (
                      <button
                        onClick={() => toggleKoordinator(u.id, !!u.isKoordinator)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.isKoordinator 
                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {u.isKoordinator ? 'Koordinator' : 'Bukan'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.email !== 'smpneg1biau@gmail.com' && (
                      <button
                        onClick={() => toggleAuth(u.id, u.isAuthorized)}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          u.isAuthorized 
                            ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                            : 'bg-green-50 text-green-600 hover:bg-green-100'
                        }`}
                      >
                        {u.isAuthorized ? 'Cabut Akses' : 'Beri Akses'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 italic">
                    Belum ada pengguna.
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
