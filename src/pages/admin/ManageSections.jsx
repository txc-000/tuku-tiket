import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Layers, MousePointer2, Layout, Loader2 } from 'lucide-react';

export default function ManageSections({ eventId }) {
  const [loading, setLoading] = useState(false);
  const [sectionData, setSectionData] = useState({
    name: '',
    price: '',
    row_count: 5,
    col_count: 10,
    layout_type: 'bowl', // Default stadium
    map_angle: 0
  });

  const handleAddSection = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Masukkan data section baru
    const { data: section, error: secError } = await supabase
      .from('sections')
      .insert([{ ...sectionData, event_id: eventId }])
      .select()
      .single();

    if (!secError) {
      // 2. Otomatis buat kursi (seats) untuk section tersebut
      // Ini akan menjalankan logika generate series di sisi server/client
      alert("Section & Layout berhasil disimpan!");
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] text-left">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Layers className="text-blue-500" size={20} /> Pengaturan Layout & Section
      </h2>

      <form onSubmit={handleAddSection} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Section</label>
            <input type="text" placeholder="Contoh: VIP West" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 text-sm" 
              onChange={e => setSectionData({...sectionData, name: e.target.value})} required />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tipe Layout</label>
            <select 
              className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 outline-none focus:ring-2 focus:ring-blue-600 text-sm appearance-none"
              value={sectionData.layout_type}
              onChange={e => setSectionData({...sectionData, layout_type: e.target.value})}
            >
              <option value="bowl">Stadium (Bowl/Melingkar)</option>
              <option value="orchestra">Concert (Orchestra/Kipas)</option>
              <option value="grid">Theater (Grid/Kotak)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Baris</label>
            <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 outline-none" 
              value={sectionData.row_count} onChange={e => setSectionData({...sectionData, row_count: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kursi/Baris</label>
            <input type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 outline-none" 
              value={sectionData.col_count} onChange={e => setSectionData({...sectionData, col_count: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Sudut Peta (°)</label>
            <input type="number" placeholder="0-360" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3 px-4 outline-none" 
              onChange={e => setSectionData({...sectionData, map_angle: e.target.value})} />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2">
          {loading ? <Loader2 className="animate-spin" /> : <Layout size={18} />}
          Simpan Layout Section
        </button>
      </form>
    </div>
  );
}