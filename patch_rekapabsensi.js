const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapAbsensi.tsx', 'utf8');

code = code.replace(
  /export default function RekapAbsensi\(\) \{[\s\S]*?const \{ state \} = useStore\(\);/,
  `export default function RekapAbsensi() {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);`
);

code = code.replace(/state\.agmp_absensi/g, `filteredAbsensi`);

fs.writeFileSync('components/modules/RekapAbsensi.tsx', code);
