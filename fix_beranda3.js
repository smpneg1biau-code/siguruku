const fs = require('fs');
let code = fs.readFileSync('components/modules/Beranda.tsx', 'utf8');

code = code.replace(
  /export default function Beranda\(\{[\s\S]*?\}\) \{[\s\S]*?const \{ state \} = useStore\(\);/,
  `export default function Beranda({
  onNavigate,
}: {
  onNavigate: (tab: TabId) => void;
}) {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";

  const filterByMapel = <T extends { mapel?: string }>(items: T[]) => {
    return items.filter(item => !item.mapel || item.mapel === currentMapel);
  };`
);

fs.writeFileSync('components/modules/Beranda.tsx', code);
