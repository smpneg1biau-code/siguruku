const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

const uiTarget = `                          <div className="space-y-2">
                            {(aspek.skalaPenilaian || []).map((s, sIdx) => (
                              <div key={sIdx} className="flex gap-2 items-center">
                                <span className="text-xs w-5 text-gray-400">{sIdx+1}.</span>
                                <input
                                  type="text"
                                  value={s}
                                  onChange={(e) => updateAspekSkala(idx, sIdx, e.target.value)}
                                  className="flex-1 px-3 py-1.5 border rounded text-xs"
                                  required
                                />
                                <button type="button" onClick={() => removeAspekSkala(idx, sIdx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>`;

const uiReplacement = `                          <div className="space-y-3">
                            {(aspek.skalaPenilaian || []).map((s, sIdx) => (
                              <div key={sIdx} className="flex flex-col gap-2 p-2 border rounded bg-gray-50/30">
                                <div className="flex gap-2 items-center">
                                  <span className="text-xs font-bold text-gray-500 w-5">{sIdx+1}.</span>
                                  <input
                                    type="text"
                                    value={s}
                                    onChange={(e) => updateAspekSkala(idx, sIdx, e.target.value)}
                                    className="flex-1 px-3 py-1.5 border rounded text-xs font-medium"
                                    placeholder="Nama Skala (misal: Layak)"
                                    required
                                  />
                                  <button type="button" onClick={() => removeAspekSkala(idx, sIdx)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 pl-7">
                                  <input
                                    type="text"
                                    value={aspek.deskripsiSkala?.[sIdx] || ""}
                                    onChange={(e) => updateAspekDeskripsi(idx, sIdx, e.target.value)}
                                    className="flex-[2] px-3 py-1.5 border rounded text-xs"
                                    placeholder="Deskripsi Capaian"
                                  />
                                  <div className="flex items-center gap-1 flex-1">
                                    <span className="text-xs text-gray-500">Nilai Ekivalen:</span>
                                    <input
                                      type="number"
                                      value={aspek.ekivalenSkala?.[sIdx] || 0}
                                      onChange={(e) => updateAspekEkivalen(idx, sIdx, Number(e.target.value))}
                                      className="w-16 px-2 py-1.5 border rounded text-xs"
                                      placeholder="0-100"
                                      min="0" max="100"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>`;

if (code.includes(uiTarget)) {
  code = code.replace(uiTarget, uiReplacement);
  fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
  console.log('Patched UI');
} else {
  console.log('Target not found in Konfigurasi.tsx UI');
}
