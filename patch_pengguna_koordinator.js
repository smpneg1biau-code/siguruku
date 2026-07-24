const fs = require('fs');
let code = fs.readFileSync('components/modules/ManajemenPengguna.tsx', 'utf8');

code = code.replace(
  /isAuthorized: boolean;\n  createdAt: string;/,
  'isAuthorized: boolean;\n  isKoordinator?: boolean;\n  createdAt: string;'
);

const toggleKoordinator = `  const toggleKoordinator = async (userId: string, currentStatus: boolean) => {
    try {
      const userRef = doc(db, 'app_users', userId);
      await updateDoc(userRef, { isKoordinator: !currentStatus });
      showToast(\`Status Koordinator berhasil \${!currentStatus ? 'diberikan' : 'dicabut'}\`, "success");
    } catch (error) {
      console.error("Error updating koordinator status", error);
      showToast("Gagal mengubah status Koordinator", "error");
    }
  };

  const toggleAuth`;

code = code.replace(/  const toggleAuth/g, toggleKoordinator);

code = code.replace(
  /<th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status Akses<\/th>/,
  '<th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Status Akses</th>\n                <th className="px-6 py-4 font-semibold border-b border-gray-100 text-center">Koordinator</th>'
);

const koordinatorCol = `                  <td className="px-6 py-4 text-center">
                    {u.email !== 'smpneg1biau@gmail.com' && (
                      <button
                        onClick={() => toggleKoordinator(u.id, !!u.isKoordinator)}
                        className={\`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors \${
                          u.isKoordinator 
                            ? 'bg-purple-50 text-purple-600 hover:bg-purple-100' 
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }\`}
                      >
                        {u.isKoordinator ? 'Koordinator' : 'Bukan'}
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {u.email !== 'smpneg1biau@gmail.com' && (`;

code = code.replace(/                  <td className="px-6 py-4 text-center">\n                    \{u.email !== 'smpneg1biau@gmail.com' && \(/, koordinatorCol);

code = code.replace(/colSpan=\{5\}/, 'colSpan={6}');

fs.writeFileSync('components/modules/ManajemenPengguna.tsx', code);
