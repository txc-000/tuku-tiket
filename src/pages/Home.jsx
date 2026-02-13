import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  Search, Calendar, MapPin, ArrowRight, 
  Music, Trophy, Mic2, Theater, Gamepad2, Star, Sparkles,
  Handshake, Zap, BarChart3, ShieldCheck // Ikon baru untuk Kerja Sama
} from 'lucide-react';
import Navbar from '../components/Navbar'; 

const heroBanner = "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop";

const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);

export default function Home() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'Semua', icon: Star },
    { name: 'Konser', icon: Music },
    { name: 'Olahraga', icon: Trophy },
    { name: 'Seminar', icon: Mic2 },
    { name: 'Teater', icon: Theater },
    { name: 'E-Sports', icon: Gamepad2 },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    setLoading(true);
    const { data } = await supabase.from('events').select('*').order('date', { ascending: true });
    
    if (data) {
      const fixedData = data.map(event => {
        const rawCat = event.category ? event.category.toLowerCase().trim() : '';
        let finalCategory = event.category || 'Lainnya';
        if (rawCat === 'sport' || rawCat === 'sports' || rawCat === 'olahraga') finalCategory = 'Olahraga';
        return { ...event, category: finalCategory };
      });
      setEvents(fixedData);
    }
    setLoading(false);
  }

  const filteredEvents = events.filter(ev => {
    const matchCategory = activeCategory === 'Semua' || ev.category === activeCategory;
    const matchSearch = ev.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans selection:bg-cyan-500">
      <Navbar />

      {/* --- HERO SECTION --- */}
      <div className="relative h-[850px] flex items-center justify-center overflow-hidden group">
        <div className="absolute inset-0 z-0">
          <img src={heroBanner} alt="Hero" className="w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-[3s]" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent"></div>
        </div>

        <div className="relative z-10 text-center max-w-5xl px-6 animate-fade-in-up mt-10">
          <h1 className="text-6xl md:text-[110px] font-black tracking-tighter mb-10 leading-none italic uppercase">
            Music of the <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-purple-300">Spheres</span>
          </h1>
          
          <div className="bg-white/10 p-3 rounded-full border border-white/20 backdrop-blur-xl max-w-2xl mx-auto flex items-center shadow-2xl mb-24 transition-all focus-within:ring-2 focus-within:ring-cyan-500/50">
            <div className="pl-6 text-white/70"><Search size={26}/></div>
            <input 
              type="text" 
              placeholder="Cari event atau lokasi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-white w-full px-6 py-4 text-xl placeholder:text-white/30"
            />
          </div>
        </div>
      </div>

      {/* --- KATEGORI --- */}
      <div className="max-w-7xl mx-auto px-8 -mt-36 relative z-20">
        <div className="bg-slate-900/80 border border-white/10 backdrop-blur-2xl p-6 rounded-[50px] shadow-2xl overflow-x-auto scrollbar-hide">
          <div className="flex justify-between md:justify-center items-center gap-8 min-w-max">
            {categories.map((cat) => (
              <button key={cat.name} onClick={() => setActiveCategory(cat.name)}
                className={`flex items-center gap-4 px-10 py-5 rounded-[30px] transition-all border ${
                  activeCategory === cat.name ? 'bg-gradient-to-r from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                }`}>
                <cat.icon size={22} />
                <span className="text-xs font-black uppercase tracking-widest">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- TRENDING EVENTS --- */}
      <div className="max-w-7xl mx-auto px-8 py-32">
        <div className="flex items-center gap-3 mb-10">
          <Sparkles className="text-cyan-400 animate-pulse" />
          <h2 className="text-5xl font-black italic uppercase tracking-tighter">Sedang Trending</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-14">
          {filteredEvents.map((event) => (
            <div 
              key={event.id} 
              onClick={() => navigate(`/book/${event.id}`)}
              className="group relative bg-slate-900/40 border border-white/5 rounded-[50px] overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-4 cursor-pointer"
            >
              <div className="h-[360px] overflow-hidden relative">
                <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute top-6 left-6 z-20">
                   <span className="backdrop-blur-xl border border-white/20 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-black/40">
                      {event.category}
                   </span>
                </div>
              </div>

              <div className="p-10 relative z-20 -mt-24">
                <div className="flex gap-4 text-[10px] font-black text-cyan-400 mb-8 uppercase tracking-widest">
                  <span className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/20 px-4 py-2 rounded-xl">
                    <Calendar size={14}/> {new Date(event.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                  </span>
                  <span className="flex items-center gap-2 bg-cyan-950/40 border border-cyan-500/20 px-4 py-2 rounded-xl truncate">
                    <MapPin size={14}/> {event.venue}
                  </span>
                </div>
                
                <h3 className="text-3xl font-black mb-12 leading-[1.1] group-hover:text-cyan-400 transition-colors line-clamp-2 min-h-[66px]">
                  {event.title}
                </h3>

                <div className="flex items-center justify-between border-t border-white/5 pt-10">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase font-black mb-2">Mulai Dari</p>
                    <p className="text-2xl font-black text-white">{formatIDR(event.price)}</p>
                  </div>
                  <button className="w-16 h-16 rounded-3xl bg-white text-black flex items-center justify-center group-hover:bg-cyan-500 group-hover:text-white transition-all shadow-xl group-hover:scale-110">
                    <ArrowRight size={28} className="-rotate-45 group-hover:rotate-0 transition-transform"/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- KERJA SAMA (PARTNERSHIP SECTION) --- */}
      <div className="max-w-7xl mx-auto px-8 py-32 border-t border-white/5">
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-white/10 rounded-[60px] p-16 relative overflow-hidden">
          {/* Ornamen Background */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px]"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest mb-8">
                <Handshake size={14} /> Partnership
              </div>
              <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter mb-8 leading-none">
                Ingin Menyelenggarakan <br/> <span className="text-cyan-400">Event Besar?</span>
              </h2>
              <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                TukuTiket menyediakan solusi manajemen tiket terlengkap dengan sistem pemetaan kursi visual, laporan penjualan real-time, dan sistem keamanan transaksi berlapis.
              </p>
              <button className="bg-white text-black px-10 py-5 rounded-full font-black uppercase text-sm tracking-widest hover:bg-cyan-400 transition-all shadow-2xl flex items-center gap-3 active:scale-95">
                Hubungi Tim Sales <ArrowRight size={18} />
              </button>
            </div>

            {/* List Keuntungan Kerja Sama */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: "Sistem Cepat", desc: "Tiket terkirim instan ke email pembeli.", icon: Zap, color: "text-yellow-400" },
                { title: "Visual Map", desc: "Denah kursi interaktif kelas dunia.", icon: MapPin, color: "text-cyan-400" },
                { title: "Analytics", desc: "Pantau revenue secara real-time.", icon: BarChart3, color: "text-purple-400" },
                { title: "Aman", desc: "Enkripsi data & proteksi penipuan.", icon: ShieldCheck, color: "text-green-400" },
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[40px] backdrop-blur-sm hover:bg-white/10 transition-colors group">
                  <item.icon className={`${item.color} mb-6 group-hover:scale-110 transition-transform`} size={32} />
                  <h4 className="font-black uppercase tracking-widest mb-2 text-sm">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- FOOTER CTA --- */}
      <div className="py-32 bg-slate-950 text-center border-t border-white/5">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-4">TukuTiket Indonesia</h2>
        <p className="text-slate-500 text-sm font-medium">© 2026 TukuTiket. Semua Hak Dilindungi Undang-Undang.</p>
      </div>
    </div>
  );
}