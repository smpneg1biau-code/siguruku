const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapJurnal.tsx', 'utf8');

code = code.replace(
  /const filteredTP = filteredTP\.filter/,
  `const filteredTP = state.agmp_tp.filter`
);

fs.writeFileSync('components/modules/RekapJurnal.tsx', code);
