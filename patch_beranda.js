const fs = require('fs');
let code = fs.readFileSync('components/modules/Beranda.tsx', 'utf8');

// The active mapel
// We need to filter agmp_jurnal, agmp_tp, agmp_formatif, agmp_sumatif, etc. by mapel.
// It's probably easier to just replace `state.agmp_` with `state.agmp_...filter(x => !x.mapel || x.mapel === currentMapel)`
code = code.replace(
  /export default function Beranda\(\{ onNavigate \}: \{ onNavigate: \(tab: any\) => void \}\) \{/,
  `export default function Beranda({ onNavigate }: { onNavigate: (tab: any) => void }) {
  const { state } = useStore();
  const currentMapel = state.agmp_pengaturan?.mapel || "";

  const filterByMapel = <T extends { mapel?: string }>(items: T[]) => {
    return items.filter(item => !item.mapel || item.mapel === currentMapel);
  };
`
);

// We need to carefully replace state.agmp_jurnal with filterByMapel(state.agmp_jurnal)
// Actually, I can just do a global replace for specific arrays inside Beranda.tsx, but that might be risky.

