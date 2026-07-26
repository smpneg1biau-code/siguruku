import { useStore } from "@/lib/store";

export default function AsesmenFormatifKoku() {
  const { state } = useStore();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Asesmen Formatif (Kokurikuler)</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola penilaian formatif untuk kegiatan kokurikuler.</p>
        </div>
      </header>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <h3 className="text-lg font-medium text-gray-700">Modul Asesmen Formatif</h3>
        <p className="text-gray-500 mt-2">Fitur asesmen formatif kokurikuler sedang dalam pengembangan.</p>
      </div>
    </div>
  );
}
