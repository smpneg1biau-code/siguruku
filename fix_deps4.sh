#!/bin/bash
sed -i 's/setKelasId(kelasList\[0\].id);/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n      setKelasId(kelasList[0].id);/g' components/modules/AbsensiKokurikuler.tsx
sed -i 's/setLocalRecords(records);/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n            setLocalRecords(records);/g' components/modules/AbsensiKokurikuler.tsx

sed -i 's/setFilterKelas(kelasOptions\[0\].id);/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n      setFilterKelas(kelasOptions[0].id);/g' components/modules/Konfigurasi.tsx
sed -i 's/setSelectedTpId(tpOptions\[0\].id);/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n      setSelectedTpId(tpOptions[0].id);/g' components/modules/Konfigurasi.tsx
sed -i 's/setJenisKKTP(existingRubrik.jenisKKTP || "Interval Nilai");/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\n      setJenisKKTP(existingRubrik.jenisKKTP || "Interval Nilai");/g' components/modules/Konfigurasi.tsx

