import React from "react";
import { useStore } from "@/lib/store";
import { DatabaseBackup, UploadCloud, Trash2 } from "lucide-react";

export default function Database() {
  const { state, clearAllData, restoreAllData } = useStore();
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);

  const handleBackup = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute(
      "download",
      `agmp_backup_${new Date().toISOString()}.json`,
    );
    dlAnchorElem.click();
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      confirm("Restore akan menimpa semua data Anda saat ini di database Firebase. Lanjutkan?")
    ) {
      setIsRestoring(true);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const newData = JSON.parse(event.target?.result as string);
          await restoreAllData(newData);
          setIsRestoring(false);
          alert("Restore berhasil! Aplikasi akan disegarkan.");
          window.location.reload();
        } catch (err) {
          setIsRestoring(false);
          alert("Gagal memuat file backup. Format tidak valid atau error jaringan.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const handleReset = async () => {
    if (
      confirm(
        "PERINGATAN! Anda akan menghapus seluruh data pada aplikasi ini. Tindakan ini tidak dapat dibatalkan. Lanjutkan?"
      )
    ) {
      if (confirm("Apakah Anda benar-benar yakin ingin menghapus data di database Firebase? Semua akan hilang selamanya!")) {
        setIsDeleting(true);
        await clearAllData();
        setIsDeleting(false);
        alert("Semua data berhasil dihapus dari database. Aplikasi akan disegarkan.");
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database</h2>
          <p className="text-sm text-gray-500">
            Kelola data aplikasi Anda: Backup, Restore, atau Hapus Data.
          </p>
        </div>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 space-y-6">
        <div className="p-5 bg-blue-50 border border-blue-100 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
              <DatabaseBackup className="w-5 h-5" /> Backup Database
            </h3>
            <p className="text-sm text-blue-800 mt-1 max-w-2xl">
              Unduh seluruh data aplikasi ke dalam format JSON. Simpan file ini di tempat yang aman agar Anda tidak kehilangan data, atau jika Anda ingin memindahkannya ke perangkat lain.
            </p>
          </div>
          <button
            onClick={handleBackup}
            className="px-5 py-2.5 whitespace-nowrap bg-[#007AFF] text-white text-sm font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-sm"
          >
            Download Backup
          </button>
        </div>

        <div className="p-5 bg-orange-50 border border-orange-100 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h3 className="font-bold text-orange-900 text-lg flex items-center gap-2">
              <UploadCloud className="w-5 h-5" /> Restore Database
            </h3>
            <p className="text-sm text-orange-800 mt-1 max-w-2xl">
              Pulihkan data dari file backup JSON yang sebelumnya Anda unduh. <strong className="text-orange-900">Tindakan ini akan menimpa dan menghapus data Anda saat ini.</strong>
            </p>
          </div>
          <label className={`inline-block cursor-pointer px-5 py-2.5 whitespace-nowrap text-white text-sm font-bold rounded-xl transition-colors shadow-sm ${isRestoring ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}>
            {isRestoring ? "Merestore..." : "Unggah File Backup"}
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleRestore}
              disabled={isRestoring}
            />
          </label>
        </div>

        <div className="p-5 bg-red-50 border border-red-100 rounded-xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h3 className="font-bold text-red-900 text-lg flex items-center gap-2">
              <Trash2 className="w-5 h-5" /> Hapus Data
            </h3>
            <p className="text-sm text-red-800 mt-1 max-w-2xl">
              Reset aplikasi dengan menghapus seluruh data siswa, nilai, kelas, dan pengaturan. <strong className="text-red-900">Data yang terhapus tidak dapat dikembalikan</strong>. Lakukan backup terlebih dahulu jika ragu.
            </p>
          </div>
          <button
            onClick={handleReset}
            disabled={isDeleting}
            className={`px-5 py-2.5 whitespace-nowrap text-white text-sm font-bold rounded-xl transition-colors shadow-sm ${isDeleting ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isDeleting ? "Menghapus..." : "Hapus Semua Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
