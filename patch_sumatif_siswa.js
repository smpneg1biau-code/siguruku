const fs = require('fs');
let content = fs.readFileSync('components/modules/Sumatif.tsx', 'utf8');

// Replace the wizard useEffect
const oldUseEffect = `  // Sync local records when entering wizard mode
  useEffect(() => {
    if (mode === "wizard" && existingSumatif) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalRecords(JSON.parse(JSON.stringify(existingSumatif.records)));
    } else {
      setLocalRecords(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, existingSumatif?.id]);`;

const newUseEffect = `  // Sync local records when entering wizard mode
  useEffect(() => {
    if (mode === "wizard" && existingSumatif) {
      const recordsCopy = JSON.parse(JSON.stringify(existingSumatif.records));
      // Auto-fill missing students that might have been added later
      siswaList.forEach(s => {
        if (!recordsCopy[s.id]) {
          recordsCopy[s.id] = {
            level: 0,
            nilai: 0,
            catatan: "",
            status: "BELUM TUNTAS",
            tesTulisScores: {},
          };
        }
      });
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocalRecords(recordsCopy);
    } else {
      setLocalRecords(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, existingSumatif?.id, siswaList]);`;

content = content.replace(oldUseEffect, newUseEffect);

// Replace the render null check
const oldRenderCheck = `                  {siswaList.map((s) => {
                    const r = existingSumatif.records[s.id];
                    if (!r) return null;`;

const newRenderCheck = `                  {siswaList.map((s) => {
                    const r = existingSumatif.records[s.id] || {
                      level: 0,
                      nilai: 0,
                      catatan: "",
                      status: "BELUM TUNTAS",
                      tesTulisScores: {},
                    };`;

content = content.replace(oldRenderCheck, newRenderCheck);

fs.writeFileSync('components/modules/Sumatif.tsx', content);
console.log('Patched Sumatif.tsx successfully');
