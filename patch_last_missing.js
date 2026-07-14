const fs = require('fs');

function fixJurnal() {
  let code = fs.readFileSync('components/modules/Jurnal.tsx', 'utf8');
  code = code.replace(/state\.agmp_tp\[0\]\?/g, '(state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel))[0]?');
  code = code.replace(/state\.agmp_tp\.find/g, 'state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel).find');
  fs.writeFileSync('components/modules/Jurnal.tsx', code);
}
fixJurnal();

function fixFormatif() {
  let code = fs.readFileSync('components/modules/Formatif.tsx', 'utf8');
  code = code.replace(/const tpList = state\.agmp_tp\.filter/g, 'const tpList = state.agmp_tp.filter(tp => !tp.mapel || tp.mapel === currentMapel).filter');
  fs.writeFileSync('components/modules/Formatif.tsx', code);
}
fixFormatif();

function fixKonfig() {
  let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');
  // the useMemo in ManajemenKKTP
  code = code.replace(/state\.agmp_tp\.filter\(\(t\)/g, 'state.agmp_tp.filter(t => !t.mapel || t.mapel === currentMapel).filter((t)');
  code = code.replace(/state\.agmp_tp\.find\(\(t\)/g, 'state.agmp_tp.filter(t => !t.mapel || t.mapel === currentMapel).find((t)');
  fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
}
fixKonfig();

