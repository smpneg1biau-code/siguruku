const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

code = code.replace(
  /import Database from "@\/components\/modules\/Database";/,
  `import Database from "@/components/modules/Database";\nimport ManajemenPengguna from "@/components/modules/ManajemenPengguna";`
);

code = code.replace(
  /import \{ BarChart2, Database as DatabaseIcon \} from "lucide-react";/,
  `import { BarChart2, Database as DatabaseIcon, Shield } from "lucide-react";`
);

code = code.replace(
  /const \{ state, logout \} = useStore\(\);/,
  `const { state, logout, isAdmin } = useStore();`
);

code = code.replace(
  /\{ id: "database", label: "Database", icon: DatabaseIcon \},/,
  `{ id: "database", label: "Database", icon: DatabaseIcon },\n      { id: "pengguna", label: "Pengguna", icon: Shield, adminOnly: true },`
);

code = code.replace(
  /type MenuItem = \{/,
  `type MenuItem = {\n  adminOnly?: boolean;`
);

// Filtering MENU_CATEGORIES
code = code.replace(
  /\{MENU_CATEGORIES\.map\(\(category\) => \(/,
  `{MENU_CATEGORIES.map((category) => {\n            const filteredItems = category.items.filter(item => !item.adminOnly || isAdmin);\n            if (filteredItems.length === 0) return null;\n            return (`
);

code = code.replace(
  /\{category\.items\.map\(\(item\) => \(/,
  `{filteredItems.map((item) => (`
);

// End of MENU_CATEGORIES loop
code = code.replace(
  /<\/div>\n            <\/div>\n          \)\)\}/,
  `</div>\n            </div>\n          ); \n          })}`
);


// Render component
code = code.replace(
  /case "database":\n        return <Database \/>;/,
  `case "database":\n        return <Database />;\n      case "pengguna":\n        return isAdmin ? <ManajemenPengguna /> : <Beranda onNavigate={setActiveTab} />;`
);

fs.writeFileSync('components/Shell.tsx', code);
