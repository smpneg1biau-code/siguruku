const fs = require('fs');
let code = fs.readFileSync('components/Shell.tsx', 'utf8');

const oldCases = `      case "tema-bentuk":
        return <TemaBentuk />;
      case "daftar-modul":
        return <DaftarModul />;
      case "fasilitator":
        return <Fasilitator />;`;

const newCases = `      case "tema-bentuk":
        return <TemaBentuk />;
      case "daftar-modul":
        return <DaftarModul />;
      case "tema-kokurikuler":
        return <TemaKokurikuler />;
      case "kegiatan-kokurikuler":
        return <KegiatanKokurikuler />;
      case "asesmen-formatif-koku":
        return <AsesmenFormatifKoku />;
      case "asesmen-sumatif-koku":
        return <AsesmenSumatifKoku />;
      case "fasilitator":
        return <Fasilitator />;`;

if (code.includes(oldCases)) {
  code = code.replace(oldCases, newCases);
  fs.writeFileSync('components/Shell.tsx', code);
  console.log("Patched correctly");
} else {
  console.log("Not found");
}
