const fs = require('fs');
let code = fs.readFileSync('components/modules/Formatif.tsx', 'utf8');

code = code.replace(
  /export default function Formatif\(\) \{[\s\S]*?const \{ state, updateData, addItem \} = useStore\(\);/,
  `export default function Formatif() {
  const { state, updateData, addItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredFormatif = state.agmp_formatif.filter(f => !f.mapel || f.mapel === currentMapel);`
);

code = code.replace(
  /state\.agmp_formatif\.find/g,
  `filteredFormatif.find`
);

code = code.replace(
  /const jurnals = state\.agmp_jurnal/g,
  `const jurnals = state.agmp_jurnal.filter(j => !j.mapel || j.mapel === currentMapel)`
);

code = code.replace(
  /addItem\('agmp_formatif', \{ id: generateId\(\),/g,
  `addItem('agmp_formatif', { id: generateId(), mapel: currentMapel,`
);

fs.writeFileSync('components/modules/Formatif.tsx', code);
