import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { generateId, getNilaiDetails } from "@/lib/utils";
import {
  Lock,
  Camera,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Search,
  Activity,
  User,
  Save,
} from "lucide-react";
import { TesTulisConfig } from "@/lib/types";

export default function Sumatif() {
  const { state, addItem, updateItem, showToast } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [kelasId, setKelasId] = useState(state.agmp_kelas[0]?.id || "");
  
  const tpOptions = useMemo(() => 
    state.agmp_tp.filter((t) => t.kelasIds.includes(kelasId)),
    [state.agmp_tp, kelasId]
  );
  
  const [tpId, setTpId] = useState(tpOptions[0]?.id || "");

  useEffect(() => {
    if (tpOptions.length > 0 && !tpOptions.find((t) => t.id === tpId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTpId(tpOptions[0].id);
    } else if (tpOptions.length === 0 && tpId !== "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTpId("");
    }
  }, [tpOptions, tpId]);

  const [teknik, setTeknik] = useState("Tes Tulis (PG/Esai)");
  const [mode, setMode] = useState<"init" | "wizard" | "rekap">("init");
  const [activeSiswaIdx, setActiveSiswaIdx] = useState(0);

  const [jumlahSoal, setJumlahSoal] = useState(5);
  const [tesTulisConfig, setTesTulisConfig] = useState<TesTulisConfig[]>(
    Array(5)
      .fill(null)
      .map((_, i) => ({ id: i, bobotMaksimal: 20 })),
  );

  const handleJumlahSoalChange = (jml: number) => {
    setJumlahSoal(jml);
    setTesTulisConfig(
      Array(jml)
        .fill(null)
        .map((_, i) => ({ id: i, bobotMaksimal: Math.floor(100 / jml) })),
    );
  };

  const sumatifMatches = state.agmp_sumatif.filter((s) => s.kelasId === kelasId && s.tpId === tpId);
  const existingSumatif = activeTaId
    ? sumatifMatches.find((s) => s.taId === activeTaId) || sumatifMatches.find((s) => !s.taId)
    : sumatifMatches[0];
  const sumatifId = existingSumatif?.id;
  const rubrik = state.agmp_rubrik.find((r) => r.tpId === tpId);
  const siswaList = state.agmp_siswa
    .filter((s) => s.kelasId === kelasId)
    .sort((a, b) => a.nama.localeCompare(b.nama));

  // Set default state based on existing data
  useEffect(() => {
    if (existingSumatif) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("rekap");
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode("init");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelasId, tpId, existingSumatif?.id]);

  const handleCreateSumatif = () => {
    if (!activeTaId) {
      showToast('Tidak ada Tahun Ajaran yang aktif!', 'error');
      return;
    }
    const newId = generateId();
    const records: any = {};
    siswaList.forEach(
      (s) =>
        (records[s.id] = {
          level: 0,
          nilai: 0,
          catatan: "",
          status: "BELUM TUNTAS",
          tesTulisScores: {},
        }),
    );

    addItem("agmp_sumatif", {
      id: newId,
      taId: activeTaId,
      tpId,
      kelasId,
      teknik,
      isLocked: false,
      records,
      auditLog: [],
      tesTulisConfig:
        teknik === "Tes Tulis (PG/Esai)" ? tesTulisConfig : undefined,
    });
    setMode("wizard");
    setActiveSiswaIdx(0);
  };

  const handleScoreUpdate = (sId: string, level: number) => {
    if (!existingSumatif) return;

    const interval = state.agmp_pengaturan.intervalKKTP || {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };

    // Auto calculate value based on action requirements
    let nilai = 0;
    if (level === 1)
      nilai = Math.floor(interval.batasBawahSelektif / 2); // default logic for 0-60
    else if (level === 2)
      nilai = Math.floor(
        (interval.batasBawahTuntas + interval.batasBawahSelektif) / 2,
      ); // default logic for L2
    else if (level === 3)
      nilai = Math.floor(
        (interval.batasAtasLanjut + interval.batasBawahTuntas) / 2,
      ); // default logic for L3
    else if (level === 4)
      nilai = Math.floor((100 + interval.batasAtasLanjut) / 2); // default logic for L4

    const status: "TUNTAS" | "BELUM TUNTAS" =
      nilai >= interval.batasBawahTuntas ? "TUNTAS" : "BELUM TUNTAS";

    const newRecords = {
      ...existingSumatif.records,
      [sId]: {
        ...existingSumatif.records[sId],
        level,
        nilai,
        status,
      },
    };

    updateItem("agmp_sumatif", sumatifId!, { records: newRecords });
  };

  const handleTesTulisVal = (sId: string, soalId: number, val: number) => {
    if (!existingSumatif) return;
    const currentScores = existingSumatif.records[sId].tesTulisScores || {};
    const newScores = { ...currentScores, [soalId]: val };
    const totalNilai = Object.values(newScores).reduce((a, b) => a + b, 0);

    const interval = state.agmp_pengaturan.intervalKKTP || {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };

    let level = 1;
    if (totalNilai > interval.batasAtasLanjut) level = 4;
    else if (totalNilai >= interval.batasBawahTuntas) level = 3;
    else if (totalNilai >= interval.batasBawahSelektif) level = 2;
    else level = 1;

    const status: "TUNTAS" | "BELUM TUNTAS" =
      totalNilai >= interval.batasBawahTuntas ? "TUNTAS" : "BELUM TUNTAS";

    updateItem("agmp_sumatif", sumatifId!, {
      records: {
        ...existingSumatif.records,
        [sId]: {
          ...existingSumatif.records[sId],
          tesTulisScores: newScores,
          nilai: totalNilai,
          level,
          status,
        },
      },
    }, true);
  };

  const handleCatatanUpdate = (sId: string, catatan: string) => {
    if (!existingSumatif) return;
    updateItem("agmp_sumatif", sumatifId!, {
      records: {
        ...existingSumatif.records,
        [sId]: { ...existingSumatif.records[sId], catatan },
      },
    }, true);
  };

  const simulateUpload = (sId: string) => {
    if (!existingSumatif) return;
    updateItem("agmp_sumatif", sumatifId!, {
      records: {
        ...existingSumatif.records,
        [sId]: {
          ...existingSumatif.records[sId],
          buktiUrl: "simulated-base64-url",
        },
      },
    }, true);
    alert("Bukti berhasil diunggah (Simulasi)");
  };

  const student = siswaList[activeSiswaIdx];
  const activeRecord =
    student && existingSumatif ? existingSumatif.records[student.id] : null;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Asesmen Sumatif (High Stake)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Evaluasi tahap akhir Tujuan Pembelajaran.
          </p>
        </div>
      </header>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-gray-50 flex-1"
          value={kelasId}
          onChange={(e) => setKelasId(e.target.value)}
        >
          {state.agmp_kelas.map((k) => (
            <option key={k.id} value={k.id}>
              Kelas {k.nama}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-gray-50 flex-1"
          value={tpId}
          onChange={(e) => setTpId(e.target.value)}
        >
          {tpOptions.length === 0 && <option value="" disabled>Tidak ada TP</option>}
          {tpOptions.map((t) => (
            <option key={t.id} value={t.id}>
              TP {t.kode}
            </option>
          ))}
        </select>
      </div>

      {/* INIT WIZARD - Step 1 & 2 */}
      {mode === "init" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="font-bold text-gray-900 text-lg">Inisiasi Sumatif</h3>

          <div>
            <label className="text-sm font-semibold block mb-3">
              Langkah 1: Pilih Teknik Asesmen
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                "Tes Tulis (PG/Esai)",
                "Kinerja/Praktik",
                "Proyek",
                "Observasi Evaluatif",
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => setTeknik(t)}
                  className={`p-3 border rounded-xl text-xs font-bold transition-colors ${teknik === t ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {teknik === "Tes Tulis (PG/Esai)" && (
            <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-blue-900">
                  Konfigurasi Tes Tulis
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-800">Jumlah Soal:</span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={jumlahSoal}
                    onChange={(e) =>
                      handleJumlahSoalChange(Number(e.target.value))
                    }
                    className="w-16 px-2 py-1 text-sm border rounded outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {tesTulisConfig.map((config, idx) => (
                  <div
                    key={config.id}
                    className="bg-white p-2 border rounded-lg flex items-center gap-2"
                  >
                    <span className="text-xs font-semibold text-gray-600">
                      Bobot S{idx + 1}:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.bobotMaksimal || ""}
                      onChange={(e) => {
                        const newConfig = [...tesTulisConfig];
                        newConfig[idx].bobotMaksimal = Number(e.target.value);
                        setTesTulisConfig(newConfig);
                      }}
                      className="w-16 px-2 py-1 text-sm border rounded outline-none bg-gray-50 focus:bg-white focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-semibold block mb-3">
              Langkah 2: Review Rubrik
            </label>
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl">
              {rubrik ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <p className="text-xs font-bold text-red-800 mb-1">
                        Baru Berkembang (L1)
                      </p>
                      <p className="text-xs text-red-700">{rubrik.level1}</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <p className="text-xs font-bold text-orange-800 mb-1">
                        Layak (L2)
                      </p>
                      <p className="text-xs text-orange-700">{rubrik.level2}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                      <p className="text-xs font-bold text-green-800 mb-1">
                        Cakap (L3)
                      </p>
                      <p className="text-xs text-green-700">{rubrik.level3}</p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <p className="text-xs font-bold text-blue-800 mb-1">
                        Mahir (L4)
                      </p>
                      <p className="text-xs text-blue-700">{rubrik.level4}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-gray-500 gap-2">
                  <AlertTriangle className="w-8 h-8 text-orange-400" />
                  <p className="text-sm text-center">
                    Rubrik KKTP belum dikonfigurasi untuk TP ini.
                    <br />
                    Atur di menu Konfigurasi terlebih dahulu.
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCreateSumatif}
            disabled={!rubrik || siswaList.length === 0}
            className="w-full bg-[#007AFF] text-white py-3 rounded-xl font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            Mulai Penilaian ({siswaList.length} Murid)
          </button>
        </div>
      )}

      {/* WIZARD INPUT per Murid */}
      {mode === "wizard" && activeRecord && student && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <button
              onClick={() => {
                if (activeSiswaIdx > 0) setActiveSiswaIdx(activeSiswaIdx - 1);
                else setMode("rekap");
              }}
              className="p-2 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 flex items-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Murid {activeSiswaIdx + 1} dari {siswaList.length}
              </p>
              <div className="w-48 bg-gray-100 h-1.5 rounded-full mt-2 mx-auto">
                <div
                  className="bg-[#007AFF] h-full rounded-full transition-all"
                  style={{
                    width: `${((activeSiswaIdx + 1) / siswaList.length) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <button
              onClick={() => {
                if (activeSiswaIdx < siswaList.length - 1)
                  setActiveSiswaIdx(activeSiswaIdx + 1);
                else setMode("rekap");
              }}
              className="p-2 bg-[#007AFF] rounded-lg text-white font-bold flex items-center text-sm px-4"
            >
              {activeSiswaIdx === siswaList.length - 1 ? "Selesai" : "Lanjut"}{" "}
              <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-4 bg-gray-50/30">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-[#007AFF] flex items-center justify-center text-xl font-bold shrink-0">
                {student.jk === "L" ? "👦" : "👧"}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 truncate">
                  {student.nama}
                </h3>
                <p className="text-sm text-gray-500">NISN: {student.nisn}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-3xl font-black text-gray-900">
                  {activeRecord.nilai > 0 ? activeRecord.nilai : "-"}
                </span>
                {activeRecord.level > 0 && (
                  <p
                    className={`text-[10px] font-bold mt-1 ${activeRecord.status === "TUNTAS" ? "text-green-600" : "text-red-500"}`}
                  >
                    {activeRecord.status}
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                {existingSumatif?.teknik === "Tes Tulis (PG/Esai)" ? (
                  <div className="space-y-3">
                    <label className="text-sm font-bold text-gray-700">
                      Input Nilai Per Soal (Pilih dari{" "}
                      {existingSumatif?.tesTulisConfig?.length || 0} Soal)
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {existingSumatif?.tesTulisConfig?.map((config, idx) => {
                        const val =
                          activeRecord.tesTulisScores?.[config.id] || 0;
                        return (
                          <div
                            key={config.id}
                            className="p-3 border rounded-xl bg-gray-50 flex flex-col gap-1 shadow-sm border-gray-200"
                          >
                            <span className="text-xs font-bold text-gray-600">
                              Soal {idx + 1}{" "}
                              <span className="font-normal text-gray-400">
                                (Max: {config.bobotMaksimal})
                              </span>
                            </span>
                            <input
                              type="number"
                              min="0"
                              max={config.bobotMaksimal}
                              value={val === 0 ? "" : val}
                              onChange={(e) =>
                                handleTesTulisVal(
                                  student.id,
                                  config.id,
                                  Number(e.target.value),
                                )
                              }
                              className="w-full border p-2 rounded bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <label className="text-sm font-bold text-gray-700">
                      Tingkat Capaian Kompetensi
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        {
                          l: 1,
                          label: `Baru Berkembang (0-${(state.agmp_pengaturan.intervalKKTP?.batasBawahSelektif || 61) - 1})`,
                          desc: rubrik?.level1,
                          bg: "bg-red-50",
                          active: "bg-red-500 text-white border-red-500",
                        },
                        {
                          l: 2,
                          label: `Layak (${state.agmp_pengaturan.intervalKKTP?.batasBawahSelektif || 61}-${(state.agmp_pengaturan.intervalKKTP?.batasBawahTuntas || 75) - 1})`,
                          desc: rubrik?.level2,
                          bg: "bg-orange-50",
                          active: "bg-orange-500 text-white border-orange-500",
                        },
                        {
                          l: 3,
                          label: `Cakap (${state.agmp_pengaturan.intervalKKTP?.batasBawahTuntas || 75}-${state.agmp_pengaturan.intervalKKTP?.batasAtasLanjut || 85})`,
                          desc: rubrik?.level3,
                          bg: "bg-green-50",
                          active: "bg-green-500 text-white border-green-500",
                        },
                        {
                          l: 4,
                          label: `Mahir (${(state.agmp_pengaturan.intervalKKTP?.batasAtasLanjut || 85) + 1}-100)`,
                          desc: rubrik?.level4,
                          bg: "bg-blue-50",
                          active: "bg-blue-500 text-white border-blue-500",
                        },
                      ].map((lvl) => (
                        <div
                          key={lvl.l}
                          onClick={() => handleScoreUpdate(student.id, lvl.l)}
                          className={`cursor-pointer p-4 border-2 rounded-xl transition-all ${activeRecord.level === lvl.l ? lvl.active : `border-gray-100 ${lvl.bg} text-gray-800 hover:border-gray-300`}`}
                        >
                          <p className="font-bold text-sm mb-1">{lvl.label}</p>
                          <p
                            className={`text-xs ${activeRecord.level === lvl.l ? "text-white/90" : "text-gray-500"} line-clamp-2`}
                          >
                            {lvl.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-gray-100">
                <div className="flex-1 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Catatan Penilaian
                  </label>
                  <textarea
                    className="w-full text-sm border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-100 bg-gray-50"
                    rows={3}
                    placeholder="Masukkan catatan spesifik mengenai hasil sumatif..."
                    value={activeRecord.catatan}
                    onChange={(e) =>
                      handleCatatanUpdate(student.id, e.target.value)
                    }
                  />
                </div>
                <div className="w-1/3 space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Bukti Kinerja
                  </label>
                  <div
                    onClick={() => simulateUpload(student.id)}
                    className={`h-[94px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${activeRecord.buktiUrl ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 border-gray-200"}`}
                  >
                    {activeRecord.buktiUrl ? (
                      <>
                        <Activity className="w-6 h-6 text-[#007AFF] mb-1" />
                        <span className="text-[10px] text-[#007AFF] font-bold">
                          Bukti Tersimpan
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[10px] text-gray-500 font-bold">
                          Upload Foto
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REKAP & HASIL (Proses Hasil & Audit) */}
      {mode === "rekap" && existingSumatif && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
                <button
                  onClick={() => setMode("wizard")}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Lihat/Isi Nilai Rinci
                </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
              <h3 className="font-bold text-gray-900">
                Ringkasan Hasil Sumatif
              </h3>
              <span className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-500 font-medium">
                Teknik: {existingSumatif.teknik}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="p-4 font-semibold">Nama Siswa</th>
                    <th className="p-4 font-semibold text-center w-24">
                      Level
                    </th>
                    <th className="p-4 font-semibold text-center w-24">
                      Nilai
                    </th>
                    <th className="p-4 font-semibold text-center w-32">
                      Status
                    </th>
                    <th className="p-4 font-semibold w-56">
                      Tindak Lanjut Otomatis
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {siswaList.map((s) => {
                    const r = existingSumatif.records[s.id];
                    if (!r) return null;

                    const interval = state.agmp_pengaturan.intervalKKTP || {
                      batasBawahTuntas: 75,
                      batasAtasLanjut: 85,
                      batasBawahSelektif: 61,
                    };

                    let tindakLanjut = "";
                    let tlBadge = "";
                    if (r.nilai < interval.batasBawahSelektif) {
                      tindakLanjut = "Remedial Total";
                      tlBadge = "bg-red-100 text-red-700";
                    } else if (r.nilai < interval.batasBawahTuntas) {
                      tindakLanjut = "Remedial Selektif";
                      tlBadge = "bg-orange-100 text-orange-700";
                    } else if (r.nilai <= interval.batasAtasLanjut) {
                      tindakLanjut = "Lanjut Materi";
                      tlBadge = "bg-green-100 text-green-700";
                    } else {
                      tindakLanjut = "Pengayaan";
                      tlBadge = "bg-blue-100 text-blue-700";
                    }

                    return (
                      <tr 
                        key={s.id} 
                        className="hover:bg-gray-100 cursor-pointer transition-colors"
                        onClick={() => {
                          const idx = siswaList.findIndex(x => x.id === s.id);
                          if (idx !== -1) {
                            setActiveSiswaIdx(idx);
                            setMode("wizard");
                          }
                        }}
                      >
                        <td className="p-4">
                          <div className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {s.nama}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {s.nisn}
                          </div>
                        </td>
                        <td className="p-4 text-center font-bold text-gray-700">
                          {r.level > 0 ? `L${r.level}` : "-"}
                        </td>
                        <td className="p-4 text-center font-black text-gray-900">
                          {r.nilai > 0 ? r.nilai : "-"}
                        </td>
                        <td className="p-4 text-center">
                          {r.level > 0 ? (
                            <span
                              className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${r.status === "TUNTAS" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                            >
                              {r.status}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4">
                          {r.level > 0 && (
                            <span
                              className={`text-[10px] px-2 py-1 rounded font-bold ${tlBadge}`}
                            >
                              {tindakLanjut}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AUDIT TRAIL */}
          {existingSumatif.auditLog &&
            existingSumatif.auditLog.length > 0 && (
              <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden text-gray-300">
                <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-blue-400" /> Audit Trail Log
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 border border-red-900 px-2 py-1 rounded bg-red-950/50">
                    READ ONLY
                  </span>
                </div>
                <div className="p-4 space-y-3 font-mono text-[11px]">
                  {existingSumatif.auditLog.map((log, idx) => (
                    <div
                      key={idx}
                      className="flex gap-4 border-b border-gray-800 pb-3 last:border-0 last:pb-0"
                    >
                      <div className="text-gray-500 shrink-0">
                        {new Date(log.tanggal).toLocaleString("id-ID", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </div>
                      <div className="text-blue-400 font-bold shrink-0">
                        [{log.user}]
                      </div>
                      <div className="flex-1">{log.action}</div>
                      <div className="text-gray-600 shrink-0">{log.ip}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
