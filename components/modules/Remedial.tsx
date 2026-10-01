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
  Search,
  Filter,
  Printer,
  FileText,
  X,
  RotateCcw,
  Check,
  ExternalLink,
  Sparkles,
  Download,
} from "lucide-react";
import { Remedial as TRemedial } from "@/lib/types";
import { generateId } from "@/lib/utils";

export default function Remedial() {
  const { state, updateItem, addItem, showToast, filteredKelas } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find((ta) => ta.isActive);
  const activeTaId = activeTA?.id || "";

  // View state: "daftar" (card view) or "rekap" (recap table view)
  const [activeView, setActiveView] = useState<"daftar" | "rekap">("daftar");

  // Filter & Search states
  const [selectedKelasId, setSelectedKelasId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [remedialStatusFilter, setRemedialStatusFilter] = useState<
    "semua" | "sedang" | "selesai" | "Direncanakan" | "Berlangsung"
  >("semua");

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Print Preview Modal states
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [printKelasId, setPrintKelasId] = useState<string>("");
  const [printStatusFilter, setPrintStatusFilter] = useState<
    "semua" | "sedang" | "selesai"
  >("semua");
  const [paperSize, setPaperSize] = useState<"folio" | "a4" | "legal" | "letter">("folio");
  const [paperMargin, setPaperMargin] = useState<"normal" | "compact" | "spacious">("normal");
  const [paperDensity, setPaperDensity] = useState<"auto" | "normal" | "compact" | "ultra">("auto");
  const [paperLayoutMode, setPaperLayoutMode] = useState<"auto" | "force1" | "split2" | "split3">("auto");
  const [previewTab, setPreviewTab] = useState<number | "all">("all");
  const [showSignatures, setShowSignatures] = useState(true);

  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualKelasId, setManualKelasId] = useState("");
  const [manualSumatifId, setManualSumatifId] = useState("");
  const [manualSiswaId, setManualSiswaId] = useState("");

  const remedialList = useMemo(() => {
    return state.agmp_remedial.filter((r) =>
      activeTaId ? r.taId === activeTaId || !r.taId : true
    );
  }, [state.agmp_remedial, activeTaId]);

  const availableKelas = useMemo(() => {
    return filteredKelas.length > 0 ? filteredKelas : state.agmp_kelas;
  }, [filteredKelas, state.agmp_kelas]);

  // Filtered remedial list based on Class, Search Query, and Status
  const filteredRemedialList = useMemo(() => {
    return remedialList.filter((r) => {
      const siswa = state.agmp_siswa.find((s) => s.id === r.siswaId);
      const kelasId = r.kelasId || siswa?.kelasId || "";
      const tp = state.agmp_tp.find((t) => t.id === r.tpId);

      // Class Filter
      if (selectedKelasId && kelasId !== selectedKelasId) {
        return false;
      }

      // Status Filter
      if (remedialStatusFilter === "sedang") {
        if (r.status !== "Berlangsung" && r.status !== "Direncanakan") {
          return false;
        }
      } else if (remedialStatusFilter === "selesai") {
        if (r.status !== "Selesai") {
          return false;
        }
      } else if (remedialStatusFilter !== "semua") {
        if (r.status !== remedialStatusFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nama = (siswa?.nama || "").toLowerCase();
        const nisn = (siswa?.nisn || "").toLowerCase();
        const tpKode = (tp?.kode || "").toLowerCase();
        const tpDeskripsi = (tp?.deskripsi || "").toLowerCase();
        const jenis = (r.jenis || "").toLowerCase();
        const pic = (r.pic || "").toLowerCase();
        const status = (r.status || "").toLowerCase();
        const kelasNama = (
          state.agmp_kelas.find((k) => k.id === kelasId)?.nama || ""
        ).toLowerCase();

        const match =
          nama.includes(q) ||
          nisn.includes(q) ||
          tpKode.includes(q) ||
          tpDeskripsi.includes(q) ||
          jenis.includes(q) ||
          pic.includes(q) ||
          status.includes(q) ||
          kelasNama.includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [
    remedialList,
    selectedKelasId,
    remedialStatusFilter,
    searchQuery,
    state.agmp_siswa,
    state.agmp_tp,
    state.agmp_kelas,
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Direncanakan":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "Berlangsung":
        return "bg-amber-100 text-amber-800 border border-amber-300";
      case "Selesai":
        return "bg-emerald-100 text-emerald-800 border border-emerald-300";
      case "Dibatalkan":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const dashboardStats = useMemo(() => {
    let perluPerhatian = 0;
    let berlangsung = 0;
    let selesai = 0;

    const listToCount = selectedKelasId
      ? remedialList.filter((r) => {
          const siswa = state.agmp_siswa.find((s) => s.id === r.siswaId);
          return (r.kelasId || siswa?.kelasId) === selectedKelasId;
        })
      : remedialList;

    listToCount.forEach((r) => {
      if (r.status === "Direncanakan" || r.status === "Dibatalkan")
        perluPerhatian++;
      else if (r.status === "Berlangsung") berlangsung++;
      else if (r.status === "Selesai") selesai++;
    });

    return {
      perluPerhatian,
      berlangsung,
      selesai,
      total: listToCount.length,
      sedangRemedial: perluPerhatian + berlangsung,
    };
  }, [remedialList, selectedKelasId, state.agmp_siswa]);

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

  const handleRemedialRubrikVal = (r: TRemedial, sumatifAsli: any, rubrik: any, aspekId: string, skalaIdx: number) => {
    const currentScores = r.rubrikScoresBaru || { ...sumatifAsli?.rubrikScores };
    const newScores = { ...currentScores, [aspekId]: skalaIdx };

    let status: "TUNTAS" | "BELUM TUNTAS" = "TUNTAS";
    let nilai = 0;
    let level = 1;

    const interval = {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };

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
            if (typeof val === 'string') {
              const parts = val.split('-').map(s => Number(s.trim())).filter(n => !isNaN(n));
              if (parts.length === 2) ekivalen = (parts[0] + parts[1]) / 2;
              else if (parts.length === 1) ekivalen = parts[0];
            } else if (typeof val === 'number') {
              ekivalen = val;
            }
          } else {
            const maxSkalaAspek = (aspek.skalaPenilaian?.length || rubrik.skalaPenilaian?.length || 4);
            ekivalen = ((actualSkala + 1) / maxSkalaAspek) * 100;
          }
          totalNilaiEkivalen += ekivalen;
        }

        if (actualSkala === undefined || actualSkala < requiredSkala) {
          status = "BELUM TUNTAS";
        }
      }

      if (totalAspekDinilai > 0) {
        nilai = Number((totalNilaiEkivalen / totalAspekDinilai).toFixed(2));
      } else {
        nilai = 0;
      }
    }

    if (nilai >= interval.batasAtasLanjut) level = 4;
    else if (nilai >= interval.batasBawahTuntas) level = 3;
    else if (nilai >= interval.batasBawahSelektif) level = 2;
    else level = 1;

    updateItem("agmp_remedial", r.id, {
      rubrikScoresBaru: newScores,
      nilaiBaru: nilai,
      levelBaru: level,
      statusBaru: status,
      status: "Selesai",
    });
  };

  const handleRemedialDaftarCeklistVal = (r: TRemedial, sumatifAsli: any, rubrik: any, aspekId: string, isTercapai: boolean) => {
    const currentScores = r.ceklistScoresBaru || { ...sumatifAsli?.ceklistScores };
    const newScores = { ...currentScores, [aspekId]: isTercapai };

    let status: "TUNTAS" | "BELUM TUNTAS" = "BELUM TUNTAS";
    let nilai = 0;
    let level = 1;
    
    if (rubrik && rubrik.jenisKKTP === "Daftar Ceklist" && rubrik.aspekPenilaian) {
      const totalKriteria = rubrik.aspekPenilaian.length;
      const tercapaiCount = Object.values(newScores).filter(Boolean).length;
      const syaratMinimal = rubrik.syaratKetuntasanDaftarCeklis || 1;
      
      nilai = totalKriteria > 0 ? Math.round((tercapaiCount / totalKriteria) * 100) : 0;
      status = tercapaiCount >= syaratMinimal ? "TUNTAS" : "BELUM TUNTAS";
    }

    const interval = {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };

    if (nilai >= interval.batasAtasLanjut) level = 4;
    else if (nilai >= interval.batasBawahTuntas) level = 3;
    else if (nilai >= interval.batasBawahSelektif) level = 2;
    else level = 1;

    updateItem("agmp_remedial", r.id, {
      ceklistScoresBaru: newScores,
      nilaiBaru: nilai,
      levelBaru: level,
      statusBaru: status,
      status: "Selesai",
    });
  };

  const handleRemedialTesTulisVal = (r: TRemedial, sumatifAsli: any, soalId: number, val: number) => {
    const currentScores = r.tesTulisScoresBaru || { ...sumatifAsli?.tesTulisScores };
    const newScores = { ...currentScores, [soalId]: val };
    const totalNilai: number = Object.values(newScores).reduce((a: any, b: any) => Number(a) + Number(b), 0) as number;

    const interval = {
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

    updateItem("agmp_remedial", r.id, {
      tesTulisScoresBaru: newScores,
      nilaiBaru: totalNilai,
      levelBaru: level,
      statusBaru: status,
      status: "Selesai",
    });
  };

  const schoolName = state.agmp_pengaturan?.sekolah?.trim() || "SMP NEGERI 1 BIAU";
  const guruName = state.agmp_pengaturan?.guruNama?.trim() || "Guru Mata Pelajaran";
  const mapelName =
    state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
    state.agmp_pengaturan?.mapel ||
    "Mata Pelajaran";
  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const selectedKelasObj = availableKelas.find((k) => k.id === selectedKelasId);
  const selectedPrintKelasObj = availableKelas.find((k) => k.id === printKelasId);
  const printKelasNama = selectedPrintKelasObj ? selectedPrintKelasObj.nama : "Semua Kelas";

  const kepsekName =
    (state.agmp_pengaturan as any)?.kepalaSekolah ||
    "( ............................................ )";
  const kepsekNip = (state.agmp_pengaturan as any)?.nipKepsek
    ? `NIP. ${(state.agmp_pengaturan as any).nipKepsek}`
    : "NIP. ........................................";
  const guruNip = (state.agmp_pengaturan as any)?.nipGuru
    ? `NIP. ${(state.agmp_pengaturan as any).nipGuru}`
    : "NIP. ........................................";

  // Data filtered specifically for Print / Preview based on Print Class and Status Filter
  const printRows = useMemo(() => {
    return remedialList.filter((r) => {
      const siswa = state.agmp_siswa.find((s) => s.id === r.siswaId);
      const kelasId = r.kelasId || siswa?.kelasId || "";

      // Filter by selected print class
      if (printKelasId && kelasId !== printKelasId) {
        return false;
      }

      // Filter by print status
      if (printStatusFilter === "sedang") {
        if (r.status !== "Berlangsung" && r.status !== "Direncanakan") {
          return false;
        }
      } else if (printStatusFilter === "selesai") {
        if (r.status !== "Selesai") {
          return false;
        }
      }

      return true;
    });
  }, [remedialList, printKelasId, printStatusFilter, state.agmp_siswa]);

  const paperConfig = useMemo(() => {
    switch (paperSize) {
      case "a4":
        return {
          name: "A4",
          widthMm: 297,
          heightMm: 210,
          aspectRatio: "297 / 210",
          label: "A4 Landscape (297 x 210 mm)",
        };
      case "legal":
        return {
          name: "Legal",
          widthMm: 356,
          heightMm: 216,
          aspectRatio: "356 / 216",
          label: "Legal Landscape (356 x 216 mm)",
        };
      case "letter":
        return {
          name: "Letter",
          widthMm: 279,
          heightMm: 216,
          aspectRatio: "279 / 216",
          label: "Letter Landscape (279 x 216 mm)",
        };
      case "folio":
      default:
        return {
          name: "Folio / F4",
          widthMm: 330,
          heightMm: 215,
          aspectRatio: "330 / 215",
          label: "Folio / F4 Landscape (330 x 215 mm)",
        };
    }
  }, [paperSize]);

  const marginConfig = useMemo(() => {
    switch (paperMargin) {
      case "compact":
        return {
          marginMm: 6,
          label: "Sempit (6 mm)",
          paddingClass: "p-4 sm:p-5",
        };
      case "spacious":
        return {
          marginMm: 14,
          label: "Lebar (14 mm)",
          paddingClass: "p-8 sm:p-9",
        };
      case "normal":
      default:
        return {
          marginMm: 9,
          label: "Standar (9 mm)",
          paddingClass: "p-6 sm:p-7",
        };
    }
  }, [paperMargin]);

  const densityStyles = useMemo(() => {
    let effectiveDensity = paperDensity;
    if (effectiveDensity === "auto") {
      const count = printRows.length;
      if (paperLayoutMode === "force1") {
        if (count > 25) effectiveDensity = "ultra";
        else if (count > 16) effectiveDensity = "compact";
        else effectiveDensity = "normal";
      } else {
        effectiveDensity = count > 20 ? "compact" : "normal";
      }
    }

    switch (effectiveDensity) {
      case "ultra":
        return {
          tableText: "text-[9px]",
          headerText: "text-[9px] py-1 px-1",
          cellPadding: "py-0.5 px-1.5 leading-tight",
          subText: "text-[8px]",
          badgeText: "text-[8px] px-1 py-0.2",
          kopText: "text-[10px]",
          sigSpace: "h-8",
        };
      case "compact":
        return {
          tableText: "text-[10px]",
          headerText: "text-[10px] py-1.5 px-1.5",
          cellPadding: "py-1 px-2 leading-tight",
          subText: "text-[9px]",
          badgeText: "text-[9px] px-1.5 py-0.5",
          kopText: "text-xs",
          sigSpace: "h-10",
        };
      default: // normal
        return {
          tableText: "text-[11px]",
          headerText: "text-[11px] py-2 px-2",
          cellPadding: "py-1.5 px-2.5 leading-snug",
          subText: "text-[10px]",
          badgeText: "text-[10px] px-2 py-0.5",
          kopText: "text-sm",
          sigSpace: "h-12",
        };
    }
  }, [paperDensity, paperLayoutMode, printRows.length]);

  const printPagesData = useMemo(() => {
    const total = printRows.length;
    if (total === 0) return [[]];

    if (paperLayoutMode === "force1") {
      return [printRows];
    }

    if (paperLayoutMode === "split2") {
      const mid = Math.ceil(total / 2);
      return [printRows.slice(0, mid), printRows.slice(mid)];
    }

    if (paperLayoutMode === "split3") {
      const chunk = Math.ceil(total / 3);
      return [
        printRows.slice(0, chunk),
        printRows.slice(chunk, chunk * 2),
        printRows.slice(chunk * 2),
      ];
    }

    // "auto" dynamic pagination
    if (total <= 14) {
      return [printRows];
    } else if (total <= 28) {
      const page1Limit = 15;
      return [printRows.slice(0, page1Limit), printRows.slice(page1Limit)];
    } else {
      const page1Limit = 15;
      const page2Limit = 16;
      return [
        printRows.slice(0, page1Limit),
        printRows.slice(page1Limit, page1Limit + page2Limit),
        printRows.slice(page1Limit + page2Limit),
      ];
    }
  }, [printRows, paperLayoutMode]);

  const handleExportCsv = () => {
    const headers = [
      "No",
      "Nama Siswa",
      "NISN",
      "Kelas",
      "TP / Asesmen",
      "Deskripsi TP",
      "Nilai Awal Sumatif",
      "Level Awal",
      "Jenis Program Remedial",
      "PIC / Pendamping",
      "Jadwal",
      "Target Selesai",
      "Status Pelaksanaan",
      "Nilai Baru Remedial",
      "Ketuntasan Baru"
    ];

    const listToExport = showPreviewModal ? printRows : filteredRemedialList;

    const rows = listToExport.map((r, idx) => {
      const s = state.agmp_siswa.find((sis) => sis.id === r.siswaId);
      const tp = state.agmp_tp.find((t) => t.id === r.tpId);
      const existingSumatif = state.agmp_sumatif.find((sum) => sum.id === r.sumatifId);
      const sumatifAsli = existingSumatif?.records?.[r.siswaId];
      const kelasNama = state.agmp_kelas.find((k) => k.id === (r.kelasId || s?.kelasId))?.nama || "-";

      return [
        idx + 1,
        `"${(s?.nama || '-').replace(/"/g, '""')}"`,
        `"${s?.nisn || '-'}"`,
        `"${kelasNama}"`,
        `"TP ${tp?.kode || '-'}"`,
        `"${(tp?.deskripsi || '-').replace(/"/g, '""')}"`,
        sumatifAsli?.nilai ?? "-",
        sumatifAsli?.level ? `L${sumatifAsli.level}` : "-",
        `"${(r.jenis || '-').replace(/"/g, '""')}"`,
        `"${(r.pic || '-').replace(/"/g, '""')}"`,
        `"${r.jadwal || '-'}"`,
        `"${r.target || '-'}"`,
        `"${r.status}"`,
        r.nilaiBaru !== undefined ? r.nilaiBaru : "-",
        `"${r.statusBaru || (r.status === 'Selesai' ? 'TUNTAS' : '-')}"`
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const kelasStr = (showPreviewModal ? selectedPrintKelasObj?.nama : selectedKelasObj?.nama)?.replace(/\s+/g, "_") || "Semua_Kelas";
    const statusStr =
      (showPreviewModal ? printStatusFilter : remedialStatusFilter) === "sedang"
        ? "Sedang_Remedial"
        : (showPreviewModal ? printStatusFilter : remedialStatusFilter) === "selesai"
        ? "Tuntas_Remedial"
        : "Semua_Status";
    link.setAttribute("download", `Rekap_Remedial_${kelasStr}_${statusStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-20 print:space-y-0 print:pb-0">
      {/* Print CSS for Rekap Siswa Remedial */}
      <style>{`
        @media print {
          @page {
            size: ${paperConfig.widthMm}mm ${paperConfig.heightMm}mm landscape;
            margin: ${marginConfig.marginMm}mm;
          }
          html, body {
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #print-rekap-container,
          #print-rekap-container * {
            visibility: visible;
          }
          #print-rekap-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .print-page-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
          }
          .print-page-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
          header, nav, aside, .print\\:hidden, #main-sidebar, button, input, select {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Header & Actions (Hidden in Print) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Program Remedial
            {selectedKelasObj && (
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full">
                {selectedKelasObj.nama}
              </span>
            )}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Kelola program perbaikan, pantau siswa yang sedang remedial per kelas, dan cetak rekap data hasil remedial.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => {
              setPrintKelasId(selectedKelasId);
              setPrintStatusFilter(
                remedialStatusFilter === "Direncanakan" || remedialStatusFilter === "Berlangsung"
                  ? "sedang"
                  : remedialStatusFilter
              );
              setShowPreviewModal(true);
            }}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-indigo-100 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap
          </button>
          <button
            onClick={() => setShowManualAdd(!showManualAdd)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-bold border border-blue-200 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Flag Manual
          </button>
        </div>
      </header>

      {/* DASHBOARD TRACKING (Interactive Status Filter) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div
          onClick={() =>
            setRemedialStatusFilter(
              remedialStatusFilter === "Direncanakan" ? "semua" : "Direncanakan"
            )
          }
          className={`bg-red-50 border p-4 rounded-2xl flex items-center gap-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
            remedialStatusFilter === "Direncanakan"
              ? "border-red-400 ring-2 ring-red-400"
              : "border-red-100 hover:border-red-200"
          }`}
          title="Klik untuk filter status Direncanakan"
        >
          <div className="bg-white p-3 rounded-xl shadow-sm text-red-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-2xl font-black text-red-700">
              {dashboardStats.perluPerhatian}
            </p>
            <p className="text-xs font-bold text-red-900 uppercase tracking-widest mt-1">
              Perlu Perhatian (Direncanakan)
            </p>
          </div>
        </div>

        <div
          onClick={() =>
            setRemedialStatusFilter(
              remedialStatusFilter === "Berlangsung" ? "semua" : "Berlangsung"
            )
          }
          className={`bg-yellow-50 border p-4 rounded-2xl flex items-center gap-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
            remedialStatusFilter === "Berlangsung"
              ? "border-yellow-400 ring-2 ring-yellow-400"
              : "border-yellow-100 hover:border-yellow-200"
          }`}
          title="Klik untuk filter siswa yang Sedang Berlangsung"
        >
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

        <div
          onClick={() =>
            setRemedialStatusFilter(
              remedialStatusFilter === "selesai" ? "semua" : "selesai"
            )
          }
          className={`bg-green-50 border p-4 rounded-2xl flex items-center gap-4 shadow-sm cursor-pointer transition-all hover:shadow-md ${
            remedialStatusFilter === "selesai"
              ? "border-green-400 ring-2 ring-green-400"
              : "border-green-100 hover:border-green-200"
          }`}
          title="Klik untuk filter siswa yang Tuntas Remedial"
        >
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

      {dashboardStats.sedangRemedial > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-xl text-sm text-blue-800 print:hidden flex items-center justify-between gap-4">
          <div>
            Terdapat <strong>{dashboardStats.sedangRemedial} siswa</strong> yang sedang atau perlu mengikuti program remedial
            {selectedKelasObj ? ` di ${selectedKelasObj.nama}` : ""}.
          </div>
          {remedialStatusFilter !== "sedang" && (
            <button
              onClick={() => setRemedialStatusFilter("sedang")}
              className="text-xs font-bold text-blue-700 underline hover:text-blue-900 whitespace-nowrap cursor-pointer"
            >
              Tampilkan Siswa Sedang Remedial
            </button>
          )}
        </div>
      )}

      {/* FILTER & SEARCH BAR (Fitur Pencarian & Filter Kelas) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-sm print:hidden space-y-3.5">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Fitur Pencarian Data Siswa */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari murid (nama siswa, NISN, materi / TP, jenis program)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:text-gray-400 font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                title="Hapus pencarian"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Berdasarkan Kelas */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5">
            <div className="relative min-w-[190px] flex-1 sm:flex-initial">
              <div className="absolute left-3 top-2.5 pointer-events-none text-gray-500">
                <Users className="w-4 h-4" />
              </div>
              <select
                value={selectedKelasId}
                onChange={(e) => setSelectedKelasId(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="">Semua Kelas ({availableKelas.length})</option>
                {availableKelas.map((k) => {
                  const countInClass = remedialList.filter((r) => {
                    const s = state.agmp_siswa.find((sis) => sis.id === r.siswaId);
                    return (r.kelasId || s?.kelasId) === k.id;
                  }).length;
                  return (
                    <option key={k.id} value={k.id}>
                      {k.nama} {countInClass > 0 ? `(${countInClass} Siswa)` : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Filter Status Dropdown */}
            <div className="relative min-w-[170px] flex-1 sm:flex-initial">
              <select
                value={remedialStatusFilter}
                onChange={(e) => setRemedialStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                <option value="semua">Semua Status</option>
                <option value="sedang">Sedang Remedial (Aktif)</option>
                <option value="Berlangsung">Sedang Berlangsung</option>
                <option value="Direncanakan">Direncanakan</option>
                <option value="selesai">Tuntas / Selesai</option>
              </select>
            </div>

            {/* Reset Filters button if any is active */}
            {(selectedKelasId || searchQuery || remedialStatusFilter !== "semua") && (
              <button
                onClick={() => {
                  setSelectedKelasId("");
                  setSearchQuery("");
                  setRemedialStatusFilter("semua");
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
                title="Reset semua filter dan pencarian"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Quick Status Filter Pills Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-gray-400 font-medium mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Status:
            </span>
            <button
              onClick={() => setRemedialStatusFilter("semua")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                remedialStatusFilter === "semua"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Semua ({dashboardStats.total})
            </button>
            <button
              onClick={() => setRemedialStatusFilter("sedang")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                remedialStatusFilter === "sedang"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60"
              }`}
            >
              <Clock className="w-3 h-3" />
              Sedang Remedial ({dashboardStats.sedangRemedial})
            </button>
            <button
              onClick={() => setRemedialStatusFilter("Berlangsung")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                remedialStatusFilter === "Berlangsung"
                  ? "bg-yellow-600 text-white shadow-sm"
                  : "bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200/60"
              }`}
            >
              Berlangsung ({dashboardStats.berlangsung})
            </button>
            <button
              onClick={() => setRemedialStatusFilter("Direncanakan")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                remedialStatusFilter === "Direncanakan"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/60"
              }`}
            >
              Direncanakan ({dashboardStats.perluPerhatian})
            </button>
            <button
              onClick={() => setRemedialStatusFilter("selesai")}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
                remedialStatusFilter === "selesai"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60"
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Tuntas ({dashboardStats.selesai})
            </button>
          </div>

          <div className="text-gray-500 font-medium text-[11px]">
            {searchQuery && (
              <span className="text-blue-600 font-semibold mr-2">
                Hasil pencarian: &quot;{searchQuery}&quot;
              </span>
            )}
            Menampilkan <strong className="text-gray-900">{filteredRemedialList.length}</strong> data siswa
          </div>
        </div>
      </div>

      {/* VIEW TABS: "Kelola Program" (Cards) vs "Rekap Remedial Kelas" (Table) */}
      <div className="flex border-b border-gray-200 print:hidden">
        <button
          onClick={() => setActiveView("daftar")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeView === "daftar"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Kelola Program ({filteredRemedialList.length})
        </button>

        <button
          onClick={() => setActiveView("rekap")}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeView === "rekap"
              ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300"
          }`}
        >
          <FileText className="w-4 h-4" />
          Rekap Remedial Kelas
          {remedialStatusFilter === "sedang" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200">
              Sedang Remedial
            </span>
          )}
        </button>
      </div>

      {/* VIEW SWITCH: "daftar" (Kelola Program) OR "rekap" (Rekap Remedial Kelas) */}
      {activeView === "daftar" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-gray-900 text-base">Kelola Program Remedial</h3>
              <p className="text-xs text-gray-500">
                Pilih murid untuk membuka instrumen penilaian ulang dan mencatat nilai perbaikan.
              </p>
            </div>
            <button
              onClick={() => setShowManualAdd(!showManualAdd)}
              className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-3.5 py-2 rounded-xl border border-blue-200 hover:bg-blue-100 font-bold transition-colors w-fit cursor-pointer"
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
                {filteredKelas.map((k) => (
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

        {filteredRemedialList.length === 0 ? (
          remedialList.length === 0 ? (
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
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
              <div className="bg-gray-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <p className="font-bold text-gray-900 text-base">Tidak Ditemukan Siswa Remedial</p>
              <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
                {searchQuery
                  ? `Tidak ada siswa yang sesuai dengan kata kunci "${searchQuery}".`
                  : remedialStatusFilter === "sedang"
                  ? `Tidak ada siswa yang sedang berstatus remedial pada filter ${selectedKelasObj ? selectedKelasObj.nama : 'kelas ini'}.`
                  : remedialStatusFilter === "selesai"
                  ? `Belum ada siswa yang selesai program remedial pada filter ${selectedKelasObj ? selectedKelasObj.nama : 'kelas ini'}.`
                  : "Tidak ada siswa yang sesuai dengan filter kelas saat ini."}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedKelasId("");
                  setRemedialStatusFilter("semua");
                }}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filter & Pencarian
              </button>
            </div>
          )
        ) : (
          filteredRemedialList.map((r) => {
            const siswa = state.agmp_siswa.find((s) => s.id === r.siswaId);
            const tp = state.agmp_tp.find((t) => t.id === r.tpId);
            const existingSumatif = state.agmp_sumatif.find((s) => s.id === r.sumatifId);
            const sumatifAsli = existingSumatif?.records[r.siswaId];
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
                        siswa setelah program selesai. Hanya menampilkan indikator yang belum tercapai.
                      </p>

                      {rubrik?.jenisKKTP === "Rubrik Deskripsi" && rubrik.aspekPenilaian ? (
                        <div className="overflow-x-auto border rounded-xl border-gray-200 mb-4">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              <tr>
                                <th className="p-3 w-1/2">Aspek yang Belum Tercapai</th>
                                <th className="p-3 w-1/2">Pencapaian Baru</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {rubrik.aspekPenilaian.filter(aspek => {
                                const required = rubrik.aturanKetuntasan?.[aspek.id] ?? 0;
                                const actual = sumatifAsli?.rubrikScores?.[aspek.id];
                                return actual === undefined || actual < required;
                              }).map(aspek => {
                                const skalaOptions = aspek.skalaPenilaian || rubrik.skalaPenilaian || [];
                                return (
                                <tr key={aspek.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-medium text-gray-900">{aspek.nama}</td>
                                  <td className="p-3">
                                    <select 
                                      className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#007AFF] transition-shadow text-sm"
                                      value={r.rubrikScoresBaru?.[aspek.id] ?? (sumatifAsli?.rubrikScores?.[aspek.id] ?? "")}
                                      onChange={(e) => handleRemedialRubrikVal(r, sumatifAsli, rubrik, aspek.id, Number(e.target.value))}
                                    >
                                      <option value="" disabled>Pilih Skala</option>
                                      {skalaOptions.map((skala, idx) => {
                                        const desc = aspek.deskripsiSkala?.[idx] ? ` - ${aspek.deskripsiSkala[idx]}` : "";
                                        const val = aspek.ekivalenSkala?.[idx] !== undefined ? ` (${aspek.ekivalenSkala[idx]})` : "";
                                        return (
                                          <option key={idx} value={idx}>{skala}{desc}{val}</option>
                                        );
                                      })}
                                    </select>
                                  </td>
                                </tr>
                              )})}
                              {rubrik.aspekPenilaian.filter(aspek => {
                                const required = rubrik.aturanKetuntasan?.[aspek.id] ?? 0;
                                const actual = sumatifAsli?.rubrikScores?.[aspek.id];
                                return actual === undefined || actual < required;
                              }).length === 0 && (
                                <tr>
                                  <td colSpan={2} className="p-4 text-center text-gray-500">
                                    Semua aspek sudah tercapai di asesmen sebelumnya.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : rubrik?.jenisKKTP === "Daftar Ceklist" && rubrik.aspekPenilaian ? (
                        <div className="overflow-x-auto border rounded-xl border-gray-200 mb-4">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 border-b border-gray-100/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                              <tr>
                                <th className="p-3 w-3/4">Kriteria / Indikator Belum Tercapai</th>
                                <th className="p-3 w-1/4 text-center">Tercapai</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {rubrik.aspekPenilaian.filter(aspek => !sumatifAsli?.ceklistScores?.[aspek.id]).map(aspek => (
                                <tr key={aspek.id} className="hover:bg-gray-50/50">
                                  <td className="p-3 font-medium text-gray-900">{aspek.nama}</td>
                                  <td className="p-3 text-center">
                                    <input 
                                      type="checkbox"
                                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                      checked={r.ceklistScoresBaru?.[aspek.id] ?? (sumatifAsli?.ceklistScores?.[aspek.id] || false)}
                                      onChange={(e) => handleRemedialDaftarCeklistVal(r, sumatifAsli, rubrik, aspek.id, e.target.checked)}
                                    />
                                  </td>
                                </tr>
                              ))}
                              {rubrik.aspekPenilaian.filter(aspek => !sumatifAsli?.ceklistScores?.[aspek.id]).length === 0 && (
                                <tr>
                                  <td colSpan={2} className="p-4 text-center text-gray-500">
                                    Semua kriteria sudah tercapai di asesmen sebelumnya.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      ) : existingSumatif?.teknik === "Tes Tulis (PG/Esai)" && existingSumatif.tesTulisConfig ? (
                        <div className="mb-4">
                          <label className="text-sm font-bold text-gray-700 block mb-2">Soal yang belum maksimal:</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {existingSumatif.tesTulisConfig.filter(config => (sumatifAsli?.tesTulisScores?.[config.id] || 0) < config.bobotMaksimal).map((config, idx) => {
                              const val = r.tesTulisScoresBaru?.[config.id] ?? (sumatifAsli?.tesTulisScores?.[config.id] || 0);
                              return (
                                <div key={config.id} className="p-3 border rounded-xl bg-gray-50 flex flex-col gap-1 shadow-sm">
                                  <span className="text-xs font-bold text-gray-600">
                                    Soal {idx + 1} <span className="font-normal text-gray-400">(Max: {config.bobotMaksimal})</span>
                                  </span>
                                  <input
                                    type="number"
                                    min="0"
                                    max={config.bobotMaksimal}
                                    value={val === 0 ? "" : val}
                                    onChange={(e) => handleRemedialTesTulisVal(r, sumatifAsli, config.id, Number(e.target.value))}
                                    className="w-full border p-2 rounded bg-white text-sm outline-none"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : rubrik ? (
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
                        <p className="text-sm text-red-500 mb-4">
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
      ) : (
        /* REKAP REMEDIAL KELAS VIEW (Tampilan Rekap Berdasarkan Filter Kelas & Pencarian) */
        <div className="space-y-5">
          {/* Header Card for Rekap View */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">
                  Rekapitulasi Siswa Remedial
                </h3>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {selectedKelasObj ? selectedKelasObj.nama : "Semua Kelas"}
                </span>
                {remedialStatusFilter === "sedang" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    Sedang Remedial
                  </span>
                )}
                {remedialStatusFilter === "selesai" && (
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Tuntas / Selesai
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Daftar rekap pemantauan siswa yang sedang berlangsung maupun yang sudah menyelesaikan program remedial berdasarkan filter kelas.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                title="Unduh data rekap ke format spreadsheet CSV"
              >
                <Download className="w-3.5 h-3.5" /> Unduh CSV
              </button>
              <button
                onClick={() => {
                  setPrintKelasId(selectedKelasId);
                  setPrintStatusFilter(
                    remedialStatusFilter === "Direncanakan" || remedialStatusFilter === "Berlangsung"
                      ? "sedang"
                      : remedialStatusFilter
                  );
                  setShowPreviewModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
                title="Buka pratinjau cetak lembar rekapitulasi formal"
              >
                <Printer className="w-3.5 h-3.5" /> Cetak Lembar Rekap
              </button>
            </div>
          </div>

          {/* Quick Metrics in Rekap View */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Siswa Terdata</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{dashboardStats.total}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30 shadow-sm">
              <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Sedang Remedial (Aktif)</p>
              <p className="text-2xl font-black text-amber-700 mt-1">{dashboardStats.sedangRemedial}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-sm">
              <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Tuntas / Selesai</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">{dashboardStats.selesai}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/30 shadow-sm">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">% Ketuntasan</p>
              <p className="text-2xl font-black text-blue-700 mt-1">
                {dashboardStats.total > 0
                  ? `${Math.round((dashboardStats.selesai / dashboardStats.total) * 100)}%`
                  : "0%"}
              </p>
            </div>
          </div>

          {/* Rekap Table Container */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div className="text-xs text-gray-600 font-medium">
                Menampilkan <strong className="text-gray-900">{filteredRemedialList.length}</strong> data siswa remedial
                {selectedKelasObj ? ` di kelas ${selectedKelasObj.nama}` : ""}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span> Sedang Remedial
                </span>
                <span className="flex items-center gap-1 ml-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Tuntas / Selesai
                </span>
              </div>
            </div>

            {filteredRemedialList.length === 0 ? (
              <div className="p-10 text-center">
                <div className="bg-gray-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                  <Search className="w-6 h-6" />
                </div>
                <p className="font-bold text-gray-800 text-base">Tidak Ada Data Siswa Remedial</p>
                <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                  {searchQuery
                    ? `Tidak ditemukan data siswa dengan kata kunci "${searchQuery}". Coba kata kunci lain atau reset pencarian.`
                    : remedialStatusFilter === "sedang"
                    ? `Tidak ada siswa yang sedang berstatus remedial pada filter ${selectedKelasObj ? selectedKelasObj.nama : 'ini'}.`
                    : remedialStatusFilter === "selesai"
                    ? `Belum ada siswa yang selesai program remedial pada filter ${selectedKelasObj ? selectedKelasObj.nama : 'ini'}.`
                    : "Belum ada catatan remedial pada filter kelas ini."}
                </p>
                {(searchQuery || selectedKelasId || remedialStatusFilter !== "semua") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedKelasId("");
                      setRemedialStatusFilter("semua");
                    }}
                    className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reset Semua Filter
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 border-b border-gray-200 uppercase font-bold text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3 text-center w-10">No</th>
                      <th className="py-3 px-3 min-w-[160px]">Nama Siswa & NISN</th>
                      <th className="py-3 px-3 text-center min-w-[70px]">Kelas</th>
                      <th className="py-3 px-3 min-w-[150px]">TP / Materi Asesmen</th>
                      <th className="py-3 px-3 text-center min-w-[80px]">Nilai Awal</th>
                      <th className="py-3 px-3 min-w-[150px]">Program & PIC</th>
                      <th className="py-3 px-3 min-w-[110px]">Jadwal / Target</th>
                      <th className="py-3 px-3 text-center min-w-[110px]">Status Remedial</th>
                      <th className="py-3 px-3 text-center min-w-[90px]">Nilai Remedial</th>
                      <th className="py-3 px-3 text-center min-w-[90px]">Ketuntasan</th>
                      <th className="py-3 px-3 text-center min-w-[80px]">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/80">
                    {filteredRemedialList.map((r, idx) => {
                      const siswa = state.agmp_siswa.find((s) => s.id === r.siswaId);
                      const tp = state.agmp_tp.find((t) => t.id === r.tpId);
                      const existingSumatif = state.agmp_sumatif.find((s) => s.id === r.sumatifId);
                      const sumatifAsli = existingSumatif?.records?.[r.siswaId];
                      const kelasNama = state.agmp_kelas.find((k) => k.id === (r.kelasId || siswa?.kelasId))?.nama || "-";

                      return (
                        <tr key={r.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-3 text-center font-medium text-gray-500">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-bold text-gray-900">{siswa?.nama || "-"}</div>
                            <div className="text-[10px] text-gray-400 font-mono">NISN: {siswa?.nisn || "-"}</div>
                          </td>
                          <td className="py-3 px-3 text-center font-semibold text-gray-700">
                            {kelasNama}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-blue-700">TP {tp?.kode || "-"}</div>
                            <div className="text-[11px] text-gray-600 line-clamp-1" title={tp?.deskripsi}>
                              {tp?.deskripsi || "-"}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="inline-block font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              {sumatifAsli?.nilai ?? "-"}
                            </span>
                            {sumatifAsli?.level && (
                              <div className="text-[10px] text-gray-400 font-medium">L{sumatifAsli.level}</div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-medium text-gray-800">{r.jenis || "-"}</div>
                            <div className="text-[10px] text-gray-500">PIC: {r.pic || "-"}</div>
                          </td>
                          <td className="py-3 px-3 text-gray-600">
                            <div>{r.jadwal ? r.jadwal.replace("T", " ") : "-"}</div>
                            {r.target && <div className="text-[10px] text-gray-400">Target: {r.target}</div>}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${getStatusColor(r.status)}`}>
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {r.nilaiBaru !== undefined ? (
                              <span className="font-black text-gray-900 text-sm">
                                {r.nilaiBaru}
                              </span>
                            ) : (
                              <span className="text-gray-400 italic">Belum dinilai</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {r.statusBaru ? (
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                r.statusBaru === "TUNTAS"
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                  : "bg-red-100 text-red-800 border border-red-300"
                              }`}>
                                {r.statusBaru}
                              </span>
                            ) : r.status === "Selesai" ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                                TUNTAS
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => {
                                setActiveView("daftar");
                                setExpandedId(r.id);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                              title="Buka untuk kelola dan input nilai remedial"
                            >
                              Kelola <ExternalLink className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PRINT CONTAINER FOR BROWSER PRINT (Hidden on screen, Visible when window.print() is called) */}
      <div id="print-rekap-container" className="hidden print:block text-black bg-white">
        {printPagesData.map((pageRows, pageIdx) => {
          const startingIndex = printPagesData
            .slice(0, pageIdx)
            .reduce((sum, p) => sum + p.length, 0);

          return (
            <div key={pageIdx} className="print-page-sheet">
              <RemedialPrintPaperSheet
                pageIndex={pageIdx}
                totalPages={printPagesData.length}
                pageRows={pageRows}
                startingIndex={startingIndex}
                schoolName={schoolName}
                mapelName={mapelName}
                kelasName={printKelasNama}
                activeTA={activeTA}
                guruName={guruName}
                todayStr={todayStr}
                kepsekName={kepsekName}
                kepsekNip={kepsekNip}
                guruNip={guruNip}
                densityStyles={densityStyles}
                showSignatures={showSignatures}
                printStatusFilter={printStatusFilter}
                state={state}
              />
            </div>
          );
        })}
      </div>

      {/* PRINT PREVIEW MODAL (Pratinjau Kertas Siap Cetak & Pengaturan Dinamis) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
          {/* Modal Header Controls */}
          <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white flex flex-wrap items-center gap-2">
                  <span>Pratinjau Cetak: Rekap Siswa Remedial</span>
                  <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                    {paperConfig.name} Landscape
                  </span>
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                    {printPagesData.length} Halaman Kertas
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total {printRows.length} data siswa ({printKelasNama}) • Tata letak siap cetak rapi dengan margin simetris tanpa terpotong.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Filter Kelas untuk Dicetak */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-slate-400 font-medium">Filter Kelas:</span>
                <select
                  value={printKelasId}
                  onChange={(e) => {
                    setPrintKelasId(e.target.value);
                    setPreviewTab("all");
                  }}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-800">
                    Semua Kelas ({remedialList.length} Siswa)
                  </option>
                  {availableKelas.map((k) => {
                    const countInClass = remedialList.filter((r) => {
                      const s = state.agmp_siswa.find((sis) => sis.id === r.siswaId);
                      return (r.kelasId || s?.kelasId) === k.id;
                    }).length;
                    return (
                      <option key={k.id} value={k.id} className="bg-slate-800">
                        {k.nama} ({countInClass} Siswa)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Filter Status Cetak */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">Status:</span>
                <select
                  value={printStatusFilter}
                  onChange={(e) => {
                    setPrintStatusFilter(e.target.value as any);
                    setPreviewTab("all");
                  }}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="semua" className="bg-slate-800">Semua Status</option>
                  <option value="sedang" className="bg-slate-800">Sedang Remedial Saja</option>
                  <option value="selesai" className="bg-slate-800">Tuntas / Selesai Saja</option>
                </select>
              </div>

              {/* Ukuran Kertas Dinamis */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">Kertas:</span>
                <select
                  value={paperSize}
                  onChange={(e) => setPaperSize(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="folio" className="bg-slate-800">Folio / F4 (215 x 330 mm)</option>
                  <option value="a4" className="bg-slate-800">A4 (210 x 297 mm)</option>
                  <option value="legal" className="bg-slate-800">Legal (216 x 356 mm)</option>
                  <option value="letter" className="bg-slate-800">Letter (216 x 279 mm)</option>
                </select>
              </div>

              {/* Margin Kertas Dinamis */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">Margin:</span>
                <select
                  value={paperMargin}
                  onChange={(e) => setPaperMargin(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="normal" className="bg-slate-800">Standar (9 mm)</option>
                  <option value="compact" className="bg-slate-800">Sempit (6 mm)</option>
                  <option value="spacious" className="bg-slate-800">Lebar (14 mm)</option>
                </select>
              </div>

              {/* Tata Letak Halaman */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">Tata Letak:</span>
                <select
                  value={paperLayoutMode}
                  onChange={(e) => setPaperLayoutMode(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="auto" className="bg-slate-800">Otomatis Dinamis ({printPagesData.length} Hal)</option>
                  <option value="force1" className="bg-slate-800">Muat 1 Halaman</option>
                  <option value="split2" className="bg-slate-800">Bagi 2 Halaman</option>
                  {printRows.length > 25 && (
                    <option value="split3" className="bg-slate-800">Bagi 3 Halaman</option>
                  )}
                </select>
              </div>

              {/* Kerapatan Baris */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">Kerapatan:</span>
                <select
                  value={paperDensity}
                  onChange={(e) => setPaperDensity(e.target.value as any)}
                  className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="auto" className="bg-slate-800">Auto</option>
                  <option value="normal" className="bg-slate-800">Normal</option>
                  <option value="compact" className="bg-slate-800">Kompak</option>
                  <option value="ultra" className="bg-slate-800">Sangat Rapat</option>
                </select>
              </div>

              {/* Toggle Tanda Tangan */}
              <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-2.5 py-1.5 rounded-xl border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-indigo-500"
                />
                Tanda Tangan
              </label>

              {/* Tab Navigasi Halaman jika > 1 */}
              {printPagesData.length > 1 && (
                <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700 text-xs">
                  <button
                    onClick={() => setPreviewTab("all")}
                    className={`px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
                      previewTab === "all"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Semua ({printPagesData.length})
                  </button>
                  {printPagesData.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPreviewTab(idx)}
                      className={`px-2.5 py-1 rounded-lg transition-colors font-medium cursor-pointer ${
                        previewTab === idx
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Hal {idx + 1}
                    </button>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                title="Buka dialog cetak browser / simpan sebagai PDF"
              >
                <Printer className="w-4 h-4" />
                Cetak Sekarang
              </button>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                title="Tutup Pratinjau Cetak"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Paper Sheet Canvas (Realistic View) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-slate-950/80 flex flex-col items-center">
            {printPagesData.map((pageRows, pageIdx) => {
              if (previewTab !== "all" && previewTab !== pageIdx) return null;
              const startingIndex = printPagesData
                .slice(0, pageIdx)
                .reduce((sum, p) => sum + p.length, 0);

              return (
                <div key={pageIdx} className="w-full max-w-5xl flex flex-col items-center">
                  <div className="w-full flex items-center justify-between text-xs text-slate-400 mb-2 px-1">
                    <span className="font-semibold text-slate-300">
                      Lembar Cetak #{pageIdx + 1} dari {printPagesData.length} — {paperConfig.label}
                    </span>
                    <span className="text-slate-400">
                      {pageRows.length} Siswa pada Halaman Ini
                    </span>
                  </div>

                  {/* Simulated Paper Sheet */}
                  <div
                    className="w-full bg-white text-black shadow-2xl rounded-sm border border-gray-300 overflow-hidden flex flex-col justify-between"
                    style={{
                      aspectRatio: paperConfig.aspectRatio,
                      minHeight: "185mm",
                    }}
                  >
                    <div className={`flex-1 flex flex-col justify-between ${marginConfig.paddingClass}`}>
                      <RemedialPrintPaperSheet
                        pageIndex={pageIdx}
                        totalPages={printPagesData.length}
                        pageRows={pageRows}
                        startingIndex={startingIndex}
                        schoolName={schoolName}
                        mapelName={mapelName}
                        kelasName={printKelasNama}
                        activeTA={activeTA}
                        guruName={guruName}
                        todayStr={todayStr}
                        kepsekName={kepsekName}
                        kepsekNip={kepsekNip}
                        guruNip={guruNip}
                        densityStyles={densityStyles}
                        showSignatures={showSignatures}
                        printStatusFilter={printStatusFilter}
                        state={state}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// REMEDIAL PRINT PAPER SHEET HELPER COMPONENT
// ==========================================
function RemedialPrintPaperSheet({
  pageIndex,
  totalPages,
  pageRows,
  startingIndex,
  schoolName,
  mapelName,
  kelasName,
  activeTA,
  guruName,
  todayStr,
  kepsekName,
  kepsekNip,
  guruNip,
  densityStyles,
  showSignatures,
  printStatusFilter,
  state,
}: {
  pageIndex: number;
  totalPages: number;
  pageRows: TRemedial[];
  startingIndex: number;
  schoolName: string;
  mapelName: string;
  kelasName: string;
  activeTA: any;
  guruName: string;
  todayStr: string;
  kepsekName: string;
  kepsekNip: string;
  guruNip: string;
  densityStyles: any;
  showSignatures: boolean;
  printStatusFilter: string;
  state: any;
}) {
  const isFirstPage = pageIndex === 0;
  const isLastPage = pageIndex === totalPages - 1;

  return (
    <div className="w-full flex-1 flex flex-col justify-between text-black">
      {/* KOP / HEADER */}
      {isFirstPage ? (
        <div className="mb-2.5">
          {/* Formal School Kop */}
          <div className="text-center border-b-2 border-black pb-2 mb-2">
            <h3 className="text-[10px] uppercase tracking-wider font-semibold">
              PEMERINTAH KABUPATEN BUOL
            </h3>
            <h4 className="text-[10px] uppercase tracking-wider font-semibold">
              DINAS PENDIDIKAN DAN KEBUDAYAAN
            </h4>
            <h2 className="text-sm sm:text-base uppercase tracking-wider font-black mt-0.5">
              {schoolName}
            </h2>
            <p className="text-[9px] text-gray-700 mt-0.5">
              Alamat: Jl. Syarif Mansur No. 05 Kel. Biau, Kec. Biau, Kab. Buol, Prov. Sulawesi Tengah
            </p>
            <div className="border-t border-black mt-1 pt-0.5" />
          </div>

          {/* Judul Dokumen */}
          <div className="text-center mb-2">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide underline">
              REKAPITULASI PELAKSANAAN PROGRAM REMEDIAL
            </h2>
            <p className="text-[10px] font-bold text-gray-800 mt-0.5">
              {printStatusFilter === "sedang"
                ? "DAFTAR SISWA SEDANG MENGIKUTI PROGRAM REMEDIAL"
                : printStatusFilter === "selesai"
                ? "DAFTAR SISWA YANG TELAH MENYELESAIKAN PROGRAM REMEDIAL"
                : "DAFTAR KESELURUHAN SISWA PROGRAM REMEDIAL"}
            </p>
          </div>

          {/* Meta Identitas */}
          <div className="grid grid-cols-2 text-[10px] mb-2 font-medium bg-gray-50/70 p-2 rounded border border-gray-300">
            <div className="space-y-0.5">
              <div className="flex gap-2">
                <span className="w-24 text-gray-600">Satuan Pendidikan</span>
                <span>: <strong className="text-black">{schoolName}</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-gray-600">Mata Pelajaran</span>
                <span>: <strong className="text-black">{mapelName}</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-gray-600">Kelas / Rombel</span>
                <span>: <strong className="text-black">{kelasName}</strong></span>
              </div>
            </div>
            <div className="space-y-0.5">
              <div className="flex gap-2">
                <span className="w-24 text-gray-600">Tahun Pelajaran</span>
                <span>: <strong className="text-black">{activeTA?.nama || "2024/2025"}</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-gray-600">Semester</span>
                <span>: <strong className="text-black">{activeTA?.semester || "Ganjil"}</strong></span>
              </div>
              <div className="flex gap-2">
                <span className="w-24 text-gray-600">Guru Pengampu</span>
                <span>: <strong className="text-black">{guruName}</strong></span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Continuation Header on Page 2+ */
        <div className="flex justify-between items-center text-[10px] border-b border-black pb-1.5 mb-2.5">
          <div>
            <strong className="uppercase">{schoolName}</strong> — Rekapitulasi Program Remedial
          </div>
          <div className="text-gray-700">
            Kelas: <strong className="text-black">{kelasName}</strong> | Mapel: <strong className="text-black">{mapelName}</strong>{" "}
            <em>(Lanjutan Hal {pageIndex + 1} dari {totalPages})</em>
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="flex-1">
        <table className={`w-full border-collapse border border-black ${densityStyles.tableText}`}>
          <thead>
            <tr className="bg-gray-100 text-gray-900 border border-black text-center font-bold">
              <th className={`border border-black w-8 ${densityStyles.headerText}`}>No</th>
              <th className={`border border-black w-[20%] text-left ${densityStyles.headerText}`}>Nama Siswa & NISN</th>
              <th className={`border border-black w-[7%] ${densityStyles.headerText}`}>Kelas</th>
              <th className={`border border-black w-[20%] text-left ${densityStyles.headerText}`}>Materi / TP Asesmen</th>
              <th className={`border border-black w-[9%] ${densityStyles.headerText}`}>Nilai Awal</th>
              <th className={`border border-black w-[15%] text-left ${densityStyles.headerText}`}>Bentuk Remedial & PIC</th>
              <th className={`border border-black w-[9%] ${densityStyles.headerText}`}>Jadwal</th>
              <th className={`border border-black w-[9%] ${densityStyles.headerText}`}>Status</th>
              <th className={`border border-black w-[8%] ${densityStyles.headerText}`}>Nilai Baru</th>
              <th className={`border border-black w-[8%] ${densityStyles.headerText}`}>Hasil Akhir</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={10} className="border border-black p-4 text-center italic text-gray-500">
                  Tidak ada data siswa remedial untuk filter yang dipilih.
                </td>
              </tr>
            ) : (
              pageRows.map((r, idx) => {
                const siswa = state.agmp_siswa.find((s: any) => s.id === r.siswaId);
                const tp = state.agmp_tp.find((t: any) => t.id === r.tpId);
                const existingSumatif = state.agmp_sumatif.find((s: any) => s.id === r.sumatifId);
                const sumatifAsli = existingSumatif?.records?.[r.siswaId];
                const rowKelas = state.agmp_kelas.find((k: any) => k.id === (r.kelasId || siswa?.kelasId))?.nama || "-";

                return (
                  <tr key={r.id} className="border border-black">
                    <td className={`border border-black text-center font-medium ${densityStyles.cellPadding}`}>
                      {startingIndex + idx + 1}
                    </td>
                    <td className={`border border-black font-semibold text-gray-950 ${densityStyles.cellPadding}`}>
                      <div>{siswa?.nama || "-"}</div>
                      <div className={`font-mono text-gray-600 ${densityStyles.subText}`}>NISN: {siswa?.nisn || "-"}</div>
                    </td>
                    <td className={`border border-black text-center font-medium ${densityStyles.cellPadding}`}>
                      {rowKelas}
                    </td>
                    <td className={`border border-black ${densityStyles.cellPadding}`}>
                      <div className="font-bold text-gray-900">TP {tp?.kode || "-"}</div>
                      <div className={`text-gray-700 line-clamp-1 ${densityStyles.subText}`} title={tp?.deskripsi}>
                        {tp?.deskripsi || "-"}
                      </div>
                    </td>
                    <td className={`border border-black text-center font-bold text-red-600 ${densityStyles.cellPadding}`}>
                      {sumatifAsli?.nilai ?? "-"}
                      {sumatifAsli?.level && (
                        <span className={`block font-normal text-gray-500 ${densityStyles.subText}`}>
                          L{sumatifAsli.level}
                        </span>
                      )}
                    </td>
                    <td className={`border border-black ${densityStyles.cellPadding}`}>
                      <div className="font-medium">{r.jenis || "-"}</div>
                      <div className={`text-gray-600 ${densityStyles.subText}`}>PIC: {r.pic || "-"}</div>
                    </td>
                    <td className={`border border-black text-center ${densityStyles.cellPadding}`}>
                      <div>{r.jadwal ? r.jadwal.split("T")[0] : "-"}</div>
                      {r.target && (
                        <div className={`text-gray-500 ${densityStyles.subText}`}>T: {r.target}</div>
                      )}
                    </td>
                    <td className={`border border-black text-center font-medium ${densityStyles.cellPadding}`}>
                      <span className={`inline-block font-semibold ${
                        r.status === "Selesai"
                          ? "text-emerald-800"
                          : r.status === "Berlangsung"
                          ? "text-amber-800"
                          : "text-blue-800"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className={`border border-black text-center font-black ${densityStyles.cellPadding}`}>
                      {r.nilaiBaru !== undefined ? r.nilaiBaru : "-"}
                    </td>
                    <td className={`border border-black text-center font-bold ${densityStyles.cellPadding}`}>
                      <span className={r.statusBaru === "TUNTAS" || r.status === "Selesai" ? "text-emerald-700 font-extrabold" : "text-gray-700"}>
                        {r.statusBaru || (r.status === "Selesai" ? "TUNTAS" : "-")}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* TANDA TANGAN (Hanya pada Halaman Terakhir jika showSignatures aktif) */}
      {isLastPage && showSignatures && (
        <div className="pt-3 break-inside-avoid">
          <div className="grid grid-cols-2 text-[10px]">
            <div className="text-left pl-6">
              <p>Mengetahui,</p>
              <p className="font-bold">Kepala Sekolah</p>
              <div className={densityStyles.sigSpace} />
              <p className="font-bold underline">{kepsekName}</p>
              <p className="text-[9px] text-gray-700">{kepsekNip}</p>
            </div>
            <div className="text-right pr-6">
              <p>Biau, {todayStr}</p>
              <p className="font-bold">Guru Mata Pelajaran</p>
              <div className={densityStyles.sigSpace} />
              <p className="font-bold underline">{guruName}</p>
              <p className="text-[9px] text-gray-700">{guruNip}</p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="border-t border-gray-300 mt-2 pt-1 flex justify-between items-center text-[9px] text-gray-500">
        <div>{schoolName} • Dokumen Rekapitulasi Pelaksanaan Remedial</div>
        <div>Tanggal Cetak: {todayStr}</div>
        <div className="font-bold text-gray-700">Halaman {pageIndex + 1} dari {totalPages}</div>
      </div>
    </div>
  );
}
