import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { QRCodeCanvas } from 'qrcode.react'; // QR Unik
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Ticket, Calendar, MapPin, ArrowLeft, Download, Armchair, Loader2 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);

export default function MyTickets() {
  const navigate = useNavigate();
  const [myTickets, setMyTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Email placeholder (Hubungkan dengan Auth jika sudah ada)
  const userEmail = "pembeli@example.com";

  useEffect(() => {
    fetchMyTickets();
  }, []);

  async function fetchMyTickets() {
    setLoading(true);
    try {
      // Mengambil data per kursi yang terhubung ke transaksi user
      const { data, error } = await supabase
        .from('seats')
        .select(`
          id, row_label, seat_number,
          sections (name, floor_name, price),
          transactions!inner (
            customer_email,
            events (title, date, venue, image)
          )
        `)
        .eq('transactions.customer_email', userEmail)
        .order('id', { ascending: false });

      if (error) throw error;
      setMyTickets(data || []);
    } catch (err) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const downloadPDF = async (ticketId) => {
    const element = document.getElementById(`ticket-card-${ticketId}`);
    const canvas = await html2canvas(element, { scale: 3, useCORS: true });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('l', 'mm', [150, 100]);
    pdf.addImage(imgData, 'PNG', 0, 0, 150, 100);
    pdf.save(`Tiket-${ticketId}.pdf`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans pb-20 text-left">
      <Navbar />
      <div className="max-w-5xl mx-auto px-8 pt-32">
        <header className="mb-16">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-500 hover:text-white mb-6 uppercase text-[10px] font-black tracking-widest transition-all">
            <ArrowLeft size={16}/> Kembali ke Jelajah
          </button>
          <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none mb-4">Tiket Saya</h1>
          <p className="text-slate-500 text-sm">Menampilkan {myTickets.length} tiket fisik yang terdaftar di akun Anda.</p>
        </header>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
        ) : myTickets.length > 0 ? (
          <div className="grid gap-12">
            {myTickets.map((ticket) => (
              <div key={ticket.id} id={`ticket-card-${ticket.id}`} className="group relative flex flex-col md:flex-row bg-slate-900/30 border border-white/5 rounded-[48px] overflow-hidden hover:border-blue-500/30 transition-all duration-500">
                <div className="md:w-80 h-56 md:h-auto overflow-hidden">
                  <img src={ticket.transactions.events?.image || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4"} alt="Event" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 p-10 flex flex-col justify-between border-r border-dashed border-white/10">
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <span className="bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">E-Ticket Confirmed</span>
                      <div className="flex items-center gap-2 text-cyan-400">
                         <Armchair size={16} />
                         <span className="text-sm font-black uppercase">{ticket.sections?.name} — {ticket.row_label}{ticket.seat_number}</span>
                      </div>
                    </div>
                    <h3 className="text-3xl font-black uppercase italic leading-none mb-8 tracking-tight">{ticket.transactions.events?.title}</h3>
                    <div className="grid grid-cols-2 gap-8 text-slate-400">
                      <div className="flex items-center gap-3"><Calendar size={20} className="text-blue-500"/><span className="text-xs font-bold uppercase">{new Date(ticket.transactions.events?.date).toLocaleDateString('id-ID')}</span></div>
                      <div className="flex items-center gap-3"><MapPin size={20} className="text-blue-500"/><span className="text-xs font-bold uppercase truncate">{ticket.transactions.events?.venue}</span></div>
                    </div>
                  </div>
                  <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-end">
                    <p className="text-xl font-black text-white italic">{formatIDR(ticket.sections?.price)}</p>
                    <button onClick={() => downloadPDF(ticket.id)} className="flex items-center gap-3 bg-white/5 hover:bg-white hover:text-black px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                       <Download size={16}/> Save PDF
                    </button>
                  </div>
                </div>
                <div className="bg-slate-900/60 p-12 flex flex-col items-center justify-center min-w-[260px] text-center border-l border-white/5">
                   <div className="bg-white p-5 rounded-[32px] mb-6"><QRCodeCanvas value={ticket.id.toString()} size={100} level={"H"} /></div>
                   <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Unique Ticket ID</p>
                   <p className="text-xs font-black text-blue-500 font-mono italic">TK-{ticket.id.toString().padStart(6, '0')}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-40 bg-slate-900/20 rounded-[64px] border border-dashed border-white/10">
            <Ticket className="mx-auto text-slate-800 mb-8 opacity-20" size={100} />
            <h2 className="text-2xl font-black uppercase tracking-widest text-slate-600 italic">Belum Ada Tiket</h2>
          </div>
        )}
      </div>
    </div>
  );
}