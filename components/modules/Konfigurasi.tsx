import React, { useState, useEffect, useMemo } from "react";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { Plus, Trash2, Edit } from "lucide-react";

export default function Konfigurasi() {
  const [activeTab, setActiveTab] = useState<"ta" | "kelas" | "siswa" | "tp" | "kktp" | "db">(
    "ta",
  );

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Konfigurasi Data</h2>
        <p className="text-sm text-gray-500 mt-1">
          Kelola data master referensi PPA 2025.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
        {[{id:"ta", label:"Tahun Ajaran"}, {id:"kelas", label:"Kelas"}, {id:"siswa", label: "Siswa"}, {id:"tp", label:"TP"}, {id:"kktp", label:"KKTP"}, {id:"db", label:"Database"}].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? "bg-[#007AFF] text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6">
        {activeTab === "ta" && <ManajemenTA />}
        {activeTab === "kelas" && <ManajemenKelas />}
        {activeTab === "siswa" && <ManajemenSiswa />}
        {activeTab === "tp" && <ManajemenTP />}
        {activeTab === "kktp" && <ManajemenKKTP />}
        {activeTab === "db" && <ManajemenDB />}
      </div>
    </div>
  );
}

function ManajemenTA() {
  const { state, addItem, updateItem, deleteItem, updateData } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    semester: "Ganjil" as "Ganjil" | "Genap",
    isActive: false,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = generateId();
    if (formData.isActive) {
      const updatedTA = (state.agmp_tahun_ajaran || []).map(ta => ({ ...ta, isActive: false }));
      updateData("agmp_tahun_ajaran", [...updatedTA, { id: newId, ...formData }]);
    } else {
      addItem("agmp_tahun_ajaran", { id: newId, ...formData });
    }
    setIsAdding(false);
    setFormData({ nama: "", semester: "Ganjil", isActive: false });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      if (formData.isActive) {
        const updatedTA = (state.agmp_tahun_ajaran || []).map(ta => 
          ta.id === editingId ? { ...ta, ...formData } : { ...ta, isActive: false }
        );
        updateData("agmp_tahun_ajaran", updatedTA);
      } else {
        updateItem("agmp_tahun_ajaran", editingId, formData);
      }
      setEditingId(null);
      setFormData({ nama: "", semester: "Ganjil", isActive: false });
    }
  };

  const handleEditClick = (ta: any) => {
    setEditingId(ta.id);
    setFormData({ nama: ta.nama, semester: ta.semester || "Ganjil", isActive: ta.isActive });
    setIsAdding(false);
  };

  const handleSetAktif = (ta: any) => {
    const updatedTA = (state.agmp_tahun_ajaran || []).map(item => 
      item.id === ta.id ? { ...item, isActive: true } : { ...item, isActive: false }
    );
    updateData("agmp_tahun_ajaran", updatedTA);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900">Daftar Tahun Ajaran</h3>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({ nama: "", semester: "Ganjil", isActive: false });
          }}
          className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {(isAdding || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleAdd}
          className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              required
              placeholder="Tahun Ajaran (e.g. 2026/2027)"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
            />
            <select
              required
              className="px-3 py-2 border rounded-lg text-sm bg-white"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value as "Ganjil" | "Genap" })}
            >
              <option value="Ganjil">Semester Ganjil</option>
              <option value="Genap">Semester Genap</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              />
              Jadikan Aktif
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-sm text-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-[#007AFF] text-white rounded-lg"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="divide-y border rounded-xl overflow-hidden">
        {state.agmp_tahun_ajaran?.map((ta) => (
          <div
            key={ta.id}
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 hover:bg-gray-50 gap-2"
          >
            <div>
              <p className="font-semibold text-sm flex items-center gap-2">
                {ta.nama} - Semester {ta.semester}
                {ta.isActive && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold">
                    AKTIF
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              {!ta.isActive && (
                <button
                  onClick={() => handleSetAktif(ta)}
                  className="px-3 py-1.5 text-xs border border-green-500 text-green-600 hover:bg-green-50 rounded-lg font-medium"
                >
                  Set Aktif
                </button>
              )}
              <button
                onClick={() => handleEditClick(ta)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteItem("agmp_tahun_ajaran", ta.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManajemenDB() {
  const { state } = useStore();

  const handleBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `agmp_backup_${new Date().toISOString()}.json`);
    dlAnchorElem.click();
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm("Restore akan menimpa semua data Anda saat ini. Lanjutkan?")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const newData = JSON.parse(event.target?.result as string);
          Object.keys(newData).forEach((key) => {
            localStorage.setItem(key, JSON.stringify(newData[key]));
          });
          alert("Restore berhasil! Aplikasi akan disegarkan.");
          window.location.reload();
        } catch (err) {
          alert("Gagal memuat file backup.");
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
        <h3 className="font-bold text-blue-900">Backup Database</h3>
        <p className="text-sm text-blue-800">Unduh seluruh data aplikasi ke dalam file JSON untuk mengamankan data Anda.</p>
        <button
          onClick={handleBackup}
          className="px-4 py-2 bg-[#007AFF] text-white text-sm font-bold rounded-lg hover:bg-blue-600 transition-colors"
        >
          Download Backup
        </button>
      </div>

      <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
        <h3 className="font-bold text-orange-900">Restore Database</h3>
        <p className="text-sm text-orange-800">Unggah file JSON backup yang sebelumnya Anda unduh. <strong className="text-orange-900">Tindakan ini akan menimpa data Anda saat ini.</strong></p>
        <label className="inline-block cursor-pointer px-4 py-2 bg-orange-600 text-white text-sm font-bold rounded-lg hover:bg-orange-700 transition-colors">
          Unggah File Backup
          <input
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleRestore}
          />
        </label>
      </div>
    </div>
  );
}

function ManajemenKelas() {
  const { state, addItem, updateItem, deleteItem } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    fase: "D",
    tahunAjaran: "2026/2027",
    waliKelas: "",
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addItem("agmp_kelas", { id: generateId(), ...formData });
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateItem("agmp_kelas", editingId, formData);
      setEditingId(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      nama: "",
      fase: "D",
      tahunAjaran: "2026/2027",
      waliKelas: "",
    });
  };

  const handleEditClick = (k: any) => {
    setEditingId(k.id);
    setFormData({
      nama: k.nama,
      fase: k.fase,
      tahunAjaran: k.tahunAjaran,
      waliKelas: k.waliKelas,
    });
    setIsAdding(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900">Daftar Kelas</h3>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            resetForm();
          }}
          className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" /> Tambah
        </button>
      </div>

      {(isAdding || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleAdd}
          className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100"
        >
          <div className="grid grid-cols-2 gap-3">
            <input
              required
              placeholder="Nama Kelas (e.g. 7A)"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
            />
            <select
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.fase}
              onChange={(e) =>
                setFormData({ ...formData, fase: e.target.value })
              }
            >
              <option value="A">Fase A</option>
              <option value="B">Fase B</option>
              <option value="C">Fase C</option>
              <option value="D">Fase D (SMP)</option>
              <option value="E">Fase E</option>
              <option value="F">Fase F</option>
            </select>
            <input
              required
              placeholder="Tahun Ajaran"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.tahunAjaran}
              onChange={(e) =>
                setFormData({ ...formData, tahunAjaran: e.target.value })
              }
            />
            <input
              placeholder="Wali Kelas"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.waliKelas}
              onChange={(e) =>
                setFormData({ ...formData, waliKelas: e.target.value })
              }
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-sm text-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-[#007AFF] text-white rounded-lg"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="divide-y border rounded-xl overflow-hidden">
        {state.agmp_kelas.map((k) => (
          <div
            key={k.id}
            className="flex justify-between items-center p-3 hover:bg-gray-50"
          >
            <div>
              <p className="font-semibold text-sm">
                {k.nama}{" "}
                <span className="text-xs text-gray-400 font-normal ml-2">
                  Fase {k.fase}
                </span>
              </p>
              <p className="text-xs text-gray-500">
                Wali: {k.waliKelas} • TA: {k.tahunAjaran}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditClick(k)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteItem("agmp_kelas", k.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManajemenSiswa() {
  const { state, addItem, updateItem, deleteItem, showToast } = useStore();
  const [filterKelas, setFilterKelas] = useState(state.agmp_kelas[0]?.id || "");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    nama: "",
    nisn: "",
    jk: "L" as "L" | "P",
    kelasId: filterKelas,
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addItem("agmp_siswa", { id: generateId(), ...formData });
    setIsAdding(false);
    resetForm();
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateItem("agmp_siswa", editingId, formData);
      setEditingId(null);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({ nama: "", nisn: "", jk: "L", kelasId: filterKelas });
  };

  const handleEditClick = (s: any) => {
    setEditingId(s.id);
    setFormData({
      nama: s.nama,
      nisn: s.nisn,
      jk: s.jk,
      kelasId: s.kelasId,
    });
    setIsAdding(false);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !filterKelas) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n");
      // Skip header, assuming: NISN, Nama, JK (L/P)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const [nisn, nama, jkInput] = line.split(",");
        if (nama && nisn) {
          const jk = jkInput?.trim().toUpperCase() === "P" ? "P" : "L";
          addItem("agmp_siswa", {
            id: generateId(),
            nisn: nisn.trim(),
            nama: nama.trim(),
            jk: jk as "L" | "P",
            kelasId: filterKelas,
          }, true);
        }
      }
      showToast("Impor siswa berhasil!", "success");
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const filteredSiswa = state.agmp_siswa.filter(
    (s) => s.kelasId === filterKelas,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <select
          className="px-3 py-2 border rounded-lg text-sm bg-gray-50 max-w-xs w-full"
          value={filterKelas}
          onChange={(e) => {
            setFilterKelas(e.target.value);
            setFormData({ ...formData, kelasId: e.target.value });
          }}
        >
          {state.agmp_kelas.map((k) => (
            <option key={k.id} value={k.id}>
              Kelas {k.nama}
            </option>
          ))}
        </select>
        <div className="flex gap-2 w-full sm:w-auto">
          <label className="flex items-center justify-center cursor-pointer gap-1 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 whitespace-nowrap">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportCSV}
            />
          </label>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
              resetForm();
            }}
            className="flex items-center justify-center w-full sm:w-auto gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Tambah Siswa
          </button>
        </div>
      </div>

      {(isAdding || editingId) && (
        <form
          onSubmit={editingId ? handleUpdate : handleAdd}
          className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              required
              placeholder="NISN"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.nisn}
              onChange={(e) =>
                setFormData({ ...formData, nisn: e.target.value })
              }
            />
            <input
              required
              placeholder="Nama Lengkap"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.nama}
              onChange={(e) =>
                setFormData({ ...formData, nama: e.target.value })
              }
            />
            <select
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.jk}
              onChange={(e) =>
                setFormData({ ...formData, jk: e.target.value as "L" | "P" })
              }
            >
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingId(null);
              }}
              className="px-3 py-1.5 text-sm text-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-[#007AFF] text-white rounded-lg"
            >
              Simpan
            </button>
          </div>
        </form>
      )}

      <div className="divide-y border rounded-xl overflow-hidden">
        {filteredSiswa.map((s, idx) => (
          <div
            key={s.id}
            className="flex justify-between items-center p-3 hover:bg-gray-50"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-4">{idx + 1}</span>
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex flex-shrink-0 items-center justify-center text-xs font-bold">
                {s.nama.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{s.nama}</p>
                <p className="text-xs text-gray-500">
                  {s.nisn} • {s.jk === "L" ? "Laki-laki" : "Perempuan"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleEditClick(s)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteItem("agmp_siswa", s.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {filteredSiswa.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Belum ada data siswa
          </div>
        )}
      </div>
    </div>
  );
}

function ManajemenTP() {
  const { state, addItem, deleteItem } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    kode: "",
    deskripsi: "",
    fase: "D",
    semester: "1",
    kelasIds: [] as string[],
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    addItem("agmp_tp", { id: generateId(), ...formData });
    setIsAdding(false);
    setFormData({
      kode: "",
      deskripsi: "",
      fase: "D",
      semester: "1",
      kelasIds: [],
    });
  };

  const toggleKelas = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      kelasIds: prev.kelasIds.includes(id)
        ? prev.kelasIds.filter((k) => k !== id)
        : [...prev.kelasIds, id],
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-900">Daftar Tujuan Pembelajaran</h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
        >
          <Plus className="w-4 h-4" /> Tambah TP
        </button>
      </div>

      {isAdding && (
        <form
          onSubmit={handleAdd}
          className="bg-gray-50 p-4 rounded-xl space-y-3 border border-gray-100"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <input
              required
              placeholder="Kode (e.g. 3.1)"
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.kode}
              onChange={(e) =>
                setFormData({ ...formData, kode: e.target.value })
              }
            />
            <select
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.fase}
              onChange={(e) =>
                setFormData({ ...formData, fase: e.target.value })
              }
            >
              <option value="A">Fase A</option>
              <option value="B">Fase B</option>
              <option value="C">Fase C</option>
              <option value="D">Fase D (SMP)</option>
              <option value="E">Fase E</option>
              <option value="F">Fase F</option>
            </select>
            <select
              className="px-3 py-2 border rounded-lg text-sm"
              value={formData.semester}
              onChange={(e) =>
                setFormData({ ...formData, semester: e.target.value })
              }
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>
          <textarea
            required
            placeholder="Deskripsi TP"
            rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm"
            value={formData.deskripsi}
            onChange={(e) =>
              setFormData({ ...formData, deskripsi: e.target.value })
            }
          />

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-700 block">
              Terapkan ke Kelas:
            </label>
            <div className="flex flex-wrap gap-2">
              {state.agmp_kelas
                .filter((k) => k.fase === formData.fase)
                .map((k) => (
                  <button
                    type="button"
                    key={k.id}
                    onClick={() => toggleKelas(k.id)}
                    className={`px-2 py-1 text-xs border rounded transition-colors ${formData.kelasIds.includes(k.id) ? "bg-blue-100 border-blue-300 text-blue-700" : "bg-white"}`}
                  >
                    {k.nama}
                  </button>
                ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-sm text-gray-500"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-[#007AFF] text-white rounded-lg"
            >
              Simpan TP
            </button>
          </div>
        </form>
      )}

      <div className="divide-y border rounded-xl overflow-hidden">
        {state.agmp_tp.map((tp) => (
          <div key={tp.id} className="p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded">
                    TP {tp.kode}
                  </span>
                  <span className="text-xs text-gray-500">
                    Fase {tp.fase} • Semester {tp.semester}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {tp.deskripsi}
                </p>
              </div>
              <button
                onClick={() => deleteItem("agmp_tp", tp.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-1 flex-wrap">
              {tp.kelasIds.map((kid) => {
                const k = state.agmp_kelas.find((c) => c.id === kid);
                return k ? (
                  <span
                    key={kid}
                    className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600"
                  >
                    {k.nama}
                  </span>
                ) : null;
              })}
            </div>
          </div>
        ))}
        {state.agmp_tp.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            Belum ada data TP
          </div>
        )}
      </div>
    </div>
  );
}

function ManajemenKKTP() {
  const { state, addItem, updateItem, updateData } = useStore();
  const [selectedKelasId, setSelectedKelasId] = useState<string>(
    state.agmp_kelas[0]?.id || "",
  );
  
  const tpOptions = useMemo(() => 
    state.agmp_tp.filter((t) => t.kelasIds.includes(selectedKelasId)),
    [state.agmp_tp, selectedKelasId]
  );

  const [selectedTpId, setSelectedTpId] = useState<string>(
    tpOptions[0]?.id || "",
  );

  const tp = state.agmp_tp.find((t) => t.id === selectedTpId);
  const existingRubrik = state.agmp_rubrik.find((r) => r.tpId === selectedTpId);

  const [intervalData, setIntervalData] = useState({
    batasBawahSelektif:
      state.agmp_pengaturan.intervalKKTP?.batasBawahSelektif || 61,
    batasBawahTuntas:
      state.agmp_pengaturan.intervalKKTP?.batasBawahTuntas || 75,
    batasAtasLanjut: state.agmp_pengaturan.intervalKKTP?.batasAtasLanjut || 85,
  });

  const [formData, setFormData] = useState({
    level1: "", // Baru Berkembang
    level2: "", // Layak
    level3: "", // Cakap
    level4: "", // Mahir
  });

  useEffect(() => {
    // When class changes, reset the selected TP to the first available for that class
    if (tpOptions.length > 0 && !tpOptions.find((t) => t.id === selectedTpId)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTpId(tpOptions[0].id);
    } else if (tpOptions.length === 0 && selectedTpId !== "") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedTpId("");
    }
  }, [tpOptions, selectedTpId]);

  // Sync state when TP changes
  useEffect(() => {
    if (existingRubrik) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        level1: existingRubrik.level1 || "",
        level2: existingRubrik.level2 || "",
        level3: existingRubrik.level3 || "",
        level4: existingRubrik.level4 || "",
      });
    } else {
      setFormData({ level1: "", level2: "", level3: "", level4: "" });
    }
  }, [existingRubrik]);

  const handleTpChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTpId = e.target.value;
    setSelectedTpId(newTpId);
    const rubrik = state.agmp_rubrik.find((r) => r.tpId === newTpId);
    if (rubrik) {
      setFormData({
        level1: rubrik.level1,
        level2: rubrik.level2,
        level3: rubrik.level3,
        level4: rubrik.level4,
      });
    } else {
      setFormData({ level1: "", level2: "", level3: "", level4: "" });
    }
  };

  const handleSaveInterval = (e: React.FormEvent) => {
    e.preventDefault();
    updateData("agmp_pengaturan", {
      ...state.agmp_pengaturan,
      intervalKKTP: intervalData,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTpId) return;

    if (existingRubrik) {
      updateItem("agmp_rubrik", existingRubrik.id, { ...formData });
    } else {
      addItem("agmp_rubrik", {
        id: generateId(),
        tpId: selectedTpId,
        ...formData,
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Pengaturan Interval Global */}
      <form
        onSubmit={handleSaveInterval}
        className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-4"
      >
        <h3 className="font-bold text-blue-900 border-b border-blue-100 pb-2">
          Pengaturan Interval Nilai & Predikat (Global)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Batas Minimal L2 (Layak)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={intervalData.batasBawahSelektif}
              onChange={(e) =>
                setIntervalData({
                  ...intervalData,
                  batasBawahSelektif: Number(e.target.value),
                })
              }
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Dibawah ini = L1 (Remedial Total)
            </p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Batas Minimal L3 (Cakap) / KKM
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={intervalData.batasBawahTuntas}
              onChange={(e) =>
                setIntervalData({
                  ...intervalData,
                  batasBawahTuntas: Number(e.target.value),
                })
              }
            />
            <p className="text-[10px] text-gray-500 mt-1">
              L2 (Remedial Selektif) ~ L3 (Tuntas)
            </p>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Batas Maksimal L3 (Cakap)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              className="w-full px-3 py-2 border rounded-lg text-sm"
              value={intervalData.batasAtasLanjut}
              onChange={(e) =>
                setIntervalData({
                  ...intervalData,
                  batasAtasLanjut: Number(e.target.value),
                })
              }
            />
            <p className="text-[10px] text-gray-500 mt-1">
              Diatas ini = L4 (Pengayaan)
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold"
          >
            Simpan Interval
          </button>
        </div>
      </form>

      {/* Existing Rubrik Config */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold block mb-2">
              Pilih Kelas
            </label>
            <select
              className="px-3 py-2 border rounded-lg text-sm bg-gray-50 w-full"
              value={selectedKelasId}
              onChange={(e) => setSelectedKelasId(e.target.value)}
            >
              <option value="" disabled>Pilih Kelas</option>
              {state.agmp_kelas.map((k) => (
                <option key={k.id} value={k.id}>
                  Kelas {k.nama}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-semibold block mb-2">
              Pilih Tujuan Pembelajaran
            </label>
            <select
              className="px-3 py-2 border rounded-lg text-sm bg-gray-50 w-full"
              value={selectedTpId}
              onChange={handleTpChange}
            >
              <option value="" disabled>Pilih TP</option>
              {tpOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  TP {t.kode}: {t.deskripsi.substring(0, 50)}...
                </option>
              ))}
            </select>
            {tpOptions.length === 0 && selectedKelasId && (
              <p className="text-xs text-red-500 mt-1">
                Belum ada TP untuk kelas ini.
              </p>
            )}
          </div>
        </div>

        {tp && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-1">
                  Level 1: Baru Berkembang (Skor 0-
                  {intervalData.batasBawahSelektif - 1})
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-700"
                  value={formData.level1}
                  onChange={(e) =>
                    setFormData({ ...formData, level1: e.target.value })
                  }
                  placeholder="Siswa belum mampu..."
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-1">
                  Level 2: Layak (Skor {intervalData.batasBawahSelektif}-
                  {intervalData.batasBawahTuntas - 1})
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-700"
                  value={formData.level2}
                  onChange={(e) =>
                    setFormData({ ...formData, level2: e.target.value })
                  }
                  placeholder="Siswa mampu secara terbatas..."
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-1">
                  Level 3: Cakap (Skor {intervalData.batasBawahTuntas}-
                  {intervalData.batasAtasLanjut}){" "}
                  <span className="text-xs text-green-600 ml-2 font-normal">
                    Ketuntasan Minimal
                  </span>
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-700"
                  value={formData.level3}
                  onChange={(e) =>
                    setFormData({ ...formData, level3: e.target.value })
                  }
                  placeholder="Siswa mampu menyelesaikan..."
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-900 block mb-1">
                  Level 4: Mahir (Skor {intervalData.batasAtasLanjut + 1}-100)
                </label>
                <textarea
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm text-gray-700"
                  value={formData.level4}
                  onChange={(e) =>
                    setFormData({ ...formData, level4: e.target.value })
                  }
                  placeholder="Siswa sangat mampu dan dapat..."
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#007AFF] text-white rounded-xl font-bold"
            >
              Simpan Rubrik KKTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
