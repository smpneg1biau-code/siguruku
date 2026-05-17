import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  Filter,
  Search,
  RotateCcw,
  X,
  FileText,
  Download,
  Printer,
  UserCircle,
  Target,
  Award,
} from "lucide-react";
import { TabId } from "@/components/Shell";

export default function RekapAkhir({
  onNavigate,
}: {
  onNavigate: (tab: TabId) => void;
}) {
  const { state } = useStore();

  const [selectedKelasId, setSelectedKelasId] = useState(
    state.agmp_kelas[0]?.id || "",
  );
  
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const [selectedTaId, setSelectedTaId] = useState(activeTA?.id || "");

  // For Modal
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"umum" | "formatif" | "sumatif">(
    "umum",
  );

  const selectedTA = state.agmp_tahun_ajaran.find(ta => ta.id === selectedTaId);
  const selectedSemester = selectedTA?.semester || "Ganjil";

  const siswaList = useMemo(() => {
    return state.agmp_siswa
      .filter((s) => s.kelasId === selectedKelasId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [state.agmp_siswa, selectedKelasId]);

  const tpList = useMemo(() => {
    return state.agmp_tp.filter(
      (tp) =>
        tp.kelasIds.includes(selectedKelasId) &&
        tp.semester === selectedSemester,
    );
  }, [state.agmp_tp, selectedKelasId, selectedSemester]);

  const interval = state.agmp_pengaturan.intervalKKTP || {
    batasBawahTuntas: 75,
    batasAtasLanjut: 85,
    batasBawahSelektif: 61,
  };

  // Helper calculation functions
  const calculateKehadiran = (sId: string) => {
    const classAbsensi = state.agmp_absensi.filter(
      (a) => a.kelasId === selectedKelasId && (selectedTaId ? a.taId === selectedTaId : true),
    );
    if (classAbsensi.length === 0)
      return {
        percent: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        bolos: 0,
        total: 0,
      };

    let hadir = 0,
      sakit = 0,
      izin = 0,
      alpa = 0,
      bolos = 0;
    classAbsensi.forEach((a) => {
      const status = a.records[sId];
      if (status === "HADIR") hadir++;
      else if (status === "SAKIT") sakit++;
      else if (status === "IZIN") izin++;
      else if (status === "ALPA") alpa++;
      else if (status === "BOLOS") bolos++;
    });

    const percent = Math.round((hadir / classAbsensi.length) * 100);
    return {
      percent,
      hadir,
      sakit,
      izin,
      alpa,
      bolos,
      total: classAbsensi.length,
    };
  };

  const calculateSumatifForTP = (sId: string, tpId: string) => {
    // A TP can have multiple sumatifs, but in our app we usually have 1 sumatif per TP per Kelas
    // Let's find the sumatif for this TP
    const sumatif = state.agmp_sumatif.find(
      (s) => s.tpId === tpId && s.kelasId === selectedKelasId && (selectedTaId ? (s.taId === selectedTaId || !s.taId) : true),
    );
    if (!sumatif) return { status: "BELUM DINILAI", nilai: 0, isLocked: false };

    let record = sumatif.records[sId];
    if (!record) return { status: "BELUM DINILAI", nilai: 0, isLocked: false };

    // Override with remedial
    const remedial = state.agmp_remedial.find(
      (r) => r.sumatifId === sumatif.id && r.siswaId === sId && (selectedTaId ? r.taId === selectedTaId : true),
    );
    let finalNilai = record.nilai;
    let finalLevel = record.level;
    if (
      remedial &&
      remedial.nilaiBaru !== undefined &&
      remedial.status === "Selesai"
    ) {
      finalNilai = remedial.nilaiBaru;
      if (remedial.levelBaru) finalLevel = remedial.levelBaru;
    }

    const interval = state.agmp_pengaturan.intervalKKTP || {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };
    
    let finalStatus = finalNilai >= interval.batasBawahTuntas ? "TUNTAS" : "BELUM TUNTAS";

    return {
      isLocked: false,
      level: finalLevel,
      nilai: finalNilai,
      status: finalStatus,
      sumatifId: sumatif.id,
      remedial,
    };
  };

  const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId);

  return (
    <div className="space-y-6 h-full flex flex-col pt-4 sm:pt-0 print:space-y-0 print:pt-0">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0 print:hidden px-4 sm:px-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Rekap Akhir Semester
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pantau ketercapaian TP dan kehadiran murid secara komprehensif.
          </p>
        </div>
      </header>

      {/* FILTER SECTION */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 flex-shrink-0 print:hidden mx-4 sm:mx-0">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Kelas
            </label>
            <select
              className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
            >
              <option value="">Semua Kelas</option>
              {state.agmp_kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} (Fase {k.fase})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
              Tahun Ajaran & Semester
            </label>
            <select
              className="w-full text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-100"
              value={selectedTaId}
              onChange={(e) => setSelectedTaId(e.target.value)}
            >
              <option value="">Pilih Tahun Ajaran</option>
              {state.agmp_tahun_ajaran.map(ta => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama} - Semester {ta.semester}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button className="flex-1 bg-[#007AFF] text-white px-4 py-2.5 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
              <Search className="w-4 h-4" /> Tampilkan
            </button>
          </div>
        </div>
      </div>

      {/* REKAP TABLE */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex-1 flex flex-col min-h-[400px] overflow-hidden mx-4 sm:mx-0 print:border-none print:shadow-none print:min-h-0 print:m-0 print:rounded-none">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 print:hidden">
          <h3 className="font-bold text-gray-900">Data Rekap Kelas</h3>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-bold hover:bg-gray-50 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" /> Print Tabel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto flex-1 p-0 print:p-4">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-max">
            <thead className="bg-gray-100 text-[10px] sm:text-xs text-gray-600 uppercase tracking-widest sticky top-0 z-10 print:static">
              <tr>
                <th className="px-4 py-3 font-bold border-b border-gray-200">
                  No
                </th>
                <th className="px-4 py-3 font-bold border-b border-gray-200 sticky left-0 bg-gray-100 z-20">
                  Nama Siswa
                </th>
                <th className="px-4 py-3 font-bold border-b border-gray-200 text-center">
                  % Kehadiran
                </th>
                {tpList.map((tp, i) => (
                  <th
                    key={tp.id}
                    className="px-4 py-3 font-bold border-b border-gray-200 text-center"
                    title={tp.deskripsi}
                  >
                    TP {tp.kode}
                  </th>
                ))}
                <th className="px-4 py-3 font-bold border-b border-gray-200 text-center print:hidden">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {siswaList.length === 0 ? (
                <tr>
                  <td
                    colSpan={tpList.length + 4}
                    className="p-8 text-center text-gray-400 font-medium italic"
                  >
                    Tidak ada data siswa untuk kelas ini.
                  </td>
                </tr>
              ) : (
                siswaList.map((s, idx) => {
                  const keh = calculateKehadiran(s.id);
                  return (
                    <tr
                      key={s.id}
                      className="hover:bg-blue-50/30 transition-colors group"
                    >
                      <td className="px-4 py-3 text-gray-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900 sticky left-0 bg-white group-hover:bg-blue-50/30 print:bg-transparent">
                        {s.nama}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {s.nisn}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`font-bold ${keh.percent >= 85 ? "text-[#34C759]" : keh.percent >= 70 ? "text-[#FF9500]" : "text-[#FF3B30]"}`}
                          >
                            {keh.percent}%
                          </span>
                          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${keh.percent >= 85 ? "bg-[#34C759]" : keh.percent >= 70 ? "bg-[#FF9500]" : "bg-[#FF3B30]"}`}
                              style={{ width: `${keh.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      {tpList.map((tp) => {
                        const res = calculateSumatifForTP(s.id, tp.id);
                        return (
                          <td
                            key={tp.id}
                            className="px-4 py-3 text-center align-middle"
                          >
                            {res.status === "BELUM DINILAI" ? (
                              <span
                                className="text-gray-300 font-bold"
                                title="Belum Dinilai"
                              >
                                ➖
                              </span>
                            ) : res.status === "TUNTAS" ? (
                              <span
                                className="text-green-500 font-bold"
                                title={`Tuntas: ${res.nilai}`}
                              >
                                ✅
                              </span>
                            ) : (
                              <span
                                className="text-red-500 font-bold"
                                title={`Belum Tuntas: ${res.nilai}`}
                              >
                                ❌
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center print:hidden">
                        <button
                          onClick={() => setSelectedSiswaId(s.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg hover:bg-blue-100"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Footer Table for specific class */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 text-xs text-gray-600 print:hidden grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div>
            <strong>Total Siswa:</strong> {siswaList.length} Anak
          </div>
          <div>
            <strong>Total TP (Semester Ini):</strong> {tpList.length} TP
          </div>
          <div>
            <strong>Tahun Ajaran:</strong> {selectedTA ? `${selectedTA.nama} (${selectedTA.semester})` : "Semua Tahun"}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedSiswaId && selectedSiswa && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 print:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedSiswaId(null)}
          ></div>
          <div className="bg-[#F5F5F7] w-full sm:max-w-2xl sm:rounded-2xl h-[90vh] sm:h-[85vh] relative z-10 flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 rounded-t-2xl">
            {/* Modal Header */}
            <div className="bg-white p-5 sm:p-6 border-b border-gray-100 flex-shrink-0 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xl font-black shadow-inner">
                  {selectedSiswa.nama.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 leading-tight">
                    {selectedSiswa.nama}
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    NISN: {selectedSiswa.nisn} • Kelas{" "}
                    {
                      state.agmp_kelas.find((k) => k.id === selectedKelasId)
                        ?.nama
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSiswaId(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="bg-white px-6 flex items-center gap-6 border-b border-gray-100 flex-shrink-0">
              {[
                { id: "umum", icon: UserCircle, label: "Info Umum" },
                { id: "formatif", icon: Target, label: "Formatif" },
                { id: "sumatif", icon: Award, label: "Sumatif" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id as "umum" | "formatif" | "sumatif")
                  }
                  className={`flex items-center gap-2 py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === tab.id ? "border-blue-600 text-blue-700" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                >
                  <tab.icon className="w-4 h-4" /> {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 p-safe space-y-6">
              {activeTab === "umum" &&
                (() => {
                  const keh = calculateKehadiran(selectedSiswa.id);
                  let tuntas = 0,
                    blmTuntas = 0,
                    blmDinilai = 0;
                  tpList.forEach((tp) => {
                    const st = calculateSumatifForTP(
                      selectedSiswa.id,
                      tp.id,
                    ).status;
                    if (st === "TUNTAS") tuntas++;
                    else if (st === "BELUM TUNTAS") blmTuntas++;
                    else blmDinilai++;
                  });

                  let statusAkhir = "SIAP NAIK KELAS";
                  if (blmTuntas > 0) statusAkhir = "PERLU PERHATIAN";
                  if (blmTuntas >= 3) statusAkhir = "PERLU REMEDIAL INTENSIF";

                  return (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      {/* Identitas Card */}
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">
                          Profil Singkat
                        </h4>
                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                          <div>
                            <span className="block text-gray-500 font-medium">
                              Jenis Kelamin
                            </span>
                            <span className="font-bold text-gray-900">
                              {selectedSiswa.jk === "L"
                                ? "Laki-Laki"
                                : "Perempuan"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-gray-500 font-medium">
                              Thn Ajaran / Semester
                            </span>
                            <span className="font-bold text-gray-900">
                              {selectedTA ? `${selectedTA.nama} / ${selectedTA.semester}` : 'Semua Tahun'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Kehadiran Card */}
                      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center gap-6">
                        <div className="shrink-0 w-24 h-24 rounded-full border-4 border-gray-50 flex items-center justify-center relative">
                          <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle
                              className="text-gray-100"
                              strokeWidth="6"
                              stroke="currentColor"
                              fill="transparent"
                              r="42"
                              cx="48"
                              cy="48"
                            />
                            <circle
                              className={`${keh.percent >= 85 ? "text-[#34C759]" : keh.percent >= 70 ? "text-[#FF9500]" : "text-[#FF3B30]"} drop-shadow-sm transition-all duration-1000`}
                              strokeWidth="6"
                              strokeDasharray={`${(keh.percent / 100) * 264} 264`}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="42"
                              cx="48"
                              cy="48"
                            />
                          </svg>
                          <span className="text-xl font-black text-gray-800">
                            {keh.percent}%
                          </span>
                        </div>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-sm">
                          <div className="bg-green-50 rounded-lg py-2">
                            <span className="block font-black text-green-700 text-lg">
                              {keh.hadir}
                            </span>
                            <span className="text-[10px] font-bold text-green-600 uppercase">
                              Hadir
                            </span>
                          </div>
                          <div className="bg-blue-50 rounded-lg py-2">
                            <span className="block font-black text-blue-700 text-lg">
                              {keh.sakit}
                            </span>
                            <span className="text-[10px] font-bold text-blue-600 uppercase">
                              Sakit
                            </span>
                          </div>
                          <div className="bg-orange-50 rounded-lg py-2">
                            <span className="block font-black text-orange-700 text-lg">
                              {keh.izin}
                            </span>
                            <span className="text-[10px] font-bold text-orange-600 uppercase">
                              Izin
                            </span>
                          </div>
                          <div className="bg-red-50 rounded-lg py-2">
                            <span className="block font-black text-red-700 text-lg">
                              {keh.alpa}
                            </span>
                            <span className="text-[10px] font-bold text-red-600 uppercase">
                              Alpa
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Ringkasan TP Card */}
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-5 border-b border-gray-100 grid grid-cols-4 text-center divide-x divide-gray-100">
                          <div>
                            <span className="block text-2xl font-black text-gray-800">
                              {tpList.length}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              Total TP
                            </span>
                          </div>
                          <div>
                            <span className="block text-2xl font-black text-[#34C759]">
                              {tuntas}
                            </span>
                            <span className="text-[10px] font-bold text-[#34C759] uppercase">
                              Tuntas
                            </span>
                          </div>
                          <div>
                            <span className="block text-2xl font-black text-[#FF3B30]">
                              {blmTuntas}
                            </span>
                            <span className="text-[10px] font-bold text-[#FF3B30] uppercase">
                              Blm Tuntas
                            </span>
                          </div>
                          <div>
                            <span className="block text-2xl font-black text-gray-400">
                              {blmDinilai}
                            </span>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">
                              Blm Dinilai
                            </span>
                          </div>
                        </div>
                        <div
                          className={`p-4 text-center font-bold text-sm tracking-widest ${statusAkhir === "SIAP NAIK KELAS" ? "bg-green-600 text-white" : statusAkhir === "PERLU PERHATIAN" ? "bg-[#FF9500] text-white" : "bg-red-600 text-white"}`}
                        >
                          {statusAkhir}
                        </div>
                      </div>
                    </div>
                  );
                })()}

              {activeTab === "formatif" &&
                (() => {
                  const studentFormatifs = state.agmp_formatif.filter(
                    (f) => f.hasil[selectedSiswa.id],
                  );
                  const tpKodeMap: Record<string, string> = {};
                  state.agmp_tp.forEach((t) => (tpKodeMap[t.id] = t.kode));

                  if (studentFormatifs.length === 0)
                    return (
                      <div className="text-center py-10">
                        <p className="text-gray-400 font-medium italic mb-2">
                          Belum ada data formatif untuk siswa ini.
                        </p>
                        <p className="text-xs text-gray-500">
                          Cek berkala untuk update dari guru.
                        </p>
                      </div>
                    );

                  return (
                    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                      {studentFormatifs.map((f) => {
                        const [kelasF, tpIdF] = f.jurnalId.split("_");
                        const tpKode = tpKodeMap[tpIdF] || "?";
                        const res = f.hasil[selectedSiswa.id];

                        let badgeColor = "bg-gray-100 text-gray-700";
                        if (
                          res.status === "Siap Belajar" ||
                          res.status === "4" ||
                          res.status === "3"
                        )
                          badgeColor = "bg-green-100 text-green-700";
                        if (
                          res.status === "Perlu Bimbingan" ||
                          res.status === "1" ||
                          res.status === "2"
                        )
                          badgeColor = "bg-orange-100 text-orange-700";

                        return (
                          <div
                            key={f.id}
                            className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden"
                          >
                            <div
                              className={`absolute top-0 left-0 w-1.5 h-full ${badgeColor.split(" ")[0].replace("100", "500")}`}
                            />
                            <div className="flex justify-between items-start mb-3 pl-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                                    TP {tpKode}
                                  </span>
                                  <span className="text-[10px] font-bold text-gray-400 uppercase">
                                    •{" "}
                                    {f.jenis === "AWAL"
                                      ? "Diagnostic"
                                      : "Monitoring"}
                                  </span>
                                </div>
                                <h4 className="font-bold text-gray-900 text-sm">
                                  Teknik: {f.teknik}
                                </h4>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${badgeColor}`}
                              >
                                {res.status ? (res.status.length <= 2
                                  ? `Level ${res.status}`
                                  : res.status) : "Anekdot"}
                              </span>
                            </div>
                            <div className="pl-3 mt-2 space-y-2">
                              {res.catatan && (
                                <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-gray-200 pl-2">
                                  &quot;{res.catatan}&quot;
                                </p>
                              )}
                              {!res.catatan && (!res.anekdots || res.anekdots.length === 0) && (
                                <p className="text-sm text-gray-400 leading-relaxed italic border-l-2 border-gray-200 pl-2">
                                  Tidak ada catatan spesifik.
                                </p>
                              )}
                              {res.anekdots && res.anekdots.length > 0 && (
                                <div className="space-y-2 mt-2">
                                  {res.anekdots.map((anekdot: any) => (
                                    <div key={anekdot.id} className="text-sm bg-gray-50 border border-gray-100 rounded p-2">
                                      {anekdot.tanggal && (
                                        <span className="inline-block px-1.5 py-0.5 bg-gray-200 text-gray-600 rounded text-[10px] mr-2">
                                          {new Date(anekdot.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
                                        </span>
                                      )}
                                      <span className="text-[10px] uppercase font-bold text-blue-600 mr-2">{anekdot.kategori}</span>
                                      <span className="text-gray-700">{anekdot.teks}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      
                      {state.agmp_anekdot.filter(a => a.siswaId === selectedSiswa.id && (selectedTaId ? a.taId === selectedTaId : true)).length > 0 && (
                        <div className="mt-6">
                            <h4 className="font-bold text-gray-900 text-sm mb-3 px-1">Catatan Anekdot Global (Sikap/Perilaku)</h4>
                            <div className="space-y-3">
                              {state.agmp_anekdot.filter(a => a.siswaId === selectedSiswa.id && (selectedTaId ? a.taId === selectedTaId : true)).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()).map((anet) => (
                                 <div key={anet.id} className="bg-orange-50 border border-orange-100 p-4 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-0.5 bg-orange-200 text-orange-800 text-[10px] font-bold rounded uppercase">
                                        Perilaku
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-500 uppercase">
                                        • {new Date(anet.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'})}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700">{anet.teks}</p>
                                 </div>
                              ))}
                            </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              {activeTab === "sumatif" && (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  {tpList.map((tp) => {
                    const res = calculateSumatifForTP(selectedSiswa.id, tp.id);
                    const sumatifObj = state.agmp_sumatif.find(
                      (s) => s.id === res.sumatifId,
                    );
                    const record = sumatifObj?.records[selectedSiswa.id];

                    return (
                      <div
                        key={tp.id}
                        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                      >
                        {/* Header TP */}
                        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-sm">
                              TP {tp.kode}
                            </h4>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {tp.deskripsi}
                            </p>
                          </div>
                          <span
                            className={`shrink-0 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${res.status === "TUNTAS" ? "bg-[#E8F5E9] text-[#34C759] border border-[#34C759]/20" : res.status === "BELUM TUNTAS" ? "bg-[#FFEBEE] text-[#FF3B30] border border-[#FF3B30]/20" : "bg-[#F5F5F7] text-[#8E8E93] border border-[#E5E5EA]"}`}
                          >
                            {res.status}
                          </span>
                        </div>

                        {/* Body */}
                        <div className="p-4 sm:p-5">
                          {res.status === "BELUM DINILAI" ? (
                            <div className="text-center py-6">
                              <p className="text-gray-400 text-sm font-medium mb-3">
                                Belum ada penilaian sumatif untuk TP
                                ini.
                              </p>
                              <button
                                onClick={() => onNavigate("sumatif")}
                                className="mx-auto block px-4 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                              >
                                Buka Modul Sumatif
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col sm:flex-row gap-6">
                              {/* Nilai Besar Center */}
                              <div className="flex flex-col items-center justify-center shrink-0">
                                <div
                                  className={`w-24 h-24 rounded-full border-4 flex items-center justify-center text-3xl font-black ${res.nilai >= interval.batasAtasLanjut ? "border-blue-100 text-blue-600 bg-blue-50/50" : res.nilai >= interval.batasBawahTuntas ? "border-green-100 text-green-600 bg-green-50/50" : res.nilai >= interval.batasBawahSelektif ? "border-yellow-100 text-yellow-600 bg-yellow-50/50" : "border-red-100 text-red-600 bg-red-50/50"}`}
                                >
                                  {res.nilai}
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-3 whitespace-nowrap">
                                  Nilai Akhir TP
                                </p>
                              </div>

                              {/* Detail */}
                              <div className="flex-1 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                      Teknik & Instrumen
                                    </span>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {sumatifObj?.teknik || "Tertulis"}
                                    </p>
                                  </div>
                                  <div>
                                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                      Level Dicapai
                                    </span>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {res.level ? `Level ${res.level}` : "-"}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
                                    Catatan Guru
                                  </span>
                                  <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic border border-gray-100">
                                    &quot;
                                    {record?.catatan ||
                                      "Telah dievaluasi berdasarkan rubrik/kriteria."}
                                    &quot;
                                  </div>
                                </div>

                                {/* Block Remedial if any */}
                                {res.remedial && (
                                  <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-xl mt-4">
                                    <h5 className="text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-3 border-b border-orange-100 pb-2">
                                      Riwayat Program Remedial
                                    </h5>
                                    <div className="grid grid-cols-2 gap-y-3 text-xs">
                                      <div>
                                        <span className="text-orange-600/70 block mb-0.5">
                                          Jenis Program
                                        </span>
                                        <strong className="text-orange-900">
                                          {res.remedial.jenis}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-orange-600/70 block mb-0.5">
                                          Status Program
                                        </span>
                                        <strong className="text-orange-900">
                                          {res.remedial.status}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-orange-600/70 block mb-0.5">
                                          Nilai Awal Sumatif
                                        </span>
                                        <strong className="text-red-600">
                                          {record?.nilai}
                                        </strong>
                                      </div>
                                      <div>
                                        <span className="text-orange-600/70 block mb-0.5">
                                          Nilai Hasil Remedial
                                        </span>
                                        <strong className="text-orange-900">
                                          {res.remedial.nilaiBaru}
                                        </strong>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-white p-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">
                <Download className="w-4 h-4" /> Export PDF Siswa
              </button>
              <button className="flex-1 bg-green-600 text-white py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-green-700 transition-colors shadow-sm">
                Kirim Info ke Ortu (Simulasi)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
