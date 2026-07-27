"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, 
  Save, 
  RotateCcw, 
  CheckCircle2, 
  Search, 
  Filter, 
  HelpCircle,
  Award,
  Sparkles,
  Printer
} from "lucide-react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { 
  KOKU_RUBRIK_STANDARD_FASE_D, 
  PREDIKAT_MAPPING_INFO 
} from "@/lib/kokuReferenceData";
import { RubrikKokurikuler, KegiatanKokurikuler } from "@/lib/types";

export default function SettingRubrikKoku() {
  const { state, addItem, updateItem, showToast } = useStore();

  const kegiatanList = useMemo(() => state.agmp_kegiatan_kokurikuler || [], [state.agmp_kegiatan_kokurikuler]);
  const temaList = state.agmp_tema_kokurikuler || [];
  const dimensiList = useMemo(() => state.agmp_dimensi || [], [state.agmp_dimensi]);
  const savedRubrikList = useMemo(() => state.agmp_rubrik_kokurikuler || [], [state.agmp_rubrik_kokurikuler]);

  const [selectedKegiatanId, setSelectedKegiatanId] = useState<string>("");
  const [selectedDimensiFilter, setSelectedDimensiFilter] = useState<string>("");
  const [selectedSubDimensiFilter, setSelectedSubDimensiFilter] = useState<string>("");

  // Local state for live editing of rubrics: Key = `${kegiatanId || 'global'}_${dimensiNama}_${subDimensiNama}`
  const [rubrikState, setRubrikState] = useState<Record<string, {
    id?: string;
    deskripsiSB: string;
    deskripsiB: string;
    deskripsiC: string;
    deskripsiK: string;
    standarKelulusan: "SB" | "B" | "C" | "K";
  }>>({});

  // Populate initial state from saved store data or default standards
  useEffect(() => {
    const initialState: Record<string, {
      id?: string;
      deskripsiSB: string;
      deskripsiB: string;
      deskripsiC: string;
      deskripsiK: string;
      standarKelulusan: "SB" | "B" | "C" | "K";
    }> = {};

    // First load static standards
    KOKU_RUBRIK_STANDARD_FASE_D.forEach((dim) => {
      dim.subDimensiList.forEach((sub) => {
        const keyGlobal = `global_${dim.dimensiNama}_${sub.nama}`;
        initialState[keyGlobal] = {
          deskripsiSB: sub.M,
          deskripsiB: sub.C,
          deskripsiC: sub.B,
          deskripsiK: sub.K,
          standarKelulusan: "B",
        };
      });
    });

    // Override with saved items from store
    savedRubrikList.forEach((r) => {
      const kegKey = r.kegiatanId || "global";
      const key = `${kegKey}_${r.dimensiNama}_${r.subDimensiNama}`;
      initialState[key] = {
        id: r.id,
        deskripsiSB: r.deskripsiSB,
        deskripsiB: r.deskripsiB,
        deskripsiC: r.deskripsiC,
        deskripsiK: r.deskripsiK,
        standarKelulusan: r.standarKelulusan || "B",
      };
    });

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRubrikState(initialState);
  }, [savedRubrikList]);

  // Selected Kegiatan object
  const selectedKegiatan = useMemo(() => {
    return kegiatanList.find(k => k.id === selectedKegiatanId) || null;
  }, [kegiatanList, selectedKegiatanId]);

  const filterDimensiOptions = useMemo(() => {
    if (!selectedKegiatan || !selectedKegiatan.capaianProfil) return [];
    
    const options: string[] = [];
    selectedKegiatan.capaianProfil.forEach(cp => {
      const dimObj = dimensiList.find(d => d.id === cp.dimensiId);
      if (dimObj && !options.includes(dimObj.nama)) {
        options.push(dimObj.nama);
      }
    });
    return options;
  }, [selectedKegiatan, dimensiList]);

  const filterSubDimensiOptions = useMemo(() => {
    if (!selectedKegiatan || !selectedKegiatan.capaianProfil || !selectedDimensiFilter) return [];
    
    const options: string[] = [];
    selectedKegiatan.capaianProfil.forEach(cp => {
      const dimObj = dimensiList.find(d => d.id === cp.dimensiId);
      if (dimObj && dimObj.nama === selectedDimensiFilter) {
        cp.subDimensiIds.forEach(subId => {
          const subObj = dimObj.subDimensi?.find(s => s.id === subId);
          if (subObj && !options.includes(subObj.nama)) {
            options.push(subObj.nama);
          }
        });
      }
    });
    return options;
  }, [selectedKegiatan, selectedDimensiFilter, dimensiList]);

  // List of dimensions & sub-dimensions to display
  const activeDimensions = useMemo(() => {
    // Standard 8 dimensions from reference
    let dims = KOKU_RUBRIK_STANDARD_FASE_D.map(d => ({
      nama: d.dimensiNama,
      subDimensi: d.subDimensiList.map(s => ({
        nama: s.nama,
        defaultSB: s.M,
        defaultB: s.C,
        defaultC: s.B,
        defaultK: s.K,
      }))
    }));

    // If user has custom dimensions in `agmp_dimensi`, merge them in if missing
    dimensiList.forEach(customDim => {
      let existing = dims.find(d => d.nama.toLowerCase() === customDim.nama.toLowerCase());
      if (!existing) {
        dims.push({
          nama: customDim.nama,
          subDimensi: (customDim.subDimensi || []).map(s => ({
            nama: s.nama,
            defaultSB: "Tingkat pencapaian sangat baik (Mahir)",
            defaultB: "Tingkat pencapaian baik (Cakap / Standar)",
            defaultC: "Tingkat pencapaian cukup (Berkembang)",
            defaultK: "Tingkat pencapaian kurang (Belum berkembang)",
          }))
        });
      } else {
        // Merge subdimensions if they exist in agmp_dimensi but not in standard list
        (customDim.subDimensi || []).forEach(customSub => {
          if (!existing.subDimensi.find(s => s.nama.toLowerCase() === customSub.nama.toLowerCase())) {
            existing.subDimensi.push({
              nama: customSub.nama,
              defaultSB: "Tingkat pencapaian sangat baik (Mahir)",
              defaultB: "Tingkat pencapaian baik (Cakap / Standar)",
              defaultC: "Tingkat pencapaian cukup (Berkembang)",
              defaultK: "Tingkat pencapaian kurang (Belum berkembang)",
            });
          }
        });
      }
    });

    // If a Kegiatan is selected, filter by its CapaianProfil
    if (selectedKegiatan && selectedKegiatan.capaianProfil) {
      const allowedDimensiNames = new Map<string, Set<string>>(); // dimName -> Set(subDimNames)
      selectedKegiatan.capaianProfil.forEach(cp => {
        const dimObj = dimensiList.find(d => d.id === cp.dimensiId);
        if (dimObj) {
          const subSet = new Set<string>();
          cp.subDimensiIds.forEach(subId => {
            const subObj = dimObj.subDimensi?.find(s => s.id === subId);
            if (subObj) subSet.add(subObj.nama.trim().toLowerCase());
          });
          allowedDimensiNames.set(dimObj.nama.trim().toLowerCase(), subSet);
        }
      });

      dims = dims.filter(d => {
        const dimNameLower = d.nama.trim().toLowerCase();
        if (allowedDimensiNames.has(dimNameLower)) {
          const allowedSubs = allowedDimensiNames.get(dimNameLower);
          d.subDimensi = d.subDimensi.filter(sub => allowedSubs?.has(sub.nama.trim().toLowerCase()));
          return d.subDimensi.length > 0;
        }
        return false;
      });
    } else if (!selectedKegiatanId) {
      // If no kegiatan is selected, show nothing based on new requirement
      return [];
    }

    // Filter by Dimensi dropdown if selected
    if (selectedDimensiFilter) {
      dims = dims.filter(d => d.nama === selectedDimensiFilter);
    }

    // Filter by Sub-dimensi dropdown if selected
    if (selectedSubDimensiFilter) {
      dims = dims.map(d => {
        const filteredSub = d.subDimensi.filter(s => s.nama === selectedSubDimensiFilter);
        return { ...d, subDimensi: filteredSub };
      }).filter(d => d.subDimensi.length > 0);
    }

    return dims;
  }, [dimensiList, selectedDimensiFilter, selectedSubDimensiFilter, selectedKegiatan, selectedKegiatanId]);

  // Handle local text edits
  const handleRubrikChange = (
    dimensiNama: string, 
    subDimensiNama: string, 
    predikat: "SB" | "B" | "C" | "K", 
    value: string
  ) => {
    const kegKey = selectedKegiatanId || "global";
    const key = `${kegKey}_${dimensiNama}_${subDimensiNama}`;

    // Get fallback values from global or standard
    const globalKey = `global_${dimensiNama}_${subDimensiNama}`;
    const fallback = rubrikState[globalKey] || {
      deskripsiSB: "",
      deskripsiB: "",
      deskripsiC: "",
      deskripsiK: "",
    };

    const current = rubrikState[key] || { ...fallback };

    setRubrikState({
      ...rubrikState,
      [key]: {
        ...current,
        [predikat === "SB" ? "deskripsiSB" : predikat === "B" ? "deskripsiB" : predikat === "C" ? "deskripsiC" : "deskripsiK"]: value,
      }
    });
  };

  const handleStandarKelulusanChange = (
    dimensiNama: string,
    subDimensiNama: string,
    value: "SB" | "B" | "C" | "K"
  ) => {
    const kegKey = selectedKegiatanId || "global";
    const key = `${kegKey}_${dimensiNama}_${subDimensiNama}`;

    const globalKey = `global_${dimensiNama}_${subDimensiNama}`;
    const fallback = rubrikState[globalKey] || {
      deskripsiSB: "",
      deskripsiB: "",
      deskripsiC: "",
      deskripsiK: "",
      standarKelulusan: "B",
    };

    const current = rubrikState[key] || { ...fallback };

    setRubrikState({
      ...rubrikState,
      [key]: {
        ...current,
        standarKelulusan: value,
      }
    });
  };

  // Helper to get active value
  const getRubrikValue = (dimensiNama: string, subDimensiNama: string, predikat: "SB" | "B" | "C" | "K") => {
    const kegKey = selectedKegiatanId || "global";
    const key = `${kegKey}_${dimensiNama}_${subDimensiNama}`;
    const globalKey = `global_${dimensiNama}_${subDimensiNama}`;

    if (rubrikState[key]) {
      const val = rubrikState[key][predikat === "SB" ? "deskripsiSB" : predikat === "B" ? "deskripsiB" : predikat === "C" ? "deskripsiC" : "deskripsiK"];
      if (val !== undefined) return val;
    }

    if (rubrikState[globalKey]) {
      const val = rubrikState[globalKey][predikat === "SB" ? "deskripsiSB" : predikat === "B" ? "deskripsiB" : predikat === "C" ? "deskripsiC" : "deskripsiK"];
      if (val !== undefined) return val;
    }

    // Default fallback from standard array
    const stdDim = KOKU_RUBRIK_STANDARD_FASE_D.find(d => d.dimensiNama === dimensiNama);
    const stdSub = stdDim?.subDimensiList.find(s => s.nama === subDimensiNama);
    if (stdSub) {
      if (predikat === "SB") return stdSub.M;
      if (predikat === "B") return stdSub.C;
      if (predikat === "C") return stdSub.B;
      if (predikat === "K") return stdSub.K;
    }

    return "";
  };

  const getStandarKelulusanValue = (dimensiNama: string, subDimensiNama: string): "SB" | "B" | "C" | "K" => {
    const kegKey = selectedKegiatanId || "global";
    const key = `${kegKey}_${dimensiNama}_${subDimensiNama}`;
    const globalKey = `global_${dimensiNama}_${subDimensiNama}`;

    if (rubrikState[key] && rubrikState[key].standarKelulusan) {
      return rubrikState[key].standarKelulusan;
    }
    if (rubrikState[globalKey] && rubrikState[globalKey].standarKelulusan) {
      return rubrikState[globalKey].standarKelulusan;
    }
    return "B"; // default standard
  };

  // Save all current modifications to store/database
  const handleSaveAll = async () => {
    try {
      let countSaved = 0;
      const kegKey = selectedKegiatanId || undefined;

      for (const dim of activeDimensions) {
        for (const sub of dim.subDimensi) {
          const key = `${selectedKegiatanId || "global"}_${dim.nama}_${sub.nama}`;
          const current = rubrikState[key];

          const deskSB = current?.deskripsiSB ?? getRubrikValue(dim.nama, sub.nama, "SB");
          const deskB = current?.deskripsiB ?? getRubrikValue(dim.nama, sub.nama, "B");
          const deskC = current?.deskripsiC ?? getRubrikValue(dim.nama, sub.nama, "C");
          const deskK = current?.deskripsiK ?? getRubrikValue(dim.nama, sub.nama, "K");
          const standar = current?.standarKelulusan ?? getStandarKelulusanValue(dim.nama, sub.nama);

          // Find existing item in savedRubrikList
          const existing = savedRubrikList.find(r => 
            (r.kegiatanId || "") === (kegKey || "") &&
            r.dimensiNama === dim.nama &&
            r.subDimensiNama === sub.nama
          );

          if (existing) {
            await updateItem("agmp_rubrik_kokurikuler", existing.id, {
              kegiatanId: kegKey,
              dimensiNama: dim.nama,
              subDimensiNama: sub.nama,
              deskripsiSB: deskSB,
              deskripsiB: deskB,
              deskripsiC: deskC,
              deskripsiK: deskK,
              standarKelulusan: standar,
            });
            countSaved++;
          } else {
            await addItem("agmp_rubrik_kokurikuler", {
              id: generateId(),
              kegiatanId: kegKey,
              dimensiNama: dim.nama,
              subDimensiNama: sub.nama,
              deskripsiSB: deskSB,
              deskripsiB: deskB,
              deskripsiC: deskC,
              deskripsiK: deskK,
              standarKelulusan: standar,
            });
            countSaved++;
          }
        }
      }

      showToast(`Berhasil menyimpan ${countSaved} setting kriteria rubrik kokurikuler`, "success");
    } catch (error) {
      showToast("Gagal menyimpan setting rubrik", "error");
    }
  };

  // Reset to default standard Panduan 2025
  const handleResetToStandard = () => {
    if (confirm("Reset kriteria rubrik ke standar resmi Panduan Kokurikuler 2025 (Fase D)?")) {
      const kegKey = selectedKegiatanId || "global";
      const newRubState = { ...rubrikState };

      KOKU_RUBRIK_STANDARD_FASE_D.forEach((dim) => {
        dim.subDimensiList.forEach((sub) => {
          const key = `${kegKey}_${dim.dimensiNama}_${sub.nama}`;
          newRubState[key] = {
            deskripsiSB: sub.M,
            deskripsiB: sub.C,
            deskripsiC: sub.B,
            deskripsiK: sub.K,
            standarKelulusan: "B",
          };
        });
      });

      setRubrikState(newRubState);
      showToast("Berhasil mereset kriteria rubrik ke standar Panduan 2025", "success");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-gray-900">Setting Rubrik Kokurikuler</h2>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-blue-100 text-blue-800 rounded-full border border-blue-300">
              Fase D (Panduan 2025)
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Menetapkan kriteria deskripsi capaian untuk predikat <b>Sangat Baik (SB)</b>, <b>Baik (B)</b>, <b>Cukup (C)</b>, dan <b>Kurang (K)</b> pada setiap Dimensi & Sub-dimensi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleResetToStandard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-2xs transition-all"
            title="Kembalikan kriteria ke standar Panduan 2025"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reset Standar 2025
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-semibold shadow-2xs transition-all"
          >
            <Printer className="w-3.5 h-3.5" /> Cetak Rubrik
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Simpan Setting Rubrik
          </button>
        </div>
      </header>

      {/* Info Card - Predikat Mapping Standard */}
      <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-white p-5 rounded-2xl border border-blue-100 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">
                Standar Pemetaan Predikat Nilai (Panduan Kokurikuler 2025 - Fase D)
              </h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kriteria rubrik penilaian dikelompokkan ke dalam 4 predikat utama. Nilai <b>Baik (B)</b> berpedoman pada <b>Tahap Cakap</b> sebagai standar kelulusan minimal.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-1">
              {PREDIKAT_MAPPING_INFO.map((p) => (
                <div key={p.code} className={`p-2.5 rounded-xl border ${p.color} bg-white/80 shadow-2xs space-y-1`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold uppercase tracking-wide">[{p.code}] {p.predikat}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 border border-gray-200">
                      {p.code === "SB" ? "M" : p.code === "B" ? "C" : p.code === "C" ? "B" : "K"}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-gray-700">{p.level}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Filter Kegiatan Kokurikuler */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Target Kegiatan Kokurikuler:
            </label>
            <select
              value={selectedKegiatanId}
              onChange={(e) => {
                setSelectedKegiatanId(e.target.value);
                setSelectedDimensiFilter("");
                setSelectedSubDimensiFilter("");
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#007AFF] outline-none"
            >
              <option value="">-- Semua Kegiatan / Rubrik Standar Global --</option>
              {kegiatanList.map((k) => {
                const tema = temaList.find(t => t.id === k.temaId);
                return (
                  <option key={k.id} value={k.id}>
                    Kegiatan #{k.noUrut}: {k.nama} {tema ? `(${tema.nama})` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Filter Dimensi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Dimensi:
            </label>
            <select
              value={selectedDimensiFilter}
              onChange={(e) => {
                setSelectedDimensiFilter(e.target.value);
                setSelectedSubDimensiFilter("");
              }}
              className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#007AFF] outline-none"
            >
              <option value="">-- Semua Dimensi Lulusan --</option>
              {filterDimensiOptions.map((dimensiNama) => (
                <option key={dimensiNama} value={dimensiNama}>
                  {dimensiNama}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Sub Dimensi */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-blue-600" /> Filter Sub-dimensi:
            </label>
            <select
              value={selectedSubDimensiFilter}
              onChange={(e) => setSelectedSubDimensiFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs font-medium bg-white focus:ring-2 focus:ring-[#007AFF] outline-none disabled:bg-gray-100 disabled:text-gray-400"
              disabled={!selectedDimensiFilter}
            >
              <option value="">
                {!selectedDimensiFilter 
                  ? "-- Pilih Dimensi Terlebih Dahulu --" 
                  : "-- Semua Sub-dimensi --"}
              </option>
              {filterSubDimensiOptions.map((subNama) => (
                <option key={subNama} value={subNama}>
                  {subNama}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedKegiatan && (
          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Menampilkan kriteria khusus untuk kegiatan: <b>{selectedKegiatan.nama}</b>
                {selectedKegiatan.capaianProfil?.length ? ` (${selectedKegiatan.capaianProfil.length} Dimensi Terhubung)` : ' (Belum ada dimensi dihubungkan di menu Kegiatan)'}
              </span>
            </div>
            <button
              onClick={() => setSelectedKegiatanId("")}
              className="text-blue-700 hover:underline font-semibold text-[11px]"
            >
              Kembali ke Global
            </button>
          </div>
        )}
      </div>

      {/* Main Rubrik List */}
      <div className="space-y-6">
        {activeDimensions.map((dim, dimIdx) => (
          <div key={dim.nama} className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Dimensi Header */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-500 text-white flex items-center justify-center font-extrabold text-xs">
                  {dimIdx + 1}
                </span>
                <h3 className="font-bold text-sm tracking-wide">{dim.nama}</h3>
              </div>
              <span className="text-[11px] font-medium text-gray-300 bg-gray-700/80 px-2.5 py-1 rounded-full">
                {dim.subDimensi.length} Sub-dimensi
              </span>
            </div>

            {/* Sub-dimensi Matrix */}
            <div className="p-5 space-y-6 divide-y divide-gray-100">
              {dim.subDimensi.map((sub, subIdx) => {
                const valSB = getRubrikValue(dim.nama, sub.nama, "SB");
                const valB = getRubrikValue(dim.nama, sub.nama, "B");
                const valC = getRubrikValue(dim.nama, sub.nama, "C");
                const valK = getRubrikValue(dim.nama, sub.nama, "K");
                const standar = getStandarKelulusanValue(dim.nama, sub.nama);

                return (
                  <div key={sub.nama} className={subIdx > 0 ? "pt-5 space-y-3" : "space-y-3"}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm">
                          Sub-dimensi: <span className="text-blue-700">{sub.nama}</span>
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-gray-600">Standar Kelulusan:</label>
                        <select
                          value={standar}
                          onChange={(e) => handleStandarKelulusanChange(dim.nama, sub.nama, e.target.value as "SB" | "B" | "C" | "K")}
                          className="px-2 py-1 text-xs border border-gray-300 rounded-lg bg-white font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="SB">Sangat Baik (SB)</option>
                          <option value="B">Baik (B)</option>
                          <option value="C">Cukup (C)</option>
                          <option value="K">Kurang (K)</option>
                        </select>
                      </div>
                    </div>

                    {/* 4 Predikat Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* SB */}
                      <div className={`p-3 border rounded-xl space-y-2 focus-within:ring-2 focus-within:ring-emerald-500 transition-all ${standar === "SB" ? "bg-emerald-100/50 border-emerald-400 shadow-md ring-1 ring-emerald-400" : "bg-emerald-50/40 border-emerald-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${standar === "SB" ? "bg-emerald-500 text-white border-emerald-600" : "bg-emerald-100 text-emerald-800 border-emerald-300"}`}>
                            SB (Sangat Baik) {standar === "SB" && "⭐"}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700">Tahap Mahir (M)</span>
                        </div>
                        <textarea
                          rows={3}
                          value={valSB}
                          onChange={(e) => handleRubrikChange(dim.nama, sub.nama, "SB", e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-emerald-200 rounded-lg text-gray-800 focus:outline-none focus:border-emerald-500 shadow-2xs resize-y"
                          placeholder="Deskripsi kriteria Sangat Baik..."
                        />
                      </div>

                      {/* B */}
                      <div className={`p-3 border rounded-xl space-y-2 focus-within:ring-2 focus-within:ring-blue-500 transition-all ${standar === "B" ? "bg-blue-100/50 border-blue-400 shadow-md ring-1 ring-blue-400" : "bg-blue-50/40 border-blue-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${standar === "B" ? "bg-blue-500 text-white border-blue-600" : "bg-blue-100 text-blue-800 border-blue-300"}`}>
                            B (Baik) {standar === "B" && "⭐"}
                          </span>
                          <span className="text-[10px] font-bold text-blue-700">Tahap Cakap (C)</span>
                        </div>
                        <textarea
                          rows={3}
                          value={valB}
                          onChange={(e) => handleRubrikChange(dim.nama, sub.nama, "B", e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-blue-200 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 shadow-2xs resize-y"
                          placeholder="Deskripsi kriteria Baik..."
                        />
                      </div>

                      {/* C */}
                      <div className={`p-3 border rounded-xl space-y-2 focus-within:ring-2 focus-within:ring-amber-500 transition-all ${standar === "C" ? "bg-amber-100/50 border-amber-400 shadow-md ring-1 ring-amber-400" : "bg-amber-50/40 border-amber-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${standar === "C" ? "bg-amber-500 text-white border-amber-600" : "bg-amber-100 text-amber-800 border-amber-300"}`}>
                            C (Cukup) {standar === "C" && "⭐"}
                          </span>
                          <span className="text-[10px] font-bold text-amber-700">Tahap Berkembang (B)</span>
                        </div>
                        <textarea
                          rows={3}
                          value={valC}
                          onChange={(e) => handleRubrikChange(dim.nama, sub.nama, "C", e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-amber-200 rounded-lg text-gray-800 focus:outline-none focus:border-amber-500 shadow-2xs resize-y"
                          placeholder="Deskripsi kriteria Cukup..."
                        />
                      </div>

                      {/* K */}
                      <div className={`p-3 border rounded-xl space-y-2 focus-within:ring-2 focus-within:ring-rose-500 transition-all ${standar === "K" ? "bg-rose-100/50 border-rose-400 shadow-md ring-1 ring-rose-400" : "bg-rose-50/40 border-rose-200"}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded border ${standar === "K" ? "bg-rose-500 text-white border-rose-600" : "bg-rose-100 text-rose-800 border-rose-300"}`}>
                            K (Kurang) {standar === "K" && "⭐"}
                          </span>
                          <span className="text-[10px] font-bold text-rose-700">Menuju Berkembang</span>
                        </div>
                        <textarea
                          rows={3}
                          value={valK}
                          onChange={(e) => handleRubrikChange(dim.nama, sub.nama, "K", e.target.value)}
                          className="w-full p-2.5 text-xs bg-white border border-rose-200 rounded-lg text-gray-800 focus:outline-none focus:border-rose-500 shadow-2xs resize-y"
                          placeholder="Deskripsi kriteria Kurang..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {activeDimensions.length === 0 && (
          <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-2">
            <HelpCircle className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-sm font-semibold text-gray-700">Tidak ada dimensi atau sub-dimensi yang cocok.</p>
            <p className="text-xs text-gray-500">Coba ubah filter pencarian atau pilihan dimensi.</p>
          </div>
        )}
      </div>

      {/* Floating Save Action Bar */}
      <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md border border-gray-200 p-4 rounded-2xl shadow-xl flex items-center justify-between">
        <div className="text-xs text-gray-600 hidden sm:block">
          💡 Klik <b>Simpan Setting Rubrik</b> untuk memperbarui kriteria di seluruh modul asesmen.
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={handleResetToStandard}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reset Panduan 2025
          </button>
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#007AFF] hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Save className="w-4 h-4" /> Simpan Setting Rubrik
          </button>
        </div>
      </div>
    </div>
  );
}
