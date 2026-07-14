const fs = require('fs');

function fix(file, matchStr, replacementStr) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('const currentMapel = state.agmp_pengaturan?.mapel')) {
    code = code.replace(matchStr, replacementStr);
    fs.writeFileSync(file, code);
  }
}

// Sumatif
fix('components/modules/Sumatif.tsx',
  /export default function Sumatif\(\) \{[\s\S]*?const \{ state, addItem, updateItem, showToast \} = useStore\(\);/,
  `export default function Sumatif() {
  const { state, addItem, updateItem, showToast } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

// Remedial
fix('components/modules/Remedial.tsx',
  /export default function Remedial\(\) \{[\s\S]*?const \{ state, addItem, updateItem, showToast \} = useStore\(\);/,
  `export default function Remedial() {
  const { state, addItem, updateItem, showToast } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredRemedial = state.agmp_remedial.filter(r => !r.mapel || r.mapel === currentMapel);
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

// Rapor
fix('components/modules/Rapor.tsx',
  /export default function Rapor\(\) \{[\s\S]*?const \{ state, addItem, updateItem, showToast \} = useStore\(\);/,
  `export default function Rapor() {
  const { state, addItem, updateItem, showToast } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);
  const filteredAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);
  const filteredRapor = state.agmp_rapor.filter(r => !r.mapel || r.mapel === currentMapel);`
);

// RekapAkhir
fix('components/modules/RekapAkhir.tsx',
  /export default function RekapAkhir\(\) \{[\s\S]*?const \{ state \} = useStore\(\);/,
  `export default function RekapAkhir() {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredFormatif = state.agmp_formatif.filter(f => !f.mapel || f.mapel === currentMapel);
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

