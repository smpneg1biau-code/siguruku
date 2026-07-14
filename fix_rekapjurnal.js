const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapJurnal.tsx', 'utf8');

// I injected `const filteredJurnal = state.agmp_jurnal.filter(...)` at the top.
// Then there is `const filteredJurnal = useMemo(...)`. Let's rename the top one to `mapelJurnal`.
code = code.replace(
  /const filteredJurnal = state\.agmp_jurnal\.filter/g,
  `const mapelJurnal = state.agmp_jurnal.filter`
);
// And the `useMemo` uses the top one. It was `return filteredJurnal.filter(j => ...)`
code = code.replace(
  /return filteredJurnal\.filter/g,
  `return mapelJurnal.filter`
);

fs.writeFileSync('components/modules/RekapJurnal.tsx', code);
