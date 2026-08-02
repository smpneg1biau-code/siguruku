#!/bin/bash

# Fix AsesmenFormatifKoku.tsx
sed -i 's/}, \[state.agmp_kegiatan_kokurikuler, selectedTemaId\]);/}, \[kegiatanList, selectedTemaId\]);/g' components/modules/AsesmenFormatifKoku.tsx
sed -i 's/}, \[state.agmp_kegiatan_kokurikuler, selectedKegiatanId\]);/}, \[kegiatanList, selectedKegiatanId\]);/g' components/modules/AsesmenFormatifKoku.tsx
sed -i 's/}, \[state.agmp_siswa, selectedKelasId\]);/}, \[siswaList, selectedKelasId\]);/g' components/modules/AsesmenFormatifKoku.tsx
sed -i 's/}, \[state.agmp_asesmen_formatif_koku, selectedSiswaId, selectedKegiatanId, activeTaId\]);/}, \[formatifList, selectedSiswaId, selectedKegiatanId, activeTaId\]);/g' components/modules/AsesmenFormatifKoku.tsx
sed -i 's/eslint-disable-next-line react-hooks\/set-state-in-effect//g' components/modules/AsesmenFormatifKoku.tsx

# Fix AsesmenSumatifKoku.tsx
sed -i 's/}, \[state.agmp_kegiatan_kokurikuler, selectedTemaId\]);/}, \[kegiatanList, selectedTemaId\]);/g' components/modules/AsesmenSumatifKoku.tsx
sed -i 's/}, \[state.agmp_kegiatan_kokurikuler, selectedKegiatanId\]);/}, \[kegiatanList, selectedKegiatanId\]);/g' components/modules/AsesmenSumatifKoku.tsx
sed -i 's/\[filteredKelas, availableKelasIds\])/\[kelasList, availableKelasIds\])/g' components/modules/AsesmenSumatifKoku.tsx
sed -i 's/}, \[state.agmp_siswa, selectedKelasId\]);/}, \[siswaList, selectedKelasId\]);/g' components/modules/AsesmenSumatifKoku.tsx
sed -i 's/\[state.agmp_dimensi, targetDimensiIds\])/\[dimensiList, targetDimensiIds\])/g' components/modules/AsesmenSumatifKoku.tsx
sed -i 's/}, \[state.agmp_asesmen_sumatif_koku, selectedSiswaId, selectedKegiatanId, activeTaId\]);/}, \[sumatifList, selectedSiswaId, selectedKegiatanId, activeTaId\]);/g' components/modules/AsesmenSumatifKoku.tsx
sed -i 's/}, \[state.agmp_asesmen_formatif_koku, selectedSiswaId, selectedKegiatanId, activeTaId\]);/}, \[formatifList, selectedSiswaId, selectedKegiatanId, activeTaId\]);/g' components/modules/AsesmenSumatifKoku.tsx

# Fix AbsensiKokurikuler.tsx
sed -i 's/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect//g' components/modules/AbsensiKokurikuler.tsx

# Fix Konfigurasi.tsx
sed -i 's/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect//g' components/modules/Konfigurasi.tsx

# Fix RekapAbsensiKokurikuler.tsx
sed -i 's/const availableKelasIds = kegiatanDetails?.kelasIds || \[\];/const availableKelasIds = useMemo(() => kegiatanDetails?.kelasIds || \[\], \[kegiatanDetails\]);/g' components/modules/RekapAbsensiKokurikuler.tsx

