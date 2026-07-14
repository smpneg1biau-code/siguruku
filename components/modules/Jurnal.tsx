import { useState } from 'react';
import { useStore } from '@/lib/store';
import { TabId } from '@/components/Shell';
import { generateId } from '@/lib/utils';
import { Save, Lock, ArrowRight, CheckCircle, Target } from 'lucide-react';

export default function Jurnal({ onNavigate }: { onNavigate: (tab: TabId) => void }) {
  const { state, addItem, updateItem, showToast } = useStore();
  const activeTA = state.agmp_tahun_ajaran.find(ta => ta.isActive);
  const activeTaId = activeTA?.id || '';

  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    kelasId: state.agmp_kelas[0]?.id || '',
    tpId: state.agmp_tp[0]?.id || '',
    materi: '',
    kegiatan: '',
    refleksi: '',
    status: 'TUNTAS' as 'TUNTAS' | 'BELUM TUNTAS'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTaId) {
      showToast('Tidak ada Tahun Ajaran yang aktif!', 'error');
      return;
    }
    const newJurnal = {
      id: generateId(),
      taId: activeTaId,
      ...formData,
      cekAwalDone: false,
      cekTengahDone: false,
      isClosed: false
    };
    addItem('agmp_jurnal', newJurnal);
    showToast('Jurnal berhasil disimpan!', 'success');
    setFormData({...formData, materi: '', kegiatan: '', refleksi: ''});
  };

  const recentJurnals = state.agmp_jurnal
    .filter(j => j.taId === activeTaId || !j.taId)
    .reverse()
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-gray-900">Jurnal Mengajar</h2>
        <p className="text-sm text-gray-500 mt-1">Catat aktivitas dan refleksi pembelajaran. {activeTA ? `(TA: ${activeTA.nama} - Smt ${activeTA.semester})` : ''}</p>
      </header>

      <form onSubmit={handleSave} className="bg-white p-5 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Tanggal</label>
            <input type="date" required className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700">Kelas</label>
            <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white" value={formData.kelasId} onChange={e => setFormData({...formData, kelasId: e.target.value})}>
              {state.agmp_kelas.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Tujuan Pembelajaran (TP)</label>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white" value={formData.tpId} onChange={e => setFormData({...formData, tpId: e.target.value})}>
            {state.agmp_tp.map(tp => <option key={tp.id} value={tp.id}>{tp.kode} - {tp.deskripsi}</option>)}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Materi Esensial</label>
          <input required placeholder="Contoh: Penjumlahan Bilangan Bulat" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm" value={formData.materi} onChange={e => setFormData({...formData, materi: e.target.value})} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Kegiatan Pembelajaran</label>
          <textarea required rows={3} placeholder="Ceritakan urutan kegiatan..." className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none" value={formData.kegiatan} onChange={e => setFormData({...formData, kegiatan: e.target.value})} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700">Refleksi Guru</label>
          <textarea placeholder="Apa yang berjalan baik? Apa tantangannya?" className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm resize-none" value={formData.refleksi} onChange={e => setFormData({...formData, refleksi: e.target.value})} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Status Ketercapaian TP Hari ini</label>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setFormData({...formData, status: 'TUNTAS'})} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.status === 'TUNTAS' ? 'bg-[#34C759] text-white' : 'bg-gray-100 text-gray-600'}`}>TUNTAS</button>
              <button type="button" onClick={() => setFormData({...formData, status: 'BELUM TUNTAS'})} className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.status === 'BELUM TUNTAS' ? 'bg-[#FF3B30] text-white' : 'bg-gray-100 text-gray-600'}`}>BELUM TUNTAS</button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
           <button type="button" onClick={() => onNavigate('formatif')} className="flex-1 px-4 py-2.5 bg-blue-50 text-blue-700 font-semibold text-sm rounded-xl flex justify-center items-center gap-2">
             <Target className="w-4 h-4" /> Cek Awal / Formatif
           </button>
           <button type="submit" disabled={!activeTaId} className="flex-1 px-4 py-2.5 bg-[#007AFF] text-white font-semibold text-sm rounded-xl flex justify-center items-center gap-2 shadow-sm disabled:opacity-50">
             <Save className="w-4 h-4" /> Simpan Jurnal
           </button>
        </div>
      </form>

      {/* Riwayat */}
      <div>
        <h3 className="font-bold text-gray-900 mb-3">Riwayat Jurnal Terakhir</h3>
        <div className="space-y-3">
          {recentJurnals.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Belum ada entri jurnal untuk tahun ajaran / semester ini</p>
          ) : recentJurnals.map(j => (
            <div key={j.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{state.agmp_kelas.find(k=>k.id === j.kelasId)?.nama}</span>
                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{j.tanggal}</span>
                  </div>
                  <p className="text-xs font-semibold text-[#007AFF] mt-1">TP {state.agmp_tp.find(t=>t.id === j.tpId)?.kode}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${j.status === 'TUNTAS' ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF3B30]/10 text-[#FF3B30]'}`}>
                  {j.status}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{j.materi}</p>
              
              {!j.isClosed && j.status === 'TUNTAS' && (
                <div className="border-t pt-3 mt-1 flex justify-end">
                   <button 
                     onClick={() => {
                       updateItem('agmp_jurnal', j.id, { isClosed: true });
                       onNavigate('sumatif');
                     }} 
                     className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                   >
                     <Lock className="w-3.5 h-3.5" /> Tutup TP & Lanjut Sumatif <ArrowRight className="w-3 h-3" />
                   </button>
                </div>
              )}
               {j.isClosed && (
                 <div className="border-t pt-3 mt-1 flex items-center gap-1.5 text-xs font-semibold text-green-600">
                    <CheckCircle className="w-3.5 h-3.5" /> TP Ditutup (Lanjut ke Sumatif)
                 </div>
               )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
