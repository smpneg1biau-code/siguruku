const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

// Add imports
code = code.replace(
  /import ManajemenPengguna from "@\/components\/modules\/ManajemenPengguna";/,
  `import ManajemenPengguna from "@/components/modules/ManajemenPengguna";\nimport TemaBentuk from "@/components/modules/TemaBentuk";\nimport DaftarModul from "@/components/modules/DaftarModul";\nimport Fasilitator from "@/components/modules/Fasilitator";`
);

// Add TabId
code = code.replace(
  /  \| "database"/,
  `  | "database"\n  | "tema-bentuk"\n  | "daftar-modul"\n  | "fasilitator"`
);

// Add Menu Category (before Sistem & Pengaturan)
const kokuMenu = `  {
    category: "Kokurikuler",
    items: [
      { id: "tema-bentuk", label: "Tema & Bentuk", icon: BookOpen },
      { id: "daftar-modul", label: "Daftar Modul", icon: FileText },
      { id: "fasilitator", label: "Fasilitator", icon: Users },
    ],
  },
  {
    category: "Sistem & Pengaturan",`;
code = code.replace(/  \{\n    category: "Sistem & Pengaturan",/g, kokuMenu);

// Add to renderContent
const kokuCases = `      case "tema-bentuk":
        return <TemaBentuk />;
      case "daftar-modul":
        return <DaftarModul />;
      case "fasilitator":
        return <Fasilitator />;
      case "database":`;
code = code.replace(/      case "database":/, kokuCases);

fs.writeFileSync('components/Shell.tsx', code);
