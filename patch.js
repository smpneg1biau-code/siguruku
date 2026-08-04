const fs = require('fs');
let content = fs.readFileSync('components/modules/AsesmenFormatifKoku.tsx', 'utf8');

// 1. Add selectedTanggal state
content = content.replace(
  '  const [selectedSiswaId, setSelectedSiswaId] = useState("");',
  '  const [selectedSiswaId, setSelectedSiswaId] = useState("");\n  const [selectedTanggal, setSelectedTanggal] = useState(new Date().toISOString().split(\'T\')[0]);'
);

// 2. Modify resetForm
content = content.replace(
  'setFormTanggal(new Date().toISOString().split(\'T\')[0]);',
  'setFormTanggal(selectedTanggal);'
);

// 3. Modify Step 2 rendering
const step2Target = `          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Daftar Murid</h3>
              <p className="text-sm text-gray-500">Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama || \'-\'}</p>
            </div>
            <button onClick={() => setStep(1)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg flex items-center gap-1 text-sm font-medium">
              <ArrowLeft size={16} /> Kembali
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

const step2Replacement = `          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Daftar Murid</h3>
              <p className="text-sm text-gray-500">Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama || \'-\'}</p>
            </div>
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Tanggal Pertemuan:</label>
                <input 
                  type="date" 
                  value={selectedTanggal} 
                  onChange={(e) => setSelectedTanggal(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 flex-1 md:flex-none"
                />
              </div>
              <button onClick={() => setStep(1)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-lg flex justify-center items-center gap-1 text-sm font-medium whitespace-nowrap border md:border-none">
                <ArrowLeft size={16} /> Kembali
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">`;

content = content.replace(step2Target, step2Replacement);

// 4. Modify student iteration in Step 2
const studentTarget = `            {filteredSiswa.map(siswa => {
              const recordCount = formatifList.filter(f => 
                f.siswaId === siswa.id && 
                f.kegiatanId === selectedKegiatanId &&
                (activeTaId ? (f.taId === activeTaId || !f.taId) : true)
              ).length;
              
              return (
                <div 
                  key={siswa.id} 
                  onClick={() => handleSelectSiswa(siswa.id)}
                  className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group bg-gray-50 hover:bg-blue-50/30"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{siswa.nama}</h4>
                    <p className="text-xs text-gray-500">NISN: {siswa.nisn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {recordCount > 0 ? (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> {recordCount} Observasi
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                        Belum ada
                      </span>
                    )}
                  </div>
                </div>
              );
            })}`;

const studentReplacement = `            {filteredSiswa.map(siswa => {
              const studentRecords = formatifList.filter(f => 
                f.siswaId === siswa.id && 
                f.kegiatanId === selectedKegiatanId &&
                (activeTaId ? (f.taId === activeTaId || !f.taId) : true)
              );
              const recordCount = studentRecords.length;
              const hasRecordToday = studentRecords.some(f => f.tanggal === selectedTanggal);
              
              return (
                <div 
                  key={siswa.id} 
                  onClick={() => handleSelectSiswa(siswa.id)}
                  className="flex items-center justify-between p-4 border rounded-xl cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group bg-gray-50 hover:bg-blue-50/30"
                >
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-blue-700">{siswa.nama}</h4>
                    <p className="text-xs text-gray-500">NISN: {siswa.nisn}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasRecordToday ? (
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle size={10} /> Selesai
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full flex items-center gap-1">
                        <Clock size={10} /> Belum
                      </span>
                    )}
                    {recordCount > 0 && (
                      <span className="text-[10px] text-gray-500 font-medium">Total: {recordCount} Obs</span>
                    )}
                  </div>
                </div>
              );
            })}`;

content = content.replace(studentTarget, studentReplacement);

fs.writeFileSync('components/modules/AsesmenFormatifKoku.tsx', content);
console.log('Patched AsesmenFormatifKoku.tsx');
