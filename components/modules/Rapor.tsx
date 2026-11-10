import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  FileText,
  Download,
  Printer,
  Edit2,
  Sliders,
  Calculator,
  User,
  Users,
  Award,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Rapor() {
  const { state, filteredKelas, showToast } = useStore();

  const activeTA = state.agmp_tahun_ajaran.find((ta) => ta.isActive);
  const [selectedTaId, setSelectedTaId] = useState(activeTA?.id || "");
  const [kelasId, setKelasId] = useState(filteredKelas[0]?.id || "");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);

  // Mode: "rekap" (Rekap Nilai Rapor Kelas & Cetak Rekap) vs "siswa" (Rapor Individu Siswa)
  const [activeMode, setActiveMode] = useState<"rekap" | "siswa">("rekap");

  // Fitur Bobot Nilai: Kehadiran 40%, Rata-rata Sumatif 60% vs Rata-rata Sumatif 100%
  const [useBobot, setUseBobot] = useState<boolean>(true);

  // Search filter for recap
  const [searchQuery, setSearchQuery] = useState("");

  // Edit manual narrative per siswa
  const [customNarratives, setCustomNarratives] = useState<Record<string, string>>({});
  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState("");
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const selectedTA = state.agmp_tahun_ajaran.find((ta) => ta.id === selectedTaId);
  const selectedSemester = selectedTA?.semester || "Ganjil";
  const tpSemesterToMatch = selectedSemester === "Ganjil" ? "1" : "2";

  const siswaList = useMemo(() => {
    return state.agmp_siswa
      .filter((s) => s.kelasId === kelasId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [state.agmp_siswa, kelasId]);

  const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId);
  const kelas = filteredKelas.find((k) => k.id === kelasId);

  const interval = {
    batasBawahTuntas: 75,
    batasAtasLanjut: 85,
    batasBawahSelektif: 61,
  };

  // Helper calculation for student attendance (Kehadiran)
  const calculateKehadiran = (sId: string) => {
    const classAbsensi = state.agmp_absensi.filter(
      (a) => a.kelasId === kelasId && (selectedTaId ? a.taId === selectedTaId : true),
    );
    if (classAbsensi.length === 0) {
      return {
        percent: 100,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        bolos: 0,
        total: 0,
      };
    }

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

  // Generate data for report & recap for a specific student
  const generateStudentReportData = (siswaId: string, currentUseBobot: boolean) => {
    const tps = state.agmp_tp.filter(
      (tp) =>
        tp.kelasIds.includes(kelasId) &&
        (selectedTA ? tp.semester === selectedTA.semester || tp.semester === tpSemesterToMatch : true),
    );

    let scores: {
      tp: string;
      deskripsiTP: string;
      nilai: number;
      status: string;
      isRemedial: boolean;
      predikat: string;
    }[] = [];
    let allNilai: number[] = [];

    tps.forEach((tp) => {
      const sumatifMatches = state.agmp_sumatif.filter((s) => s.tpId === tp.id && s.kelasId === kelasId);
      const sumatif = selectedTaId
        ? sumatifMatches.find((s) => s.taId === selectedTaId) || sumatifMatches.find((s) => !s.taId)
        : sumatifMatches[0];

      if (sumatif) {
        let record = sumatif.records[siswaId];
        // Check remedial override
        const remedialMatches = state.agmp_remedial.filter(
          (r) => r.sumatifId === sumatif.id && r.siswaId === siswaId && r.status === "Selesai",
        );
        const remedial = selectedTaId
          ? remedialMatches.find((r) => r.taId === selectedTaId) || remedialMatches.find((r) => !r.taId)
          : remedialMatches[0];

        if (remedial && remedial.nilaiBaru !== undefined) {
          record = {
            level: remedial.levelBaru!,
            nilai: remedial.nilaiBaru,
            catatan: "",
            status: remedial.statusBaru!,
          };
        }

        if (record && record.nilai > 0) {
          allNilai.push(record.nilai);
          let predikatDesc = "";
          if (record.nilai > interval.batasAtasLanjut) predikatDesc = "Sangat Baik";
          else if (record.nilai >= interval.batasBawahTuntas) predikatDesc = "Baik";
          else if (record.nilai >= interval.batasBawahSelektif) predikatDesc = "Cukup";
          else predikatDesc = "Kurang";

          scores.push({
            tp: tp.kode,
            deskripsiTP: tp.deskripsi,
            nilai: record.nilai,
            status: record.status,
            isRemedial: !!remedial,
            predikat: predikatDesc,
          });
        }
      }
    });

    const avgSumatif = allNilai.length > 0 ? Math.round(allNilai.reduce((a, b) => a + b, 0) / allNilai.length) : 0;
    const keh = calculateKehadiran(siswaId);
    const kehadiranPercent = keh.percent;

    // Perhitungan Nilai Akhir Rapor:
    // Jika bobot aktif: Kehadiran 40%, Rata-rata sumatif 60%
    // Jika bobot tidak aktif: Rata-rata nilai sumatif murni
    const nilaiAkhirRapor = allNilai.length > 0
      ? currentUseBobot
        ? Math.round((kehadiranPercent * 0.40) + (avgSumatif * 0.60))
        : avgSumatif
      : (currentUseBobot && keh.total > 0 ? Math.round(kehadiranPercent * 0.40) : 0);

    let predikatRapor = "-";
    if (allNilai.length > 0 || keh.total > 0) {
      if (nilaiAkhirRapor > interval.batasAtasLanjut) predikatRapor = "Sangat Baik";
      else if (nilaiAkhirRapor >= interval.batasBawahTuntas) predikatRapor = "Baik";
      else if (nilaiAkhirRapor >= interval.batasBawahSelektif) predikatRapor = "Cukup";
      else predikatRapor = "Kurang";
    }

    const isTuntas = allNilai.length > 0 && nilaiAkhirRapor >= interval.batasBawahTuntas;

    // KRUSIAL (Requirement 2):
    // "kalimat 'sangat baik' harus merujuk pada salah satu Tujuan Pembelajaran yang memperoleh nilai sumatif tertinggi,
    // sementara kalimat 'perlu mendapatkan bimbingan' harus merujuk pada nilai Tujuan pembelajaran yang memperoleh nilai sumatif terendah."
    let highestTP: typeof scores[0] | null = null;
    let lowestTP: typeof scores[0] | null = null;

    if (scores.length > 0) {
      const maxNilai = Math.max(...scores.map((s) => s.nilai));
      const minNilai = Math.min(...scores.map((s) => s.nilai));

      // Merujuk pada salah satu TP dengan nilai sumatif tertinggi
      highestTP = scores.find((s) => s.nilai === maxNilai) || null;

      // Merujuk pada nilai TP yang memperoleh nilai sumatif terendah
      const candidatesLow = scores.filter((s) => s.nilai === minNilai);
      lowestTP = candidatesLow[candidatesLow.length - 1] || null;
    }

    const siswaObj = state.agmp_siswa.find((s) => s.id === siswaId);
    const siswaNama = siswaObj?.nama || "Peserta Didik";
    const mapelName =
      state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
      state.agmp_pengaturan?.mapel ||
      "Mata Pelajaran";

    // Format deskripsi capaian naratif Kurikulum Merdeka
    let narrative = "";
    if (scores.length === 0) {
      narrative = `Belum ada data nilai sumatif untuk Ananda ${siswaNama} pada mata pelajaran ${mapelName}.`;
    } else if (scores.length === 1) {
      if (highestTP && highestTP.nilai >= interval.batasBawahTuntas) {
        narrative = `Ananda ${siswaNama} menunjukkan penguasaan yang sangat baik dalam ${highestTP.deskripsiTP}.`;
      } else if (lowestTP) {
        narrative = `Ananda ${siswaNama} perlu mendapatkan bimbingan untuk meningkatkan ${lowestTP.deskripsiTP}.`;
      }
    } else {
      if (highestTP && lowestTP && highestTP.tp !== lowestTP.tp) {
        narrative = `Ananda ${siswaNama} menunjukkan penguasaan yang sangat baik dalam ${highestTP.deskripsiTP}. Sementara itu, ananda perlu mendapatkan bimbingan untuk meningkatkan ${lowestTP.deskripsiTP}.`;
      } else {
        // Semua nilai TP identik
        if (highestTP && highestTP.nilai >= interval.batasBawahTuntas) {
          narrative = `Ananda ${siswaNama} menunjukkan penguasaan yang sangat baik dalam ${highestTP.deskripsiTP}. Disarankan untuk terus mempertahankan dan memperkaya kompetensi materi.`;
        } else if (lowestTP) {
          narrative = `Ananda ${siswaNama} perlu mendapatkan bimbingan untuk meningkatkan ${lowestTP.deskripsiTP}.`;
        }
      }
    }

    return {
      scores,
      allNilai,
      avgSumatif,
      kehadiranPercent,
      keh,
      nilaiAkhirRapor,
      predikatRapor,
      isTuntas,
      highestTP,
      lowestTP,
      narrative,
    };
  };

  // Compile recap data for all students in the selected class
  const classRecapData = useMemo(() => {
    return siswaList.map((siswa, idx) => {
      const data = generateStudentReportData(siswa.id, useBobot);
      return {
        no: idx + 1,
        siswa,
        ...data,
      };
    });
  }, [siswaList, useBobot, selectedTaId, kelasId, state.agmp_sumatif, state.agmp_remedial, state.agmp_absensi]);

  // Filtered recap data for search
  const filteredRecapData = useMemo(() => {
    if (!searchQuery.trim()) return classRecapData;
    const q = searchQuery.toLowerCase();
    return classRecapData.filter(
      (item) =>
        item.siswa.nama.toLowerCase().includes(q) ||
        (item.siswa.nisn && item.siswa.nisn.toLowerCase().includes(q)),
    );
  }, [classRecapData, searchQuery]);

  // Current single student report data
  const currentStudentData = selectedSiswaId
    ? generateStudentReportData(selectedSiswaId, useBobot)
    : null;

  // Handle PDF Export for Class Recap
  const handleExportRekapPDF = async () => {
    if (classRecapData.length === 0) {
      showToast("Tidak ada data siswa untuk diekspor", "error");
      return;
    }

    setIsExportingPDF(true);
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const callAutoTable = (options: any) => {
        if (typeof autoTable === "function") {
          autoTable(doc, options);
        } else if (typeof (autoTable as any)?.default === "function") {
          (autoTable as any).default(doc, options);
        } else if (typeof (doc as any)?.autoTable === "function") {
          (doc as any).autoTable(options);
        }
      };

      const sekolahNama = state.agmp_pengaturan?.sekolah || "SMP NEGERI 1 BIAU";
      const mapelNama =
        state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
        state.agmp_pengaturan?.mapel ||
        "-";

      // 1. Header Rekap
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(26, 54, 93);
      doc.text("REKAPITULASI NILAI AKHIR RAPOR & CAPAIAN KOMPETENSI SISWA", 148.5, 14, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(sekolahNama.toUpperCase(), 148.5, 19.5, { align: "center" });

      // Sub-info box
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      const kelasText = `Kelas: ${kelas?.nama || "-"} (Fase ${kelas?.fase || "-"})`;
      const taText = `Tahun Ajaran: ${selectedTA ? `${selectedTA.nama} Semester ${selectedTA.semester}` : "-"}`;
      const guruText = `Guru Mapel: ${state.agmp_pengaturan?.guruNama || "-"}`;
      const rumusText = useBobot
        ? "Komposisi Bobot: 40% Kehadiran + 60% Rata-rata Sumatif"
        : "Komposisi: 100% Rata-rata Nilai Sumatif Murni (Tanpa Bobot Kehadiran)";

      doc.text(`${kelasText}  •  Mata Pelajaran: ${mapelNama}  •  ${taText}  •  ${guruText}`, 148.5, 24.5, {
        align: "center",
      });
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(2, 132, 199);
      doc.text(`*Catatan Rumus: ${rumusText}`, 148.5, 28.5, { align: "center" });

      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(14, 30.5, 283, 30.5);

      // 2. Table Data
      const tableBody = classRecapData.map((item) => {
        const highestText = item.highestTP
          ? `TP ${item.highestTP.tp} (${item.highestTP.nilai}): Sangat baik dalam ${item.highestTP.deskripsiTP}`
          : "-";
        const lowestText = item.lowestTP
          ? `TP ${item.lowestTP.tp} (${item.lowestTP.nilai}): Perlu bimbingan dalam ${item.lowestTP.deskripsiTP}`
          : "-";

        return [
          item.no.toString(),
          item.siswa.nisn || "-",
          item.siswa.nama,
          `${item.kehadiranPercent}%`,
          item.avgSumatif > 0 ? item.avgSumatif.toString() : "-",
          item.nilaiAkhirRapor > 0 ? item.nilaiAkhirRapor.toString() : "-",
          item.predikatRapor,
          item.isTuntas ? "TUNTAS" : item.allNilai.length > 0 ? "BELUM TUNTAS" : "-",
          highestText,
          lowestText,
        ];
      });

      callAutoTable({
        startY: 33,
        head: [
          [
            "No",
            "NISN",
            "Nama Peserta Didik",
            "Kehadiran",
            "Rata-rata Sumatif",
            "Nilai Akhir",
            "Predikat",
            "Status",
            "Capaian Tertinggi (Sangat Baik)",
            "Capaian Terendah (Perlu Bimbingan)",
          ],
        ],
        body: tableBody,
        theme: "grid",
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: 255,
          fontStyle: "bold",
          fontSize: 7.5,
          halign: "center",
        },
        styles: {
          fontSize: 7,
          cellPadding: 1.8,
          textColor: [30, 41, 59],
        },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 16, halign: "center" },
          2: { cellWidth: 38, fontStyle: "bold" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 16, halign: "center" },
          5: { cellWidth: 15, halign: "center", fontStyle: "bold" },
          6: { cellWidth: 16, halign: "center" },
          7: { cellWidth: 18, halign: "center" },
          8: { cellWidth: 63 },
          9: { cellWidth: 64 },
        },
        margin: { left: 14, right: 14 },
      });

      // 3. Tanda Tangan Footer
      const finalY = (doc as any).lastAutoTable?.finalY ?? 150;
      let signY = finalY + 10;
      if (signY > 170) {
        doc.addPage();
        signY = 25;
      }

      const todayStr = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      doc.text("Mengetahui,", 40, signY);
      doc.text(`Dicetak pada: ${todayStr}`, 215, signY);

      doc.text("Kepala Sekolah", 40, signY + 5);
      doc.text("Guru Mata Pelajaran", 215, signY + 5);

      doc.text("( ............................................ )", 40, signY + 25);
      doc.text(
        state.agmp_pengaturan?.guruNama ? `( ${state.agmp_pengaturan.guruNama} )` : "( ............................................ )",
        215,
        signY + 25,
      );

      doc.text("NIP. ............................................", 40, signY + 30);
      doc.text("NIP. ............................................", 215, signY + 30);

      const sanitizedKelas = (kelas?.nama || "Kelas").replace(/[/\\?%*:|"<>]/g, "_");
      doc.save(`Rekap_Nilai_Rapor_${sanitizedKelas}.pdf`);
      showToast("Rekap PDF Nilai Rapor berhasil diunduh!", "success");
    } catch (err) {
      console.error("Gagal export PDF:", err);
      showToast("Gagal mengunduh PDF rekap", "error");
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Handle CSV Export for Class Recap
  const handleExportRekapCSV = () => {
    if (classRecapData.length === 0) return;

    const headers = [
      "No",
      "NISN",
      "Nama Siswa",
      "Kehadiran (%)",
      "Rata-rata Sumatif",
      useBobot ? "Nilai Akhir Rapor (40% Hadir + 60% Sumatif)" : "Nilai Akhir Rapor (Sumatif 100%)",
      "Predikat",
      "Status",
      "Capaian Tertinggi (Sangat Baik)",
      "Capaian Terendah (Perlu Bimbingan)",
      "Deskripsi Rapor Lengkap",
    ];

    const rows = classRecapData.map((item) => {
      const highest = item.highestTP
        ? `TP ${item.highestTP.tp} (${item.highestTP.nilai}) - ${item.highestTP.deskripsiTP}`
        : "-";
      const lowest = item.lowestTP
        ? `TP ${item.lowestTP.tp} (${item.lowestTP.nilai}) - ${item.lowestTP.deskripsiTP}`
        : "-";
      return [
        item.no,
        `"${item.siswa.nisn || ""}"`,
        `"${item.siswa.nama}"`,
        item.kehadiranPercent,
        item.avgSumatif,
        item.nilaiAkhirRapor,
        `"${item.predikatRapor}"`,
        `"${item.isTuntas ? "Tuntas" : "Belum Tuntas"}"`,
        `"${highest.replace(/"/g, '""')}"`,
        `"${lowest.replace(/"/g, '""')}"`,
        `"${item.narrative.replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    const sanitizedKelas = (kelas?.nama || "Kelas").replace(/[/\\?%*:|"<>]/g, "_");
    link.setAttribute("download", `Rekap_Rapor_${sanitizedKelas}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("File CSV Rekap Rapor berhasil diunduh!", "success");
  };

  return (
    <div className="space-y-6 pb-20">
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rapor & Deskripsi Capaian</h2>
          <p className="text-sm text-gray-500 mt-1">
            Pengolahan nilai akhir rapor, deskripsi capaian kompetensi otomatis, dan cetak rekap kelas.
          </p>
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveMode("rekap")}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === "rekap"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Rekap Nilai Rapor Kelas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveMode("siswa");
              if (!selectedSiswaId && siswaList.length > 0) {
                setSelectedSiswaId(siswaList[0].id);
              }
            }}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activeMode === "siswa"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Rapor Perorangan Siswa</span>
          </button>
        </div>
      </header>

      {/* FILTER & CONFIGURATION BAR */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 print:hidden space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-end">
          {/* Tahun Ajaran */}
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Tahun Ajaran & Semester
            </label>
            <select
              className="w-full text-xs sm:text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
              value={selectedTaId}
              onChange={(e) => setSelectedTaId(e.target.value)}
            >
              <option value="" disabled>
                Pilih Tahun Ajaran
              </option>
              {state.agmp_tahun_ajaran.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama} - Semester {ta.semester}
                </option>
              ))}
            </select>
          </div>

          {/* Kelas */}
          <div className="sm:col-span-3">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Kelas
            </label>
            <select
              className="w-full text-xs sm:text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
              value={kelasId}
              onChange={(e) => {
                setKelasId(e.target.value);
                setSelectedSiswaId(null);
              }}
            >
              {filteredKelas.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama} (Fase {k.fase})
                </option>
              ))}
            </select>
          </div>

          {/* Siswa Selector (Saat Mode Siswa) */}
          {activeMode === "siswa" && (
            <div className="sm:col-span-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
                Pilih Siswa
              </label>
              <select
                className="w-full text-xs sm:text-sm font-semibold text-gray-900 p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
                value={selectedSiswaId || ""}
                onChange={(e) => setSelectedSiswaId(e.target.value)}
              >
                <option value="" disabled>
                  -- Pilih Siswa --
                </option>
                {siswaList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.nisn})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Toggle Bobot Nilai (Requirement 1) */}
          <div className={`${activeMode === "siswa" ? "sm:col-span-3" : "sm:col-span-6"} flex flex-col justify-end`}>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1.5">
              Opsi Perhitungan Nilai Akhir
            </label>
            <button
              type="button"
              onClick={() => setUseBobot(!useBobot)}
              className={`w-full p-2.5 rounded-xl text-xs font-bold border flex items-center justify-between gap-2 transition-all shadow-2xs ${
                useBobot
                  ? "bg-indigo-50/80 text-indigo-800 border-indigo-200 ring-1 ring-indigo-100"
                  : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
              }`}
              title="Aktifkan atau nonaktifkan bobot nilai kehadiran (40%) + sumatif (60%)"
            >
              <div className="flex items-center gap-2 truncate">
                <Sliders className={`w-4 h-4 shrink-0 ${useBobot ? "text-indigo-600" : "text-gray-400"}`} />
                <span className="truncate">
                  Bobot Nilai:{" "}
                  <strong>{useBobot ? "Aktif (Hadir 40% + Sumatif 60%)" : "Nonaktif (Sumatif Murni 100%)"}</strong>
                </span>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-black shrink-0 ${
                  useBobot ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-700"
                }`}
              >
                {useBobot ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        {/* Info Banner Rumus Nilai Akhir */}
        <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>Rumus Nilai Akhir Rapor:</strong>{" "}
              {useBobot ? (
                <>
                  <span className="text-indigo-700 font-bold">40% Kehadiran</span> +{" "}
                  <span className="text-blue-700 font-bold">60% Rata-rata Nilai Sumatif</span>
                </>
              ) : (
                <span className="text-gray-800 font-bold">Rata-rata Nilai Sumatif (100% tanpa bobot absensi)</span>
              )}
            </span>
          </div>
          <span className="text-[11px] font-semibold text-blue-700 hidden sm:inline">
            {useBobot ? "Mode Pembobotan Aktif" : "Mode Standar Murni"}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: REKAPITULASI NILAI RAPOR KELAS (DILENGKAPI CETAK REKAP)           */}
      {/* ========================================================================= */}
      {activeMode === "rekap" && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 print:hidden bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari siswa atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
                Total: <strong>{classRecapData.length}</strong> siswa
              </span>
            </div>

            {/* Print & Export Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                title="Cetak lembar rekap rapor kelas"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Rekap</span>
              </button>
              <button
                type="button"
                onClick={handleExportRekapPDF}
                disabled={isExportingPDF}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs disabled:opacity-60"
              >
                <Download className="w-4 h-4 text-gray-500" />
                <span>{isExportingPDF ? "Mengekspor..." : "Unduh PDF"}</span>
              </button>
              <button
                type="button"
                onClick={handleExportRekapCSV}
                className="flex-1 sm:flex-none px-3.5 py-2 bg-white hover:bg-gray-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
              >
                <FileText className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          {/* Printable Recap Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:border-none print:shadow-none print:m-0 print:rounded-none">
            {/* Header Cetak (Khusus Print) */}
            <div className="hidden print:block text-center mb-4 p-4 border-b border-gray-300">
              <h2 className="text-lg font-black uppercase tracking-wide text-gray-900">
                REKAPITULASI NILAI AKHIR RAPOR & CAPAIAN KOMPETENSI SISWA
              </h2>
              <h3 className="text-sm font-bold text-gray-700 uppercase mt-0.5">
                {state.agmp_pengaturan?.sekolah || "SMP NEGERI 1 BIAU"}
              </h3>
              <div className="flex justify-between items-center text-[10.5px] text-gray-700 mt-2 px-1 border-t border-gray-300 pt-1.5 font-semibold">
                <span>Kelas: {kelas?.nama || "-"} (Fase {kelas?.fase || "-"})</span>
                <span>Mata Pelajaran: {state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama || state.agmp_pengaturan?.mapel || "-"}</span>
                <span>Tahun Ajaran: {selectedTA ? `${selectedTA.nama} (${selectedTA.semester})` : "-"}</span>
                <span>Guru: {state.agmp_pengaturan?.guruNama || "-"}</span>
              </div>
              <div className="text-[10px] text-blue-800 italic mt-1 text-center bg-blue-50/50 py-0.5 rounded">
                *Ketentuan Nilai Akhir:{" "}
                {useBobot
                  ? "Bobot Aktif (40% Kehadiran + 60% Rata-rata Sumatif)"
                  : "Murni Rata-rata Nilai Sumatif (100% Tanpa Bobot Kehadiran)"}
              </div>
            </div>

            {/* Rekap Table */}
            <div className="overflow-x-auto">
              <style>{`
                @media print {
                  @page { size: A4 landscape; margin: 10mm 12mm; }
                  body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                  table.rekap-rapor-table {
                    width: 100% !important;
                    font-size: 8pt !important;
                    border-collapse: collapse !important;
                  }
                  table.rekap-rapor-table th,
                  table.rekap-rapor-table td {
                    padding: 3.5px 5px !important;
                    border: 1px solid #cbd5e1 !important;
                  }
                  table.rekap-rapor-table th {
                    background-color: #f1f5f9 !important;
                    color: #0f172a !important;
                    font-weight: bold !important;
                  }
                }
              `}</style>

              <table className="rekap-rapor-table w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="p-3 text-center w-10">No</th>
                    <th className="p-3 text-center w-24">NISN</th>
                    <th className="p-3 w-44">Nama Peserta Didik</th>
                    <th className="p-3 text-center w-20">Kehadiran</th>
                    <th className="p-3 text-center w-24">Rata-rata Sumatif</th>
                    <th className="p-3 text-center w-28 bg-blue-50/80 text-blue-900 border-x border-blue-200">
                      <div>Nilai Akhir</div>
                      <div className="text-[9px] font-normal text-blue-600 lowercase">
                        {useBobot ? "40% H + 60% S" : "100% S"}
                      </div>
                    </th>
                    <th className="p-3 text-center w-24">Predikat / Status</th>
                    <th className="p-3 min-w-[200px]">Capaian Tertinggi (Sangat Baik)</th>
                    <th className="p-3 min-w-[200px]">Capaian Terendah (Perlu Bimbingan)</th>
                    <th className="p-3 text-center w-20 print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredRecapData.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-gray-400 italic">
                        Tidak ada data siswa ditemukan untuk kelas ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRecapData.map((item) => (
                      <tr key={item.siswa.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 text-center font-semibold text-gray-500">{item.no}</td>
                        <td className="p-3 text-center text-gray-600 font-mono text-[11px]">
                          {item.siswa.nisn || "-"}
                        </td>
                        <td className="p-3 font-bold text-gray-900">
                          {item.siswa.nama}
                          <span className="block text-[10px] text-gray-400 font-normal">
                            {item.siswa.jk === "L" ? "Laki-laki" : "Perempuan"}
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold">
                          <span
                            className={
                              item.kehadiranPercent >= 85
                                ? "text-emerald-600"
                                : item.kehadiranPercent >= 75
                                ? "text-blue-600"
                                : "text-amber-600"
                            }
                          >
                            {item.kehadiranPercent}%
                          </span>
                        </td>
                        <td className="p-3 text-center font-bold text-gray-700">
                          {item.avgSumatif > 0 ? item.avgSumatif : <span className="text-gray-300">-</span>}
                        </td>
                        <td className="p-3 text-center bg-blue-50/40 border-x border-blue-100">
                          <div className="flex flex-col items-center justify-center">
                            <span
                              className={`text-sm font-black ${
                                item.isTuntas ? "text-blue-700" : "text-rose-600"
                              }`}
                            >
                              {item.nilaiAkhirRapor > 0 ? item.nilaiAkhirRapor : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold text-gray-800 text-[11px]">{item.predikatRapor}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                                item.isTuntas
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.allNilai.length > 0
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "text-gray-400"
                              }`}
                            >
                              {item.isTuntas ? "Tuntas" : item.allNilai.length > 0 ? "Belum Tuntas" : "-"}
                            </span>
                          </div>
                        </td>
                        {/* Kolom Capaian Tertinggi: Merujuk pada salah satu TP dengan nilai sumatif tertinggi */}
                        <td className="p-3 align-top">
                          {item.highestTP ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                                  TP {item.highestTP.tp} ({item.highestTP.nilai})
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold">★ Sangat Baik</span>
                              </div>
                              <p className="text-[11px] text-gray-700 leading-snug">
                                Sangat baik dalam {item.highestTP.deskripsiTP}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-[11px]">Belum dinilai</span>
                          )}
                        </td>
                        {/* Kolom Capaian Terendah: Merujuk pada TP dengan nilai sumatif terendah */}
                        <td className="p-3 align-top">
                          {item.lowestTP ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1">
                                <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                                  TP {item.lowestTP.tp} ({item.lowestTP.nilai})
                                </span>
                                <span className="text-[10px] text-amber-700 font-bold">⚠ Perlu Bimbingan</span>
                              </div>
                              <p className="text-[11px] text-gray-700 leading-snug">
                                Perlu bimbingan dalam {item.lowestTP.deskripsiTP}
                              </p>
                            </div>
                          ) : (
                            <span className="text-gray-300 italic text-[11px]">Belum dinilai</span>
                          )}
                        </td>
                        {/* Aksi */}
                        <td className="p-3 text-center print:hidden">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSiswaId(item.siswa.id);
                              setActiveMode("siswa");
                            }}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            Rapor
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Cetak: Tanda Tangan */}
            <div className="hidden print:block mt-8 p-6 text-xs text-gray-900 border-t border-gray-200">
              <div className="flex justify-between items-start px-8">
                <div className="text-center w-64">
                  <p>Mengetahui,</p>
                  <p className="font-bold">Kepala Sekolah</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">( ............................................ )</p>
                  <p className="text-[10px] text-gray-500">NIP. ............................................</p>
                </div>
                <div className="text-center w-64">
                  <p>
                    Dicetak: {new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                  <p className="font-bold">Guru Mata Pelajaran</p>
                  <div className="h-16"></div>
                  <p className="font-bold underline">
                    {state.agmp_pengaturan?.guruNama ? `( ${state.agmp_pengaturan.guruNama} )` : "( ............................................ )"}
                  </p>
                  <p className="text-[10px] text-gray-500">NIP. ............................................</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: RAPOR PERORANGAN PESERTA DIDIK                                    */}
      {/* ========================================================================= */}
      {activeMode === "siswa" && currentStudentData && selectedSiswa && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden print-container">
          {/* Header Kop Rapor */}
          <div className="p-6 border-b-4 border-gray-900 bg-gray-50 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-gray-900">{state.agmp_pengaturan.sekolah}</h3>
              <p className="text-xs font-bold text-gray-600 tracking-wider uppercase mt-1">
                Laporan Hasil Belajar (Rapor Capaian Kompetensi Siswa)
              </p>
              <p className="text-sm font-semibold text-blue-700 mt-0.5">
                {state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
                  state.agmp_pengaturan.mapel}
              </p>
            </div>
            <div className="text-right text-xs text-gray-600 space-y-0.5">
              <p className="font-semibold text-gray-800">
                TA: {selectedTA ? `${selectedTA.nama} Semester ${selectedTA.semester}` : "Semua Tahun"}
              </p>
              <p>Fase: {kelas?.fase || "-"}</p>
              <p className="text-[11px] text-indigo-700 font-bold">
                {useBobot ? "Bobot Nilai: Hadir 40% + Sumatif 60%" : "Bobot Nilai: Sumatif Murni 100%"}
              </p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Profil Singkat Siswa & Nilai Akhir Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                    Nama Peserta Didik
                  </p>
                  <p className="text-lg font-bold text-gray-900">{selectedSiswa.nama}</p>
                  <p className="text-xs font-medium text-gray-600 mt-0.5">
                    NISN: {selectedSiswa.nisn || "-"} • Kelas: <strong>{kelas?.nama}</strong>
                  </p>
                </div>
                <div className="text-right pr-2">
                  <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block">
                    Kehadiran
                  </span>
                  <span className="text-xl font-black text-gray-900">
                    {currentStudentData.kehadiranPercent}%
                  </span>
                </div>
              </div>

              {/* Nilai Akhir Rapor Box */}
              <div className="md:col-span-4 bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-xl shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-slate-300 font-bold block">
                    Nilai Akhir Rapor
                  </span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-black text-amber-400">
                      {currentStudentData.nilaiAkhirRapor > 0 ? currentStudentData.nilaiAkhirRapor : "-"}
                    </span>
                    <span className="text-xs text-slate-300">/ 100</span>
                  </div>
                  <span className="text-[10px] text-slate-300 block mt-0.5">
                    {useBobot ? "40% Hadir + 60% Sumatif" : "100% Rata-rata Sumatif"}
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    {currentStudentData.predikatRapor}
                  </span>
                  <span
                    className={`block text-[10px] font-bold ${
                      currentStudentData.isTuntas ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {currentStudentData.isTuntas ? "✓ TUNTAS KKTP" : "BELUM TUNTAS"}
                  </span>
                </div>
              </div>
            </div>

            {/* TABEL NILAI AKHIR SUMATIF TIAP TP */}
            <div>
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <span>Daftar Nilai Sumatif per Tujuan Pembelajaran (TP)</span>
                </h4>
                <span className="text-xs text-gray-500 font-medium">
                  Rata-rata Nilai: <strong>{currentStudentData.avgSumatif}</strong>
                </span>
              </div>

              {currentStudentData.scores.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-4 bg-gray-50 rounded-xl text-center">
                  Belum ada rekaman nilai sumatif untuk siswa ini pada semester/tahun ajaran ini.
                </p>
              ) : (
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700 text-xs">
                      <tr>
                        <th className="text-left p-3 font-semibold">Tujuan Pembelajaran</th>
                        <th className="text-center p-3 font-semibold w-24">Nilai</th>
                        <th className="text-center p-3 font-semibold w-28">Predikat</th>
                        <th className="text-center p-3 font-semibold w-32">Ketercapaian</th>
                        <th className="text-center p-3 font-semibold w-36">Visualisasi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentStudentData.scores.map((score, i) => {
                        const isHighest = currentStudentData.highestTP?.tp === score.tp;
                        const isLowest = currentStudentData.lowestTP?.tp === score.tp;

                        return (
                          <tr
                            key={i}
                            className={`hover:bg-slate-50/50 ${
                              isHighest ? "bg-emerald-50/30" : isLowest ? "bg-amber-50/20" : ""
                            }`}
                          >
                            <td className="p-3 text-xs font-medium leading-relaxed">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-bold text-gray-900">TP {score.tp}</span>
                                {isHighest && (
                                  <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9.5px] font-bold">
                                    ★ Tertinggi
                                  </span>
                                )}
                                {isLowest && currentStudentData.scores.length > 1 && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9.5px] font-bold">
                                    ⚠ Terendah
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600">{score.deskripsiTP}</p>
                            </td>
                            <td className="p-3 text-center align-middle">
                              <span className="font-extrabold text-base text-gray-900">{score.nilai}</span>
                              {score.isRemedial && (
                                <span className="block text-[8px] uppercase tracking-wider text-orange-600 font-bold">
                                  *Remedial
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-center align-middle">
                              <span
                                className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                                  score.status === "TUNTAS"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-600 border border-red-200"
                                }`}
                              >
                                {score.predikat}
                              </span>
                            </td>
                            <td className="p-3 text-center align-middle">
                              <span
                                className={`text-xs font-semibold ${
                                  score.status === "TUNTAS" ? "text-emerald-700" : "text-rose-600"
                                }`}
                              >
                                {score.status === "TUNTAS" ? "✓ Tercapai" : "✗ Belum"}
                              </span>
                            </td>
                            <td className="p-3 align-middle">
                              <div className="w-24 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${
                                    score.status === "TUNTAS" ? "bg-green-500" : "bg-red-500"
                                  } transition-all`}
                                  style={{ width: `${Math.min(score.nilai, 100)}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DESKRIPSI CAPAIAN KOMPETENSI (Requirement 2) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b pb-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Deskripsi Capaian Kompetensi (Kurikulum Merdeka)</span>
                </h4>
                <button
                  type="button"
                  onClick={() => {
                    if (!isEditingNarrative) {
                      setEditedNarrative(
                        customNarratives[selectedSiswa.id] || currentStudentData.narrative,
                      );
                    } else {
                      setCustomNarratives({
                        ...customNarratives,
                        [selectedSiswa.id]: editedNarrative,
                      });
                      showToast("Deskripsi capaian siswa berhasil disimpan!", "success");
                    }
                    setIsEditingNarrative(!isEditingNarrative);
                  }}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isEditingNarrative ? "Simpan Perubahan" : "Edit Manual"}</span>
                </button>
              </div>

              {/* Explanatory note */}
              <div className="p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[11px] text-indigo-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aturan Deskripsi Capaian:</strong> Kalimat <em>&quot;sangat baik&quot;</em> merujuk pada TP dengan nilai sumatif tertinggi (
                  <strong>
                    {currentStudentData.highestTP ? `TP ${currentStudentData.highestTP.tp} [${currentStudentData.highestTP.nilai}]` : "-"}
                  </strong>
                  ), sedangkan kalimat <em>&quot;perlu mendapatkan bimbingan&quot;</em> merujuk pada TP dengan nilai sumatif terendah (
                  <strong>
                    {currentStudentData.lowestTP ? `TP ${currentStudentData.lowestTP.tp} [${currentStudentData.lowestTP.nilai}]` : "-"}
                  </strong>
                  ).
                </span>
              </div>

              {isEditingNarrative ? (
                <textarea
                  className="w-full p-4 border rounded-xl text-sm leading-relaxed text-gray-800 resize-none font-medium bg-white focus:ring-2 focus:ring-blue-500 transition-colors shadow-2xs"
                  rows={4}
                  value={editedNarrative}
                  onChange={(e) => setEditedNarrative(e.target.value)}
                />
              ) : (
                <div className="w-full p-4 border rounded-xl text-sm leading-relaxed text-gray-800 font-medium bg-gray-50/70 shadow-2xs">
                  {customNarratives[selectedSiswa.id] || currentStudentData.narrative}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" /> Preview Cetak Rapor Siswa
              </button>
              <button
                type="button"
                onClick={() => {
                  // Export single student CSV
                  const header = "TP,Deskripsi,Nilai,Predikat,Status\n";
                  const rows = currentStudentData.scores
                    .map(
                      (s) =>
                        `${s.tp},"${s.deskripsiTP}",${s.nilai},${s.predikat},${s.status}`,
                    )
                    .join("\n");
                  const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + header + rows;
                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csvContent));
                  link.setAttribute("download", `Rapor_${selectedSiswa.nama}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast("File CSV siswa berhasil diunduh!", "success");
                }}
                className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" /> Export CSV Siswa
              </button>
              <button
                type="button"
                onClick={() => setActiveMode("rekap")}
                className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Users className="w-4 h-4" /> Kembali ke Rekap Kelas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no student selected in student mode */}
      {activeMode === "siswa" && !selectedSiswaId && (
        <div className="p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm space-y-3">
          <User className="w-12 h-12 text-gray-400 mx-auto" />
          <h4 className="font-bold text-gray-800 text-base">Silakan Pilih Siswa Terlebih Dahulu</h4>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Pilih salah satu siswa dari menu pilihan di atas atau kembali ke tabel rekap untuk melihat seluruh nilai rapor kelas.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setActiveMode("rekap")}
              className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
            >
              Buka Rekap Nilai Rapor Kelas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
