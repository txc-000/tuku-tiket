import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Calendar, MapPin, ArrowLeft, Download, Armchair, Loader2, Ticket as TicketIcon, Clock 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

// Helper format Rupiah
const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);

// Helper format Tanggal
const formatDate = (dateString) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });
};

export default function MyTickets() {
  const navigate = useNavigate();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // TODO: Ganti dengan user.email dari Context/Auth Session kamu
  const userEmail = "pembeli@example.com"; 

  useEffect(() => {
    fetchMyTickets();
  }, []);

  async function fetchMyTickets() {
    setLoading(true);
    try {
      // Mengambil data tiket + warna tema (theme_color) dari event
      const { data, error } = await supabase
        .from('seats')
        .select(`
          id, row_label, seat_number,
          sections (name, floor_name, price),
          transactions!inner (
            customer_email, 
            events (title, date, venue, image, theme_color) 
          )
        `)
        .eq('transactions.customer_email', userEmail)
        .order('id', { ascending: false });

      if (error) throw error;
      setMyTickets(data || []);
    } catch (err) {
      console.error("Error fetching tickets:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- LOGIKA DOWNLOAD PDF YANG SUDAH DIPERBAIKI ---
  const downloadPDF = async (ticketId) => {
    const element = document.getElementById(`ticket-card-${ticketId}`);
    const btn = element.querySelector('.download-btn'); 
    
    // 1. Sembunyikan tombol saat screenshot
    if(btn) btn.style.display = 'none'; 

    try {
      // 2. Capture elemen dengan resolusi tinggi (scale 2)
      const canvas = await html2canvas(element, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: null // Transparan agar sudut rounded terlihat bagus
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // 3. Kalkulasi Rasio (Agar PDF tidak gepeng/melebar)
      const pdfWidth = 200; // Lebar tetap (mm)
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width; // Tinggi menyesuaikan rasio asli
      
      const pdf = new jsPDF('l', 'mm', [pdfWidth, pdfHeight]);
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Tiket-${ticketId}.pdf`);
      
    } catch (error) {
      console.error("Gagal download tiket", error);
      alert("Maaf, terjadi kesalahan saat mengunduh tiket.");
    } finally {
      // 4. Munculkan kembali tombol
      if(btn) btn.style.display = 'flex'; 
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pb-20 selection:bg-white/20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 pt-32">
        {/* Header Section */}
        <header className="mb-12">
          <button onClick={() => navigate('/')} className="group flex items-center gap-2 text-zinc-500 hover:text-white mb-6 text-xs font-bold tracking-[0.2em] uppercase transition-colors">
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Kembali
          </button>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-2">
            Tiket <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-600">Saya</span>
          </h1>
          <p className="text-zinc-500 text-sm">Kelola tiket event aktif dan riwayat pembelian Anda.</p>
        </header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40">
             <Loader2 className="animate-spin text-white mb-4" size={40} />
             <p className="text-zinc-500 text-xs uppercase tracking-widest animate-pulse">Memuat Tiket...</p>
          </div>
        ) : myTickets.length > 0 ? (
          <div className="grid gap-12">
            {myTickets.map((ticket) => {
              // Menentukan warna tema (Default Cyan jika null)
              const accentColor = ticket.transactions.events?.theme_color || '#22d3ee';
              
              return (
                <div key={ticket.id} id={`ticket-card-${ticket.id}`} className="group relative w-full flex flex-col md:flex-row rounded-3xl overflow-hidden bg-zinc-900 shadow-2xl transition-all duration-300 hover:shadow-cyan-900/20">
                  
                  {/* Border Glow Effect (Dynamic Color) */}
                  <div className="absolute inset-0 rounded-3xl border border-white/5 group-hover:border-opacity-50 transition-colors pointer-events-none z-20"
                       style={{ borderColor: 'rgba(255,255,255,0.1)' }}></div>

                  {/* --- BAGIAN KIRI: GAMBAR & INFO UTAMA --- */}
                  <div className="relative flex-1 p-8 overflow-hidden flex flex-col justify-between min-h-[320px]">
                     
                     {/* Background Image + Overlay */}
                     <div className="absolute inset-0 z-0">
                        <img src={ticket.transactions.events?.image || "https://via.placeholder.com/800"} 
                             alt="Event" 
                             className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/90 to-transparent"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent"></div>
                     </div>

                     {/* Top Content */}
                     <div className="relative z-10 flex justify-between items-start">
                        <span className="backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-lg"
                              style={{ color: accentColor, backgroundColor: `${accentColor}15` }}>
                          Confirmed
                        </span>
                        
                        {/* Tombol Download PDF */}
                        <button onClick={() => downloadPDF(ticket.id)} 
                                className="download-btn flex items-center gap-2 bg-white text-black px-5 py-2 rounded-full text-[10px] font-black uppercase hover:scale-105 transition-transform">
                            <Download size={14}/> Save PDF
                        </button>
                     </div>

                     {/* Middle Content (Title) */}
                     <div className="relative z-10 my-6">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic leading-[0.9] text-white drop-shadow-2xl mb-4">
                          {ticket.transactions.events?.title}
                        </h2>
                        <div className="flex items-center gap-2 text-zinc-300 text-sm font-medium">
                          <MapPin size={18} style={{ color: accentColor }} /> 
                          {ticket.transactions.events?.venue}
                        </div>
                     </div>

                     {/* Bottom Grid (Details) */}
                     <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 gap-6 pt-6 border-t border-white/10">
                        <div>
                          <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1">Tanggal</p>
                          <div className="flex items-center gap-2 text-white font-bold text-sm">
                             <Calendar size={16} style={{ color: accentColor }}/>
                             {formatDate(ticket.transactions.events?.date)}
                          </div>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1">Waktu</p>
                          <div className="flex items-center gap-2 text-white font-bold text-sm">
                             <Clock size={16} style={{ color: accentColor }}/>
                             19:00 WIB
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase text-zinc-500 font-bold tracking-wider mb-1">Kursi</p>
                          <div className="flex items-center gap-2 font-black text-xl" style={{ color: accentColor }}>
                             <Armchair size={20}/>
                             {ticket.row_label}-{ticket.seat_number}
                          </div>
                        </div>
                     </div>
                  </div>

                  {/* --- BAGIAN TENGAH: GARIS SOBEKAN --- */}
                  <div className="relative hidden md:flex flex-col items-center justify-center bg-[#09090b] w-14 z-10">
                     {/* Notch Atas (Warna harus sama dengan Background Page Body) */}
                     <div className="absolute -top-6 w-8 h-8 bg-[#050505] rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]"></div>
                     {/* Garis Putus-putus */}
                     <div className="h-[80%] border-l-2 border-dashed border-zinc-700 opacity-30"></div>
                     {/* Notch Bawah */}
                     <div className="absolute -bottom-6 w-8 h-8 bg-[#050505] rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"></div>
                  </div>

                  {/* --- BAGIAN KANAN: QR CODE --- */}
                  <div className="relative md:w-[320px] bg-[#0c0c0e] p-8 flex flex-col items-center justify-center text-center border-l border-white/5 border-dashed md:border-none">
                      <div className="bg-white p-4 rounded-2xl mb-6 shadow-2xl">
                        <QRCodeCanvas value={`TICKET-${ticket.id}`} size={140} level={"H"} />
                      </div>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">Scan at Gate</p>
                      <p className="text-lg font-mono font-black text-zinc-300 tracking-wider bg-white/5 px-4 py-1 rounded-lg border border-white/5">
                        #{ticket.id.toString().padStart(6, '0')}
                      </p>
                      
                      <div className="mt-8 w-full">
                         <div className="flex justify-between items-center text-sm border-b border-dashed border-white/10 pb-3 mb-3">
                            <span className="text-zinc-500">Tipe</span>
                            <span className="font-bold">{ticket.sections?.name}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-zinc-500 text-xs uppercase">Total</span>
                            <span className="text-xl font-black" style={{ color: accentColor }}>
                              {formatIDR(ticket.sections?.price)}
                            </span>
                         </div>
                      </div>
                  </div>

                </div> 
              );
            })}
          </div>
        ) : (
          // --- EMPTY STATE ---
          <div className="flex flex-col items-center justify-center py-32 bg-zinc-900/30 rounded-[48px] border border-dashed border-white/5">
            <div className="bg-zinc-800 p-8 rounded-full mb-6 opacity-50">
               <TicketIcon size={64} className="text-zinc-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase italic">Belum Ada Tiket</h2>
            <p className="text-zinc-500 text-sm mb-8 max-w-md text-center">
              Anda belum memiliki tiket aktif. Tiket yang Anda beli akan muncul secara otomatis di halaman ini.
            </p>
            <button onClick={() => navigate('/')} className="px-10 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-cyan-400 hover:scale-105 transition-all">
              Beli Tiket Sekarang
            </button>
          </div>
        )}
      </div>
    </div>
  );
}