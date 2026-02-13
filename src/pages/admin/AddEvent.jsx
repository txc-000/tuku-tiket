import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Image as ImageIcon, Calendar, MapPin, Tag, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';

export default function AddEvent({ onEventAdded }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    venue: '',
    price: '',
    category: 'sport',
    image: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Proses INSERT ke tabel events
    const { data, error } = await supabase
      .from('events')
      .insert([
        { 
          title: formData.title,
          date: formData.date,
          venue: formData.venue,
          price: parseFloat(formData.price),
          category: formData.category,
          image: formData.image
        }
      ]);

    if (error) {
      alert("Gagal menambahkan event: " + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      // Reset form
      setFormData({ title: '', date: '', venue: '', price: '', category: 'sport', image: '' });
      if (onEventAdded) onEventAdded(); // Refresh list event
    }
    setLoading(false);
  };

  return (
    <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 shadow-2xl backdrop-blur-sm text-left">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-blue-600 p-2 rounded-xl">
          <Plus className="text-white" size={20} />
        </div>
        <h2 className="text-xl font-black tracking-tighter italic">Buat Event Baru</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Nama Event */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nama Event</label>
            <input 
              type="text" required
              className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-white"
              placeholder="Contoh: Konser Coldplay Jakarta"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>

          {/* Input Kategori */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Kategori</label>
            <select 
              className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-white appearance-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value})}
            >
              <option value="sport">Sport</option>
              <option value="music">Music</option>
              <option value="festival">Festival</option>
            </select>
          </div>
        </div>

        {/* Baris Kedua: Tanggal & Lokasi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Tanggal Event</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" required
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-white"
                placeholder="Contoh: 25 Desember 2026"
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Lokasi/Venue</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" required
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-white"
                placeholder="Stadion Utama GBK"
                value={formData.venue}
                onChange={(e) => setFormData({...formData, venue: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Baris Ketiga: Harga & Image URL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Harga Mulai Dari (Rp)</label>
            <div className="relative">
              <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="number" required
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-white"
                placeholder="750000"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">URL Gambar Banner</label>
            <div className="relative">
              <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" required
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium text-white"
                placeholder="https://images.unsplash.com/..."
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
              />
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 ${
            success ? 'bg-green-600 hover:bg-green-500' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'
          }`}
        >
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : success ? (
            <><CheckCircle2 size={20} /> Berhasil Disimpan!</>
          ) : (
            <><Plus size={20} /> Terbitkan Event</>
          )}
        </button>
      </form>
    </div>
  );
}