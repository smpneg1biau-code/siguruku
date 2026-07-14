const fs = require('fs');
let code = fs.readFileSync('components/modules/Formatif.tsx', 'utf8');

code = code.replace(
  /export default function Formatif\(\) \{[\s\S]*?const \{ state, addItem, updateItem, showToast \} = useStore\(\);/,
  `export default function Formatif() {
  const { state, addItem, updateItem, showToast } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredFormatif = state.agmp_formatif.filter(f => !f.mapel || f.mapel === currentMapel);`
);

fs.writeFileSync('components/modules/Formatif.tsx', code);
