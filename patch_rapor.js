const fs = require('fs');
let code = fs.readFileSync('components/modules/Rapor.tsx', 'utf8');

code = code.replace(
  /export default function Rapor\(\) \{[\s\S]*?const \{ state, updateItem, addItem \} = useStore\(\);/,
  `export default function Rapor() {
  const { state, updateItem, addItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);
  const filteredAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);
  const filteredRapor = state.agmp_rapor.filter(r => !r.mapel || r.mapel === currentMapel);`
);

code = code.replace(/state\.agmp_sumatif/g, `filteredSumatif`);
code = code.replace(/state\.agmp_tp/g, `filteredTP`);
code = code.replace(/state\.agmp_absensi/g, `filteredAbsensi`);
code = code.replace(/state\.agmp_rapor/g, `filteredRapor`);

code = code.replace(
  /addItem\('agmp_rapor', \{ id: newId,/g,
  `addItem('agmp_rapor', { id: newId, mapel: currentMapel,`
);

fs.writeFileSync('components/modules/Rapor.tsx', code);
