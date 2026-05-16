import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  BookOpen,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { Remedial as TRemedial } from "@/lib/types";
import { generateId } from "@/lib/utils";

export default function Remedial() {
  const { state, updateItem, addItem, showToast } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualKelasId, setManualKelasId] = useState("");
  const [manualSumatifId, setManualSumatifId] = useState("");
  const [manualSiswaId, setManualSiswaId] = useState("");

  const remedialList = state.agmp_remedial.filter(r => (activeTaId ? r.taId === activeTaId : true));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Direncanakan":
        return "bg-gray-100 text-gray-700";
      case "Berlangsung":
        return "bg-yellow-100 text-yellow-800";
      case "Selesai":
        return "bg-green-100 text-green-800";
      case "Dibatalkan":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const dashboardStats = useMemo(() => {
    let perluPerhatian = 0;
    let berlangsung = 0;
    let selesai = 0;

    remedialList.forEach((r) => {
      if (r.status === "Direncanakan" || r.status === "Dibatalkan")
        perluPerhatian++;
      else if (r.status === "Berlangsung") berlangsung++;
      else if (r.status === "Selesai") selesai++;
    });

    return { perluPerhatian, berlangsung, selesai };
  }, [remedialList]);

  const handleSimpanNilai = (id: string, level: number) => {
    let nilai = 0;
    if (level === 1)
      nilai = 50; // 0-60
    else if (level === 2)
      nilai = 68; // 61-74
    else if (level === 3)
      nilai = 80; // 75-85
    else if (level === 4) nilai = 90; // 86-100

    const statusBaru: "TUNTAS" | "BELUM TUNTAS" =
      nilai >= 75 ? "TUNTAS" : "BELUM TUNTAS";

    updateItem("agmp_remedial", id, {
      levelBaru: level,
      nilaiBaru: nilai,
      statusBaru,
      status: "Selesai",
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Program Remedial</h2>
        <p className="text-sm text-gray-500 mt-1">
          Kelola dan pantau program perbaikan murid secara komprehensif.
        </p>
      </header>

      {/* DASHBOARD TRACKING */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-xl shadow-sm text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-red-700">
              {dashboardStats.perluPerhatian}
            </p>
            <p className="text-xs font-bold text-red-900 uppercase tracking-widest mt-1">
              Perlu Perhatian
            </p>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-xl shadow-sm text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-yellow-700">
              {dashboardStats.berlangsung}
            </p>
            <p className="text-xs font-bold text-yellow-900 uppercase tracking-widest mt-1">
              Sedang Berlangsung
            </p>
          </div>
        </div>
        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex items-center gap-4 shadow-sm">
          <div className="bg-white p-3 rounded-xl shadow-sm text-green-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-green-700">
              {dashboardStats.selesai}
            </p>
            <p className="text-xs font-bold text-green-900 uppercase tracking-widest mt-1">
              Tuntas Remedial
            </p>
          </div>
        </div>
      </div>

      {dashboardStats.perluPerhatian > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-sm text-blue-800">
          Terdapat <strong>{dashboardStats.perluPerhatian} murid</strong> yang
          perlu segera ditindaklanjuti untuk program remedial.
        </div>
      )}

      {/* LIST OF REMEDIAL */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-gray-900">Daftar Murid Remedial</h3>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 font-bold transition-colors w-fit"
          >
            <Plus className="w-4 h-4" /> Flag Manual
          </button>
        </div>

        {showManualAdd && (
          <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm flex flex-col md:flex-row gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                Pilih Kelas
              </label>
              <select
                className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                value={manualKelasId}
                onChange={(e) => {
                  setManualKelasId(e.target.value);
                  setManualSumatifId("");
                  setManualSiswaId("");
                }}
              >
                <option value="">-- Pilih Kelas --</option>
                {state.agmp_kelas.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                Pilih Asesmen Sumatif
              </label>
              <select
                className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                value={manualSumatifId}
                onChange={(e) => {
                  setManualSumatifId(e.target.value);
                  setManualSiswaId("");
                }}
                disabled={!manualKelasId}
              >
                <option value="">-- Pilih Asesmen Sumatif --</option>
                {state.agmp_sumatif
                  .filter((s) => s.kelasId === manualKelasId)
                  .map((s) => {
                    const tp = state.agmp_tp.find((t) => t.id === s.tpId);
                    return (
                      <option key={s.id} value={s.id}>
                        TP {tp?.kode} ({s.teknik})
                      </option>
                    );
                  })}
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                Pilih Siswa (Belum Tuntas)
              </label>
              <select
                className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                value={manualSiswaId}
                onChange={(e) => setManualSiswaId(e.target.value)}
                disabled={!manualSumatifId}
              >
                <option value="">-- Pilih Siswa --</option>
                {manualSumatifId &&
                  state.agmp_siswa
                    .filter((s) => s.kelasId === manualKelasId)
                    .filter((s) => {
                      const sumatif = state.agmp_sumatif.find(
                        (sum) => sum.id === manualSumatifId,
                      );
                      const sumatifRecord = sumatif?.records?.[s.id];
                      return (
                        sumatifRecord && sumatifRecord.status === "BELUM TUNTAS"
                      );
                    })
                    .filter(
                      (s) =>
                        !remedialList.find(
                          (r) =>
                            r.sumatifId === manualSumatifId &&
                            r.siswaId === s.id,
                        ),
                    )
                    .map((s) => {
                      const sumatifRec = state.agmp_sumatif.find(
                        (sum) => sum.id === manualSumatifId,
                      )?.records?.[s.id];
                      return (
                        <option key={s.id} value={s.id}>
                          {s.nama} (Nilai: {sumatifRec?.nilai ?? "-"})
                        </option>
                      );
                    })}
              </select>
            </div>
            <button
              disabled={!manualSumatifId || !manualSiswaId}
              onClick={() => {
                if (!activeTaId) {
                  showToast('Tidak ada Tahun Ajaran yang aktif!', 'error');
                  return;
                }
                const sumatif = state.agmp_sumatif.find(
                  (s) => s.id === manualSumatifId,
                );
                if (sumatif) {
                  addItem("agmp_remedial", {
                    id: generateId(),
                    taId: activeTaId,
                    tpId: sumatif.tpId,
                    kelasId: sumatif.kelasId,
                    sumatifId: sumatif.id,
                    siswaId: manualSiswaId,
                    jenis: "Pembelajaran Ulang (Total)",
                    jadwal: "",
                    pic: "Guru",
                    target: "",
                    status: "Direncanakan",
                  });
                  setManualSumatifId("");
                  setManualSiswaId("");
                  setShowManualAdd(false);
                }
              }}
              className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Tambahkan
            </button>
          </div>
        )}

        {remedialList.length === 0 ? (
          <div className="bg-white border rounded-2xl p-10 text-center">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="font-bold text-gray-900">Semua Tuntas!</p>
            <p className="text-sm text-gray-500 mt-2">
              Belum ada data remedial dari modul sumatif akhir.
            </p>
          </div>
        ) : (
          remedialList.map((r) => {
            const siswa = state.agmp_siswa.find((s) => s.id === r.siswaId);
            const tp = state.agmp_tp.find((t) => t.id === r.tpId);
            const sumatifAsli = state.agmp_sumatif.find(
              (s) => s.id === r.sumatifId,
            )?.records[r.siswaId];
            const rubrik = state.agmp_rubrik.find((rub) => rub.tpId === r.tpId);
            const isExpanded = expandedId === r.id;

            return (
              <div
                key={r.id}
                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-gray-300"
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : r.id)}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${r.status === "Selesai" ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}
                    >
                      {r.status === "Selesai" ? "✅" : "👦"}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">
                        {siswa?.nama}
                      </h4>
                      <p className="text-xs text-gray-500 font-medium">
                        TP {tp?.kode} • {tp?.deskripsi?.substring(0, 50)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                        Status Sumatif
                      </p>
                      <p className="text-sm font-bold text-red-600">
                        {sumatifAsli?.nilai ?? "-"} (L
                        {sumatifAsli?.level ?? "-"})
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${getStatusColor(r.status)}`}
                      >
                        {r.status}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          <BookOpen className="w-3.5 h-3.5 inline mr-1" /> Jenis
                          Program
                        </label>
                        <select
                          className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                          value={r.jenis}
                          onChange={(e) =>
                            updateItem("agmp_remedial", r.id, {
                              jenis: e.target.value,
                            })
                          }
                        >
                          <option value="Pembelajaran Ulang (Total)">
                            Pembelajaran Ulang
                          </option>
                          <option value="Pendampingan Tutor Sebaya">
                            Pendampingan Tutor Sebaya
                          </option>
                          <option value="Tugas Pengayaan Terarah">
                            Tugas Pengayaan Terarah
                          </option>
                          <option value="Program Khusus">Program Khusus</option>
                          <option value="Bimbingan Khusus (Selektif)">
                            Bimbingan Khusus (Selektif)
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          <Users className="w-3.5 h-3.5 inline mr-1" /> PIC
                          (Penanggung Jawab)
                        </label>
                        <select
                          className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                          value={r.pic}
                          onChange={(e) =>
                            updateItem("agmp_remedial", r.id, {
                              pic: e.target.value,
                            })
                          }
                        >
                          <option value="Guru">Guru Mata Pelajaran</option>
                          <option value="Teman/Tutor Sebaya">
                            Teman / Tutor Sebaya
                          </option>
                          <option value="Orang Tua">Orang Tua</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          <Clock className="w-3.5 h-3.5 inline mr-1" /> Jadwal
                          Remedial
                        </label>
                        <input
                          type="datetime-local"
                          className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                          value={r.jadwal}
                          onChange={(e) =>
                            updateItem("agmp_remedial", r.id, {
                              jadwal: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />{" "}
                          Target Selesai
                        </label>
                        <input
                          type="date"
                          className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                          value={r.target}
                          onChange={(e) =>
                            updateItem("agmp_remedial", r.id, {
                              target: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
                          Status Penanganan
                        </label>
                        <select
                          className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
                          value={r.status}
                          onChange={(e) =>
                            updateItem("agmp_remedial", r.id, {
                              status: e.target.value as any,
                            })
                          }
                        >
                          <option value="Direncanakan">Direncanakan</option>
                          <option value="Berlangsung">Berlangsung</option>
                          <option value="Selesai">
                            Selesai / Sudah Dinilai
                          </option>
                          <option value="Dibatalkan">Dibatalkan</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm pt-6 mt-4 relative">
                      <div className="absolute -top-3 left-4 bg-blue-100 text-blue-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-blue-200">
                        Input Nilai Remedial
                      </div>

                      <p className="text-sm font-medium text-gray-600 mb-4">
                        Gunakan kembali rubrik TP {tp?.kode} untuk menilai ulang
                        siswa setelah program selesai.
                      </p>

                      {rubrik ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {[
                            {
                              l: 1,
                              label: "L1: Baru Berkembang (0-60)",
                              desc: rubrik.level1,
                              bg: "bg-red-50",
                              active: "bg-red-500 text-white border-red-500",
                            },
                            {
                              l: 2,
                              label: "L2: Layak (61-74)",
                              desc: rubrik.level2,
                              bg: "bg-orange-50",
                              active:
                                "bg-orange-500 text-white border-orange-500",
                            },
                            {
                              l: 3,
                              label: "L3: Cakap (75-85)",
                              desc: rubrik.level3,
                              bg: "bg-green-50",
                              active:
                                "bg-green-500 text-white border-green-500",
                            },
                            {
                              l: 4,
                              label: "L4: Mahir (86-100)",
                              desc: rubrik.level4,
                              bg: "bg-blue-50",
                              active: "bg-blue-500 text-white border-blue-500",
                            },
                          ].map((lvl) => (
                            <div
                              key={lvl.l}
                              onClick={() => handleSimpanNilai(r.id, lvl.l)}
                              className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${r.levelBaru === lvl.l ? lvl.active : `border-gray-100 ${lvl.bg} text-gray-800 hover:border-gray-300`}`}
                            >
                              <p className="font-bold text-sm mb-1">
                                {lvl.label}
                              </p>
                              <p
                                className={`text-xs ${r.levelBaru === lvl.l ? "text-white/90" : "text-gray-500"} line-clamp-2`}
                              >
                                {lvl.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-red-500">
                          Rubrik TP tidak ditemukan. Silakan atur di menu
                          Konfigurasi.
                        </p>
                      )}

                      {r.nilaiBaru !== undefined && (
                        <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl flex justify-between items-center mt-4">
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                              Hasil Remedial (Masuk Rapor)
                            </p>
                            <p className="text-sm font-medium text-gray-700 mt-1">
                              Nilai baru mengesampingkan nilai awal sumatif.
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-gray-900">
                              {r.nilaiBaru}
                            </p>
                            <p
                              className={`text-xs font-bold uppercase ${r.statusBaru === "TUNTAS" ? "text-green-600" : "text-red-500"}`}
                            >
                              {r.statusBaru}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
