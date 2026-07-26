const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

code = code.replace(
  /\| "tema-bentuk"\n  \| "daftar-modul"/,
  '| "tema-bentuk"\n  | "daftar-modul"\n  | "tema-kokurikuler"\n  | "kegiatan-kokurikuler"\n  | "asesmen-formatif-koku"\n  | "asesmen-sumatif-koku"'
);

const oldKoku = `  {
    category: "Kokurikuler",
    items: [
      { id: "tema-bentuk", label: "Tema & Bentuk", icon: BookOpen, koordinatorOnly: true },
      { id: "daftar-modul", label: "Daftar Modul", icon: FileText, koordinatorOnly: true },
      { id: "fasilitator", label: "Fasilitator", icon: Users, koordinatorOnly: true },
    ],
  },`;
  
const newKoku = `  {
    category: "Kokurikuler",
    items: [
      { id: "tema-kokurikuler", label: "Daftar Tema", icon: BookOpen, koordinatorOnly: true },
      { id: "kegiatan-kokurikuler", label: "Kegiatan Kokurikuler", icon: FileText, koordinatorOnly: true },
      { id: "asesmen-formatif-koku", label: "Asesmen Formatif", icon: CheckSquare, koordinatorOnly: true },
      { id: "asesmen-sumatif-koku", label: "Asesmen Sumatif", icon: Award, koordinatorOnly: true },
      { id: "fasilitator", label: "Fasilitator", icon: Users, koordinatorOnly: true },
    ],
  },`;

code = code.replace(oldKoku, newKoku);

const oldSwitch = `          {activeTab === "tema-bentuk" && <TemaBentuk />}
          {activeTab === "daftar-modul" && <DaftarModul />}
          {activeTab === "fasilitator" && <Fasilitator />}`;
          
const newSwitch = `          {activeTab === "tema-bentuk" && <TemaBentuk />}
          {activeTab === "daftar-modul" && <DaftarModul />}
          {activeTab === "tema-kokurikuler" && <TemaKokurikuler />}
          {activeTab === "kegiatan-kokurikuler" && <KegiatanKokurikuler />}
          {activeTab === "asesmen-formatif-koku" && <AsesmenFormatifKoku />}
          {activeTab === "asesmen-sumatif-koku" && <AsesmenSumatifKoku />}
          {activeTab === "fasilitator" && <Fasilitator />}`;

code = code.replace(oldSwitch, newSwitch);

// add imports
const importKoku = `import TemaKokurikuler from "@/components/modules/TemaKokurikuler";
import KegiatanKokurikuler from "@/components/modules/KegiatanKokurikuler";
import AsesmenFormatifKoku from "@/components/modules/AsesmenFormatifKoku";
import AsesmenSumatifKoku from "@/components/modules/AsesmenSumatifKoku";`;

code = code.replace(/import Fasilitator from "@\/components\/modules\/Fasilitator";/, `import Fasilitator from "@/components/modules/Fasilitator";\n${importKoku}`);

fs.writeFileSync('components/Shell.tsx', code);
