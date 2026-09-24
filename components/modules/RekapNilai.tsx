"use client";

import React, { useState, useMemo, useRef } from "react";
import { useStore } from "@/lib/store";
import {
  Printer,
  Download,
  Search,
  Filter,
  Users,
  Award,
  Calendar,
  CheckCircle,
  AlertTriangle,
  FileText,
  RotateCcw,
  Eye,
  X,
  Maximize2,
  ChevronDown,
  Layers,
  Sparkles,
} from "lucide-react";
import { TabId } from "@/components/Shell";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RekapNilaiProps {
  onNavigate?: (tab: TabId) => void;
}

export default function RekapNilai({ onNavigate }: RekapNilaiProps) {
  const { state, filteredKelas, showToast } = useStore();

  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    filteredKelas[0]?.id || state.agmp_kelas[0]?.id || ""
  );

  const activeTA = state.agmp_tahun_ajaran.find((ta) => ta.isActive);
  const [selectedTaId, setSelectedTaId] = useState<string>(
    activeTA?.id || state.agmp_tahun_ajaran[0]?.id || ""
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Density control for 1-page Folio guarantee: "auto" | "compact" | "ultra" | "normal"
  const [density, setDensity] = useState<"auto" | "compact" | "ultra" | "normal">("auto");
  const [showSignatures, setShowSignatures] = useState(true);

  // Selected TA and semester
  const selectedTA = state.agmp_tahun_ajaran.find((ta) => ta.id === selectedTaId);
  const selectedSemester = selectedTA?.semester || "Ganjil";
  const tpSemesterToMatch = selectedSemester === "Ganjil" ? "1" : "2";

  // Selected Kelas
  const selectedKelas = state.agmp_kelas.find((k) => k.id === selectedKelasId);

  // Siswa in selected class
  const allSiswaInKelas = useMemo(() => {
    return state.agmp_siswa
      .filter((s) => s.kelasId === selectedKelasId)
      .sort((a, b) => a.nama.localeCompare(b.nama));
  }, [state.agmp_siswa, selectedKelasId]);

  // Filtered by search
  const siswaList = useMemo(() => {
    if (!searchQuery.trim()) return allSiswaInKelas;
    const q = searchQuery.toLowerCase().trim();
    return allSiswaInKelas.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        (s.nisn && s.nisn.toLowerCase().includes(q))
    );
  }, [allSiswaInKelas, searchQuery]);

  // TP list for selected class & semester
  const tpList = useMemo(() => {
    return state.agmp_tp
      .filter(
        (tp) =>
          tp.kelasIds.includes(selectedKelasId) &&
          (selectedTA
            ? tp.semester === selectedSemester || tp.semester === tpSemesterToMatch
            : true)
      )
      .sort((a, b) => a.kode.localeCompare(b.kode, undefined, { numeric: true }));
  }, [state.agmp_tp, selectedKelasId, selectedSemester, tpSemesterToMatch, selectedTA]);

  // KKTP Constants
  const interval = {
    batasBawahTuntas: 75,
    batasAtasLanjut: 85,
    batasBawahSelektif: 61,
  };

  // Helper: Kehadiran Calculation
  const calculateKehadiran = (siswaId: string) => {
    const classAbsensi = state.agmp_absensi.filter(
      (a) =>
        a.kelasId === selectedKelasId &&
        (selectedTaId ? a.taId === selectedTaId : true)
    );

    if (classAbsensi.length === 0) {
      return {
        percent: 0,
        hadir: 0,
        sakit: 0,
        izin: 0,
        alpa: 0,
        bolos: 0,
        total: 0,
        statusText: "Belum Ada Presensi",
      };
    }

    let hadir = 0,
      sakit = 0,
      izin = 0,
      alpa = 0,
      bolos = 0;

    classAbsensi.forEach((a) => {
      const st = a.records?.[siswaId];
      if (st === "HADIR") hadir++;
      else if (st === "SAKIT") sakit++;
      else if (st === "IZIN") izin++;
      else if (st === "ALPA") alpa++;
      else if (st === "BOLOS") bolos++;
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
      statusText: `${percent}% (H:${hadir} S:${sakit} I:${izin} A:${alpa} B:${bolos})`,
    };
  };

  // Helper: Nilai Akhir Sumatif, Catatan, & Tindak Lanjut Calculation
  const calculateSumatifData = (siswaId: string) => {
    let totalScore = 0;
    let scoredCount = 0;
    const tpDetails: {
      tpKode: string;
      deskripsi: string;
      nilai: number;
      level: number;
      status: string;
      isRemedial: boolean;
      catatan: string;
    }[] = [];

    const customNotes: string[] = [];
    const highTPs: string[] = [];
    const lowTPs: string[] = [];
    const needRemedialTPs: string[] = [];
    let completedRemedialCount = 0;

    tpList.forEach((tp) => {
      // Find sumatif for this TP & Kelas
      const sumatifMatches = state.agmp_sumatif.filter(
        (s) => s.tpId === tp.id && s.kelasId === selectedKelasId
      );
      const sumatif = selectedTaId
        ? sumatifMatches.find((s) => s.taId === selectedTaId) ||
          sumatifMatches.find((s) => !s.taId)
        : sumatifMatches[0];

      if (sumatif && sumatif.records?.[siswaId]) {
        let record = sumatif.records[siswaId];
        let finalNilai = record.nilai;
        let finalLevel = record.level;
        let finalStatus = record.status || "BELUM TUNTAS";
        let isRemedial = false;

        // Check Remedial override
        const remedialMatches = state.agmp_remedial.filter(
          (r) =>
            r.sumatifId === sumatif.id &&
            r.siswaId === siswaId &&
            (selectedTaId ? r.taId === selectedTaId || !r.taId : true)
        );
        const remedial = remedialMatches[0];

        if (remedial && remedial.status === "Selesai") {
          isRemedial = true;
          completedRemedialCount++;
          if (remedial.nilaiBaru !== undefined) finalNilai = remedial.nilaiBaru;
          if (remedial.levelBaru !== undefined) finalLevel = remedial.levelBaru;
          if (remedial.statusBaru) finalStatus = remedial.statusBaru;
        }

        if (finalNilai > 0 || record.status === "TUNTAS" || record.status === "BELUM TUNTAS") {
          totalScore += finalNilai;
          scoredCount++;

          tpDetails.push({
            tpKode: tp.kode,
            deskripsi: tp.deskripsi,
            nilai: finalNilai,
            level: finalLevel,
            status: finalStatus,
            isRemedial,
            catatan: record.catatan || "",
          });

          if (record.catatan && record.catatan.trim()) {
            customNotes.push(`TP ${tp.kode}: ${record.catatan.trim()}`);
          }

          if (finalNilai >= interval.batasBawahTuntas) {
            highTPs.push(tp.kode);
          } else {
            lowTPs.push(tp.kode);
            needRemedialTPs.push(tp.kode);
          }
        }
      }
    });

    // Nilai Akhir (NA)
    const na = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    // Predikat & Status
    let predikat = "Belum Ada Nilai";
    let statusKetuntasan = "Belum Dinilai";
    if (scoredCount > 0) {
      if (na >= interval.batasAtasLanjut) {
        predikat = "Sangat Baik";
      } else if (na >= interval.batasBawahTuntas) {
        predikat = "Baik";
      } else if (na >= interval.batasBawahSelektif) {
        predikat = "Cukup";
      } else {
        predikat = "Kurang";
      }

      if (needRemedialTPs.length === 0 && na >= interval.batasBawahTuntas) {
        statusKetuntasan = completedRemedialCount > 0 ? "Tuntas Remedial" : "Tuntas";
      } else {
        statusKetuntasan = "Belum Tuntas";
      }
    }

    // Catatan Penilaian Sumatif
    let catatanSumatif = "";
    if (customNotes.length > 0) {
      catatanSumatif = customNotes.join("; ");
    } else if (scoredCount > 0) {
      const highStr =
        highTPs.length > 0 ? `Sangat baik menguasai materi TP ${highTPs.join(", ")}.` : "";
      const lowStr =
        lowTPs.length > 0
          ? `Perlu penguatan pemahaman pada materi TP ${lowTPs.join(", ")}.`
          : "";
      catatanSumatif = [highStr, lowStr].filter(Boolean).join(" ");
      if (!catatanSumatif) {
        catatanSumatif = "Menunjukkan pencapaian kompetensi materi dengan baik.";
      }
    } else {
      catatanSumatif = "Belum ada penilaian sumatif tercatat.";
    }

    // Tindak Lanjut
    let tindakLanjut = "";
    let tindakLanjutType: "pengayaan" | "tuntas" | "remedial" | "pendampingan" | "belum" = "belum";

    if (scoredCount === 0) {
      tindakLanjut = "Menunggu Pelaksanaan Asesmen";
      tindakLanjutType = "belum";
    } else if (needRemedialTPs.length > 0) {
      tindakLanjut = `Remedial TP ${needRemedialTPs.join(", ")} (Bimbingan Terfokus)`;
      tindakLanjutType = "remedial";
    } else if (completedRemedialCount > 0) {
      tindakLanjut = "Remedial Selesai (Pemantapan Mandiri)";
      tindakLanjutType = "tuntas";
    } else if (na >= interval.batasAtasLanjut) {
      tindakLanjut = "Program Pengayaan & Tutor Sebaya";
      tindakLanjutType = "pengayaan";
    } else {
      tindakLanjut = "Tuntas (Penguatan Materi Mandiri)";
      tindakLanjutType = "tuntas";
    }

    return {
      na,
      scoredCount,
      tpDetails,
      predikat,
      statusKetuntasan,
      catatanSumatif,
      tindakLanjut,
      tindakLanjutType,
      needRemedialTPs,
      completedRemedialCount,
    };
  };

  // Compile full row data for every student
  const recapData = useMemo(() => {
    return allSiswaInKelas.map((siswa, idx) => {
      const kehadiran = calculateKehadiran(siswa.id);
      const sumatif = calculateSumatifData(siswa.id);
      return {
        no: idx + 1,
        siswa,
        kehadiran,
        sumatif,
      };
    });
  }, [allSiswaInKelas, selectedKelasId, selectedTaId, tpList]);

  // Class Summary Metrics
  const classMetrics = useMemo(() => {
    const totalSiswa = recapData.length;
    if (totalSiswa === 0) {
      return { totalSiswa: 0, avgNilai: 0, avgKehadiran: 0, tuntasCount: 0, remedialCount: 0 };
    }

    const scoredStudents = recapData.filter((r) => r.sumatif.scoredCount > 0);
    const avgNilai =
      scoredStudents.length > 0
        ? Math.round(
            scoredStudents.reduce((acc, r) => acc + r.sumatif.na, 0) /
              scoredStudents.length
          )
        : 0;

    const avgKehadiran = Math.round(
      recapData.reduce((acc, r) => acc + r.kehadiran.percent, 0) / totalSiswa
    );

    const tuntasCount = recapData.filter(
      (r) =>
        r.sumatif.statusKetuntasan === "Tuntas" ||
        r.sumatif.statusKetuntasan === "Tuntas Remedial"
    ).length;

    const remedialCount = recapData.filter(
      (r) => r.sumatif.tindakLanjutType === "remedial"
    ).length;

    return {
      totalSiswa,
      avgNilai,
      avgKehadiran,
      tuntasCount,
      remedialCount,
    };
  }, [recapData]);

  // Determine dynamic row density for 1-Page Folio guarantee
  const computedDensity = useMemo(() => {
    if (density !== "auto") return density;
    const count = allSiswaInKelas.length;
    if (count > 34) return "ultra";
    if (count > 25) return "compact";
    return "normal";
  }, [density, allSiswaInKelas.length]);

  // Density CSS helper
  const densityStyles = {
    normal: {
      tableText: "text-[11px]",
      headerText: "text-[11px] py-1.5 px-2",
      cellPadding: "py-1.5 px-2",
      lineHeight: "leading-normal",
    },
    compact: {
      tableText: "text-[9.5px]",
      headerText: "text-[10px] py-1 px-1.5",
      cellPadding: "py-1 px-1.5",
      lineHeight: "leading-tight",
    },
    ultra: {
      tableText: "text-[8.5px]",
      headerText: "text-[9px] py-0.5 px-1",
      cellPadding: "py-0.5 px-1",
      lineHeight: "leading-none",
    },
  }[computedDensity];

  // Browser print trigger
  const handlePrint = () => {
    window.print();
  };

  // Safe autoTable caller
  const callAutoTable = (doc: jsPDF, options: any) => {
    if (typeof autoTable === "function") {
      autoTable(doc, options);
    } else if (typeof (autoTable as any)?.default === "function") {
      (autoTable as any).default(doc, options);
    } else if (typeof (doc as any)?.autoTable === "function") {
      (doc as any).autoTable(options);
    }
  };

  // Export 1-Page Folio Landscape PDF using jsPDF
  const handleExportPdfFolio = async () => {
    if (allSiswaInKelas.length === 0) {
      showToast("Tidak ada data siswa untuk diekspor!", "error");
      return;
    }

    setIsExportingPdf(true);
    try {
      // Standar Folio / F4: 215 mm x 330 mm
      // Landscape: width 330mm, height 215mm
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [215, 330],
      });

      const schoolName =
        state.agmp_pengaturan.sekolah?.trim() || "SMP NEGERI 1 BIAU";
      const guruName =
        state.agmp_pengaturan.guruNama?.trim() || "Guru Mata Pelajaran";
      const mapelName =
        state.agmp_mapel?.find((m) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
        state.agmp_pengaturan.mapel ||
        "Mata Pelajaran";
      const kelasName = selectedKelas?.nama || "-";
      const faseName = selectedKelas?.fase ? `Fase ${selectedKelas.fase}` : "-";
      const taName = selectedTA
        ? `${selectedTA.nama} - Semester ${selectedTA.semester}`
        : "-";

      // 1. KOP SURAT RESMI
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(20, 35, 60);
      doc.text(schoolName.toUpperCase(), 165, 12, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text("REKAPITULASI HASIL BELAJAR PESERTA DIDIK (REKAP NILAI)", 165, 17, {
        align: "center",
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `Kurikulum Merdeka • Rekapitulasi Presensi Kehadiran, Nilai Akhir Sumatif & Tindak Lanjut Pembelajaran`,
        165,
        21.5,
        { align: "center" }
      );

      // Garis Kop Ganda
      doc.setDrawColor(30, 58, 138);
      doc.setLineWidth(0.6);
      doc.line(10, 23.5, 320, 23.5);
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.2);
      doc.line(10, 24.3, 320, 24.3);

      // 2. METADATA INFORMASI
      const metaData = [
        [
          `Kelas / Fase: ${kelasName} (${faseName})`,
          `Tahun Ajaran: ${taName}`,
          `Mata Pelajaran: ${mapelName}`,
          `KKTP: 75`,
        ],
      ];

      callAutoTable(doc, {
        startY: 25.5,
        body: metaData,
        theme: "plain",
        styles: {
          fontSize: 8,
          cellPadding: 0.8,
          fontStyle: "bold",
          textColor: [51, 65, 85],
        },
        columnStyles: {
          0: { cellWidth: 75 },
          1: { cellWidth: 85 },
          2: { cellWidth: 100 },
          3: { cellWidth: 50, halign: "right" },
        },
        margin: { left: 10, right: 10 },
      });

      const startTableY = (doc as any).lastAutoTable?.finalY
        ? (doc as any).lastAutoTable.finalY + 1.5
        : 31;

      // Dynamic sizing based on student count to strictly ensure 1-page fit
      const count = allSiswaInKelas.length;
      let pdfFontSize = 7.5;
      let pdfCellPadding = 1.1;

      if (count > 34) {
        pdfFontSize = 6.2;
        pdfCellPadding = 0.65;
      } else if (count > 26) {
        pdfFontSize = 6.8;
        pdfCellPadding = 0.85;
      } else if (count > 18) {
        pdfFontSize = 7.2;
        pdfCellPadding = 1.0;
      }

      // 3. TABLE BODY DATA
      const tableRows = recapData.map((row) => {
        const nisnText = row.siswa.nisn || "-";
        const kehadiranText = `${row.kehadiran.percent}%\n(H:${row.kehadiran.hadir} S:${row.kehadiran.sakit} I:${row.kehadiran.izin} A:${row.kehadiran.alpa} B:${row.kehadiran.bolos})`;
        const sumatifText =
          row.sumatif.scoredCount > 0
            ? `${row.sumatif.na} (${row.sumatif.predikat})\n[${row.sumatif.statusKetuntasan}]`
            : "Belum Ada Nilai";
        const catatanText = row.sumatif.catatanSumatif;
        const tindakLanjutText = row.sumatif.tindakLanjut;

        return [
          row.no.toString(),
          nisnText,
          row.siswa.nama,
          row.siswa.jk || "-",
          kehadiranText,
          sumatifText,
          catatanText,
          tindakLanjutText,
        ];
      });

      callAutoTable(doc, {
        startY: startTableY,
        head: [
          [
            "No",
            "NISN",
            "Nama Peserta Didik",
            "L/P",
            "Rekap Kehadiran",
            "Nilai Akhir Sumatif",
            "Catatan Penilaian Sumatif",
            "Tindak Lanjut",
          ],
        ],
        body: tableRows,
        theme: "grid",
        headStyles: {
          fillColor: [24, 43, 73], // Navy slate
          textColor: 255,
          fontStyle: "bold",
          fontSize: pdfFontSize + 0.3,
          halign: "center",
          valign: "middle",
          cellPadding: pdfCellPadding + 0.3,
        },
        bodyStyles: {
          fontSize: pdfFontSize,
          textColor: [30, 41, 59],
          valign: "middle",
          cellPadding: pdfCellPadding,
          lineColor: [203, 213, 225],
          lineWidth: 0.15,
        },
        columnStyles: {
          0: { cellWidth: 8, halign: "center" },
          1: { cellWidth: 24, halign: "center" },
          2: { cellWidth: 62 },
          3: { cellWidth: 9, halign: "center" },
          4: { cellWidth: 42, halign: "center" },
          5: { cellWidth: 38, halign: "center", fontStyle: "bold" },
          6: { cellWidth: 75 },
          7: { cellWidth: 52 },
        },
        margin: { left: 10, right: 10 },
      });

      // 4. TANDA TANGAN (SIGNATURES)
      const finalY = (doc as any).lastAutoTable?.finalY || 160;
      const todayStr = new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // Calculate signature Y to ensure it fits on the same page
      const maxFolioHeight = 210;
      let sigY = Math.min(finalY + 3, maxFolioHeight - 22);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);

      // Kiri: Mengetahui Kepala Sekolah
      doc.text("Mengetahui,", 30, sigY);
      doc.text("Kepala Sekolah,", 30, sigY + 3.5);
      doc.text("( ..................................................... )", 30, sigY + 16);
      doc.text("NIP. .....................................................", 30, sigY + 19.5);

      // Kanan: Guru Mata Pelajaran
      const kotaSekolah = "Biau";
      doc.text(`${kotaSekolah}, ${todayStr}`, 240, sigY);
      doc.text("Guru Mata Pelajaran,", 240, sigY + 3.5);
      doc.setFont("helvetica", "bold");
      doc.text(guruName, 240, sigY + 16);
      doc.setFont("helvetica", "normal");
      doc.text("NIP. .....................................................", 240, sigY + 19.5);

      // Verify page count: if autoTable pushed to page 2, delete extra pages to guarantee 1 page
      const totalPages = doc.getNumberOfPages();
      if (totalPages > 1) {
        for (let i = totalPages; i > 1; i--) {
          doc.deletePage(i);
        }
      }

      const sanitizedKelas = (selectedKelas?.nama || "Kelas").replace(/[^a-zA-Z0-9]/g, "_");
      doc.save(`Rekap_Nilai_${sanitizedKelas}_Folio.pdf`);
      showToast("Rekap Nilai Folio 1 Halaman berhasil diunduh!", "success");
    } catch (err) {
      console.error("Gagal cetak rekap:", err);
      showToast("Gagal menghasilkan file PDF. Silakan coba lagi.", "error");
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 print:space-y-0 print:pb-0">
      {/* Print CSS for Folio Landscape 1-Page */}
      <style>{`
        @media print {
          @page {
            size: 330mm 215mm landscape;
            margin: 6mm 8mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          header, nav, aside, .print\\:hidden, #main-sidebar, button, input {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          #print-folio-container {
            display: block !important;
            width: 100% !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          table {
            page-break-inside: avoid !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Main Header & Actions (Hidden in Print) */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">
              <Award className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                Rekap Nilai
              </h2>
              <p className="text-sm text-gray-500">
                Rekapitulasi capaian nilai akhir sumatif, persentase kehadiran, catatan guru & tindak lanjut per kelas.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-indigo-200 hover:shadow-indigo-300"
          >
            <Printer className="w-4 h-4" />
            Cetak Rekap (Print Preview)
          </button>

          <button
            onClick={handleExportPdfFolio}
            disabled={isExportingPdf}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-sm transition-all shadow-emerald-200"
          >
            <Download className="w-4 h-4" />
            {isExportingPdf ? "Memproses PDF..." : "Unduh PDF Folio"}
          </button>
        </div>
      </header>

      {/* Filter Bar (Hidden in Print) */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100 print:hidden space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Filter Kelas */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Pilih Kelas
            </label>
            <select
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
            >
              {filteredKelas.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.nama} {k.fase ? `(Fase ${k.fase})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Tahun Ajaran & Semester */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              Tahun Ajaran & Semester
            </label>
            <select
              value={selectedTaId}
              onChange={(e) => setSelectedTaId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
            >
              {state.agmp_tahun_ajaran.map((ta) => (
                <option key={ta.id} value={ta.id}>
                  {ta.nama} - Semester {ta.semester} {ta.isActive ? "★ (Aktif)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5 text-indigo-500" />
              Cari Siswa
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Cari berdasarkan nama atau NISN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-gray-800"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Info Badges & Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-gray-100">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Total Siswa</span>
            <div className="text-xl font-bold text-slate-800 mt-0.5">
              {classMetrics.totalSiswa} <span className="text-xs font-normal text-slate-500">Orang</span>
            </div>
          </div>

          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-100">
            <span className="text-[11px] font-medium text-blue-600 block">Rata-rata Nilai</span>
            <div className="text-xl font-bold text-blue-900 mt-0.5">
              {classMetrics.avgNilai} <span className="text-xs font-normal text-blue-600">/ 100</span>
            </div>
          </div>

          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-100">
            <span className="text-[11px] font-medium text-emerald-600 block">Rata-rata Kehadiran</span>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">
              {classMetrics.avgKehadiran}%
            </div>
          </div>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100">
            <span className="text-[11px] font-medium text-amber-700 block">Ketuntasan Belajar</span>
            <div className="text-xl font-bold text-amber-900 mt-0.5">
              {classMetrics.tuntasCount} <span className="text-xs font-normal text-amber-700">Tuntas</span>
              {classMetrics.remedialCount > 0 && (
                <span className="text-[10px] text-red-600 ml-1.5 font-semibold">
                  ({classMetrics.remedialCount} Remedial)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Screen Table (Hidden in Print) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden print:hidden">
        <div className="p-4 bg-slate-50/70 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
              Daftar Rekap Hasil Belajar: {selectedKelas?.nama || "Semua Kelas"}
              <span className="text-xs font-normal text-gray-500">
                ({siswaList.length} dari {allSiswaInKelas.length} siswa)
              </span>
            </h3>
          </div>

          <div className="text-xs text-gray-500">
            Orientasi Cetak: <span className="font-semibold text-gray-700">Landscape (Folio / F4)</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 border-b border-gray-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-3 w-28">NISN</th>
                <th className="py-3 px-4 min-w-[180px]">Nama Peserta Didik</th>
                <th className="py-3 px-2 w-12 text-center">L/P</th>
                <th className="py-3 px-3 min-w-[140px] text-center">Persentase Kehadiran</th>
                <th className="py-3 px-3 min-w-[120px] text-center">Nilai Akhir Sumatif</th>
                <th className="py-3 px-4 min-w-[240px]">Catatan Penilaian Sumatif</th>
                <th className="py-3 px-3 min-w-[170px]">Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {siswaList.length > 0 ? (
                siswaList.map((siswa, idx) => {
                  const kehadiran = calculateKehadiran(siswa.id);
                  const sumatif = calculateSumatifData(siswa.id);

                  // Colors for badge
                  const kehadiranBadgeColor =
                    kehadiran.percent >= 90
                      ? "bg-emerald-100 text-emerald-800"
                      : kehadiran.percent >= 75
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800";

                  const nilaiBadgeColor =
                    sumatif.na >= interval.batasAtasLanjut
                      ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                      : sumatif.na >= interval.batasBawahTuntas
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : sumatif.na >= interval.batasBawahSelektif
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-rose-100 text-rose-800 border-rose-200";

                  const tindakLanjutBadge = {
                    pengayaan: "bg-purple-100 text-purple-800 border-purple-200",
                    tuntas: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    remedial: "bg-rose-100 text-rose-800 border-rose-200",
                    pendampingan: "bg-amber-100 text-amber-800 border-amber-200",
                    belum: "bg-gray-100 text-gray-600 border-gray-200",
                  }[sumatif.tindakLanjutType];

                  return (
                    <tr key={siswa.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-gray-500 font-medium">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                        {siswa.nisn || "-"}
                      </td>

                      <td className="py-2.5 px-4 font-semibold text-gray-900">
                        {siswa.nama}
                      </td>

                      <td className="py-2.5 px-2 text-center text-gray-600 font-medium">
                        {siswa.jk || "-"}
                      </td>

                      {/* Kehadiran */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${kehadiranBadgeColor}`}
                          >
                            {kehadiran.percent}%
                          </span>
                          <span className="text-[10px] text-gray-500 mt-0.5 whitespace-nowrap">
                            H:{kehadiran.hadir} S:{kehadiran.sakit} I:{kehadiran.izin} A:{kehadiran.alpa} B:{kehadiran.bolos}
                          </span>
                        </div>
                      </td>

                      {/* Nilai Akhir Sumatif */}
                      <td className="py-2.5 px-3 text-center">
                        {sumatif.scoredCount > 0 ? (
                          <div className="inline-flex flex-col items-center">
                            <span
                              className={`px-2.5 py-0.5 rounded-lg border text-sm font-extrabold ${nilaiBadgeColor}`}
                            >
                              {sumatif.na}
                            </span>
                            <span className="text-[10px] text-gray-600 font-medium mt-0.5">
                              {sumatif.predikat}
                            </span>
                            <span
                              className={`text-[9px] font-semibold ${
                                sumatif.statusKetuntasan === "Tuntas"
                                  ? "text-emerald-600"
                                  : sumatif.statusKetuntasan === "Tuntas Remedial"
                                  ? "text-blue-600"
                                  : "text-rose-600"
                              }`}
                            >
                              {sumatif.statusKetuntasan}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">
                            Belum Dinilai
                          </span>
                        )}
                      </td>

                      {/* Catatan Penilaian Sumatif */}
                      <td className="py-2.5 px-4 text-gray-700 leading-relaxed">
                        <p className="line-clamp-2" title={sumatif.catatanSumatif}>
                          {sumatif.catatanSumatif}
                        </p>
                      </td>

                      {/* Tindak Lanjut */}
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${tindakLanjutBadge}`}
                        >
                          {sumatif.tindakLanjut}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-500 italic">
                    {searchQuery
                      ? "Tidak ada siswa yang sesuai dengan kata kunci pencarian."
                      : "Belum ada data siswa di kelas yang dipilih."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PRINT CONTAINER FOR BROWSER PRINT (Hidden on screen, Visible when window.print() is called) */}
      <div id="print-folio-container" className="hidden print:block">
        <PrintPaperSheet
          state={state}
          selectedKelas={selectedKelas}
          selectedTA={selectedTA}
          recapData={recapData}
          densityStyles={densityStyles}
          showSignatures={showSignatures}
        />
      </div>

      {/* PRINT PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-between overflow-hidden">
          {/* Modal Header Controls */}
          <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  Print Preview: Rekap Nilai Siswa
                  <span className="text-xs bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full font-mono">
                    Folio Landscape (215 x 330 mm)
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Didesain pas 1 halaman penuh tanpa ada baris siswa yang terpotong.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Density Setting */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400">Kerapatan:</span>
                <select
                  value={density}
                  onChange={(e) => setDensity(e.target.value as any)}
                  className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
                >
                  <option value="auto" className="bg-slate-800">Auto (Fit 1 Halaman)</option>
                  <option value="normal" className="bg-slate-800">Normal (s/d 20 Siswa)</option>
                  <option value="compact" className="bg-slate-800">Kompak (21 - 32 Siswa)</option>
                  <option value="ultra" className="bg-slate-800">Sangat Rapat (33+ Siswa)</option>
                </select>
              </div>

              {/* Toggle Signatures */}
              <label className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded text-indigo-500"
                />
                Tanda Tangan
              </label>

              {/* Action Buttons */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                Cetak Sekarang
              </button>

              <button
                onClick={handleExportPdfFolio}
                disabled={isExportingPdf}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Unduh PDF
              </button>

              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors ml-1"
                title="Tutup Preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Preview Canvas (Simulating Folio Landscape Paper 330mm x 215mm) */}
          <div className="flex-1 overflow-auto p-4 sm:p-8 bg-slate-950 flex justify-center items-start">
            <div
              className="bg-white text-black shadow-2xl rounded-sm p-6 sm:p-8 transition-all"
              style={{
                width: "100%",
                maxWidth: "1150px",
                minHeight: "720px",
                aspectRatio: "330 / 215",
              }}
            >
              <PrintPaperSheet
                state={state}
                selectedKelas={selectedKelas}
                selectedTA={selectedTA}
                recapData={recapData}
                densityStyles={densityStyles}
                showSignatures={showSignatures}
              />
            </div>
          </div>

          {/* Modal Footer Info */}
          <div className="bg-slate-900 px-5 py-2.5 text-center text-xs text-slate-400 border-t border-slate-800 flex justify-between items-center flex-shrink-0">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle className="w-4 h-4" />
              Format 1 Halaman Siap Cetak (Folio 330 x 215 mm)
            </span>
            <span>
              Total {allSiswaInKelas.length} Siswa • Kelas {selectedKelas?.nama || "-"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: The Print Paper Sheet (reused in both preview and print DOM)
function PrintPaperSheet({
  state,
  selectedKelas,
  selectedTA,
  recapData,
  densityStyles,
  showSignatures,
}: {
  state: any;
  selectedKelas: any;
  selectedTA: any;
  recapData: any[];
  densityStyles: {
    tableText: string;
    headerText: string;
    cellPadding: string;
    lineHeight: string;
  };
  showSignatures: boolean;
}) {
  const schoolName = state.agmp_pengaturan.sekolah?.trim() || "SMP NEGERI 1 BIAU";
  const guruName = state.agmp_pengaturan.guruNama?.trim() || "Guru Mata Pelajaran";
  const mapelName =
    state.agmp_mapel?.find((m: any) => m.id === state.agmp_pengaturan?.mapelId)?.nama ||
    state.agmp_pengaturan.mapel ||
    "Mata Pelajaran";
  const kelasName = selectedKelas?.nama || "-";
  const faseName = selectedKelas?.fase ? `Fase ${selectedKelas.fase}` : "-";
  const taName = selectedTA
    ? `${selectedTA.nama} - Semester ${selectedTA.semester}`
    : "-";

  const todayStr = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full flex flex-col justify-between h-full font-sans text-black">
      {/* 1. KOP SURAT */}
      <div className="border-b-2 border-slate-900 pb-2 mb-2">
        <div className="flex items-center justify-between gap-4">
          <div className="w-14 h-14 flex items-center justify-center flex-shrink-0">
            {/* School / Education Emblem SVG */}
            <svg
              className="w-12 h-12 text-slate-800"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          <div className="text-center flex-1">
            <h1 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-slate-900 leading-tight">
              {schoolName}
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 mt-0.5">
              REKAPITULASI HASIL BELAJAR PESERTA DIDIK (REKAP NILAI)
            </h2>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Kurikulum Merdeka • Rekapitulasi Presensi Kehadiran, Nilai Akhir Sumatif & Tindak Lanjut Pembelajaran
            </p>
          </div>

          <div className="w-14 flex-shrink-0" />
        </div>
      </div>

      {/* 2. METADATA TABLE */}
      <div className="grid grid-cols-4 gap-2 text-[10px] font-semibold text-slate-800 mb-2 px-1">
        <div>
          Kelas / Fase: <span className="font-bold">{kelasName} ({faseName})</span>
        </div>
        <div>
          Tahun Ajaran: <span className="font-bold">{taName}</span>
        </div>
        <div>
          Mata Pelajaran: <span className="font-bold">{mapelName}</span>
        </div>
        <div className="text-right">
          KKTP / KKM: <span className="font-bold">75</span>
        </div>
      </div>

      {/* 3. TABEL DATA SISWA */}
      <div className="flex-1 w-full overflow-hidden">
        <table className={`w-full border-collapse border border-slate-900 text-left ${densityStyles.tableText}`}>
          <thead>
            <tr className="bg-slate-200/90 text-slate-900 font-bold uppercase border-b border-slate-900 text-center">
              <th className={`border border-slate-900 w-8 ${densityStyles.headerText}`}>No</th>
              <th className={`border border-slate-900 w-24 ${densityStyles.headerText}`}>NISN</th>
              <th className={`border border-slate-900 text-left min-w-[150px] ${densityStyles.headerText}`}>
                Nama Peserta Didik
              </th>
              <th className={`border border-slate-900 w-8 ${densityStyles.headerText}`}>L/P</th>
              <th className={`border border-slate-900 min-w-[120px] ${densityStyles.headerText}`}>
                Rekap Kehadiran
              </th>
              <th className={`border border-slate-900 min-w-[100px] ${densityStyles.headerText}`}>
                Nilai Akhir Sumatif
              </th>
              <th className={`border border-slate-900 text-left min-w-[200px] ${densityStyles.headerText}`}>
                Catatan Penilaian Sumatif
              </th>
              <th className={`border border-slate-900 text-left min-w-[140px] ${densityStyles.headerText}`}>
                Tindak Lanjut
              </th>
            </tr>
          </thead>
          <tbody>
            {recapData.length > 0 ? (
              recapData.map((row) => (
                <tr
                  key={row.siswa.id}
                  className={`border-b border-slate-400 ${densityStyles.lineHeight}`}
                >
                  <td className={`border border-slate-900 text-center font-medium ${densityStyles.cellPadding}`}>
                    {row.no}
                  </td>
                  <td className={`border border-slate-900 text-center font-mono ${densityStyles.cellPadding}`}>
                    {row.siswa.nisn || "-"}
                  </td>
                  <td className={`border border-slate-900 font-semibold ${densityStyles.cellPadding}`}>
                    {row.siswa.nama}
                  </td>
                  <td className={`border border-slate-900 text-center ${densityStyles.cellPadding}`}>
                    {row.siswa.jk || "-"}
                  </td>
                  <td className={`border border-slate-900 text-center ${densityStyles.cellPadding}`}>
                    <span className="font-bold">{row.kehadiran.percent}%</span>{" "}
                    <span className="text-[9px] text-slate-700 block whitespace-nowrap">
                      (H:{row.kehadiran.hadir} S:{row.kehadiran.sakit} I:{row.kehadiran.izin} A:{row.kehadiran.alpa} B:{row.kehadiran.bolos})
                    </span>
                  </td>
                  <td className={`border border-slate-900 text-center ${densityStyles.cellPadding}`}>
                    {row.sumatif.scoredCount > 0 ? (
                      <div>
                        <span className="font-extrabold text-[12px]">{row.sumatif.na}</span>{" "}
                        <span className="text-[9px] font-semibold text-slate-800">
                          ({row.sumatif.predikat})
                        </span>
                        <div className="text-[8.5px] font-bold text-slate-600 leading-none">
                          [{row.sumatif.statusKetuntasan}]
                        </div>
                      </div>
                    ) : (
                      <span className="italic text-slate-400 text-[10px]">-</span>
                    )}
                  </td>
                  <td className={`border border-slate-900 ${densityStyles.cellPadding}`}>
                    <p className="line-clamp-2 leading-tight">
                      {row.sumatif.catatanSumatif}
                    </p>
                  </td>
                  <td className={`border border-slate-900 font-medium ${densityStyles.cellPadding}`}>
                    <span className="leading-tight block">
                      {row.sumatif.tindakLanjut}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="border border-slate-900 text-center py-4 italic text-slate-500">
                  Belum ada data siswa di kelas ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. TANDA TANGAN (SIGNATURES) */}
      {showSignatures && (
        <div className="grid grid-cols-2 gap-4 mt-3 pt-2 text-[10px] leading-snug">
          {/* Kolom Kiri: Mengetahui Kepala Sekolah */}
          <div className="text-left pl-6">
            <p>Mengetahui,</p>
            <p className="font-semibold">Kepala Sekolah</p>
            <div className="h-10" />
            <p className="font-bold underline">
              {state.agmp_pengaturan.kepalaSekolah || "( ..................................................... )"}
            </p>
            <p className="text-[9px] text-slate-600">
              NIP. {state.agmp_pengaturan.nipKepalaSekolah || "....................................................."}
            </p>
          </div>

          {/* Kolom Kanan: Guru Mata Pelajaran */}
          <div className="text-left pl-24">
            <p>Biau, {todayStr}</p>
            <p className="font-semibold">Guru Mata Pelajaran</p>
            <div className="h-10" />
            <p className="font-bold underline">{guruName}</p>
            <p className="text-[9px] text-slate-600">
              NIP. {state.agmp_pengaturan.nipGuru || "....................................................."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
