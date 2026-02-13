import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, MapPin, Loader2, Ticket, LayoutDashboard, Layers, 
  Pencil, ChevronRight, Search, TrendingUp, DollarSign, Receipt, Scan, Save, Trash2 
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import SeatMonitor from './SeatMonitor'; // Pastikan file ini ada

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
      setStats(prev => ({ ...prev, activeEvents: data.filter(e => e.status === 'published').length })); // Fix Published Count
    }
  }

  async function fetchTransactions() {
    const { data: trxData } = await supabase.from('transactions').select('*, events(title)').order('created_at', { ascending: false });
    // FIX: Hitung jumlah fisik kursi sold, bukan baris transaksi
    const { data: soldSeats } = await supabase.from('seats').select('id').eq('status', 'sold');
    
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
      <div className="max-w-[1600px] mx-auto px-10 pt-16">
        
        {/* HEADER & SCANNER */}
        <div className="flex justify-between items-end mb-12">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">Command Center</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2 italic">Dashboard Monitoring Real-time</p>
          </div>
          <button onClick={() => navigate('/admin/scanner')} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 shadow-xl shadow-blue-600/20 transition-all active:scale-95">
            <Scan size={18} /> Buka Scanner Gate
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[32px] backdrop-blur-sm">
            <DollarSign className="text-blue-500 mb-4" size={24} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Total Revenue</p>
            <h3 className="text-3xl font-black text-white">{formatIDR(stats.totalRevenue)}</h3>
          </div>
          <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[32px]">
            <Receipt className="text-cyan-500 mb-4" size={24} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Tiket Terjual</p>
            <h3 className="text-3xl font-black text-white">{stats.totalSold}</h3>
          </div>
          <div className="bg-slate-900/30 border border-white/5 p-8 rounded-[32px]">
            <TrendingUp className="text-green-500 mb-4" size={24} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Published Events</p>
            <h3 className="text-3xl font-black text-white">{stats.activeEvents}</h3>
          </div>
        </div>

        <div className="flex gap-10 border-b border-white/5 mb-12">
           {['events', 'transactions'].map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all ${activeTab === tab ? 'text-blue-500 border-b-2 border-blue-500' : 'text-slate-500 hover:text-white'}`}>
               {tab === 'events' ? 'Event Management' : 'Database Transaksi'}
             </button>
           ))}
        </div>

        {activeTab === 'events' ? (
          <div className="space-y-12">
            <div className="grid grid-cols-12 gap-8 animate-fade-in">
              {/* LEFT: FORM EVENT */}
              <div className="col-span-12 lg:col-span-3 bg-slate-900/30 border border-white/5 rounded-[40px] p-10 h-fit">
                <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
                  {isEditing ? <Pencil size={18} className="text-amber-400"/> : <Plus size={18} className="text-blue-500"/>}
                  {isEditing ? 'Edit Event' : 'Buat Event Baru'}
                </h2>
                <form onSubmit={handleSubmitEvent} className="space-y-5">
                  <input type="text" placeholder="Nama Event" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-sm" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})} required />
                  <select className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-4 text-sm" value={eventForm.status} onChange={e => setEventForm({...eventForm, status: e.target.value})}>
                    <option value="draft">📁 Draft</option>
                    <option value="published">🌐 Published</option>
                  </select>
                  <input type="date" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-4 text-sm" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})} required />
                  <input type="number" placeholder="Harga Dasar" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-sm" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: e.target.value})} required />
                  <button type="submit" className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest ${isEditing ? 'bg-amber-500 text-black' : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'}`}>
                    SIMPAN DATA EVENT
                  </button>
                </form>
              </div>

              {/* MIDDLE: KATALOG */}
              <div className="col-span-12 lg:col-span-5 space-y-6">
                <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3"><Layers size={18} className="text-blue-500"/> Katalog</h2>
                <div className="grid grid-cols-1 gap-6">
                  {events.map(ev => (
                    <div key={ev.id} onClick={() => setSelectedEventId(ev.id)} className={`p-8 rounded-[40px] border transition-all cursor-pointer relative ${selectedEventId === ev.id ? 'bg-blue-600/10 border-blue-500/50' : 'bg-slate-900/20 border-white/5 hover:bg-white/5'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md border ${ev.status === 'published' ? 'text-green-400 border-green-400/20 bg-green-400/5' : 'text-slate-500 border-white/5'}`}>{ev.status}</span>
                        <button onClick={(e) => {e.stopPropagation(); setIsEditing(true); setEditEventId(ev.id); setEventForm(ev);}} className="text-slate-700 hover:text-white"><Pencil size={14} /></button>
                      </div>
                      <h3 className="font-bold text-white uppercase">{ev.title}</h3>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">{ev.venue || 'Lokasi Belum Diatur'}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: TAMBAH SECTION */}
              <div className="col-span-12 lg:col-span-4 bg-slate-900/30 border border-white/5 rounded-[40px] p-10 h-fit">
                <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3"><Plus size={18} className="text-cyan-500"/> Tambah Section</h2>
                <form onSubmit={handleAddSection} className="space-y-5">
                  <input type="text" placeholder="Level (ex: Tribun Atas)" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-sm" value={secForm.floor_name} onChange={e => setSecForm({...secForm, floor_name: e.target.value})} required />
                  <input type="text" placeholder="Nama Section (ex: VIP A)" className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-6 text-sm" value={secForm.name} onChange={e => setSecForm({...secForm, name: e.target.value})} required />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="number" placeholder="Baris" className="bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-4 text-sm" value={secForm.row_count} onChange={e => setSecForm({...secForm, row_count: parseInt(e.target.value)})} />
                    <input type="number" placeholder="Kolom" className="bg-slate-950/50 border border-white/5 rounded-2xl py-4 px-4 text-sm" value={secForm.col_count} onChange={e => setSecForm({...secForm, col_count: parseInt(e.target.value)})} />
                  </div>
                  <button type="submit" disabled={!selectedEventId} className="w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest bg-slate-800 text-slate-500 hover:bg-cyan-600 hover:text-white transition-all disabled:opacity-30">
                    GENERATE LAYOUT
                  </button>
                </form>
              </div>
            </div>

            {/* BOTTOM: LIVE MONITOR */}
            {selectedEventId && (
              <div className="mt-12 pt-12 border-t border-white/5 animate-fade-in-up">
                <h2 className="text-2xl font-black italic uppercase text-white mb-8">Live Visual Monitor</h2>
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide">
                  {sections.map(sec => (
                    <button key={sec.id} onClick={() => setSelectedSectionId(sec.id)} className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${selectedSectionId === sec.id ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/5 text-slate-400 hover:text-white'}`}>
                      {sec.name} ({sec.floor_name})
                    </button>
                  ))}
                </div>
                {selectedSectionId && (
                  <div className="mt-6 bg-slate-900/20 border border-white/5 rounded-[60px] p-10 flex justify-center overflow-hidden">
                    <SeatMonitor section={sections.find(s => s.id === selectedSectionId)} />
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* TAB TRANSAKSI */
          <div className="bg-slate-900/20 border border-white/5 rounded-[40px] overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                      <th className="p-8">Pelanggan</th>
                      <th className="p-8">Event</th>
                      <th className="p-8">Jumlah Bayar</th>
                      <th className="p-8">Status</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm font-medium">
                   {transactions.map(t => (
                      <tr key={t.id} className="hover:bg-white/5 transition-colors">
                         <td className="p-8">
                            <p className="text-white font-bold">{t.customer_name}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{t.customer_email}</p>
                         </td>
                         <td className="p-8 text-slate-400 uppercase text-xs font-bold">{t.events?.title || 'Event'}</td>
                         <td className="p-8 font-black text-blue-500">{formatIDR(t.total_amount)}</td>
                         <td className="p-8">
                            <span className="bg-green-500/10 text-green-500 px-4 py-1.5 rounded-full text-[9px] font-black uppercase border border-green-500/20">Lunas</span>
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