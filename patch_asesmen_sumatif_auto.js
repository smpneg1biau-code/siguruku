const fs = require('fs');
let content = fs.readFileSync('components/modules/AsesmenSumatifKoku.tsx', 'utf-8');

content = content.replace(
  'draft += `Dalam dimensi ${dim?.nama || \\\'Profil\\\'}, murid terpantau ${predikatTeks}. `;',
  `
      // Grab matching rubric if available
      const rubricMatch = rubrikList.find(r => r.kegiatanId === selectedKegiatanId && r.dimensiNama.toLowerCase().includes(dim?.nama?.toLowerCase() || ''));
      let specificDesc = "";
      if (rubricMatch) {
        if (predikat === "SB") specificDesc = rubricMatch.deskripsiSB;
        else if (predikat === "B") specificDesc = rubricMatch.deskripsiB;
        else if (predikat === "C") specificDesc = rubricMatch.deskripsiC;
        else if (predikat === "K") specificDesc = rubricMatch.deskripsiK;
      }
      
      if (specificDesc) {
        draft += \`\${dim?.nama || 'Profil'}: \${specificDesc} \`;
      } else {
        draft += \`Dalam dimensi \${dim?.nama || 'Profil'}, murid terpantau \${predikatTeks}. \`;
      }
`
);

fs.writeFileSync('components/modules/AsesmenSumatifKoku.tsx', content);
