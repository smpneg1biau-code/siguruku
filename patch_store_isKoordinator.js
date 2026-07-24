const fs = require('fs');
let code = fs.readFileSync('lib/store.tsx', 'utf8');

code = code.replace(
  /isAdmin, isAuthorized \}\}>/,
  'isAdmin, isKoordinator, isAuthorized }}>'
);

fs.writeFileSync('lib/store.tsx', code);
