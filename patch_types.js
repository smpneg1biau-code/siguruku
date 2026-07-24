const fs = require('fs');
let code = fs.readFileSync('lib/types.ts', 'utf8');

// Add Mapel type
code = `export type Mapel = {
  id: string;
  kode: string;
  nama: string;
};\n\n` + code;

// Add to AppState
code = code.replace(
  /agmp_anekdot: Anekdot\[\];/,
  `agmp_anekdot: Anekdot[];\n  agmp_mapel: Mapel[];`
);

fs.writeFileSync('lib/types.ts', code);
