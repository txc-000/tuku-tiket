import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MapPin, Loader2, Layers, Pencil, DollarSign, 
  Receipt, Scan, TrendingUp, Save 
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import SeatMonitor from './SeatMonitor'; // Pastikan file ini dibuat (kode ada di bawah)

const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Selection States
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  
  // Edit States
  const [isEditing, setIsEditing] = useState(false);
  const [editEventId, setEditEventId] = useState(null);

  // Stats
  const [stats, setStats] = useState({ totalRevenue: 0, totalSold: 0, activeEvents: 0 });

  // Forms
  const [eventForm, setEventForm] = useState({ title: '', date: '', venue: '', price: '', category: 'Konser', status: 'draft', image: '' });
  const [secForm, setSecForm] = useState({ name: '', floor_name: '', price: '', row_count: 8, col_count: 12 });

  useEffect(() => { 
    fetchEvents();
    fetchTransactions(); 
    
    // Realtime Subscription
    const channel = supabase.channel('admin-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchTransactions())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'seats' }, () => fetchTransactions())
      .subscribe();
      
    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => { if (selectedEventId) fetchSections(selectedEventId); }, [selectedEventId]);

  async function fetchEvents() {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (data) {
      setEvents(data);
      setStats(prev => ({ ...prev, activeEvents: data.filter(e => e.status === 'published').length })); 
    }
  }

  async function fetchTransactions() {
    const { data: trxData } = await supabase.from('transactions').select('*, events(title)').order('created_at', { ascending: false });
    const { data: soldSeats } = await supabase.from('seats').select('id').in('status', ['sold', 'checked-in']);
    
    if (trxData) {
      setTransactions(trxData);
      setStats(prev => ({ 
        ...prev, 
        totalRevenue: trxData.reduce((acc, curr) => acc + Number(curr.total_amount), 0),
        totalSold: soldSeats ? soldSeats.length : 0 
      }));
    }
  }

  async function fetchSections(id) {
    const { data } = await supabase.from('sections').select('*').eq('event_id', id).order('floor_name', { ascending: true });
    if (data) setSections(data || []);
  }

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    const payload = { ...eventForm, price: parseFloat(eventForm.price) };
    
    if (isEditing) {
      await supabase.from('events').update(payload).eq('id', editEventId);
      setIsEditing(false);
    } else {
      await supabase.from('events').insert([payload]);
    }
    
    setEventForm({ title: '', date: '', venue: '', price: '', category: 'Konser', status: 'draft', image: '' });
    fetchEvents();
    setLoading(false);
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return alert("Pilih event di katalog terlebih dahulu!");
    setLoading(true);

    // 1. Buat Section
    const { data: sectionData, error } = await supabase.from('sections').insert([{ 
        ...secForm, 
        event_id: selectedEventId, 
        price: parseFloat(secForm.price) 
    }]).select();
    
    if (error) {
        alert("Gagal membuat section");
        setLoading(false);
        return;
    }
    
    // 2. Generate Kursi Otomatis
    if (sectionData) {
      const newSection = sectionData[0];
      const seats = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
      for (let r = 0; r < newSection.row_count; r++) {
        for (let c = 1; c <= newSection.col_count; c++) {
          seats.push({ 
              section_id: newSection.id, 
              row_label: alphabet[r], 
              seat_number: c, 
              status: 'available' 
          });
        }
      }
      
      const { error: seatError } = await supabase.from('seats').insert(seats);
      if (seatError) alert("Gagal generate kursi, tapi section terbuat.");

      fetchSections(selectedEventId);
      setSecForm({ name: '', floor_name: '', price: '', row_count: 8, col_count: 12 });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 pb-20 font-sans text-left selection:bg-blue-500 selection:text-white">
      <Navbar />
      
      <div className="max-w-[1600px] mx-auto px-6 md:px-10 pt-32">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">Command Center</h1>
            <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mt-3 italic">Dashboard Monitoring & Manajemen Event</p>
          </div>
          <button 
            onClick={() => navigate('/admin/scanner')} 
            className="group bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-[0_0_40px_-10px_rgba(37,99,235,0.5)] active:scale-95 transition-all"
          >
            <Scan size={18} className="group-hover:rotate-90 transition-transform" /> Buka Scanner Gate
          </button>
        </div>

        {/* --- STATISTIK --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-md">
            <DollarSign className="text-emerald-400 mb-4" size={24} />
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Total Pendapatan</p>
            <h3 className="text-3xl font-black text-white">{formatIDR(stats.totalRevenue)}</h3>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-md">
            <Receipt className="text-blue-400 mb-4" size={24} />
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Tiket Terjual</p>
            <h3 className="text-3xl font-black text-white">{stats.totalSold} <span className="text-sm text-slate-500 font-bold">Tiket</span></h3>
          </div>
          <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[32px] backdrop-blur-md">
            <TrendingUp className="text-amber-400 mb-4" size={24} />
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Event Aktif</p>
            <h3 className="text-3xl font-black text-white">{stats.activeEvents}</h3>
          </div>
        </div>

        {/* --- TABS --- */}
        <div className="flex gap-8 border-b border-white/5 mb-12">
           {['events', 'transactions'].map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-blue-500' : 'text-slate-600 hover:text-white'}`}
             >
               {tab === 'events' ? 'Manajemen Event' : 'Riwayat Transaksi'}
               {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 shadow-[0_0_15px_#3b82f6]"></div>}
             </button>
           ))}
        </div>

        {activeTab === 'events' ? (
          <div className="animate-fade-in space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* 1. FORM CREATE/EDIT EVENT (KIRI) */}
              <div className="lg:col-span-3 bg-slate-900/20 border border-white/5 rounded-[40px] p-8 h-fit">
                <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                  {isEditing ? <Pencil size={16} className="text-amber-500"/> : <Plus size={16} className="text-blue-500"/>}
                  {isEditing ? 'Edit Event' : 'Event Baru'}
                </h2>
                <form onSubmit={handleSubmitEvent} className="space-y-4">
                  <input type="text" placeholder="Nama Event" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs focus:border-blue-500 outline-none transition-colors text-white" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                  
                  <select className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-slate-300 outline-none" value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})}>
                    <option value="draft">📁 Draft (Tersembunyi)</option>
                    <option value="published">🌐 Published (Tampil)</option>
                  </select>
                  
                  <input type="date" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-slate-300 outline-none" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required />
                  <input type="text" placeholder="Lokasi / Venue" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none" value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} required />
                  <input type="number" placeholder="Harga Dasar (Rp)" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: e.target.value})} required />
                  <input type="text" placeholder="URL Gambar Poster" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none" value={eventForm.image} onChange={e => setEventForm({...eventForm, image: e.target.value})} />

                  <button type="submit" className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all mt-2 ${isEditing ? 'bg-amber-500 hover:bg-amber-400 text-black' : 'bg-white hover:bg-blue-50 text-black'}`}>
                    {loading ? <Loader2 className="animate-spin mx-auto" size={16}/> : (isEditing ? 'Simpan Perubahan' : 'Buat Event')}
                  </button>
                  
                  {isEditing && (
                    <button type="button" onClick={() => {setIsEditing(false); setEventForm({title:'', date:'', venue:'', price:'', category:'Konser', status:'draft', image: ''});}} className="w-full text-[9px] font-bold uppercase tracking-widest text-slate-500 hover:text-white mt-2">
                        Batal
                    </button>
                  )}
                </form>
              </div>

              {/* 2. DAFTAR EVENT (TENGAH) */}
              <div className="lg:col-span-6 space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider"><Layers size={16} className="text-slate-500"/> Katalog Event</h2>
                </div>
                <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {events.map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={() => setSelectedEventId(ev.id)} 
                      className={`p-6 rounded-3xl border transition-all cursor-pointer relative group flex items-center gap-6 ${selectedEventId === ev.id ? 'bg-blue-900/20 border-blue-500/50' : 'bg-slate-900/20 border-white/5 hover:bg-white/5'}`}
                    >
                      <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden flex-shrink-0">
                         {ev.image && <img src={ev.image} alt="" className="w-full h-full object-cover"/>}
                      </div>
                      <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${ev.status === 'published' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' : 'text-slate-500 border-white/5 bg-slate-800'}`}>
                              {ev.status}
                            </span>
                          </div>
                          <h3 className="font-bold text-lg text-white uppercase italic leading-tight">{ev.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
                            <span className="flex items-center gap-1"><MapPin size={12}/> {ev.venue}</span>
                            <span className="opacity-20">|</span>
                            <span>{new Date(ev.date).toLocaleDateString('id-ID')}</span>
                          </div>
                      </div>
                      <button onClick={(e) => {e.stopPropagation(); setIsEditing(true); setEditEventId(ev.id); setEventForm(ev);}} className="p-3 bg-white/5 rounded-full hover:bg-white hover:text-black transition-colors">
                        <Pencil size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. FORM TAMBAH SECTION & GENERATE KURSI (KANAN) */}
              <div className="lg:col-span-3 bg-slate-900/20 border border-white/5 rounded-[40px] p-8 h-fit">
                <h2 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-wider">
                  <Plus size={16} className="text-emerald-500"/> Generate Kursi
                </h2>
                <form onSubmit={handleAddSection} className="space-y-4">
                  <input type="text" placeholder="Nama Lantai (ex: Ground Floor)" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none" value={secForm.floor_name} onChange={e => setSecForm({...secForm, floor_name: e.target.value})} required />
                  <input type="text" placeholder="Nama Area (ex: VIP A)" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none" value={secForm.name} onChange={e => setSecForm({...secForm, name: e.target.value})} required />
                  <input type="number" placeholder="Harga Area Ini (Rp)" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none" value={secForm.price} onChange={e => setSecForm({...secForm, price: e.target.value})} required />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                       <p className="text-[8px] font-black uppercase mb-1 text-slate-500">Jml Baris</p>
                       <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center" value={secForm.row_count} onChange={e => setSecForm({...secForm, row_count: parseInt(e.target.value)})} />
                    </div>
                    <div>
                       <p className="text-[8px] font-black uppercase mb-1 text-slate-500">Jml Kolom</p>
                       <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center" value={secForm.col_count} onChange={e => setSecForm({...secForm, col_count: parseInt(e.target.value)})} />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={!selectedEventId || loading} 
                    className="w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest bg-emerald-600 text-white hover:bg-emerald-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? 'Processing...' : 'Generate Layout'}
                  </button>
                  {!selectedEventId && <p className="text-[8px] text-center font-bold text-amber-500 uppercase tracking-widest mt-2 animate-pulse">Pilih event dulu di katalog</p>}
                </form>
              </div>
            </div>

            {/* 4. LIVE VISUAL MONITOR (BAWAH) */}
            {selectedEventId && (
              <div className="pt-12 border-t border-white/5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                   <div>
                      <h2 className="text-2xl font-black italic uppercase text-white">Live Seat Monitor</h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Pantau ketersediaan kursi secara real-time</p>
                   </div>
                   <div className="flex gap-2 overflow-x-auto max-w-full pb-2 custom-scrollbar">
                      {sections.map(sec => (
                        <button 
                          key={sec.id} 
                          onClick={() => setSelectedSectionId(sec.id)} 
                          className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedSectionId === sec.id ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-white/10 text-slate-500 hover:text-white'}`}
                        >
                          {sec.name}
                        </button>
                      ))}
                   </div>
                </div>

                {selectedSectionId ? (
                  <div className="bg-[#0A0A0C] border border-white/5 rounded-[40px] p-8 md:p-16 flex justify-center shadow-inner relative overflow-hidden min-h-[400px]">
                    <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center opacity-50">
                       <div className="w-40 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent rounded-full mx-auto mb-2"></div>
                       <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.5em]">Screen / Stage Area</p>
                    </div>
                    {/* Komponen Visual Kursi */}
                    <SeatMonitor section={sections.find(s => s.id === selectedSectionId)} />
                  </div>
                ) : (
                  <div className="h-40 border border-dashed border-white/10 rounded-[32px] flex items-center justify-center text-slate-600">
                    <p className="text-[10px] font-black uppercase tracking-widest">Pilih area/section di atas untuk melihat denah</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB TRANSAKSI */
          <div className="bg-slate-900/20 border border-white/5 rounded-[40px] overflow-hidden animate-fade-in">
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-black/20 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                        <th className="p-6">User / Email</th>
                        <th className="p-6">Event</th>
                        <th className="p-6">Total</th>
                        <th className="p-6 text-center">Status</th>
                        <th className="p-6 text-right">Tanggal</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm font-medium text-slate-300">
                     {transactions.map(t => (
                        <tr key={t.id} className="hover:bg-white/5 transition-colors">
                           <td className="p-6">
                              <p className="text-white font-bold">{t.customer_name || 'Guest'}</p>
                              <p className="text-xs text-slate-500 font-mono">{t.customer_email}</p>
                           </td>
                           <td className="p-6">
                              <span className="text-xs uppercase font-bold">{t.events?.title}</span>
                           </td>
                           <td className="p-6 font-mono text-emerald-400">
                              {formatIDR(t.total_amount)}
                           </td>
                           <td className="p-6 text-center">
                              <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[9px] font-black uppercase border border-emerald-500/20">
                                Lunas
                              </span>
                           </td>
                           <td className="p-6 text-right text-xs text-slate-500">
                              {new Date(t.created_at).toLocaleDateString('id-ID')}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}