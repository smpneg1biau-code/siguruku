const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'Absensi.tsx',
  'Jurnal.tsx',
  'Formatif.tsx',
  'Sumatif.tsx',
  'Remedial.tsx',
  'RekapJurnal.tsx',
  'RekapAbsensi.tsx',
  'RekapAkhir.tsx',
  'Rapor.tsx',
  'Beranda.tsx',
  'Fasilitator.tsx',
  'AbsensiKokurikuler.tsx',
  'RekapAbsensiKokurikuler.tsx',
  'KegiatanKokurikuler.tsx'
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, 'components/modules', file);
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('const { state') && !content.includes(', filteredKelas }')) {
    content = content.replace(/const \{\s*state([^}]*)\}\s*=\s*useStore\(\);/g, 'const { state$1, filteredKelas } = useStore();');
  }
  
  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file}`);
});
