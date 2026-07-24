const fs = require('fs');

// 1. Update lib/types.ts
let types = fs.readFileSync('lib/types.ts', 'utf8');
types = types.replace(
  /guruId: string;/,
  'guruIds: string[];'
);
fs.writeFileSync('lib/types.ts', types);

// 2. Update components/modules/Fasilitator.tsx
let fasilitator = fs.readFileSync('components/modules/Fasilitator.tsx', 'utf8');
fasilitator = fasilitator.replace(
  /const \[guruId, setGuruId\] = useState\(""\);/,
  'const [guruIds, setGuruIds] = useState<string[]>([]);'
);

fasilitator = fasilitator.replace(
  /!modulId \|\| !kelasId \|\| !guruId/g,
  '!modulId || !kelasId || guruIds.length === 0'
);

fasilitator = fasilitator.replace(
  /\{ modulId, kelasId, guruId \}/,
  '{ modulId, kelasId, guruIds }'
);

fasilitator = fasilitator.replace(
  /guruId\n      \}\);/,
  'guruIds\n      });'
);

fasilitator = fasilitator.replace(
  /setGuruId\(""\);/,
  'setGuruIds([]);'
);

fasilitator = fasilitator.replace(
  /setGuruId\(item\.guruId\);/,
  'setGuruIds(item.guruIds || []);'
);

// We need to change the single select to a multi-select or multiple checkboxes for guru
const selectGuruOld = `<select
                value={guruId}
                onChange={(e) => setGuruId(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-gray-50"
              >
                <option value="">-- Pilih Guru --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>`;

const selectGuruNew = `<div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-xl bg-gray-50 text-sm">
                {users.length === 0 && <span className="text-gray-400 italic">Belum ada pengguna.</span>}
                {users.map((u: any) => (
                  <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={guruIds.includes(u.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setGuruIds([...guruIds, u.id]);
                        } else {
                          setGuruIds(guruIds.filter(id => id !== u.id));
                        }
                      }}
                      className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                    />
                    <span>{u.name} <span className="text-gray-500 text-xs">({u.email})</span></span>
                  </label>
                ))}
              </div>`;

fasilitator = fasilitator.replace(selectGuruOld, selectGuruNew);

const renderGuruOld = `const gr = users.find((u: any) => u.id === item.guruId);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {gr ? gr.name : "Guru Tidak Ditemukan"}
                    </td>`;

const renderGuruNew = `const gurus = (item.guruIds || []).map((id: string) => users.find((u: any) => u.id === id)).filter(Boolean);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {gurus.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {gurus.map((g: any) => (
                            <span key={g.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
                              {g.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-red-500 text-xs">Guru Tidak Ditemukan</span>
                      )}
                    </td>`;

fasilitator = fasilitator.replace(renderGuruOld, renderGuruNew);

fs.writeFileSync('components/modules/Fasilitator.tsx', fasilitator);

