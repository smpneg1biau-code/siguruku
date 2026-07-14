const fs = require('fs');

function fix(file) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('const currentMapel = state.agmp_pengaturan?.mapel')) {
    code = code.replace(
      /const \{ state[^}]*\} = useStore\(\);/,
      (match) => {
        let injected = "\n  const currentMapel = state.agmp_pengaturan?.mapel || '';\n  const filteredFormatif = state.agmp_formatif.filter(f => !f.mapel || f.mapel === currentMapel);\n  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);\n  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);\n  const filteredRemedial = state.agmp_remedial.filter(r => !r.mapel || r.mapel === currentMapel);\n  const filteredAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);\n  const filteredRapor = state.agmp_rapor.filter(r => !r.mapel || r.mapel === currentMapel);";
        return match + injected;
      }
    );
    fs.writeFileSync(file, code);
  }
}

fix('components/modules/Remedial.tsx');
fix('components/modules/Rapor.tsx');
fix('components/modules/RekapAkhir.tsx');
