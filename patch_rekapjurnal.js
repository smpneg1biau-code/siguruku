const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapJurnal.tsx', 'utf8');

code = code.replace(
  /export default function RekapJurnal\(\) \{[\s\S]*?const \{ state \} = useStore\(\);/,
  `export default function RekapJurnal() {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredJurnal = state.agmp_jurnal.filter(j => !j.mapel || j.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

code = code.replace(/state\.agmp_jurnal/g, `filteredJurnal`);
code = code.replace(/state\.agmp_tp/g, `filteredTP`);

fs.writeFileSync('components/modules/RekapJurnal.tsx', code);
