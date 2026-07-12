const fs = require('fs');
let code = fs.readFileSync('components/modules/ManajemenPengguna.tsx', 'utf8');

code = code.replace(/\\\$/g, '$');
code = code.replace(/\\`/g, '`');

fs.writeFileSync('components/modules/ManajemenPengguna.tsx', code);
