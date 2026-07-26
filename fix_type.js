const fs = require('fs');
let code = fs.readFileSync('components/modules/KegiatanKokurikuler.tsx', 'utf8');

code = code.replace(
  /capaianProfil: \[\]/,
  'capaianProfil: [] as CapaianProfil[]'
);

fs.writeFileSync('components/modules/KegiatanKokurikuler.tsx', code);
