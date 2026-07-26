const fs = require('fs');
['components/modules/TemaKokurikuler.tsx', 'components/modules/KegiatanKokurikuler.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  if (!code.includes('generateId')) {
    code = code.replace(/import \{ useStore \} from "@\/lib\/store";/, 'import { useStore } from "@/lib/store";\nimport { generateId } from "@/lib/utils";');
    if (file.includes('TemaKokurikuler')) {
      code = code.replace(/addItem\("agmp_tema_kokurikuler", \{ nama, deskripsi \}\);/, 'addItem("agmp_tema_kokurikuler", { id: generateId(), nama, deskripsi });');
    } else {
      code = code.replace(/addItem\("agmp_kegiatan_kokurikuler", \{/, 'addItem("agmp_kegiatan_kokurikuler", { id: generateId(),');
    }
    fs.writeFileSync(file, code);
  }
});
