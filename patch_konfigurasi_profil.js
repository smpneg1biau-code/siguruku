const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

// Update activeTab useState type
code = code.replace(
  /useState<"ta" \| "kelas" \| "siswa" \| "tp" \| "kktp" \| "db">/,
  `useState<"profil" | "ta" | "kelas" | "siswa" | "tp" | "kktp" | "db">`
);

// Update initial state to "profil" instead of "ta" so they see it first, or just keep "ta"
// Let's just keep "ta".

// Update tabs array
code = code.replace(
  /\[\{id:"ta", label:"Tahun Ajaran"\}, \{id:"kelas", label:"Kelas"\}, \{id:"siswa", label: "Siswa"\}, \{id:"tp", label:"TP"\}, \{id:"kktp", label:"KKTP"\}\]/,
  `[{id:"profil", label:"Profil Guru"}, {id:"ta", label:"Tahun Ajaran"}, {id:"kelas", label:"Kelas"}, {id:"siswa", label: "Siswa"}, {id:"tp", label:"TP"}, {id:"kktp", label:"KKTP"}]`
);

// Update activeTab conditions
code = code.replace(
  /\{activeTab === "ta" && <ManajemenTA \/>\}/,
  `{activeTab === "profil" && <ManajemenProfil />}\n        {activeTab === "ta" && <ManajemenTA />}`
);

// We need to append the ManajemenProfil component at the end of the file.
// Or just inject it after the return statement of Konfigurasi
const profilComponent = `
import { DAFTAR_MATA_PELAJARAN } from "@/lib/constants";

function ManajemenProfil() {
  const { state, updateData, showToast } = useStore();
  const [formData, setFormData] = useState({
    guruNama: state.agmp_pengaturan?.guruNama || "",
    sekolah: state.agmp_pengaturan?.sekolah || "",
    mapels: state.agmp_pengaturan?.mapels || [],
  });

  const handleToggleMapel = (m: string) => {
    setFormData(prev => ({
      ...prev,
      mapels: prev.mapels.includes(m) ? prev.mapels.filter(x => x !== m) : [...prev.mapels, m]
    }));
  };

  const handleSave = async () => {
    try {
      const activeMapel = formData.mapels.length > 0 ? formData.mapels[0] : "";
      await updateData("agmp_pengaturan", {
        ...state.agmp_pengaturan,
        guruNama: formData.guruNama,
        sekolah: formData.sekolah,
        mapels: formData.mapels,
        mapel: state.agmp_pengaturan?.mapel && formData.mapels.includes(state.agmp_pengaturan.mapel) 
                ? state.agmp_pengaturan.mapel 
                : activeMapel,
      });
      showToast("Profil berhasil disimpan", "success");
    } catch (e) {
      showToast("Gagal menyimpan profil", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-bold">Profil Guru</h3>
        <p className="text-sm text-gray-500">Atur nama, sekolah, dan mata pelajaran yang Anda ampu.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Guru</label>
          <input 
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            value={formData.guruNama}
            onChange={e => setFormData({...formData, guruNama: e.target.value})}
            placeholder="Contoh: Budi Santoso, S.Pd"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Sekolah</label>
          <input 
            type="text"
            className="w-full px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF]/20"
            value={formData.sekolah}
            onChange={e => setFormData({...formData, sekolah: e.target.value})}
            placeholder="Contoh: SMP Negeri 1 Biau"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Mata Pelajaran yang Diampu</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {DAFTAR_MATA_PELAJARAN.map(m => (
              <label key={m} className="flex items-center gap-2 p-2 border rounded-xl hover:bg-gray-50 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.mapels.includes(m)}
                  onChange={() => handleToggleMapel(m)}
                  className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                />
                <span className="text-sm text-gray-700">{m}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4">
          <button 
            onClick={handleSave}
            className="bg-[#007AFF] hover:bg-blue-600 text-white px-6 py-2 rounded-xl font-semibold text-sm transition-colors"
          >
            Simpan Profil
          </button>
        </div>
      </div>
    </div>
  );
}
`;

code = code.replace(
  /export default function Konfigurasi\(\) \{/,
  `import { DAFTAR_MATA_PELAJARAN } from "@/lib/constants";\n\nexport default function Konfigurasi() {`
);

code += '\n' + profilComponent;

fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
