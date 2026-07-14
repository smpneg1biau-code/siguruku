const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

code = code.replace(
  /\[state\.agmp_tp, selectedKelasId\]/,
  `[state.agmp_tp, selectedKelasId, currentMapel]`
);

fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
