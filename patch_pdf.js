const fs = require('fs');
let content = fs.readFileSync('components/modules/RekapAkhir.tsx', 'utf8');

// Add imports
if (!content.includes('import jsPDF')) {
  content = content.replace('import { TabId } from "@/components/Shell";', 'import { TabId } from "@/components/Shell";\nimport jsPDF from "jspdf";\nimport "jspdf-autotable";');
}

// Add handleExportPDF function
const exportCode = `
  const handleExportPDF = () => {
    if (!selectedSiswa) return;
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text(\`Laporan Hasil Belajar (Rekap Akhir)\`, 14, 20);
    
    // Info Umum
    doc.setFontSize(12);
    doc.text(\`Nama: \${selectedSiswa.nama}\`, 14, 30);
    doc.text(\`NISN: \${selectedSiswa.nisn || "-"}\`, 14, 37);
    doc.text(\`NIS: \${selectedSiswa.nis || "-"}\`, 14, 44);
    const kelas = state.agmp_kelas.find(k => k.id === selectedSiswa.kelasId);
    doc.text(\`Kelas: \${kelas?.nama || "-"} (Fase \${kelas?.fase || "-"})\`, 14, 51);
    
    const hadir = calculateKehadiran(selectedSiswa.id);
    doc.text(\`Kehadiran: \${hadir.percent}% (\${hadir.hadir} H, \${hadir.sakit} S, \${hadir.izin} I, \${hadir.alpa} A, \${hadir.bolos} B)\`, 14, 58);
    
    let currentY = 70;
    
    // Sumatif
    doc.setFontSize(14);
    doc.text("Nilai Sumatif", 14, currentY);
    currentY += 5;
    
    const sumatifBody = tpList.map(tp => {
      const res = calculateSumatifForTP(selectedSiswa.id, tp.id);
      return [tp.kode, tp.deskripsi, res.nilai.toString(), res.status];
    });
    
    (doc as any).autoTable({
      startY: currentY,
      head: [['TP', 'Deskripsi', 'Nilai', 'Status']],
      body: sumatifBody,
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: { 1: { cellWidth: 80 } }
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Formatif
    doc.setFontSize(14);
    doc.text("Nilai Formatif", 14, currentY);
    currentY += 5;
    
    const studentFormatifs = state.agmp_formatif.filter(f => f.hasil[selectedSiswa.id]);
    const tpKodeMap = {};
    state.agmp_tp.forEach((t) => (tpKodeMap[t.id] = t.kode));
    
    const formatifBody = studentFormatifs.map(f => {
       const [kelasF, tpIdF] = f.jurnalId.split("_");
       const tpKode = tpKodeMap[tpIdF] || "?";
       const res = f.hasil[selectedSiswa.id];
       return [
         \`TP \${tpKode} - \${f.jenis === "AWAL" ? "Diagnostic" : "Monitoring"}\`,
         res.status || "Anekdot",
         res.catatan || "Tidak ada catatan spesifik."
       ];
    });
    
    if (formatifBody.length > 0) {
      (doc as any).autoTable({
        startY: currentY,
        head: [['Materi / TP', 'Status / Level', 'Catatan Guru']],
        body: formatifBody,
        theme: 'grid',
        styles: { fontSize: 9 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 15;
    } else {
      doc.setFontSize(10);
      doc.text("Belum ada data formatif untuk siswa ini.", 14, currentY + 5);
      currentY += 15;
    }
    
    // Anekdot Global
    const anekdots = state.agmp_anekdot.filter(a => a.siswaId === selectedSiswa.id && (selectedTaId ? a.taId === selectedTaId : true)).sort((a,b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    
    if (anekdots.length > 0) {
       doc.setFontSize(14);
       doc.text("Catatan Anekdot Global", 14, currentY);
       currentY += 5;
       
       const anekdotBody = anekdots.map(a => {
          return [
            new Date(a.tanggal).toLocaleDateString('id-ID'),
            a.teks
          ];
       });
       
      (doc as any).autoTable({
        startY: currentY,
        head: [['Tanggal', 'Catatan']],
        body: anekdotBody,
        theme: 'grid',
        styles: { fontSize: 9 },
      });
    }

    doc.save(\`Rekap_Akhir_\${selectedSiswa.nama}.pdf\`);
  };
`;

if (!content.includes('const handleExportPDF = () => {')) {
  content = content.replace('const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId);', 'const selectedSiswa = siswaList.find((s) => s.id === selectedSiswaId);\n' + exportCode);
}

// Hook it up to the button
content = content.replace(
  '<button className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">',
  '<button onClick={handleExportPDF} className="flex-1 bg-white border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold flex justify-center items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm">'
);

fs.writeFileSync('components/modules/RekapAkhir.tsx', content);
console.log('Patched');
