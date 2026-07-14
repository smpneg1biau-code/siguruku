const fs = require('fs');
let code = fs.readFileSync('components/modules/Absensi.tsx', 'utf8');

code = code.replace(
  /\[tanggal, kelasId, existingRecord, addItem, state\.agmp_siswa, activeTaId\]/,
  `[tanggal, kelasId, existingRecord, addItem, state.agmp_siswa, activeTaId, currentMapel]`
);

fs.writeFileSync('components/modules/Absensi.tsx', code);
