const fs = require('fs');
let code = fs.readFileSync('app/publik/page.tsx', 'utf8');
code = code.replace("export const dynamic = 'force-dynamic';\n", "");
fs.writeFileSync('app/publik/page.tsx', code);
