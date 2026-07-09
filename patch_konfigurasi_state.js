const fs = require('fs');
let code = fs.readFileSync('components/modules/Konfigurasi.tsx', 'utf8');

const effectTarget = `      setAspekPenilaian((existingRubrik.aspekPenilaian || []).map(a => ({
        ...a,
        skalaPenilaian: a.skalaPenilaian || existingRubrik.skalaPenilaian || ["Mulai Memahami", "Memahami", "Sangat Memahami"]
      })));`;

const effectReplacement = `      setAspekPenilaian((existingRubrik.aspekPenilaian || []).map(a => {
        const sk = a.skalaPenilaian || existingRubrik.skalaPenilaian || ["Mulai Memahami", "Memahami", "Sangat Memahami"];
        return {
          ...a,
          skalaPenilaian: sk,
          deskripsiSkala: a.deskripsiSkala || Array(sk.length).fill(""),
          ekivalenSkala: a.ekivalenSkala || Array(sk.length).fill(70)
        };
      }));`;

code = code.replace(effectTarget, effectReplacement);

const funcsTarget = `  const addAspek = () => setAspekPenilaian([...aspekPenilaian, { id: generateId(), nama: "Aspek Baru", skalaPenilaian: ["Mulai Memahami", "Memahami", "Sangat Memahami"] }]);
  const updateAspek = (index: number, val: string) => {
    const n = [...aspekPenilaian]; n[index].nama = val; setAspekPenilaian(n);
  };
  const addAspekSkala = (aspekIndex: number) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    n[aspekIndex].skalaPenilaian = [...sk, "Skala Baru"];
    setAspekPenilaian(n);
  };
  const updateAspekSkala = (aspekIndex: number, skalaIndex: number, val: string) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    const newSk = [...sk];
    newSk[skalaIndex] = val;
    n[aspekIndex].skalaPenilaian = newSk;
    setAspekPenilaian(n);
  };
  const removeAspekSkala = (aspekIndex: number, skalaIndex: number) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    n[aspekIndex].skalaPenilaian = sk.filter((_, i) => i !== skalaIndex);
    setAspekPenilaian(n);
  };`;

const funcsReplacement = `  const addAspek = () => setAspekPenilaian([...aspekPenilaian, { 
    id: generateId(), 
    nama: "Aspek Baru", 
    skalaPenilaian: ["Mulai Memahami", "Memahami", "Sangat Memahami"],
    deskripsiSkala: ["", "", ""],
    ekivalenSkala: [65, 75, 85]
  }]);
  const updateAspek = (index: number, val: string) => {
    const n = [...aspekPenilaian]; n[index].nama = val; setAspekPenilaian(n);
  };
  const addAspekSkala = (aspekIndex: number) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    const ds = n[aspekIndex].deskripsiSkala || Array(sk.length).fill("");
    const es = n[aspekIndex].ekivalenSkala || Array(sk.length).fill(0);
    n[aspekIndex].skalaPenilaian = [...sk, "Skala Baru"];
    n[aspekIndex].deskripsiSkala = [...ds, ""];
    n[aspekIndex].ekivalenSkala = [...es, 80];
    setAspekPenilaian(n);
  };
  const updateAspekSkala = (aspekIndex: number, skalaIndex: number, val: string) => {
    const n = [...aspekPenilaian];
    const sk = [...(n[aspekIndex].skalaPenilaian || [])];
    sk[skalaIndex] = val;
    n[aspekIndex].skalaPenilaian = sk;
    setAspekPenilaian(n);
  };
  const updateAspekDeskripsi = (aspekIndex: number, skalaIndex: number, val: string) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    const ds = [...(n[aspekIndex].deskripsiSkala || Array(sk.length).fill(""))];
    ds[skalaIndex] = val;
    n[aspekIndex].deskripsiSkala = ds;
    setAspekPenilaian(n);
  };
  const updateAspekEkivalen = (aspekIndex: number, skalaIndex: number, val: number) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    const es = [...(n[aspekIndex].ekivalenSkala || Array(sk.length).fill(0))];
    es[skalaIndex] = val;
    n[aspekIndex].ekivalenSkala = es;
    setAspekPenilaian(n);
  };
  const removeAspekSkala = (aspekIndex: number, skalaIndex: number) => {
    const n = [...aspekPenilaian];
    const sk = n[aspekIndex].skalaPenilaian || [];
    const ds = n[aspekIndex].deskripsiSkala || Array(sk.length).fill("");
    const es = n[aspekIndex].ekivalenSkala || Array(sk.length).fill(0);
    n[aspekIndex].skalaPenilaian = sk.filter((_, i) => i !== skalaIndex);
    n[aspekIndex].deskripsiSkala = ds.filter((_, i) => i !== skalaIndex);
    n[aspekIndex].ekivalenSkala = es.filter((_, i) => i !== skalaIndex);
    setAspekPenilaian(n);
  };`;

if (code.includes(funcsTarget)) {
  code = code.replace(funcsTarget, funcsReplacement);
  fs.writeFileSync('components/modules/Konfigurasi.tsx', code);
  console.log('Patched state functions');
} else {
  console.log('Target not found in Konfigurasi.tsx');
}
