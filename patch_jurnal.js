const fs = require('fs');
let code = fs.readFileSync('components/modules/Jurnal.tsx', 'utf8');

// Filter TP
code = code.replace(
  /const TPs = state\.agmp_tp;/,
  `const currentMapel = state.agmp_pengaturan?.mapel || "";\n  const TPs = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel);`
);

code = code.replace(
  /const newJurnal = \{[\s\S]*?id: generateId\(\),[\s\S]*?\};/,
  `const newJurnal = {
      id: generateId(),
      taId: activeTaId,
      mapel: currentMapel,
      ...formData,
      cekAwalDone: false,
      cekTengahDone: false,
      isClosed: false
    };`
);

code = code.replace(
  /const recentJurnals = state\.agmp_jurnal/,
  `const recentJurnals = state.agmp_jurnal.filter(j => !j.mapel || j.mapel === currentMapel)`
);

fs.writeFileSync('components/modules/Jurnal.tsx', code);
