const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

code = code.replace(
  /function ManajemenKKTP\(\) \{[\s\S]*?const \{ state, addItem, updateItem, updateData, showToast \} = useStore\(\);/,
  `function ManajemenKKTP() {
  const { state, addItem, updateItem, updateData, showToast } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";`
);

fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
