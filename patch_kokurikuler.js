const fs = require('fs');

// 1. Update lib/types.ts
let types = fs.readFileSync('lib/types.ts', 'utf8');
const kokurikulerTypes = `export type TemaBentuk = {
  id: string;
  dimensiId: string;
  bentuk: "Pembelajaran Kolaboratif Lintas Disiplin" | "Gerakan 7KAIH" | "Cara Lainnya";
  deskripsi?: string;
};

export type ModulKokurikuler = {
  id: string;
  nama: string;
  temaBentukId: string;
  alokasiWaktu: number;
};

export type Fasilitator = {
  id: string;
  modulId: string;
  kelasId: string;
  guruId: string;
};

`;
types = kokurikulerTypes + types;
types = types.replace(
  /agmp_dimensi: Dimensi\[\];/,
  `agmp_dimensi: Dimensi[];\n  agmp_tema_bentuk: TemaBentuk[];\n  agmp_modul_kokurikuler: ModulKokurikuler[];\n  agmp_fasilitator: Fasilitator[];`
);
fs.writeFileSync('lib/types.ts', types);

// 2. Update lib/defaults.ts
let defs = fs.readFileSync('lib/defaults.ts', 'utf8');
defs = defs.replace(
  /agmp_dimensi: \[\],/,
  `agmp_dimensi: [],\n  agmp_tema_bentuk: [],\n  agmp_modul_kokurikuler: [],\n  agmp_fasilitator: [],`
);
fs.writeFileSync('lib/defaults.ts', defs);

// 3. Update lib/store.tsx
let store = fs.readFileSync('lib/store.tsx', 'utf8');
store = store.replace(
  /'agmp_dimensi'/g,
  `'agmp_dimensi', 'agmp_tema_bentuk', 'agmp_modul_kokurikuler', 'agmp_fasilitator'`
);
fs.writeFileSync('lib/store.tsx', store);
