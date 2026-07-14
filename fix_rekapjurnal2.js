const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapJurnal.tsx', 'utf8');

code = code.replace(
  /const filteredJurnal = filteredJurnal\.filter\(j => !j\.mapel \|\| j\.mapel === currentMapel\);/,
  `const mapelJurnal = state.agmp_jurnal.filter(j => !j.mapel || j.mapel === currentMapel);`
);

code = code.replace(
  /return filteredJurnal\.filter/g,
  `return mapelJurnal.filter`
);

code = code.replace(
  /\[filteredJurnal, startDate, endDate\]/,
  `[mapelJurnal, startDate, endDate]`
);

fs.writeFileSync('components/modules/RekapJurnal.tsx', code);
