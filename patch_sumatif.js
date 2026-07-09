const fs = require('fs');
let code = fs.readFileSync('components/modules/Sumatif.tsx', 'utf8');

const targetMath = `    if (rubrik && rubrik.jenisKKTP === "Rubrik Deskripsi" && rubrik.aspekPenilaian) {
      let totalSkor = 0;
      let skorMaksimal = 0;

      for (const aspek of rubrik.aspekPenilaian) {
        const requiredSkala = rubrik.aturanKetuntasan?.[aspek.id] ?? 0;
        const actualSkala = newScores[aspek.id];
        const maxSkalaAspek = (aspek.skalaPenilaian?.length || rubrik.skalaPenilaian?.length || 4);
        skorMaksimal += maxSkalaAspek;
        
        if (actualSkala !== undefined) {
          totalSkor += (actualSkala + 1);
        }

        if (actualSkala === undefined || actualSkala < requiredSkala) {
          status = "BELUM TUNTAS";
        }
      }
      
      if (skorMaksimal > 0) {
        nilai = Number(((totalSkor / skorMaksimal) * 100).toFixed(2));
      }
    }`;

const replaceMath = `    if (rubrik && rubrik.jenisKKTP === "Rubrik Deskripsi" && rubrik.aspekPenilaian) {
      let totalNilaiEkivalen = 0;
      let totalAspekDinilai = 0;

      for (const aspek of rubrik.aspekPenilaian) {
        const requiredSkala = rubrik.aturanKetuntasan?.[aspek.id] ?? 0;
        const actualSkala = newScores[aspek.id];
        
        if (actualSkala !== undefined) {
          totalAspekDinilai++;
          let ekivalen = 0;
          if (aspek.ekivalenSkala && aspek.ekivalenSkala[actualSkala] !== undefined) {
            ekivalen = aspek.ekivalenSkala[actualSkala];
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
    }`;

if (code.includes(targetMath)) {
  code = code.replace(targetMath, replaceMath);
  fs.writeFileSync('components/modules/Sumatif.tsx', code);
  console.log('Patched Sumatif math');
} else {
  console.log('Target not found in Sumatif.tsx');
}
