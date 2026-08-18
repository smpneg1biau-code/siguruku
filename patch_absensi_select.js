const fs = require('fs');
let content = fs.readFileSync('components/modules/Absensi.tsx', 'utf8');

content = content.replace(
  /<select className="w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-medium bg-gray-50 cursor-pointer" value={kelasId} onChange=\{e => setKelasId\(e\.target\.value\)\}>/,
  '<select className="w-full sm:w-auto px-4 py-2 border rounded-lg text-sm font-medium bg-gray-50 cursor-pointer" value={kelasId} onChange={e => setKelasId(e.target.value)}>\n          <option value="" disabled>Pilih Kelas</option>'
);

fs.writeFileSync('components/modules/Absensi.tsx', content);
console.log('Patched Absensi select');
