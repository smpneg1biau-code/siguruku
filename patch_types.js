const fs = require('fs');
let code = fs.readFileSync('lib/types.ts', 'utf8');

const target = `export type AspekRubrik = {
  id: string;
  nama: string;
  skalaPenilaian?: string[];
};`;

const replacement = `export type AspekRubrik = {
  id: string;
  nama: string;
  skalaPenilaian?: string[];
  deskripsiSkala?: string[];
  ekivalenSkala?: number[];
};`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('lib/types.ts', code);
  console.log('Patched types.ts');
} else {
  console.log('Target not found in types.ts');
}
