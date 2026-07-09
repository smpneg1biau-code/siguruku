const fs = require('fs');
let code = fs.readFileSync('components/modules/Sumatif.tsx', 'utf8');

const targetUI = `                                <select 
                                  className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#007AFF] transition-shadow text-sm"
                                  value={activeRecord.rubrikScores?.[aspek.id] ?? ""}
                                  onChange={(e) => handleRubrikVal(student.id, aspek.id, Number(e.target.value))}
                                >
                                  <option value="" disabled>Pilih Skala</option>
                                  {skalaOptions.map((skala, idx) => (
                                    <option key={idx} value={idx}>{skala}</option>
                                  ))}
                                </select>`;

const replaceUI = `                                <select 
                                  className="w-full p-2 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-[#007AFF] transition-shadow text-sm"
                                  value={activeRecord.rubrikScores?.[aspek.id] ?? ""}
                                  onChange={(e) => handleRubrikVal(student.id, aspek.id, Number(e.target.value))}
                                >
                                  <option value="" disabled>Pilih Skala</option>
                                  {skalaOptions.map((skala, idx) => {
                                    const desc = aspek.deskripsiSkala?.[idx] ? \` - \${aspek.deskripsiSkala[idx]}\` : "";
                                    const val = aspek.ekivalenSkala?.[idx] !== undefined ? \` (\${aspek.ekivalenSkala[idx]})\` : "";
                                    return (
                                      <option key={idx} value={idx}>
                                        {skala}{desc}{val}
                                      </option>
                                    );
                                  })}
                                </select>`;

if (code.includes(targetUI)) {
  code = code.replace(targetUI, replaceUI);
  fs.writeFileSync('components/modules/Sumatif.tsx', code);
  console.log('Patched Sumatif UI');
} else {
  console.log('Target not found in Sumatif.tsx');
}
