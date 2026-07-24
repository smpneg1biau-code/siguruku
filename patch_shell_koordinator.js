const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

code = code.replace(
  /type MenuItem = \{\n  adminOnly\?: boolean;/,
  'type MenuItem = {\n  adminOnly?: boolean;\n  koordinatorOnly?: boolean;'
);

code = code.replace(
  /const \{ state, logout, isAdmin \} = useStore\(\);/,
  'const { state, logout, isAdmin, isKoordinator } = useStore();'
);

code = code.replace(
  /const filteredItems = category\.items\.filter\(item => !item\.adminOnly \|\| isAdmin\);/,
  'const filteredItems = category.items.filter(item => (!item.adminOnly || isAdmin) && (!item.koordinatorOnly || isAdmin || isKoordinator));'
);

const kokuMenuOld = `  {
    category: "Kokurikuler",
    items: [
      { id: "tema-bentuk", label: "Tema & Bentuk", icon: BookOpen },
      { id: "daftar-modul", label: "Daftar Modul", icon: FileText },
      { id: "fasilitator", label: "Fasilitator", icon: Users },
    ],
  },`;
  
const kokuMenuNew = `  {
    category: "Kokurikuler",
    items: [
      { id: "tema-bentuk", label: "Tema & Bentuk", icon: BookOpen, koordinatorOnly: true },
      { id: "daftar-modul", label: "Daftar Modul", icon: FileText, koordinatorOnly: true },
      { id: "fasilitator", label: "Fasilitator", icon: Users, koordinatorOnly: true },
    ],
  },`;
  
code = code.replace(kokuMenuOld, kokuMenuNew);

fs.writeFileSync('components/Shell.tsx', code);
