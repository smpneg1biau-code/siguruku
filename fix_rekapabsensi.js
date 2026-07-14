const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapAbsensi.tsx', 'utf8');

// I injected `const filteredAbsensi = state.agmp_absensi.filter(...)` at the top.
// Then there is `const filteredAbsensi = useMemo(...)`. Let's rename the top one to `mapelAbsensi`.
code = code.replace(
  /const filteredAbsensi = state\.agmp_absensi\.filter/g,
  `const mapelAbsensi = state.agmp_absensi.filter`
);
// And the `useMemo` uses the top one. It was `return filteredAbsensi.filter(a => ...)`
code = code.replace(
  /return filteredAbsensi\.filter/g,
  `return mapelAbsensi.filter`
);

fs.writeFileSync('components/modules/RekapAbsensi.tsx', code);
