const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapAkhir.tsx', 'utf8');

code = code.replace(
  /export default function RekapAkhir\(\) \{[\s\S]*?const \{ state \} = useStore\(\);/,
  `export default function RekapAkhir() {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredFormatif = state.agmp_formatif.filter(f => !f.mapel || f.mapel === currentMapel);
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

code = code.replace(/state\.agmp_formatif/g, `filteredFormatif`);
code = code.replace(/state\.agmp_sumatif/g, `filteredSumatif`);
code = code.replace(/state\.agmp_tp/g, `filteredTP`);

fs.writeFileSync('components/modules/RekapAkhir.tsx', code);
