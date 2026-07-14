const fs = require('fs');
let code = fs.readFileSync('components/modules/Beranda.tsx', 'utf8');

const replacements = {
  'state.agmp_tp': 'filterByMapel(state.agmp_tp)',
  'state.agmp_absensi': 'filterByMapel(state.agmp_absensi)',
  'state.agmp_sumatif': 'filterByMapel(state.agmp_sumatif)',
  'state.agmp_remedial': 'filterByMapel(state.agmp_remedial)',
  'state.agmp_jurnal': 'filterByMapel(state.agmp_jurnal)',
  'state.agmp_formatif': 'filterByMapel(state.agmp_formatif)',
};

for (const [key, val] of Object.entries(replacements)) {
  code = code.split(key).join(val);
}

// Fix double replacement if there were any
code = code.replace(/filterByMapel\(filterByMapel\(/g, 'filterByMapel(').replace(/\)\)/g, '))'); // simple cleanup if needed

fs.writeFileSync('components/modules/Beranda.tsx', code);
