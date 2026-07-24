const fs = require('fs');
let code = fs.readFileSync('components/modules/ManajemenPengguna.tsx', 'utf8');

// Add mapelId to AppUser type
code = code.replace(
  /isAuthorized: boolean;\n  createdAt: string;\n}/,
  `isAuthorized: boolean;\n  createdAt: string;\n  mapelId?: string;\n}`
);

// Destructure state
code = code.replace(
  /const { showToast } = useStore\(\);/,
  `const { showToast, state } = useStore();\n  const mapels = state.agmp_mapel || [];`
);

// Add assignMapel function
code = code.replace(
  /const toggleAuth = async/g,
  `const assignMapel = async (userId: string, mapelId: string) => {
    try {
      const userRef = doc(db, 'app_users', userId);
      await updateDoc(userRef, { mapelId });
      showToast("Mata pelajaran berhasil diatur", "success");
    } catch (error) {
      console.error("Error updating user mapel", error);
      showToast("Gagal mengatur mata pelajaran", "error");
    }
  };

  const toggleAuth = async`
);

// Add table headers
code = code.replace(
  /<th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status Akses<\/th>/,
  `<th className="px-6 py-4 font-semibold border-b border-gray-100">Mata Pelajaran</th>\n                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status Akses</th>`
);

// Add Mapel column logic
code = code.replace(
  /<td className="px-6 py-4 text-center">\n\s*\{u\.email === 'smpneg1biau@gmail\.com' \? \(/s,
  `<td className="px-6 py-4">
                    <select
                      className="px-3 py-1.5 border rounded-lg text-sm bg-gray-50 focus:bg-white min-w-[150px]"
                      value={u.mapelId || ""}
                      onChange={(e) => assignMapel(u.id, e.target.value)}
                    >
                      <option value="">-- Pilih Mapel --</option>
                      {mapels.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.kode} - {m.nama}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.email === 'smpneg1biau@gmail.com' ? (`
);

// update colspan for no users
code = code.replace(
  /<td colSpan=\{4\} className="px-6 py-8 text-center text-gray-500 italic">/,
  `<td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">`
);

fs.writeFileSync('components/modules/ManajemenPengguna.tsx', code);
