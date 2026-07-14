const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapAbsensi.tsx', 'utf8');

code = code.replace(
  /const filteredAbsensi = filteredAbsensi\.filter\(a => !a\.mapel \|\| a\.mapel === currentMapel\);/,
  `const mapelAbsensi = state.agmp_absensi.filter(a => !a.mapel || a.mapel === currentMapel);`
);

code = code.replace(
  /return filteredAbsensi\n      \.filter/g,
  `return mapelAbsensi\n      .filter`
);

// also in the dependency array
code = code.replace(
  /\[filteredAbsensi, kelasId, startDate, endDate\]/,
  `[mapelAbsensi, kelasId, startDate, endDate]`
);

fs.writeFileSync('components/modules/RekapAbsensi.tsx', code);
