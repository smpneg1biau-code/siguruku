const fs = require('fs');
let code = fs.readFileSync('lib/defaults.ts', 'utf8');

code = code.replace(
  /agmp_anekdot: \[\],/,
  `agmp_anekdot: [],\n  agmp_mapel: [],`
);

fs.writeFileSync('lib/defaults.ts', code);
