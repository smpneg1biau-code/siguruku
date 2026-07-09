const fs = require('fs');
let code = fs.readFileSync('components/modules/Remedial.tsx', 'utf8');

const targetUI = `                                      <option value="" disabled>Pilih Skala</option>
                                      {skalaOptions.map((skala, idx) => (
                                        <option key={idx} value={idx}>{skala}</option>
                                      ))}
                                    </select>`;

const replaceUI = `                                      <option value="" disabled>Pilih Skala</option>
                                      {skalaOptions.map((skala, idx) => {
                                        const desc = aspek.deskripsiSkala?.[idx] ? \` - \${aspek.deskripsiSkala[idx]}\` : "";
                                        const val = aspek.ekivalenSkala?.[idx] !== undefined ? \` (\${aspek.ekivalenSkala[idx]})\` : "";
                                        return (
                                          <option key={idx} value={idx}>{skala}{desc}{val}</option>
                                        );
                                      })}
                                    </select>`;

if (code.includes(targetUI)) {
  code = code.replace(targetUI, replaceUI);
  fs.writeFileSync('components/modules/Remedial.tsx', code);
  console.log('Patched Remedial UI');
} else {
  console.log('Target not found in Remedial UI');
}
