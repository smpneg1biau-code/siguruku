const fs = require('fs');
let code = fs.readFileSync('app/publik/page.tsx', 'utf8');
code = "export const dynamic = 'force-dynamic';\n" + code;
fs.writeFileSync('app/publik/page.tsx', code);
