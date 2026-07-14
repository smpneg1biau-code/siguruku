const fs = require('fs');
let code = fs.readFileSync('components/modules/RekapJurnal.tsx', 'utf8');

code = code.replace(/return filteredJurnal/g, 'return mapelJurnal');
code = code.replace(/\[filteredJurnal,/g, '[mapelJurnal,');

fs.writeFileSync('components/modules/RekapJurnal.tsx', code);
