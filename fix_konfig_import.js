const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

// The first import was placed correctly or incorrectly, let's just make it the only one.
// There is one at the top? Wait, I added it around line 1850.
code = code.replace(/> import { DAFTAR_MATA_PELAJARAN } from "@\/lib\/constants";/, ''); // wait, that's not exactly the string in file.

// Let's remove ALL `import { DAFTAR_MATA_PELAJARAN } from "@/lib/constants";` and put one at the very top.
code = code.replace(/import \{ DAFTAR_MATA_PELAJARAN \} from "@\/lib\/constants";/g, '');

code = 'import { DAFTAR_MATA_PELAJARAN } from "@/lib/constants";\n' + code;

fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
