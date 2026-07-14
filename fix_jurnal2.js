const fs = require('fs');
let code = fs.readFileSync('components/modules/Jurnal.tsx', 'utf8');

code = code.replace(
  /const \{ state, addItem, updateItem, showToast \} = useStore\(\);/,
  `const { state, addItem, updateItem, showToast } = useStore();\n  const currentMapel = state.agmp_pengaturan?.mapel || "";`
);

// Oh wait, does `Jurnal.tsx` list TPs?
// If it has `state.agmp_tp.map(t => <option ...)` we should also filter it there!
code = code.replace(
  /state\.agmp_tp\.filter/g,
  `state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel).filter`
);
code = code.replace(
  /state\.agmp_tp\.map/g,
  `state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel).map`
);

fs.writeFileSync('components/modules/Jurnal.tsx', code);
