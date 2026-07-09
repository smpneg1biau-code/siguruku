const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapAkhir.tsx', 'utf8');

const targetFunction = `    let finalNilai = record.nilai;
    let finalLevel = record.level;
    if (
      remedial &&
      remedial.nilaiBaru !== undefined &&
      remedial.status === "Selesai"
    ) {
      finalNilai = remedial.nilaiBaru;
      if (remedial.levelBaru) finalLevel = remedial.levelBaru;
    }

    const interval = {
      batasBawahTuntas: 75,
      batasAtasLanjut: 85,
      batasBawahSelektif: 61,
    };
    
    let finalStatus = finalNilai >= interval.batasBawahTuntas ? "TUNTAS" : "BELUM TUNTAS";

    return {`;

const replaceFunction = `    let finalNilai = record.nilai;
    let finalLevel = record.level;
    let finalStatus = record.status;
    let isRemedialSelesai = false;

    if (
      remedial &&
      remedial.nilaiBaru !== undefined &&
      remedial.status === "Selesai"
    ) {
      finalNilai = remedial.nilaiBaru;
      if (remedial.levelBaru) finalLevel = remedial.levelBaru;
      if (remedial.statusBaru) finalStatus = remedial.statusBaru;
      isRemedialSelesai = true;
    }

    if (!finalStatus) {
      const interval = {
        batasBawahTuntas: 75,
        batasAtasLanjut: 85,
        batasBawahSelektif: 61,
      };
      finalStatus = finalNilai >= interval.batasBawahTuntas ? "TUNTAS" : "BELUM TUNTAS";
    }

    if (isRemedialSelesai && finalStatus === "TUNTAS") {
      finalStatus = "TUNTAS (Remedial)";
    }

    return {`;

if (code.includes(targetFunction)) {
  code = code.replace(targetFunction, replaceFunction);
  fs.writeFileSync('components/modules/RekapAkhir.tsx', code);
  console.log('Patched calculateSumatifForTP logic');
} else {
  console.log('Target not found in RekapAkhir.tsx');
}
