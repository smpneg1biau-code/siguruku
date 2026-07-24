const fs = require('fs');
let code = fs.readFileSync('lib/store.tsx', 'utf8');

code = code.replace(
  /'agmp_remedial', 'agmp_rapor', 'agmp_anekdot'/g,
  `'agmp_remedial', 'agmp_rapor', 'agmp_anekdot', 'agmp_mapel'`
);

fs.writeFileSync('lib/store.tsx', code);
