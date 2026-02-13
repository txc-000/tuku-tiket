import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MapPin, Loader2, Ticket, LayoutDashboard, Layers, 
  Pencil, ChevronRight, Search, TrendingUp, DollarSign, Receipt, Scan, Save, Trash2 
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import SeatMonitor from './SeatMonitor'; 

const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('events'); 
  const [events, setEvents] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editEventId, setEditEventId] = useState(null);

  const [stats, setStats] = useState({ totalRevenue: 0, totalSold: 0, activeEvents: 0 });

  // FORM STATES
  const [eventForm, setEventForm] = useState({ title: '', date: '', venue: '', price: '', category: 'Konser', status: 'draft' });
  const [secForm, setSecForm] = useState({ name: '', floor_name: '', price: 0, row_count: 8, col_count: 12 });

  useEffect(() => { 
    fetchEvents();
    fetchTransactions(); 
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
    if (data) setSections(data);
  }

  const handleSubmitEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    if (isEditing) {
      await supabase.from('events').update({ ...eventForm, price: parseFloat(eventForm.price) }).eq('id', editEventId);
      setIsEditing(false);
    } else {
      await supabase.from('events').insert([{ ...eventForm, price: parseFloat(eventForm.price) }]);
    }
    setEventForm({ title: '', date: '', venue: '', price: '', category: 'Konser', status: 'draft' });
    fetchEvents();
    setLoading(false);
  };

  const handleAddSection = async (e) => {
    e.preventDefault();
    if (!selectedEventId) return alert("Pilih event di katalog terlebih dahulu!");
    setLoading(true);
    const { data: sectionData } = await supabase.from('sections').insert([{ ...secForm, event_id: selectedEventId, price: parseFloat(secForm.price) }]).select();
    
    if (sectionData) {
      const newSection = sectionData[0];
      const seats = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      for (let r = 0; r < newSection.row_count; r++) {
        for (let c = 1; c <= newSection.col_count; c++) {
          seats.push({ section_id: newSection.id, row_label: alphabet[r], seat_number: c, status: 'available' });
        }
      }
      await supabase.from('seats').insert(seats);
      fetchSections(selectedEventId);
      setSecForm({ name: '', floor_name: '', price: 0, row_count: 8, col_count: 12 });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-slate-200 pb-20 font-sans text-left">
      <Navbar />
      
      {/* Container utama dengan padding-top tinggi (pt-32) agar tidak tertutup Navbar */}
      <div className="max-w-[1600px] mx-auto px-10 pt-32">
        
        {/* HEADER & SCANNER BUTTON */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white">Command Center</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-3 italic">Dashboard Monitoring Real-time</p>
          </div>
          <button 
            onClick={() => navigate('/admin/scanner')} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-5 rounded-3xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 shadow-2xl shadow-blue-600/30 active:scale-95 transition-all"
          >
            <Scan size={20} /> Buka Scanner Gate
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl">
            <DollarSign className="text-blue-500 mb-4" size={28} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-3xl font-black text-white">{formatIDR(stats.totalRevenue)}</h3>
          </div>
          <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl">
            <Receipt className="text-cyan-500 mb-4" size={28} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Tiket Terjual</p>
            <h3 className="text-3xl font-black text-white">{stats.totalSold}</h3>
          </div>
          <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[40px] backdrop-blur-xl">
            <TrendingUp className="text-green-500 mb-4" size={28} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Published Events</p>
            <h3 className="text-3xl font-black text-white">{stats.activeEvents}</h3>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="flex gap-12 border-b border-white/5 mb-12">
           {['events', 'transactions'].map(tab => (
             <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}
             >
               {tab === 'events' ? 'Event Management' : 'Database Transaksi'}
               {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>}
             </button>
           ))}
        </div>

        {activeTab === 'events' ? (
          <div className="space-y-16 animate-fade-in">
            <div className="grid grid-cols-12 gap-10">
              {/* LEFT: FORM EVENT */}
              <div className="col-span-12 lg:col-span-3 bg-slate-900/30 border border-white/5 rounded-[48px] p-10 h-fit">
                <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                  {isEditing ? <Pencil size={18} className="text-amber-400"/> : <Plus size={18} className="text-blue-500"/>}
                  {isEditing ? 'Edit Event' : 'Buat Event Baru'}
                </h2>
                <form onSubmit={handleSubmitEvent} className="space-y-6">
                  <input type="text" placeholder="Nama Event" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-sm focus:border-blue-500 outline-none transition-all" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                  <select className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-4 text-sm" value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})}>
                    <option value="draft">📁 Draft Mode</option>
                    <option value="published">🌐 Published</option>
                  </select>
                  <input type="date" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-4 text-sm text-white" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required />
                  <input type="number" placeholder="Harga Dasar (Rp)" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-sm" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: e.target.value})} required />
                  <button type="submit" className={`w-full py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest transition-all ${isEditing ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'}`}>
                    {isEditing ? 'SIMPAN PERUBAHAN' : 'TERBITKAN EVENT'}
                  </button>
                  {isEditing && <button type="button" onClick={() => {setIsEditing(false); setEventForm({title:'', date:'', venue:'', price:'', category:'Konser', status:'draft'});}} className="w-full text-[9px] font-black uppercase tracking-widest text-slate-500">Batal Edit</button>}
                </form>
              </div>

              {/* MIDDLE: KATALOG */}
              <div className="col-span-12 lg:col-span-5 space-y-8">
                <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-3"><Layers size={18} className="text-blue-500"/> Katalog Event</h2>
                <div className="grid grid-cols-1 gap-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide">
                  {events.map(ev => (
                    <div 
                      key={ev.id} 
                      onClick={() => setSelectedEventId(ev.id)} 
                      className={`p-8 rounded-[48px] border transition-all cursor-pointer relative group ${selectedEventId === ev.id ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' : 'bg-slate-900/20 border-white/5 hover:bg-white/5'}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${ev.status === 'published' ? 'text-green-400 border-green-400/20 bg-green-400/5' : 'text-slate-500 border-white/5'}`}>
                          {ev.status}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={(e) => {e.stopPropagation(); setIsEditing(true); setEditEventId(ev.id); setEventForm(ev);}} className="p-2 bg-white/5 rounded-xl hover:text-blue-400"><Pencil size={14} /></button>
                        </div>
                      </div>
                      <h3 className="font-bold text-xl text-white uppercase tracking-tight italic">{ev.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-slate-500">
                        <MapPin size={12} />
                        <p className="text-[10px] uppercase font-black tracking-widest">{ev.venue || 'Stadion Utama GBK'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: TAMBAH SECTION */}
              <div className="col-span-12 lg:col-span-4 bg-slate-900/30 border border-white/5 rounded-[48px] p-10 h-fit">
                <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3"><Plus size={18} className="text-cyan-500"/> Tambah Section</h2>
                <form onSubmit={handleAddSection} className="space-y-6">
                  <input type="text" placeholder="Level (ex: Tribun Atas)" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-sm" value={secForm.floor_name} onChange={e => setSecForm({...secForm, floor_name: e.target.value})} required />
                  <input type="text" placeholder="Nama Section (ex: VIP East)" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-6 text-sm" value={secForm.name} onChange={e => setSecForm({...secForm, name: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <p className="text-[8px] font-black uppercase ml-2 text-slate-500 tracking-widest">Baris</p>
                       <input type="number" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-4 text-sm" value={secForm.row_count} onChange={e => setSecForm({...secForm, row_count: parseInt(e.target.value)})} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-[8px] font-black uppercase ml-2 text-slate-500 tracking-widest">Kolom</p>
                       <input type="number" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-4 px-4 text-sm" value={secForm.col_count} onChange={e => setSecForm({...secForm, col_count: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <button 
                    type="submit" 
                    disabled={!selectedEventId} 
                    className="w-full py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest bg-slate-800 text-slate-500 hover:bg-cyan-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    GENERATE SEAT LAYOUT
                  </button>
                  {!selectedEventId && <p className="text-[8px] text-center font-bold text-amber-500 uppercase tracking-widest">Pilih event dulu di katalog</p>}
                </form>
              </div>
            </div>

            {/* BOTTOM: LIVE MONITOR */}
            {selectedEventId && (
              <div className="mt-12 pt-16 border-t border-white/5 animate-fade-in-up">
                <div className="flex justify-between items-center mb-10">
                   <div>
                      <h2 className="text-3xl font-black italic uppercase text-white">Live Visual Monitor</h2>
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Pemantauan okupansi kursi secara real-time</p>
                   </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                  {sections.map(sec => (
                    <button 
                      key={sec.id} 
                      onClick={() => setSelectedSectionId(sec.id)} 
                      className={`px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${selectedSectionId === sec.id ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/30' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:text-white'}`}
                    >
                      {sec.name} <span className="opacity-40 mx-2">|</span> {sec.floor_name}
                    </button>
                  ))}
                </div>

                {selectedSectionId ? (
                  <div className="mt-8 bg-slate-900/10 border border-white/5 rounded-[64px] p-16 flex justify-center overflow-hidden shadow-inner relative">
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
                       <div className="w-32 h-1 bg-blue-500/20 rounded-full mx-auto mb-2"></div>
                       <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.5em]">Stage Direction</p>
                    </div>
                    <SeatMonitor section={sections.find(s => s.id === selectedSectionId)} />
                  </div>
                ) : (
                  <div className="mt-8 h-64 border border-dashed border-white/10 rounded-[48px] flex items-center justify-center text-slate-600">
                    <p className="text-xs font-black uppercase tracking-widest">Pilih section untuk memantau kursi</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB DATABASE TRANSAKSI */
          <div className="bg-slate-900/20 border border-white/5 rounded-[48px] overflow-hidden animate-fade-in shadow-2xl">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                      <th className="p-10">Pelanggan</th>
                      <th className="p-10">Event Terkait</th>
                      <th className="p-10">Total Bayar</th>
                      <th className="p-10 text-center">Metode</th>
                      <th className="p-10 text-right">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-medium">
                   {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                         <td className="p-10">
                            <p className="text-white font-bold group-hover:text-blue-400 transition-colors">{t.customer_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase font-mono">{t.customer_email}</p>
                         </td>
                         <td className="p-10">
                            <span className="text-slate-400 uppercase text-xs font-bold italic">{t.events?.title || 'Event'}</span>
                         </td>
                         <td className="p-10">
                            <p className="font-black text-white">{formatIDR(t.total_amount)}</p>
                         </td>
                         <td className="p-10 text-center">
                            <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest border border-white/5 px-3 py-1 rounded-lg">QRIS / VA</span>
                         </td>
                         <td className="p-10 text-right">
                            <span className="bg-green-500/10 text-green-500 px-5 py-2 rounded-full text-[9px] font-black uppercase border border-green-500/20 shadow-sm shadow-green-500/10">Paid</span>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        )}
      </div>
    </div>
  );
}