"use client";

import { useStore } from "@/lib/store";
import { TabId } from "@/components/Shell";
import {
  Home,
  Settings,
  BookOpen,
  Users,
  CheckSquare,
  Award,
  LifeBuoy,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart2,
} from "lucide-react";
import { useMemo } from "react";

export default function Beranda({
  onNavigate,
}: {
  onNavigate: (tab: TabId) => void;
}) {
  const { state } = useStore();

  const TPs = state.agmp_tp;
  const totalTPs = TPs.length;
  
  // Calculate attendance percentage for today or latest
  const { kehadiranPersen, kehadiranDate, kehadiranTotalSiswa } = useMemo(() => {
    const absensis = state.agmp_absensi;
    if (absensis.length === 0) return { kehadiranPersen: 0, kehadiranDate: "-", kehadiranTotalSiswa: 0 };
    
    // Sort by date descending
    const sorted = [...absensis].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const latestDate = sorted[0].tanggal;
    const latestRecords = sorted.filter(a => a.tanggal === latestDate); // all classes on this latest date
    
    let hadirCount = 0;
    let totalCount = 0;
    
    latestRecords.forEach(record => {
      const siswaIds = Object.keys(record.records);
      siswaIds.forEach(id => {
        totalCount++;
        if (record.records[id] === "HADIR") {
          hadirCount++;
        }
      });
    });
    
    const persen = totalCount > 0 ? (hadirCount / totalCount) * 100 : 0;
    return { kehadiranPersen: persen, kehadiranDate: latestDate, kehadiranTotalSiswa: totalCount };
  }, [state.agmp_absensi]);

  const sumatifTuntasCount = state.agmp_sumatif.filter(
    (s) => s.isLocked,
  ).length;

  const activeRemedials = state.agmp_remedial.filter(
    (r) => r.status !== "Selesai" && r.status !== "Dibatalkan"
  ).length;

  const today = new Date().toISOString().split("T")[0];
  const jurnalsHariIni = state.agmp_jurnal.filter(j => j.tanggal === today);

  const stats = [
    {
      label: "Kehadiran " + (kehadiranDate !== "-" ? `(${kehadiranDate})` : ""),
      value: `${kehadiranPersen.toFixed(1)}%`,
      status: kehadiranTotalSiswa > 0 ? `${kehadiranTotalSiswa} Siswa Tercatat` : "Belum Ada Data",
      statusColor: "text-green-500",
      barColor: "bg-green-500",
      width: `${kehadiranPersen}%`,
    },
    {
      label: "TP Tuntas Aktif",
      value: `${sumatifTuntasCount}/${totalTPs}`,
      status: totalTPs > 0 ? `${((sumatifTuntasCount / totalTPs) * 100).toFixed(0)}% Selesai` : "Belum Ada TP",
      statusColor: "text-blue-500",
      barColor: "bg-blue-500",
      width: `${totalTPs > 0 ? (sumatifTuntasCount / totalTPs) * 100 : 0}%`,
    },
    {
      label: "Murid Remedial",
      value: activeRemedials,
      status: activeRemedials > 0 ? "Action Req." : "Clear",
      statusColor: activeRemedials > 0 ? "text-red-500" : "text-green-500",
      barColor: activeRemedials > 0 ? "bg-red-500" : "bg-green-500",
      width: activeRemedials > 0 ? "100%" : "0%",
    },
  ];

  const menuItems = [
    {
      id: "konfigurasi",
      label: "Konfigurasi",
      icon: Settings,
      color: "bg-gray-100 text-gray-700",
    },
    {
      id: "jurnal",
      label: "Jurnal",
      icon: BookOpen,
      color: "bg-blue-100 text-blue-700",
    },
    {
      id: "absensi",
      label: "Absensi",
      icon: Users,
      color: "bg-indigo-100 text-indigo-700",
    },
    {
      id: "formatif",
      label: "Formatif",
      icon: CheckSquare,
      color: "bg-emerald-100 text-emerald-700",
    },
    {
      id: "sumatif",
      label: "Sumatif",
      icon: Award,
      color: "bg-amber-100 text-amber-700",
    },
    {
      id: "remedial",
      label: "Remedial",
      icon: LifeBuoy,
      color: "bg-red-100 text-red-700",
    },
    {
      id: "rapor",
      label: "Rapor",
      icon: FileText,
      color: "bg-purple-100 text-purple-700",
    },
    {
      id: "rekap-akhir",
      label: "Rekap Akhir",
      icon: BarChart2,
      color: "bg-teal-100 text-teal-700",
    },
  ];

  const belumTerisiClassesCount = state.agmp_kelas.length - jurnalsHariIni.length;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-shrink-0">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card p-4 rounded-2xl">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1 truncate tooltip">
              {stat.label}
            </p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold">{stat.value}</h3>
              <span
                className={`text-[10px] ${stat.statusColor} font-bold mb-1`}
              >
                {stat.status}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3">
              <div
                className={`${stat.barColor} h-full rounded-full`}
                style={{ width: stat.width }}
              ></div>
            </div>
          </div>
        ))}

        <div
          className="glass-card p-4 rounded-2xl cursor-pointer hover:bg-white/95 transition-colors"
          onClick={() => onNavigate("jurnal")}
        >
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">
            Jurnal Harian ({today})
          </p>
          <div className="flex items-center gap-2 mt-2">
            {belumTerisiClassesCount > 0 ? (
              <>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
                <span className="text-sm font-semibold text-orange-600">
                  {belumTerisiClassesCount} Kelas Belum Terisi
                </span>
              </>
            ) : (
              <>
                <span className="flex h-3 w-3 relative">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <span className="text-sm font-semibold text-green-600">
                  Semua Terisi
                </span>
              </>
            )}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Berdasarkan data kelas aktif
          </p>
        </div>
      </section>

      {/* Quick Menu */}
      <section className="flex-shrink-0">
        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">
          Akses Cepat
        </h3>
        <div className="grid grid-cols-4 gap-3 sm:gap-4 lg:grid-cols-7">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as TabId)}
              className="flex flex-col items-center gap-2 group"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${item.color}`}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-medium text-gray-600 truncate w-full text-center">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 flex-1 min-h-0">
        <section className="md:col-span-3 flex flex-col space-y-4 min-h-0">
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col flex-1 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h4 className="text-sm font-bold">Jadwal & Jurnal Mengajar</h4>
              <button
                onClick={() => onNavigate("jurnal")}
                className="text-[10px] font-bold text-[#007AFF] hover:underline"
              >
                LIHAT SEMUA
              </button>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
              {state.agmp_kelas.map((kelas) => {
                const jurnal = state.agmp_jurnal.find((j) => j.kelasId === kelas.id && j.tanggal === today);
                const isTerisi = !!jurnal;
                
                return (
                  <div
                    key={kelas.id}
                    onClick={() => onNavigate("jurnal")}
                    className="cursor-pointer flex items-center justify-between p-3 border border-orange-100 bg-white hover:bg-orange-50/50 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-xs font-bold">
                          {kelas.nama} • {state.agmp_pengaturan.mapel}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {isTerisi ? "Sudah diisi" : "Belum diisi"}
                        </p>
                      </div>
                    </div>
                    {isTerisi ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-[9px] font-bold rounded-full uppercase">
                        SUDAH ISI
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[9px] font-bold rounded-full uppercase">
                        BELUM ISI
                      </span>
                    )}
                  </div>
                );
              })}
              {state.agmp_kelas.length === 0 && (
                <div className="p-4 border-2 border-dashed border-gray-100 rounded-xl flex items-center justify-center text-xs text-gray-400 font-medium italic">
                  Belum ada kelas yang terdaftar
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="md:col-span-2 flex flex-col space-y-4 min-h-0">
          <div className="bg-white rounded-2xl border border-gray-200 flex flex-col flex-1 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h4 className="text-sm font-bold">Absensi Quick-View ({kehadiranDate !== "-" ? kehadiranDate : "Hari Ini"})</h4>
              <div className="flex gap-1">
                <span className="w-5 h-5 flex items-center justify-center bg-blue-50 text-[#007AFF] text-[9px] font-bold rounded">
                  {state.agmp_siswa.length}
                </span>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar p-2">
              <table className="w-full text-left">
                <thead className="text-[9px] text-gray-400 uppercase tracking-widest bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Siswa</th>
                    <th className="px-3 py-2 font-semibold text-right">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-50">
                  {state.agmp_siswa.slice(0, 7).map((s, idx) => {
                    const colors = [
                      "bg-blue-500",
                      "bg-orange-500",
                      "bg-pink-500",
                      "bg-purple-500",
                      "bg-emerald-500",
                    ];
                    let bg = colors[idx % colors.length];
                    
                    // Get latest absensi status for this student
                    let statusSiswa = "BELUM ADA";
                    let statusBgColor = "bg-gray-50";
                    let statusTextColor = "text-gray-600";
                    
                    if (kehadiranDate !== "-") {
                       const absensiTerkait = state.agmp_absensi.find(a => a.tanggal === kehadiranDate && a.kelasId === s.kelasId);
                       if (absensiTerkait && absensiTerkait.records[s.id]) {
                          statusSiswa = absensiTerkait.records[s.id];
                          if (statusSiswa === "HADIR") { bg = "bg-green-500"; statusBgColor = "bg-green-50"; statusTextColor = "text-green-600"; }
                          else if (statusSiswa === "SAKIT" || statusSiswa === "IZIN") { bg = "bg-amber-500"; statusBgColor = "bg-amber-50"; statusTextColor = "text-amber-600"; }
                          else { statusBgColor = "bg-red-50"; statusTextColor = "text-red-600"; bg = "bg-red-500"; }
                       }
                    }

                    return (
                      <tr key={s.id} className="group">
                        <td className="px-3 py-2 flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full ${bg} flex items-center justify-center text-[8px] text-white flex-shrink-0`}
                          >
                            {s.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[120px]">{s.nama}</span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className={`text-[10px] px-2 py-0.5 rounded-lg ${statusBgColor} ${statusTextColor}`}>
                            {statusSiswa}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {state.agmp_siswa.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-400 font-medium italic">
                  Belum ada data siswa
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 flex justify-center border-t border-gray-100">
              <button
                onClick={() => onNavigate("absensi")}
                className="text-[10px] font-bold text-gray-500 uppercase tracking-widest hover:text-[#007AFF]"
              >
                Buka Modul Absensi →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

