const fs = require('fs');

function fix(file, funcName, stateVarsStr, injectedVarsStr) {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('const currentMapel = state.agmp_pengaturan?.mapel')) {
    const regex = new RegExp(\`export default function \${funcName}\\(\\) \\{[\\\\s\\\\S]*?const \\{ \${stateVarsStr} \\} = useStore\\(\\);\`);
    const replaceWith = \`export default function \${funcName}() {
  const { \${stateVarsStr} } = useStore();
  \${injectedVarsStr}\`;
    code = code.replace(regex, replaceWith);
    fs.writeFileSync(file, code);
  }
}

// Remedial
fix('components/modules/Remedial.tsx', 'Remedial',
  'state, updateItem, addItem, showToast',
  `const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredRemedial = state.agmp_remedial.filter(r => !r.mapel || r.mapel === currentMapel);
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

// Rapor
fix('components/modules/Rapor.tsx', 'Rapor',
  'state, updateItem, addItem',
  `const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);
  const filteredAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);
  const filteredRapor = state.agmp_rapor.filter(r => !r.mapel || r.mapel === currentMapel);`
);

// RekapAkhir
fix('components/modules/RekapAkhir.tsx', 'RekapAkhir',
  'state',
  `const currentMapel = state.agmp_pengaturan?.mapel || "";
  const filteredFormatif = state.agmp_formatif.filter(f => !f.mapel || f.mapel === currentMapel);
  const filteredSumatif = state.agmp_sumatif.filter(s => !s.mapel || s.mapel === currentMapel);
  const filteredTP = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

