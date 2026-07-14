const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapJurnal.tsx', 'utf8');

code = code.replace(
  /return filteredJurnal\n        \.filter/g,
  `return mapelJurnal\n        .filter`
);
code = code.replace(
  /const filteredJurnal = state\.agmp_jurnal\.filter/g,
  `const mapelJurnal = state.agmp_jurnal.filter`
);

fs.writeFileSync('components/modules/RekapJurnal.tsx', code);
