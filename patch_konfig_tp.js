const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

// Filter TP
code = code.replace(
  /function ManajemenTP\(\) \{[\s\S]*?const \{ state, addItem, deleteItem \} = useStore\(\);/,
  `function ManajemenTP() {
  const { state, addItem, deleteItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

// Add mapel to formData
code = code.replace(
  /addItem\("agmp_tp", \{ id: generateId\(\), \.\.\.formData \}\);/,
  `addItem("agmp_tp", { id: generateId(), mapel: currentMapel, ...formData });`
);

// Map filteredTP
code = code.replace(
  /state\.agmp_tp\.map\(\(tp\)/,
  `filteredTP.map((tp)`
);
code = code.replace(
  /state\.agmp_tp\.length === 0/g,
  `filteredTP.length === 0`
);

// KKTP is linked to TP, so if we filter TP in KKTP we should be good
code = code.replace(
  /function ManajemenKKTP\(\) \{[\s\S]*?const \{ state, updateData, addItem, deleteItem \} = useStore\(\);/,
  `function ManajemenKKTP() {
  const { state, updateData, addItem, deleteItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

// Map filteredTP in KKTP
code = code.replace(
  /state\.agmp_tp\.map\(\(tp\)/g,
  `filteredTP.map((tp)`
);

// When filtering KKTP, we don't strictly need to filter agmp_kktp by mapel because KKTP links to tpId.
// But we could filter them by checking if their tpId belongs to a filteredTP.

fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
