const fs = require('fs');
let code = fs.readFileSync('components/modules/Beranda.tsx', 'utf8');

code = code.replace(
  /\[filterByMapel\(state\.agmp_absensi\)\]/,
  `[state.agmp_absensi, currentMapel]`
);

fs.writeFileSync('components/modules/Beranda.tsx', code);
