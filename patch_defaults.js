const fs = require('fs');
let code = fs.readFileSync('lib/defaults.ts', 'utf8');

code = code.replace(
  /mapel: "",/,
  `mapel: "",\n    mapels: [],`
);

fs.writeFileSync('lib/defaults.ts', code);
