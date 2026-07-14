const fs = require('fs');
let code = fs.readFileSync('components/modules/Remedial.tsx', 'utf8');

code = code.replace(
  /export default function Remedial\(\) \{[\s\S]*?const \{ state, updateData, addItem, deleteItem \} = useStore\(\);/,
  `export default function Remedial() {
  const { state, updateData, addItem, deleteItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredRemedial = state.agmp_remedial.filter(r => !r.mapel || r.mapel === currentMapel);
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

code = code.replace(/state\.agmp_remedial\.filter/g, `filteredRemedial.filter`);
code = code.replace(/state\.agmp_remedial\.find/g, `filteredRemedial.find`);
code = code.replace(/state\.agmp_remedial\.map/g, `filteredRemedial.map`);

code = code.replace(/state\.agmp_sumatif\.filter/g, `filteredSumatif.filter`);
code = code.replace(/state\.agmp_sumatif\.find/g, `filteredSumatif.find`);

code = code.replace(/state\.agmp_tp\.find/g, `filteredTP.find`);

code = code.replace(
  /addItem\("agmp_remedial", \{ id: generateId\(\),/g,
  `addItem("agmp_remedial", { id: generateId(), mapel: currentMapel,`
);

fs.writeFileSync('components/modules/Remedial.tsx', code);
