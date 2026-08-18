const fs = require('fs');
let content = fs.readFileSync('components/modules/Absensi.tsx', 'utf8');

// 1. Change default class
content = content.replace(
  "const [kelasId, setKelasId] = useState(filteredKelas[0]?.id || '');",
  "const [kelasId, setKelasId] = useState('');"
);

// 2. Update useEffect to not auto-save
content = content.replace(
  /addItem\('agmp_absensi',\s*\{\s*id:\s*generateId\(\),\s*taId:\s*activeTaId,\s*tanggal,\s*kelasId,\s*records\s*\}, true\);\s*\/\/\s*eslint-disable-next-line\s*react-hooks\/set-state-in-effect/,
  ""
);

// 3. Update handleToggle
content = content.replace(
  /const handleToggle = \(siswaId: string\) => \{\s*if \(\!existingRecord\) return;/,
  "const handleToggle = (siswaId: string) => {"
);

// 4. Update setAllHadir
content = content.replace(
  /const setAllHadir = \(\) => \{\s*if \(\!existingRecord\) return;/,
  "const setAllHadir = () => {"
);

// 5. Update simpanAbsensi
const newSimpan = `const simpanAbsensi = () => {
    if (!kelasId) return showToast('Pilih kelas terlebih dahulu', 'error');
    if (!existingRecord) {
        addItem('agmp_absensi', { id: generateId(), taId: activeTaId, tanggal, kelasId, records: localRecords }, false);
        showToast('Kehadiran berhasil disimpan', 'success');
    } else {
        updateItem('agmp_absensi', existingRecord.id, { records: localRecords }, false);
        showToast('Kehadiran berhasil diupdate', 'success');
    }
  };`;

content = content.replace(
  /const simpanAbsensi = \(\) => \{\s*if \(\!existingRecord\) return;\s*updateItem\('agmp_absensi', existingRecord\.id, \{ records: localRecords \}, false\);\s*\};/,
  newSimpan
);

// Remove addItem from dependencies of useEffect just to be safe
content = content.replace(
  /\}, \[tanggal, kelasId, existingRecord, addItem, state\.agmp_siswa, activeTaId\]\);/,
  "}, [tanggal, kelasId, existingRecord, state.agmp_siswa, activeTaId]);"
);

// Replace "Pilih kelas yang memiliki murid." with a general message if no class selected
content = content.replace(
  /<div className="text-center py-10 text-gray-500">Pilih kelas yang memiliki murid\.<\/div>/,
  '<div className="text-center py-10 text-gray-500">{kelasId ? "Pilih kelas yang memiliki murid." : "Silakan pilih kelas terlebih dahulu."}</div>'
);

fs.writeFileSync('components/modules/Absensi.tsx', content);
console.log('Patched Absensi.tsx successfully');
