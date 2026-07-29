import React, { useState, useEffect } from "react";
import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useStore } from "@/lib/store";
import { Users, BookOpen, CheckSquare, Award, FileText, Calendar } from "lucide-react";
import { Jurnal, Absensi, Formatif, Sumatif, Rapor, Kelas, TP, Mapel } from "@/lib/types";

export default function Monitoring() {
  const { state } = useStore();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const users = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        }));
        setUsersList(users);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleSelectUser = async (user: any) => {
    setSelectedUser(user);
    setLoadingStats(true);
    try {
      const uid = user.uid;
      
      const [jurnalSnap, absensiSnap, formatifSnap, sumatifSnap, raporSnap] = await Promise.all([
        getDocs(collection(db, "users", uid, "agmp_jurnal")),
        getDocs(collection(db, "users", uid, "agmp_absensi")),
        getDocs(collection(db, "users", uid, "agmp_formatif")),
        getDocs(collection(db, "users", uid, "agmp_sumatif")),
        getDocs(collection(db, "users", uid, "agmp_rapor"))
      ]);

      setUserStats({
        jurnal: jurnalSnap.docs.map(d => d.data()),
        absensi: absensiSnap.docs.map(d => d.data()),
        formatif: formatifSnap.docs.map(d => d.data()),
        sumatif: sumatifSnap.docs.map(d => d.data()),
        rapor: raporSnap.docs.map(d => d.data())
      });
    } catch (error) {
      console.error("Error fetching user stats:", error);
    } finally {
      setLoadingStats(false);
    }
  };

  const getMapelName = (mapelId: string) => {
    return state.agmp_mapel?.find(m => m.id === mapelId)?.nama || "Tidak diketahui";
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Monitoring Data Guru</h2>
        <p className="text-sm text-gray-500 mt-1">
          Pantau rekapitulasi data yang telah diinput oleh masing-masing guru.
        </p>
      </header>

      {loading ? (
        <div className="text-center py-10">Memuat data guru...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar: List of Teachers */}
          <div className="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-900 mb-4 border-b pb-2">Daftar Guru</h3>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
              {usersList.map((u) => {
                const pengaturan = u.agmp_pengaturan || {};
                const name = pengaturan.guruNama || u.uid;
                const mapel = getMapelName(pengaturan.mapelId) || pengaturan.mapel || "Belum diset";
                
                return (
                  <button
                    key={u.uid}
                    onClick={() => handleSelectUser(u)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedUser?.uid === u.uid
                        ? "bg-blue-50 border-blue-200"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                    }`}
                  >
                    <p className="font-semibold text-sm text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-500 truncate">{mapel}</p>
                  </button>
                );
              })}
              {usersList.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-4">Belum ada data guru.</div>
              )}
            </div>
          </div>

          {/* Main Content: Stats for Selected Teacher */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedUser ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900">Pilih Guru</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                  Silakan pilih guru dari daftar di samping untuk melihat rekapitulasi data yang telah mereka input.
                </p>
              </div>
            ) : loadingStats ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 text-center">
                Memuat data rekapitulasi...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {selectedUser.agmp_pengaturan?.guruNama || "Tidak Bernama"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Mata Pelajaran: {getMapelName(selectedUser.agmp_pengaturan?.mapelId) || selectedUser.agmp_pengaturan?.mapel || "-"}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Jurnal Mengajar" 
                    value={userStats?.jurnal?.length || 0} 
                    icon={BookOpen} 
                    color="bg-blue-50 text-blue-600" 
                  />
                  <StatCard 
                    title="Data Absensi" 
                    value={userStats?.absensi?.length || 0} 
                    icon={Calendar} 
                    color="bg-green-50 text-green-600" 
                  />
                  <StatCard 
                    title="Nilai Formatif" 
                    value={userStats?.formatif?.length || 0} 
                    icon={CheckSquare} 
                    color="bg-purple-50 text-purple-600" 
                  />
                  <StatCard 
                    title="Nilai Sumatif" 
                    value={userStats?.sumatif?.length || 0} 
                    icon={Award} 
                    color="bg-orange-50 text-orange-600" 
                  />
                  <StatCard 
                    title="Data Rapor" 
                    value={userStats?.rapor?.length || 0} 
                    icon={FileText} 
                    color="bg-indigo-50 text-indigo-600" 
                  />
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h4 className="font-bold text-gray-900 mb-4">Aktivitas Jurnal Terbaru</h4>
                  <div className="space-y-3">
                    {userStats?.jurnal?.sort((a: any, b: any) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).slice(0, 5).map((j: any, idx: number) => (
                      <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded-xl border border-gray-100 gap-2">
                        <div>
                          <p className="font-semibold text-sm">{state.agmp_kelas.find(k => k.id === j.kelasId)?.nama || "Kelas"} • {j.tanggal}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{j.materi}</p>
                        </div>
                      </div>
                    ))}
                    {(!userStats?.jurnal || userStats.jurnal.length === 0) && (
                      <p className="text-sm text-gray-500 italic">Belum ada jurnal yang diinput.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: { title: string, value: number, icon: any, color: string }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
