import { useState } from "react";
import { useStore } from "@/lib/store";
import { getNilaiDetails } from "@/lib/utils";
import { FileText, Download, Printer, Edit2 } from "lucide-react";

export default function Rapor() {
  const { state } = useStore();
  
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const [selectedTaId, setSelectedTaId] = useState(activeTA?.id || '');

  const [kelasId, setKelasId] = useState(state.agmp_kelas[0]?.id || "");
  const [selectedSiswaId, setSelectedSiswaId] = useState<string | null>(null);

  const siswaList = state.agmp_siswa.filter((s) => s.kelasId === kelasId);
  const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId);
  const kelas = state.agmp_kelas.find((k) => k.id === kelasId);

  const [isEditingNarrative, setIsEditingNarrative] = useState(false);
  const [editedNarrative, setEditedNarrative] = useState("");

  const selectedTA = state.agmp_tahun_ajaran.find(ta => ta.id === selectedTaId);

  // Generate data for report
  const generateReportData = (siswaId: string) => {
    const tps = state.agmp_tp.filter((tp) => tp.kelasIds.includes(kelasId) && (selectedTA ? tp.semester === selectedTA.semester : true));
    const interval = state.agmp_pengaturan.intervalKKTP || {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };

    let scores: {
      tp: string;
      deskripsiTP: string;
      nilai: number;
      status: string;
      isRemedial: boolean;
      predikat: string;
    }[] = [];
    let allNilai: number[] = [];
    let highTPs: string[] = [];
    let lowTPs: string[] = [];

    tps.forEach((tp) => {
      // Find sumatif
      const sumatif = state.agmp_sumatif.find(
        (s) => s.tpId === tp.id && s.kelasId === kelasId && (selectedTaId ? s.taId === selectedTaId : true),
      );
      if (sumatif) {
        let record = sumatif.records[siswaId];
        // Check remedial override
        const remedial = state.agmp_remedial.find(
          (r) =>
            r.sumatifId === sumatif.id &&
            r.siswaId === siswaId &&
            r.status === "Selesai" &&
            (selectedTaId ? r.taId === selectedTaId : true)
        );
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
          if (record.nilai > interval.batasAtasLanjut)
            predikatDesc = "Sangat Baik";
          else if (record.nilai >= interval.batasBawahTuntas)
            predikatDesc = "Baik";
          else if (record.nilai >= interval.batasBawahSelektif)
            predikatDesc = "Cukup";
          else predikatDesc = "Kurang";

          scores.push({
            tp: tp.kode,
            deskripsiTP: tp.deskripsi,
            nilai: record.nilai,
            status: record.status,
            isRemedial: !!remedial,
            predikat: predikatDesc,
          });

          if (record.nilai >= interval.batasBawahTuntas)
            highTPs.push(`"${tp.deskripsi}"`);
          else lowTPs.push(`"${tp.deskripsi}"`);
        }
      }
    });

    // Determine overall learning status predikat
    let overallPredikat = "menunjukkan pemahaman yang baik"; // default
    if (allNilai.length > 0) {
      const avg = allNilai.reduce((a, b) => a + b, 0) / allNilai.length;
      if (avg > interval.batasAtasLanjut)
        overallPredikat = "menunjukkan kemajuan luar biasa";
      else if (avg >= interval.batasBawahTuntas)
        overallPredikat = "menunjukkan pemahaman yang baik";
      else if (avg >= interval.batasBawahSelektif)
        overallPredikat = "mulai menunjukkan pemahaman";
      else overallPredikat = "memerlukan bimbingan intensif";
    }

    if (highTPs.length === 0 && scores.length > 0) {
      const sorted = [...scores].sort((a, b) => b.nilai - a.nilai);
      highTPs.push(`"${sorted[0].deskripsiTP}"`);
    }
    if (lowTPs.length === 0 && scores.length > 0) {
      const sorted = [...scores].sort((a, b) => a.nilai - b.nilai);
      lowTPs.push(`"${sorted[0].deskripsiTP}"`);
    }

    const highText =
      highTPs.length > 0
        ? ` Ananda sudah sangat baik dalam ${highTPs.slice(0, 2).join(" dan ")}.`
        : "";
    const lowText =
      lowTPs.length > 0
        ? ` Ananda perlu mendapatkan bimbingan untuk meningkatkan ${lowTPs[0]}.`
        : "";

    const narrative = `Ananda ${selectedSiswa?.nama} ${overallPredikat} dalam pembelajaran ${state.agmp_pengaturan.mapel}.${highText}${lowText}`;

    return { scores, narrative };
  };

  const reportData = selectedSiswaId
    ? generateReportData(selectedSiswaId)
    : null;

  return (
    <div className="space-y-6 pb-20">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Rapor & Deskripsi</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generate otomatis dari data Sumatif & Remedial.
        </p>
      </header>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-3">
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-gray-50 flex-1"
          value={selectedTaId}
          onChange={(e) => setSelectedTaId(e.target.value)}
        >
          <option value="" disabled>Pilih Tahun Ajaran</option>
          {state.agmp_tahun_ajaran.map(ta => (
            <option key={ta.id} value={ta.id}>
              {ta.nama} - Semester {ta.semester}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-gray-50 flex-1"
          value={kelasId}
          onChange={(e) => {
            setKelasId(e.target.value);
            setSelectedSiswaId(null);
          }}
        >
          {state.agmp_kelas.map((k) => (
            <option key={k.id} value={k.id}>
              Kelas {k.nama}
            </option>
          ))}
        </select>
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-gray-50 flex-1"
          value={selectedSiswaId || ""}
          onChange={(e) => setSelectedSiswaId(e.target.value)}
        >
          <option value="" disabled>
            -- Pilih Siswa --
          </option>
          {siswaList.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nama}
            </option>
          ))}
        </select>
      </div>

      {reportData && selectedSiswa && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden print-container">
          {/* Kop Rapor */}
          <div className="p-6 border-b-4 border-gray-900 bg-gray-50 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-black text-gray-900">
                {state.agmp_pengaturan.sekolah}
              </h3>
              <p className="text-xs font-bold text-gray-600 tracking-wider uppercase mt-1">
                Capaian Kompetensi Mata Pelajaran
              </p>
              <p className="text-sm font-medium text-gray-500 mt-0.5">
                {state.agmp_pengaturan.mapel}
              </p>
            </div>
            <div className="text-right text-xs text-gray-600">
              <p>TA: {selectedTA ? `${selectedTA.nama} Semester ${selectedTA.semester}` : 'Semua Tahun'}</p>
              <p>Fase: {kelas?.fase}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div>
                <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                  Nama Peserta Didik
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedSiswa.nama}
                </p>
                <p className="text-xs font-medium text-gray-600 mt-1">
                  NISN: {selectedSiswa.nisn}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-blue-500 tracking-wider">
                  Kelas
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {kelas?.nama}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-3 border-b pb-2">
                Nilai Akhir Sumatif
              </h4>
              {reportData.scores.length === 0 ? (
                <p className="text-sm text-gray-500 italic">
                  Belum ada nilai sumatif untuk siswa ini.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-gray-700">
                      <tr>
                        <th className="text-left p-2 font-semibold">
                          Tujuan Pembelajaran
                        </th>
                        <th className="text-center p-2 font-semibold">Nilai</th>
                        <th className="text-center p-2 font-semibold">
                          Predikat
                        </th>
                        <th className="text-center p-2 font-semibold">
                          Progress
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.scores.map((score, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="p-2 py-3 pr-4 text-xs font-medium leading-relaxed">
                            <span className="font-bold text-gray-900">
                              TP {score.tp}:
                            </span>{" "}
                            {score.deskripsiTP}
                          </td>
                          <td className="p-2 text-center align-middle">
                            <span className="font-bold text-lg">
                              {score.nilai}
                            </span>
                            {score.isRemedial && (
                              <span className="block text-[8px] uppercase tracking-wider text-orange-600 font-bold">
                                *Remedial
                              </span>
                            )}
                          </td>
                          <td className="p-2 text-center align-middle">
                            <span
                              className={`px-2 py-1 text-[10px] uppercase font-bold rounded ${score.status === "TUNTAS" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
                            >
                              {score.predikat}
                            </span>
                          </td>
                          <td className="p-2 align-middle">
                            <div className="w-24 mx-auto h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${score.status === "TUNTAS" ? "bg-green-500" : "bg-red-500"} transition-all`}
                                style={{ width: `${score.nilai}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 border-b pb-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">
                  Deskripsi Capaian Kompetensi
                </h4>
                <button
                  onClick={() => {
                    if (!isEditingNarrative) {
                      setEditedNarrative(reportData.narrative);
                    }
                    setIsEditingNarrative(!isEditingNarrative);
                  }}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:underline"
                >
                  <Edit2 className="w-3 h-3" />{" "}
                  {isEditingNarrative ? "Selesai Edit" : "Edit Manual"}
                </button>
              </div>
              {isEditingNarrative ? (
                <textarea
                  className="w-full p-4 border rounded-xl text-sm leading-relaxed text-gray-700 resize-none font-medium bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                  rows={5}
                  value={editedNarrative}
                  onChange={(e) => setEditedNarrative(e.target.value)}
                />
              ) : (
                <div className="w-full p-4 border rounded-xl text-sm leading-relaxed text-gray-700 font-medium bg-gray-50/50">
                  {editedNarrative || reportData.narrative}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 print:hidden">
              <button
                onClick={() => window.print()}
                className="flex-1 border-2 border-gray-200 text-gray-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <Printer className="w-4 h-4" /> Preview Cetak
              </button>
              <button
                onClick={() => {
                  const url =
                    "data:text/plain;charset=utf-8," +
                    encodeURIComponent(
                      'Mencetak PDF memerlukan fitur print dari browser Anda. Silakan klik Preview Cetak lalu pilih "Simpan sebagai PDF" / Print to PDF.',
                    );
                  window.open(url, "_blank");
                }}
                className="flex-1 bg-gray-900 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" /> Export PDF
              </button>
              <button
                onClick={() => {
                  // Export Excel CSV logic
                  const header = "TP,Deskripsi,Nilai,Predikat,Status\n";
                  const rows = reportData.scores
                    .map(
                      (s) =>
                        `${s.tp},"${s.deskripsiTP}",${s.nilai},${s.predikat},${s.status}`,
                    )
                    .join("\n");
                  const csvContent =
                    "data:text/csv;charset=utf-8," + header + rows;
                  const link = document.createElement("a");
                  link.setAttribute("href", encodeURI(csvContent));
                  link.setAttribute(
                    "download",
                    `Rapor_${selectedSiswa.nama}.csv`,
                  );
                  document.body.appendChild(link);
                  link.click();
                }}
                className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-green-700 transition-colors shadow-sm"
              >
                <FileText className="w-4 h-4" /> Export Excel / CSV
              </button>
            </div>
          </div>
        </div>
      )}
      {!reportData && selectedSiswaId && (
        <div className="text-center py-20 text-gray-500">
          Menganalisis data sumatif...
        </div>
      )}
    </div>
  );
}
