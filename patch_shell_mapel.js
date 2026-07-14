const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

// Add updateData to useStore
code = code.replace(
  /const \{ state, logout, isAdmin \} = useStore\(\);/,
  `const { state, updateData, logout, isAdmin } = useStore();`
);

// Find the section showing mapel
const target = `<p className="text-[10px] text-gray-500 truncate">
                {state.agmp_pengaturan.mapel || "Guru Mata Pelajaran"}
              </p>`;

const replacement = `{(state.agmp_pengaturan.mapels && state.agmp_pengaturan.mapels.length > 1) ? (
                <select 
                  className="text-[10px] text-gray-500 bg-transparent border-none p-0 cursor-pointer focus:ring-0 max-w-full"
                  value={state.agmp_pengaturan.mapel || ""}
                  onChange={(e) => updateData("agmp_pengaturan", { ...state.agmp_pengaturan, mapel: e.target.value })}
                >
                  {state.agmp_pengaturan.mapels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              ) : (
                <p className="text-[10px] text-gray-500 truncate">
                  {state.agmp_pengaturan.mapel || "Guru Mata Pelajaran"}
                </p>
              )}`;

code = code.replace(target, replacement);

fs.writeFileSync('components/Shell.tsx', code);
