const fs = require('fs');
let code = fs.readFileSync('components/modules/Absensi.tsx', 'utf8');

code = code.replace(
  /export default function Absensi\(\) \{[\s\S]*?const \{ state, addItem, updateItem \} = useStore\(\);/,
  `export default function Absensi() {
  const { state, addItem, updateItem } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";`
);

// We need to filter `state.agmp_absensi` when looking for existing record.
code = code.replace(
  /const existingRecord = state\.agmp_absensi\.find\(\(a\) => a\.tanggal === tanggal && a\.kelasId === kelasId\);/,
  `const existingRecord = state.agmp_absensi.find((a) => a.tanggal === tanggal && a.kelasId === kelasId && (!a.mapel || a.mapel === currentMapel));`
);

code = code.replace(
  /addItem\('agmp_absensi', \{ id: generateId\(\), taId: activeTaId, tanggal, kelasId, records \}, true\);/,
  `addItem('agmp_absensi', { id: generateId(), taId: activeTaId, tanggal, kelasId, records, mapel: currentMapel }, true);`
);

// Anekdot doesn't strictly need mapel filtering unless we want anecdotes to be per-mapel. 
// A teacher's anecdote for a student might be per mapel, let's add it.
code = code.replace(
  /function DetailSiswaModal[\s\S]*?const \{ state, updateItem, addItem, showToast \} = useStore\(\);/,
  `function DetailSiswaModal({ siswaId, onClose, existingRecord }: { siswaId: string, onClose: () => void, existingRecord: any }) {
  const { state, updateItem, addItem, showToast } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";`
);

code = code.replace(
  /const anekdotHistory = state\.agmp_anekdot\.filter\(a => a\.siswaId === siswaId && \(a\.taId === activeTaId \|\| !a\.taId\)\)/,
  `const anekdotHistory = state.agmp_anekdot.filter(a => a.siswaId === siswaId && (a.taId === activeTaId || !a.taId) && (!a.mapel || a.mapel === currentMapel))`
);

code = code.replace(
  /addItem\('agmp_anekdot', \{/,
  `addItem('agmp_anekdot', {\n      mapel: currentMapel,`
);

fs.writeFileSync('components/modules/Absensi.tsx', code);
