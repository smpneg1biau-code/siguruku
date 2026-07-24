const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

// Replace state and add isAdmin
code = code.replace(
  /const \[activeTab, setActiveTab\] = useState<"ta" \| "kelas" \| "siswa" \| "tp" \| "kktp" \| "db">\(.+?"ta",\n  \);/s,
  `const { isAdmin } = useStore();\n  const [activeTab, setActiveTab] = useState<"ta" | "kelas" | "siswa" | "tp" | "kktp" | "mapel" | "db">("ta");`
);

// Map tabs logic
code = code.replace(
  /\{id:"tp", label:"TP"\}, \{id:"kktp", label:"KKTP"\}/,
  `{id:"tp", label:"TP"}, {id:"kktp", label:"KKTP"}, ...(isAdmin ? [{id:"mapel", label:"Mata Pelajaran"}] : [])`
);

// Add the rendering logic for mapel tab
code = code.replace(
  /\{activeTab === "kktp" && <ManajemenKKTP \/>\}/,
  `{activeTab === "kktp" && <ManajemenKKTP />}\n        {activeTab === "mapel" && isAdmin && <ManajemenMapel />}`
);

fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
