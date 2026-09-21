import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Search,
  Activity,
  Save,
  CheckCircle2,
  ListOrdered,
  FileText,
  Clock,
  Sparkles,
  Award,
  Users,
} from "lucide-react";
import { TesTulisConfig, SumatifRecord } from "@/lib/types";

const INTERVAL_KKTP = {
  batasBawahSelektif: 61,
  batasBawahTuntas: 75,
  batasAtasLanjut: 85,
};

const getLevelAndStatusFromScore = (score: number) => {
  if (score <= 0) {
    return { level: 0, status: "BELUM TUNTAS" as const };
  }
  let level = 1;
  if (score > INTERVAL_KKTP.batasAtasLanjut) level = 4;
  else if (score >= INTERVAL_KKTP.batasBawahTuntas) level = 3;
  else if (score >= INTERVAL_KKTP.batasBawahSelektif) level = 2;
  else level = 1;

  const status = score >= INTERVAL_KKTP.batasBawahTuntas ? ("TUNTAS" as const) : ("BELUM TUNTAS" as const);
  return { level, status };
};

export default function Sumatif() {
  const { state, addItem, updateItem, showToast, filteredKelas } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find((ta) => ta.isActive);
  const activeTaId = activeTA?.id || "";

  const [kelasId, setKelasId] = useState(filteredKelas[0]?.id || "");

  const tpOptions = useMemo(
    () => state.agmp_tp.filter((t) => t.kelasIds.includes(kelasId)),
    [state.agmp_tp, kelasId]
  );

  const [tpId, setTpId] = useState(tpOptions[0]?.id || "");

  useEffect(() => {
    if (tpOptions.length > 0 && !tpOptions.find((t) => t.id === tpId)) {
      setTpId(tpOptions[0].id);
    } else if (tpOptions.length === 0 && tpId !== "") {
      setTpId("");
    }
  }, [tpOptions, tpId]);

  const [teknik, setTeknik] = useState("Tes Tulis (PG/Esai)");
  const [mode, setMode] = useState<"init" | "wizard" | "rekap">("init");
  const [activeSiswaIdx, setActiveSiswaIdx] = useState(0);

  // Local state for records and unsaved tracking
  const [localRecords, setLocalRecords] = useState<Record<string, SumatifRecord>>({});
  const [loadedSumatifId, setLoadedSumatifId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [jumlahSoal, setJumlahSoal] = useState(5);
  const [tesTulisConfig, setTesTulisConfig] = useState<TesTulisConfig[]>(
    Array(5)
      .fill(null)
      .map((_, i) => ({ id: i, bobotMaksimal: 20 }))
  );

  const handleJumlahSoalChange = (jml: number) => {
    const clamped = Math.max(1, Math.min(20, jml));
    setJumlahSoal(clamped);
    setTesTulisConfig(
      Array(clamped)
        .fill(null)
        .map((_, i) => ({ id: i, bobotMaksimal: Math.floor(100 / clamped) }))
    );
  };

  const sumatifMatches = state.agmp_sumatif.filter(
    (s) => s.kelasId === kelasId && s.tpId === tpId
  );
  const existingSumatif = activeTaId
    ? sumatifMatches.find((s) => s.taId === activeTaId) || sumatifMatches.find((s) => !s.taId)
    : sumatifMatches[0];

  const rubrik = state.agmp_rubrik.find((r) => r.tpId === tpId);

  const siswaList = useMemo(() => {
    return state.agmp_siswa
      .filter((s) => s.kelasId === kelasId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [state.agmp_siswa, kelasId]);

  // Sync mode when kelas or TP changes
  useEffect(() => {
    if (existingSumatif) {
      setMode("rekap");
    } else {
      setMode("init");
    }
    setActiveSiswaIdx(0);
  }, [kelasId, tpId]);

  // Synchronize localRecords safely without wiping user's typing
  useEffect(() => {
    if (existingSumatif) {
      // Only reload if this is a different sumatif record than what's currently loaded
      if (loadedSumatifId !== existingSumatif.id) {
        const recordsCopy: Record<string, SumatifRecord> = JSON.parse(
          JSON.stringify(existingSumatif.records || {})
        );
        // Ensure any student in siswaList who might have been added later gets a default entry
        siswaList.forEach((s) => {
          if (!recordsCopy[s.id]) {
            recordsCopy[s.id] = {
              level: 0,
              nilai: 0,
              catatan: "",
              status: "BELUM TUNTAS",
              tesTulisScores: {},
            };
          }
        });
        setLocalRecords(recordsCopy);
        setLoadedSumatifId(existingSumatif.id);
        setHasUnsavedChanges(false);
      }
    } else {
      setLocalRecords({});
      setLoadedSumatifId(null);
      setHasUnsavedChanges(false);
    }
  }, [existingSumatif?.id, loadedSumatifId, siswaList]);

  // Helper to retrieve the current record of a student
  const getStudentRecord = (sId: string): SumatifRecord => {
    if (localRecords[sId]) return localRecords[sId];
    if (existingSumatif?.records?.[sId]) return existingSumatif.records[sId];
    return {
      level: 0,
      nilai: 0,
      catatan: "",
      status: "BELUM TUNTAS",
      tesTulisScores: {},
    };
  };

  // Direct score input handler (Angka Bilangan 0-100)
  const handleDirectNilai = (sId: string, rawVal: string) => {
    let num = 0;
    let level = 0;
    let status: "TUNTAS" | "BELUM TUNTAS" = "BELUM TUNTAS";

    if (rawVal.trim() !== "") {
      num = Math.max(0, Math.min(100, Number(rawVal)));
      const res = getLevelAndStatusFromScore(num);
      level = res.level;
      status = res.status;
    }

    setLocalRecords((prev) => {
      const existing = prev[sId] || {
        catatan: "",
        tesTulisScores: {},
        level: 0,
        nilai: 0,
        status: "BELUM TUNTAS",
      };
      return {
        ...prev,
        [sId]: {
          ...existing,
          nilai: num,
          level,
          status,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Catatan input handler (Kalimat catatan penilaian)
  const handleCatatanUpdate = (sId: string, catatan: string) => {
    setLocalRecords((prev) => {
      const existing = prev[sId] || {
        level: 0,
        nilai: 0,
        status: "BELUM TUNTAS",
        tesTulisScores: {},
      };
      return {
        ...prev,
        [sId]: {
          ...existing,
          catatan,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Level button click handler (L1, L2, L3, L4)
  const handleScoreUpdate = (sId: string, level: number) => {
    let nilai = 0;
    if (level === 1) nilai = Math.floor(INTERVAL_KKTP.batasBawahSelektif / 2); // ~30
    else if (level === 2)
      nilai = Math.floor(
        (INTERVAL_KKTP.batasBawahTuntas + INTERVAL_KKTP.batasBawahSelektif) / 2
      ); // ~68
    else if (level === 3)
      nilai = Math.floor(
        (INTERVAL_KKTP.batasAtasLanjut + INTERVAL_KKTP.batasBawahTuntas) / 2
      ); // ~80
    else if (level === 4)
      nilai = Math.floor((100 + INTERVAL_KKTP.batasAtasLanjut) / 2); // ~92

    const status: "TUNTAS" | "BELUM TUNTAS" =
      nilai >= INTERVAL_KKTP.batasBawahTuntas ? "TUNTAS" : "BELUM TUNTAS";

    setLocalRecords((prev) => {
      const existing = prev[sId] || { catatan: "", tesTulisScores: {} };
      return {
        ...prev,
        [sId]: {
          ...existing,
          level,
          nilai,
          status,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Tes Tulis per-soal input handler
  const handleTesTulisVal = (sId: string, soalId: number, val: number) => {
    const currentScores = localRecords[sId]?.tesTulisScores || {};
    const newScores = { ...currentScores, [soalId]: Math.max(0, val) };
    const totalNilai = Object.values(newScores).reduce(
      (a: number, b: any) => a + Number(b),
      0
    );

    const res = getLevelAndStatusFromScore(totalNilai);

    setLocalRecords((prev) => {
      const existing = prev[sId] || { catatan: "" };
      return {
        ...prev,
        [sId]: {
          ...existing,
          tesTulisScores: newScores,
          nilai: totalNilai,
          level: res.level,
          status: res.status,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Rubrik Deskripsi scale select handler
  const handleRubrikVal = (sId: string, aspekId: string, skalaIdx: number) => {
    const currentScores = localRecords[sId]?.rubrikScores || {};
    const newScores = { ...currentScores, [aspekId]: skalaIdx };

    let status: "TUNTAS" | "BELUM TUNTAS" = "TUNTAS";
    let nilai = 0;

    if (rubrik && rubrik.jenisKKTP === "Rubrik Deskripsi" && rubrik.aspekPenilaian) {
      let totalNilaiEkivalen = 0;
      let totalAspekDinilai = 0;

      for (const aspek of rubrik.aspekPenilaian) {
        const requiredSkala = rubrik.aturanKetuntasan?.[aspek.id] ?? 0;
        const actualSkala = newScores[aspek.id];

        if (actualSkala !== undefined) {
          totalAspekDinilai++;
          let ekivalen = 0;
          if (aspek.ekivalenSkala && aspek.ekivalenSkala[actualSkala] !== undefined) {
            const val = aspek.ekivalenSkala[actualSkala];
            if (typeof val === "string") {
              const parts = val
                .split("-")
                .map((s) => Number(s.trim()))
                .filter((n) => !isNaN(n));
              if (parts.length === 2) ekivalen = (parts[0] + parts[1]) / 2;
              else if (parts.length === 1) ekivalen = parts[0];
            } else if (typeof val === "number") {
              ekivalen = val;
            }
          } else {
            const maxSkalaAspek =
              aspek.skalaPenilaian?.length || rubrik.skalaPenilaian?.length || 4;
            ekivalen = ((actualSkala + 1) / maxSkalaAspek) * 100;
          }
          totalNilaiEkivalen += ekivalen;
        }

        if (actualSkala === undefined || actualSkala < requiredSkala) {
          status = "BELUM TUNTAS";
        }
      }

      if (totalAspekDinilai > 0) {
        nilai = Math.round(totalNilaiEkivalen / totalAspekDinilai);
      }
    }

    const res = getLevelAndStatusFromScore(nilai);
    // Respect rubrik hard failure rule if any aspect is below threshold
    const finalStatus = status === "BELUM TUNTAS" ? "BELUM TUNTAS" : res.status;

    setLocalRecords((prev) => {
      const existing = prev[sId] || { catatan: "" };
      return {
        ...prev,
        [sId]: {
          ...existing,
          rubrikScores: newScores,
          nilai,
          level: res.level,
          status: finalStatus,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  // Daftar Ceklist checkbox handler
  const handleDaftarCeklistVal = (sId: string, aspekId: string, isTercapai: boolean) => {
    const currentScores = localRecords[sId]?.ceklistScores || {};
    const newScores = { ...currentScores, [aspekId]: isTercapai };

    let status: "TUNTAS" | "BELUM TUNTAS" = "BELUM TUNTAS";
    let nilai = 0;

    if (rubrik && rubrik.jenisKKTP === "Daftar Ceklist" && rubrik.aspekPenilaian) {
      const totalKriteria = rubrik.aspekPenilaian.length;
      const tercapaiCount = Object.values(newScores).filter(Boolean).length;
      const syaratMinimal = rubrik.syaratKetuntasanDaftarCeklis || 1;

      nilai = totalKriteria > 0 ? Math.round((tercapaiCount / totalKriteria) * 100) : 0;
      status = tercapaiCount >= syaratMinimal ? "TUNTAS" : "BELUM TUNTAS";
    }

    const level = status === "TUNTAS" ? 3 : 1;

    setLocalRecords((prev) => {
      const existing = prev[sId] || { catatan: "" };
      return {
        ...prev,
        [sId]: {
          ...existing,
          ceklistScores: newScores,
          nilai,
          level,
          status,
        },
      };
    });
    setHasUnsavedChanges(true);
  };

  const simulateUpload = (sId: string) => {
    setLocalRecords((prev) => {
      const existing = prev[sId] || {
        level: 0,
        nilai: 0,
        catatan: "",
        status: "BELUM TUNTAS",
      };
      return {
        ...prev,
        [sId]: {
          ...existing,
          buktiUrl: "https://example.com/simulated-upload.jpg",
        },
      };
    });
    setHasUnsavedChanges(true);
    showToast("Bukti kinerja berhasil diunggah (Simulasi)", "success");
  };

  // Save changes to Firestore
  const handleSimpanData = async () => {
    if (!existingSumatif || !existingSumatif.id) {
      showToast("Asesmen sumatif belum dibuat untuk TP ini.", "error");
      return;
    }
    setIsSaving(true);
    try {
      const updatedAudit = [
        ...(existingSumatif.auditLog || []),
        {
          tanggal: new Date().toISOString(),
          user: state.agmp_pengaturan?.sekolah || state.agmp_pengaturan?.guruNama || "Guru Mata Pelajaran",
          action: "Pembaruan Nilai & Catatan Sumatif",
          ip: "127.0.0.1",
        },
      ].slice(-25);

      await updateItem(
        "agmp_sumatif",
        existingSumatif.id,
        {
          records: localRecords,
          auditLog: updatedAudit,
        },
        true
      );
      setHasUnsavedChanges(false);
      showToast("Nilai dan catatan sumatif berhasil disimpan!", "success");
    } catch (err) {
      console.error(err);
      showToast("Gagal menyimpan data sumatif.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Create or configure assessment
  const handleCreateSumatif = async () => {
    if (!activeTaId) {
      showToast("Tidak ada Tahun Ajaran yang aktif!", "error");
      return;
    }

    if (existingSumatif) {
      const updates: any = { teknik };
      if (teknik === "Tes Tulis (PG/Esai)") {
        updates.tesTulisConfig = tesTulisConfig;
      } else {
        updates.tesTulisConfig = null;
      }
      await updateItem("agmp_sumatif", existingSumatif.id, updates, true);
      setMode("rekap");
      showToast("Konfigurasi sumatif diperbarui!", "success");
      return;
    }

    const newId = generateId();
    const initialRecords: Record<string, SumatifRecord> = {};
    siswaList.forEach((s) => {
      initialRecords[s.id] = {
        level: 0,
        nilai: 0,
        catatan: "",
        status: "BELUM TUNTAS",
        tesTulisScores: {},
      };
    });

    const itemData: any = {
      id: newId,
      taId: activeTaId,
      tpId,
      kelasId,
      teknik,
      isLocked: false,
      records: initialRecords,
      auditLog: [],
    };
    if (teknik === "Tes Tulis (PG/Esai)") {
      itemData.tesTulisConfig = tesTulisConfig;
    }

    await addItem("agmp_sumatif", itemData, true);
    setLoadedSumatifId(newId);
    setLocalRecords(initialRecords);
    setHasUnsavedChanges(false);
    setMode("rekap");
    showToast("Asesmen Sumatif berhasil dimulai!", "success");
  };

  const student = siswaList[activeSiswaIdx];
  const activeRecord = student ? getStudentRecord(student.id) : null;

  // Compute summary stats for the current class
  const summaryStats = useMemo(() => {
    let tuntasCount = 0;
    let belumCount = 0;
    let totalScore = 0;
    let gradedCount = 0;

    siswaList.forEach((s) => {
      const r = getStudentRecord(s.id);
      if (r.nilai > 0 || r.level > 0) {
        gradedCount++;
        totalScore += r.nilai;
        if (r.status === "TUNTAS") tuntasCount++;
        else belumCount++;
      }
    });

    const avgScore = gradedCount > 0 ? (totalScore / gradedCount).toFixed(1) : "-";
    return {
      totalSiswa: siswaList.length,
      gradedCount,
      tuntasCount,
      belumCount,
      avgScore,
    };
  }, [siswaList, localRecords, existingSumatif]);

  return (
    <div id="sumatif-module" className="space-y-6 pb-20">
      {/* Module Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Award className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">
              Penilaian Asesmen Sumatif
            </h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Evaluasi capaian akhir Tujuan Pembelajaran (TP) dengan perhitungan KKTP otomatis.
          </p>
        </div>

        {/* Global Save Button if in wizard or rekap */}
        {existingSumatif && (
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Ada Perubahan Belum Disimpan
              </span>
            )}
            <button
              id="btn-save-sumatif-global"
              onClick={handleSimpanData}
              disabled={isSaving || !hasUnsavedChanges}
              className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-all ${
                hasUnsavedChanges
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200 cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Menyimpan..." : "Simpan Nilai & Catatan"}
            </button>
          </div>
        )}
      </header>

      {/* Selectors */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Kelas
          </label>
          <select
            id="select-kelas-sumatif"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
            value={kelasId}
            onChange={(e) => setKelasId(e.target.value)}
          >
            {filteredKelas.map((k) => (
              <option key={k.id} value={k.id}>
                Kelas {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">
            Tujuan Pembelajaran (TP)
          </label>
          <select
            id="select-tp-sumatif"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-gray-800"
            value={tpId}
            onChange={(e) => setTpId(e.target.value)}
          >
            {tpOptions.length === 0 && (
              <option value="" disabled>
                Tidak ada TP untuk kelas ini
              </option>
            )}
            {tpOptions.map((t) => (
              <option key={t.id} value={t.id}>
                TP {t.kode}: {t.deskripsi ? t.deskripsi.substring(0, 60) + "..." : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* INIT / CONFIG MODE */}
      {mode === "init" && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Inisiasi Asesmen Sumatif
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Tentukan teknik asesmen dan review rubrik kriteria ketercapaian tujuan pembelajaran (KKTP) sebelum memulai penilaian.
            </p>
          </div>

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-3">
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
                  className={`p-3 border rounded-xl text-xs font-bold transition-all text-left flex flex-col justify-between h-20 ${
                    teknik === t
                      ? "bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-100 shadow-sm"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span>{t}</span>
                  <span className="text-[10px] font-normal text-gray-400">
                    {t === "Tes Tulis (PG/Esai)" ? "Penilaian per butir soal" : "Penilaian rubrik/skala"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {teknik === "Tes Tulis (PG/Esai)" && (
            <div className="p-5 bg-blue-50/70 border border-blue-100 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-blue-900">
                  Konfigurasi Butir Tes Tulis
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-800 font-medium">
                    Jumlah Butir Soal:
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={jumlahSoal}
                    onChange={(e) =>
                      handleJumlahSoalChange(Number(e.target.value))
                    }
                    className="w-16 px-2 py-1 text-sm font-bold text-center border border-blue-200 rounded-lg outline-none bg-white"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {tesTulisConfig.map((config, idx) => (
                  <div
                    key={config.id}
                    className="bg-white px-3 py-2 border border-blue-100 rounded-xl flex items-center gap-2 shadow-xs"
                  >
                    <span className="text-xs font-bold text-gray-700">
                      Soal {idx + 1}:
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
                      className="w-14 px-1.5 py-0.5 text-xs text-center border border-gray-200 rounded-md outline-none bg-gray-50 focus:bg-white focus:border-blue-400"
                    />
                    <span className="text-[10px] text-gray-400">Poin</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-bold text-gray-700 block mb-3">
              Langkah 2: Review KKTP & Rubrik Acuan
            </label>
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-2xl space-y-4">
              {rubrik ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Jenis KKTP:{" "}
                      <span className="text-blue-600">
                        {rubrik.jenisKKTP || "Interval Nilai"}
                      </span>
                    </h4>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      Siap Digunakan
                    </span>
                  </div>

                  {rubrik.aspekPenilaian && rubrik.aspekPenilaian.length > 0 && (
                    <div>
                      <h5 className="text-xs font-bold text-gray-600 mb-2">
                        Indikator / Kriteria yang Dinilai:
                      </h5>
                      <ul className="list-disc pl-5 text-xs text-gray-600 space-y-1">
                        {rubrik.aspekPenilaian.map((aspek) => (
                          <li key={aspek.id} className="font-medium">
                            {aspek.nama}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {rubrik.level1 && rubrik.level4 && (
                    <div>
                      <h5 className="text-xs font-bold text-gray-600 mb-2">
                        Deskripsi Skala Capaian:
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                          <p className="text-xs font-bold text-red-800 mb-1">
                            Baru Berkembang (L1)
                          </p>
                          <p className="text-[11px] text-red-700 line-clamp-3">
                            {rubrik.level1}
                          </p>
                        </div>
                        <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                          <p className="text-xs font-bold text-orange-800 mb-1">
                            Layak (L2)
                          </p>
                          <p className="text-[11px] text-orange-700 line-clamp-3">
                            {rubrik.level2}
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded-xl border border-green-100">
                          <p className="text-xs font-bold text-green-800 mb-1">
                            Cakap (L3)
                          </p>
                          <p className="text-[11px] text-green-700 line-clamp-3">
                            {rubrik.level3}
                          </p>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <p className="text-xs font-bold text-blue-800 mb-1">
                            Mahir (L4)
                          </p>
                          <p className="text-[11px] text-blue-700 line-clamp-3">
                            {rubrik.level4}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center py-6 text-gray-500 gap-2">
                  <AlertTriangle className="w-8 h-8 text-amber-500" />
                  <p className="text-sm text-center font-medium">
                    Rubrik / KKTP belum dikonfigurasi untuk TP ini.
                    <br />
                    <span className="text-xs text-gray-400">
                      Anda tetap dapat menilai dengan input angka langsung atau mengaturnya di menu Konfigurasi.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          <button
            id="btn-mulai-sumatif"
            onClick={handleCreateSumatif}
            disabled={siswaList.length === 0}
            className="w-full bg-[#007AFF] text-white py-3.5 rounded-xl font-bold disabled:opacity-50 hover:bg-blue-600 transition-colors shadow-sm text-sm flex items-center justify-center gap-2"
          >
            <Award className="w-4 h-4" />
            {existingSumatif
              ? "Simpan Perubahan Konfigurasi & Kembali ke Rekap"
              : `Mulai Penilaian Sumatif (${siswaList.length} Murid)`}
          </button>
        </div>
      )}

      {/* WIZARD MODE (Input Kartu Rinci per Murid) */}
      {mode === "wizard" && student && activeRecord && (
        <div className="space-y-4">
          {/* Wizard Top Nav */}
          <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm gap-3">
            <div className="flex items-center gap-2">
              <button
                id="btn-wizard-prev"
                onClick={() => {
                  if (activeSiswaIdx > 0) setActiveSiswaIdx(activeSiswaIdx - 1);
                  else setMode("rekap");
                }}
                className="p-2 bg-gray-100 rounded-xl text-gray-700 hover:bg-gray-200 transition-colors"
                title="Siswa Sebelumnya"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Quick Student Selector */}
              <select
                id="select-quick-student"
                value={activeSiswaIdx}
                onChange={(e) => setActiveSiswaIdx(Number(e.target.value))}
                className="text-xs font-bold bg-gray-50 border border-gray-200 rounded-xl py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              >
                {siswaList.map((s, idx) => (
                  <option key={s.id} value={idx}>
                    {idx + 1}. {s.nama} ({getStudentRecord(s.id).nilai > 0 ? `Nilai: ${getStudentRecord(s.id).nilai}` : "Belum dinilai"})
                  </option>
                ))}
              </select>

              <button
                id="btn-wizard-next"
                onClick={() => {
                  if (activeSiswaIdx < siswaList.length - 1)
                    setActiveSiswaIdx(activeSiswaIdx + 1);
                  else setMode("rekap");
                }}
                className="p-2 bg-gray-100 rounded-xl text-gray-700 hover:bg-gray-200 transition-colors"
                title="Siswa Berikutnya"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Progress */}
            <div className="hidden sm:block text-center flex-1 max-w-xs mx-auto">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Murid {activeSiswaIdx + 1} dari {siswaList.length}
              </p>
              <div className="w-full bg-gray-100 h-2 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((activeSiswaIdx + 1) / siswaList.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-wizard-save"
                onClick={handleSimpanData}
                disabled={isSaving || !hasUnsavedChanges}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  hasUnsavedChanges
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Menyimpan..." : "Simpan"}
              </button>

              <button
                id="btn-wizard-back-rekap"
                onClick={() => setMode("rekap")}
                className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <ListOrdered className="w-4 h-4" />
                Tabel Rekap
              </button>
            </div>
          </div>

          {/* Student Evaluation Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Student Card Header & Direct Score Input */}
            <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gray-50/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-100 text-[#007AFF] flex items-center justify-center text-2xl font-bold shrink-0 shadow-xs">
                  {student.jk === "L" ? "👦" : "👧"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">
                    {student.nama}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    NISN: {student.nisn || "-"} • No. Absen: {activeSiswaIdx + 1}
                  </p>
                </div>
              </div>

              {/* DIRECT SCORE INPUT (Angka Bilangan 0-100) */}
              <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-xs">
                <div className="flex flex-col items-start">
                  <label
                    htmlFor={`input-nilai-wizard-${student.id}`}
                    className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1"
                  >
                    Input Nilai Angka (0-100)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id={`input-nilai-wizard-${student.id}`}
                      type="number"
                      min="0"
                      max="100"
                      value={
                        activeRecord.nilai !== undefined && activeRecord.nilai !== null
                          ? activeRecord.nilai === 0 && activeRecord.level === 0
                            ? ""
                            : activeRecord.nilai
                          : ""
                      }
                      onChange={(e) => handleDirectNilai(student.id, e.target.value)}
                      placeholder="0"
                      className="w-24 text-center text-2xl font-black text-blue-600 bg-blue-50/30 border-2 border-blue-200 focus:border-blue-600 rounded-xl py-1 px-2 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
                    />
                    <div className="space-y-1">
                      {activeRecord.level > 0 ? (
                        <>
                          <span
                            className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-md ${
                              activeRecord.level === 4
                                ? "bg-blue-100 text-blue-700"
                                : activeRecord.level === 3
                                ? "bg-green-100 text-green-700"
                                : activeRecord.level === 2
                                ? "bg-orange-100 text-orange-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            Level {activeRecord.level}
                          </span>
                          <div>
                            <span
                              className={`text-[11px] font-bold ${
                                activeRecord.status === "TUNTAS"
                                  ? "text-green-600"
                                  : "text-red-500"
                              }`}
                            >
                              {activeRecord.status}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">
                          Belum Dinilai
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rubrik / Ceklist / Tes Tulis / Tingkat Capaian */}
            <div className="p-6 space-y-6">
              {rubrik?.jenisKKTP === "Rubrik Deskripsi" && rubrik.aspekPenilaian ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-800">
                      Penilaian Skala Rubrik Deskripsi
                    </label>
                    <span className="text-xs text-gray-500">
                      Nilai angka & ketuntasan dievaluasi otomatis
                    </span>
                  </div>
                  <div className="overflow-x-auto border rounded-xl border-gray-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-3 w-1/2">Aspek / Indikator</th>
                          <th className="p-3 w-1/2">Pencapaian Skala</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rubrik.aspekPenilaian.map((aspek) => {
                          const skalaOptions =
                            aspek.skalaPenilaian || rubrik.skalaPenilaian || [];
                          return (
                            <tr key={aspek.id} className="hover:bg-gray-50/50">
                              <td className="p-3 font-medium text-gray-900">
                                {aspek.nama}
                              </td>
                              <td className="p-3">
                                <select
                                  id={`select-rubrik-${student.id}-${aspek.id}`}
                                  className="w-full p-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#007AFF] text-sm text-gray-800"
                                  value={activeRecord.rubrikScores?.[aspek.id] ?? ""}
                                  onChange={(e) =>
                                    handleRubrikVal(
                                      student.id,
                                      aspek.id,
                                      Number(e.target.value)
                                    )
                                  }
                                >
                                  <option value="" disabled>
                                    Pilih Skala Capaian
                                  </option>
                                  {skalaOptions.map((skala, idx) => {
                                    const desc = aspek.deskripsiSkala?.[idx]
                                      ? ` — ${aspek.deskripsiSkala[idx]}`
                                      : "";
                                    const val =
                                      aspek.ekivalenSkala?.[idx] !== undefined &&
                                      aspek.ekivalenSkala[idx] !== ""
                                        ? ` [Nilai: ${aspek.ekivalenSkala[idx]}]`
                                        : "";
                                    return (
                                      <option key={idx} value={idx}>
                                        {skala}
                                        {desc}
                                        {val}
                                      </option>
                                    );
                                  })}
                                </select>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : rubrik?.jenisKKTP === "Daftar Ceklist" && rubrik.aspekPenilaian ? (
                <div className="space-y-4">
                  <label className="text-sm font-bold text-gray-800">
                    Penilaian Daftar Ceklist
                    <span className="ml-2 font-normal text-xs text-gray-500">
                      (Syarat Ketuntasan: Minimal{" "}
                      {rubrik.syaratKetuntasanDaftarCeklis || 1} Kriteria Tercapai)
                    </span>
                  </label>
                  <div className="overflow-x-auto border rounded-xl border-gray-200">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                          <th className="p-3 w-3/4">Kriteria / Indikator</th>
                          <th className="p-3 w-1/4 text-center">Tercapai</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {rubrik.aspekPenilaian.map((aspek) => (
                          <tr key={aspek.id} className="hover:bg-gray-50/50">
                            <td className="p-3 font-medium text-gray-900">
                              {aspek.nama}
                            </td>
                            <td className="p-3 text-center">
                              <input
                                id={`check-ceklist-${student.id}-${aspek.id}`}
                                type="checkbox"
                                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                checked={
                                  activeRecord.ceklistScores?.[aspek.id] || false
                                }
                                onChange={(e) =>
                                  handleDaftarCeklistVal(
                                    student.id,
                                    aspek.id,
                                    e.target.checked
                                  )
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : existingSumatif?.teknik === "Tes Tulis (PG/Esai)" ? (
                <div className="space-y-3">
                  <label className="text-sm font-bold text-gray-800">
                    Input Poin Butir Soal (Total Soal:{" "}
                    {existingSumatif?.tesTulisConfig?.length || 0})
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {existingSumatif?.tesTulisConfig?.map((config, idx) => {
                      const val = activeRecord.tesTulisScores?.[config.id] || 0;
                      return (
                        <div
                          key={config.id}
                          className="p-3 border rounded-xl bg-gray-50/70 flex flex-col gap-1 border-gray-200"
                        >
                          <span className="text-xs font-bold text-gray-700">
                            Soal {idx + 1}{" "}
                            <span className="font-normal text-gray-400">
                              (Max: {config.bobotMaksimal})
                            </span>
                          </span>
                          <input
                            id={`input-soal-${student.id}-${config.id}`}
                            type="number"
                            min="0"
                            max={config.bobotMaksimal}
                            value={val === 0 ? "" : val}
                            onChange={(e) =>
                              handleTesTulisVal(
                                student.id,
                                config.id,
                                Number(e.target.value)
                              )
                            }
                            placeholder="0"
                            className="w-full border border-gray-200 p-2 rounded-lg bg-white text-sm font-bold text-center focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-800">
                      Tingkat Capaian Kompetensi (Pilihan Cepat)
                    </label>
                    <span className="text-xs text-gray-400">
                      Klik level untuk mengisi nilai estimasi secara otomatis
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        l: 1,
                        label: `Baru Berkembang (0-60)`,
                        desc: rubrik?.level1 || "Memerlukan bimbingan penuh",
                        bg: "bg-red-50",
                        active: "bg-red-600 text-white border-red-600 shadow-sm",
                      },
                      {
                        l: 2,
                        label: `Layak (61-74)`,
                        desc: rubrik?.level2 || "Mulai menunjukkan pemahaman",
                        bg: "bg-orange-50",
                        active: "bg-orange-500 text-white border-orange-500 shadow-sm",
                      },
                      {
                        l: 3,
                        label: `Cakap (75-85)`,
                        desc: rubrik?.level3 || "Memenuhi kriteria ketuntasan TP",
                        bg: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
                        active: "bg-emerald-600 text-white border-emerald-600 shadow-sm",
                      },
                      {
                        l: 4,
                        label: `Mahir (86-100)`,
                        desc: rubrik?.level4 || "Menguasai kompetensi melampaui target",
                        bg: "bg-blue-600 text-white border-blue-600 shadow-sm",
                        active: "bg-blue-600 text-white border-blue-600 shadow-sm",
                      },
                    ].map((lvl) => (
                      <button
                        id={`btn-level-${student.id}-${lvl.l}`}
                        key={lvl.l}
                        type="button"
                        onClick={() => handleScoreUpdate(student.id, lvl.l)}
                        className={`text-left p-4 border-2 rounded-2xl transition-all cursor-pointer ${
                          activeRecord.level === lvl.l
                            ? lvl.active
                            : `border-gray-100 ${lvl.bg} text-gray-800 hover:border-gray-300`
                        }`}
                      >
                        <p className="font-bold text-sm mb-1">{lvl.label}</p>
                        <p
                          className={`text-xs ${
                            activeRecord.level === lvl.l
                              ? "text-white/90"
                              : "text-gray-500"
                          } line-clamp-2`}
                        >
                          {lvl.desc}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CATATAN PENILAIAN & BUKTI KINERJA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label
                      htmlFor={`textarea-catatan-${student.id}`}
                      className="text-xs font-bold text-gray-700 uppercase tracking-wider"
                    >
                      Catatan Penilaian Siswa
                    </label>
                    <span className="text-[11px] text-gray-400">
                      {(activeRecord.catatan || "").length} karakter
                    </span>
                  </div>
                  <textarea
                    id={`textarea-catatan-${student.id}`}
                    rows={3}
                    placeholder="Masukkan kalimat catatan evaluasi spesifik mengenai hasil sumatif siswa..."
                    value={activeRecord.catatan || ""}
                    onChange={(e) =>
                      handleCatatanUpdate(student.id, e.target.value)
                    }
                    className="w-full text-sm border-2 border-gray-200 focus:border-blue-500 rounded-xl p-3 outline-none focus:ring-4 focus:ring-blue-50 bg-white transition-all text-gray-800"
                  />
                  <p className="text-[11px] text-gray-400">
                    Catatan ini akan otomatis masuk ke rekap akhir dan pertimbangan deskripsi rapor.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Bukti Kinerja / Hasil
                  </label>
                  <div
                    id={`upload-bukti-${student.id}`}
                    onClick={() => simulateUpload(student.id)}
                    className={`h-[96px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                      activeRecord.buktiUrl
                        ? "bg-blue-50 border-blue-300"
                        : "hover:bg-gray-50 border-gray-200"
                    }`}
                  >
                    {activeRecord.buktiUrl ? (
                      <>
                        <Activity className="w-6 h-6 text-blue-600 mb-1" />
                        <span className="text-[11px] text-blue-700 font-bold">
                          Bukti Tersimpan
                        </span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-6 h-6 text-gray-400 mb-1" />
                        <span className="text-[11px] text-gray-500 font-medium">
                          Unggah Foto Hasil / LKPD
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

      {/* REKAP & TABLE VIEW */}
      {mode === "rekap" && existingSumatif && (
        <div className="space-y-6">
          {/* Summary Dashboard Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Total Murid
                </p>
                <p className="text-xl font-black text-gray-900">
                  {summaryStats.totalSiswa}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Tuntas
                </p>
                <p className="text-xl font-black text-emerald-600">
                  {summaryStats.tuntasCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-50 text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Belum Tuntas
                </p>
                <p className="text-xl font-black text-red-600">
                  {summaryStats.belumCount}
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Rata-rata Nilai
                </p>
                <p className="text-xl font-black text-purple-600">
                  {summaryStats.avgScore}
                </p>
              </div>
            </div>
          </div>

          {/* Table Header Controls */}
          <div className="flex flex-wrap justify-between items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2">
              <button
                id="btn-switch-mode-wizard"
                onClick={() => {
                  setActiveSiswaIdx(0);
                  setMode("wizard");
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 font-bold rounded-xl text-xs hover:bg-blue-100 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Buka Mode Kartu / Wizard
              </button>

              <button
                id="btn-switch-mode-init"
                onClick={() => setMode("init")}
                className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl text-xs hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Ubah Konfigurasi Asesmen
              </button>
            </div>

            <div className="text-xs text-gray-500 font-medium">
              Teknik:{" "}
              <span className="font-bold text-gray-800">
                {existingSumatif.teknik}
              </span>
            </div>
          </div>

          {/* Help Banner */}
          <div className="bg-blue-50/70 border border-blue-200/60 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
            <span className="text-base">💡</span>
            <div>
              <span className="font-bold">Input Cepat:</span> Anda dapat langsung mengetik{" "}
              <span className="font-semibold">Nilai Angka (0-100)</span> dan{" "}
              <span className="font-semibold">Catatan Penilaian</span> siswa pada tabel di bawah ini, atau klik tombol{" "}
              <span className="font-semibold">Detail</span> untuk penilaian rubrik rinci.
            </div>
          </div>

          {/* Table View */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-[10px] text-gray-500 uppercase tracking-widest border-b border-gray-200">
                  <tr>
                    <th className="p-3.5 font-bold w-12 text-center">No</th>
                    <th className="p-3.5 font-bold min-w-[180px]">Nama Siswa</th>
                    <th className="p-3.5 font-bold text-center w-28">
                      Nilai (0-100)
                    </th>
                    <th className="p-3.5 font-bold text-center w-24">Level</th>
                    <th className="p-3.5 font-bold text-center w-28">Status</th>
                    <th className="p-3.5 font-bold min-w-[240px]">Catatan Penilaian</th>
                    <th className="p-3.5 font-bold w-36 text-center">Tindak Lanjut</th>
                    <th className="p-3.5 font-bold w-20 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {siswaList.map((s, idx) => {
                    const r = getStudentRecord(s.id);

                    let tindakLanjut = "-";
                    let tlBadge = "bg-gray-100 text-gray-500";
                    if (r.status === "TUNTAS") {
                      if (r.nilai <= INTERVAL_KKTP.batasAtasLanjut) {
                        tindakLanjut = "Lanjut Materi";
                        tlBadge = "bg-green-100 text-green-700";
                      } else {
                        tindakLanjut = "Pengayaan";
                        tlBadge = "bg-blue-100 text-blue-700";
                      }
                    } else if (r.nilai > 0 || r.level > 0) {
                      if (r.nilai < INTERVAL_KKTP.batasBawahSelektif) {
                        tindakLanjut = "Remedial Total";
                        tlBadge = "bg-red-100 text-red-700";
                      } else {
                        tindakLanjut = "Remedial Selektif";
                        tlBadge = "bg-orange-100 text-orange-700";
                      }
                    }

                    return (
                      <tr key={s.id} className="hover:bg-gray-50/70 transition-colors">
                        <td className="p-3 text-center text-xs font-bold text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{s.nama}</div>
                          <div className="text-[11px] text-gray-400">
                            NISN: {s.nisn || "-"}
                          </div>
                        </td>

                        {/* Direct Editable Nilai in Table */}
                        <td className="p-3 text-center">
                          <input
                            id={`table-input-nilai-${s.id}`}
                            type="number"
                            min="0"
                            max="100"
                            value={
                              r.nilai !== undefined && r.nilai !== null
                                ? r.nilai === 0 && r.level === 0
                                  ? ""
                                  : r.nilai
                                : ""
                            }
                            onChange={(e) => handleDirectNilai(s.id, e.target.value)}
                            placeholder="0"
                            className="w-20 text-center font-black text-blue-600 bg-white border border-gray-200 focus:border-blue-500 rounded-lg p-1.5 outline-none focus:ring-2 focus:ring-blue-100 text-base"
                          />
                        </td>

                        {/* Level Badge */}
                        <td className="p-3 text-center">
                          {r.level > 0 ? (
                            <span
                              className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-black ${
                                r.level === 4
                                  ? "bg-blue-100 text-blue-700"
                                  : r.level === 3
                                  ? "bg-green-100 text-green-700"
                                  : r.level === 2
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              L{r.level}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="p-3 text-center">
                          {r.level > 0 || r.nilai > 0 ? (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                r.status === "TUNTAS"
                                  ? "bg-green-50 text-green-700 border border-green-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {r.status}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>

                        {/* Direct Editable Catatan in Table */}
                        <td className="p-3">
                          <input
                            id={`table-input-catatan-${s.id}`}
                            type="text"
                            value={r.catatan || ""}
                            onChange={(e) => handleCatatanUpdate(s.id, e.target.value)}
                            placeholder="Ketik catatan penilaian..."
                            className="w-full text-xs border border-gray-200 focus:border-blue-500 rounded-lg px-2.5 py-1.5 outline-none focus:ring-2 focus:ring-blue-50 bg-white text-gray-800"
                          />
                        </td>

                        {/* Tindak Lanjut */}
                        <td className="p-3 text-center">
                          {r.level > 0 || r.nilai > 0 ? (
                            <span
                              className={`inline-block text-[10px] px-2.5 py-1 rounded-full font-bold ${tlBadge}`}
                            >
                              {tindakLanjut}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>

                        {/* Action: Open Wizard for this student */}
                        <td className="p-3 text-center">
                          <button
                            id={`btn-detail-siswa-${s.id}`}
                            onClick={() => {
                              setActiveSiswaIdx(idx);
                              setMode("wizard");
                            }}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg text-xs font-bold flex items-center justify-center mx-auto transition-colors cursor-pointer"
                            title="Buka Penilaian Rinci / Rubrik"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Log */}
          {existingSumatif.auditLog && existingSumatif.auditLog.length > 0 && (
            <div className="bg-gray-900 rounded-2xl shadow-sm border border-gray-800 overflow-hidden text-gray-300">
              <div className="p-4 border-b border-gray-800 bg-gray-950/50 flex justify-between items-center">
                <h3 className="font-bold text-white text-xs flex items-center gap-2">
                  <Search className="w-4 h-4 text-blue-400" /> Audit Log Penilaian Sumatif
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {existingSumatif.auditLog.length} Riwayat Tercatat
                </span>
              </div>
              <div className="p-4 space-y-2.5 font-mono text-[11px] max-h-48 overflow-y-auto">
                {existingSumatif.auditLog.map((log, idx) => (
                  <div
                    key={idx}
                    className="flex flex-wrap gap-3 border-b border-gray-800 pb-2 last:border-0 last:pb-0"
                  >
                    <span className="text-gray-500">
                      {new Date(log.tanggal).toLocaleString("id-ID", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-blue-400 font-bold">[{log.user}]</span>
                    <span className="text-gray-300 flex-1">{log.action}</span>
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
