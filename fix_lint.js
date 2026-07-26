const fs = require('fs');
let code = fs.readFileSync('components/modules/KegiatanKokurikuler.tsx', 'utf8');

code = code.replace(
  /const filteredKegiatan = useMemo\(\(\) => \{\n    if \(!selectedTemaId\) return \[\];\n    return kegiatanList\.filter\(k => k\.temaId === selectedTemaId\);\n  \}, \[kegiatanList, selectedTemaId\]\);/,
  `const filteredKegiatan = useMemo(() => {
    if (!selectedTemaId) return [];
    return (state.agmp_kegiatan_kokurikuler || []).filter(k => k.temaId === selectedTemaId);
  }, [state.agmp_kegiatan_kokurikuler, selectedTemaId]);`
);

fs.writeFileSync('components/modules/KegiatanKokurikuler.tsx', code);
