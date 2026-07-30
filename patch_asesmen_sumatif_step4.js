const fs = require('fs');
let content = fs.readFileSync('components/modules/AsesmenSumatifKoku.tsx', 'utf-8');

// Add the button to Step 2
content = content.replace(
  '<ArrowLeft size={16} /> Kembali\n            </button>',
  `<ArrowLeft size={16} /> Kembali\n            </button>\n            <button onClick={() => setStep(4)} className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors">\n              <Printer size={16} /> Rekap Rapor Kelas\n            </button>`
);

// Add Step 4
const step4Block = `
      {step === 4 && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-blue-500" /> Rekapitulasi Rapor Kokurikuler
              </h3>
              <p className="text-sm text-gray-500 mt-1">Kelas: {validKelas.find(k => k.id === selectedKelasId)?.nama || '-'} | Kegiatan: {kegiatanDetails?.nama}</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="text-gray-500 hover:bg-gray-100 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors">
                <ArrowLeft size={16} /> Kembali
              </button>
              <button onClick={() => window.print()} className="bg-gray-900 text-white hover:bg-gray-800 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-colors shadow-sm">
                <Printer size={16} /> Cetak Rekap
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 w-10 text-center border-r border-gray-200">No</th>
                  <th className="px-4 py-3 min-w-[150px] border-r border-gray-200">Nama Murid</th>
                  <th className="px-4 py-3 min-w-[200px] border-r border-gray-200">Capaian Dimensi (Predikat)</th>
                  <th className="px-4 py-3 min-w-[250px]">Deskripsi Rapor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSiswa.map((siswa, idx) => {
                  const s = sumatifList.find(sum => 
                    sum.siswaId === siswa.id && 
                    sum.kegiatanId === selectedKegiatanId &&
                    (activeTaId ? (sum.taId === activeTaId || !sum.taId) : true)
                  );
                  return (
                    <tr key={siswa.id} className="hover:bg-blue-50/30">
                      <td className="px-4 py-3 text-center border-r border-gray-100 text-gray-500">{idx + 1}</td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        <div className="font-bold text-gray-900">{siswa.nama}</div>
                        <div className="text-xs text-gray-500">NISN: {siswa.nisn}</div>
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100">
                        {s ? (
                          <div className="space-y-1.5 flex flex-col items-start">
                            {s.nilaiDimensi.map(nd => {
                              const dimName = dimensiList.find(d => d.id === nd.dimensiId)?.nama || 'Dimensi';
                              let colorClass = 'bg-gray-100 text-gray-700';
                              if(nd.predikat === 'SB') colorClass = 'bg-green-100 text-green-700 border border-green-200';
                              if(nd.predikat === 'B') colorClass = 'bg-blue-100 text-blue-700 border border-blue-200';
                              if(nd.predikat === 'C') colorClass = 'bg-amber-100 text-amber-700 border border-amber-200';
                              if(nd.predikat === 'K') colorClass = 'bg-red-100 text-red-700 border border-red-200';
                              
                              return (
                                <span key={nd.dimensiId} className={\`inline-flex text-[10px] font-bold px-2 py-0.5 rounded \${colorClass}\`}>
                                  {nd.predikat} - {dimName}
                                </span>
                              )
                            })}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Belum dinilai</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s ? (
                          <p className="text-xs text-gray-700 leading-relaxed">{s.deskripsiRapor}</p>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredSiswa.length === 0 && (
              <div className="p-8 text-center text-gray-500">Tidak ada murid.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
`;

content = content.replace('    </div>\n  );\n}', step4Block);

fs.writeFileSync('components/modules/AsesmenSumatifKoku.tsx', content);
