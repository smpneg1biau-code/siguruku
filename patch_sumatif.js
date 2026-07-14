const fs = require('fs');
let code = fs.readFileSync('components/modules/Sumatif.tsx', 'utf8');

code = code.replace(
  /export default function Sumatif\(\) \{[\s\S]*?const \{ state, updateData, addItem, deleteItem \} = useStore\(\);/,
  `export default function Sumatif() {
  const { state, updateData, addItem, deleteItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

code = code.replace(
  /state\.agmp_sumatif\.find/g,
  `filteredSumatif.find`
);
code = code.replace(
  /state\.agmp_sumatif\.map/g,
  `filteredSumatif.map`
);
code = code.replace(
  /state\.agmp_tp/g,
  `filteredTP`
);
code = code.replace(
  /addItem\('agmp_sumatif', \{ id: generateId\(\),/g,
  `addItem('agmp_sumatif', { id: generateId(), mapel: currentMapel,`
);

fs.writeFileSync('components/modules/Sumatif.tsx', code);
