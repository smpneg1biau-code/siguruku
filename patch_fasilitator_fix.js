const fs = require('fs');
let code = fs.readFileSync('components/modules/Fasilitator.tsx', 'utf8');

code = code.replace(
  /setGuruId\(""\);/,
  'setGuruIds([]);'
);

fs.writeFileSync('components/modules/Fasilitator.tsx', code);
