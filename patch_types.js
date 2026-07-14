const fs = require('fs');
let code = fs.readFileSync('lib/types.ts', 'utf8');

// Add mapel to all relevant types
const typesToModify = ['TP', 'Jurnal', 'Absensi', 'Anekdot', 'Formatif', 'Sumatif', 'Remedial', 'Rapor'];
typesToModify.forEach(t => {
  const regex = new RegExp(`export type ${t} = \\{`);
  code = code.replace(regex, `export type ${t} = {\n  mapel?: string;`);
});

// Update agmp_pengaturan
code = code.replace(
  /agmp_pengaturan: \{[\s\S]*?\};/,
  `agmp_pengaturan: {
    guruNama: string;
    mapel: string; // The current active mapel or legacy single mapel
    mapels?: string[]; // The list of mapels the teacher teaches
    sekolah: string;
  };`
);

fs.writeFileSync('lib/types.ts', code);
