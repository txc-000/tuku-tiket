import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import ClassModal from "../components/ClassModal";
import PaymentModal from "../components/PaymentModal";
import { Loader2, ArrowLeft } from "lucide-react";

const STAND_CONFIG = {
  "VIP East":    { start: -45,  end: 45,   inner: 220, outer: 280, color: "bg-blue-600 border-blue-800" },
  "VIP West":    { start: 135,  end: 225,  inner: 220, outer: 280, color: "bg-indigo-600 border-indigo-800" },
  "North Stand": { start: -135, end: -45,  inner: 250, outer: 340, color: "bg-orange-600 border-orange-800" },
  "South Stand": { start: 45,   end: 135,  inner: 250, outer: 340, color: "bg-amber-600 border-amber-800" },
};

export default function BookingPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeModal, setActiveModal] = useState(null); 
  const [showPayment, setShowPayment] = useState(false);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchData();
    fetchUserProfile();

    // Real-time listener untuk update status kursi
    const channel = supabase.channel("live-seats").on("postgres_changes", 
      { event: "UPDATE", schema: "public", table: "seats" }, (p) => {
        setSections(curr => curr.map(sec => ({
          ...sec, seats: sec.seats.map(s => s.id === p.new.id ? p.new : s)
        })));
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  async function fetchUserProfile() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setProfile(data);
    }
  }

  async function fetchData() {
    setLoading(true);
    const { data: ev } = await supabase.from("events").select("*").eq("id", eventId).single();
    const { data: sec } = await supabase.from("sections").select("*, seats(*)").eq("event_id", eventId);
    setEvent(ev);
    setSections(sec || []);
    setLoading(false);
  }

  // --- LOGIKA UTAMA: SIMULASI PAYMENT & TRANSACTION ID ---
  const confirmBooking = async () => {
    setLoading(true);
    try {
      const totalAmount = cart.reduce((a, b) => a + (Number(b.price) || 0), 0);

      // 1. Simpan Transaksi dengan status 'pending' (Simulasi Payment Gateway)
      const { data: trx, error: trxError } = await supabase
        .from('transactions')
        .insert([{
          event_id: eventId,
          customer_name: profile?.full_name || "User Testing",
          customer_email: profile?.email || "pembeli@example.com",
          total_amount: totalAmount,
          payment_status: 'pending' 
        }])
        .select()
        .single();

      if (trxError) throw trxError;

      // 2. Update status kursi & hubungkan ke transaction_id
      const { error: seatError } = await supabase
        .from('seats')
        .update({ 
          status: 'sold',
          transaction_id: trx.id 
        })
        .in('id', cart.map(s => s.id));

      if (seatError) throw seatError;

      // 3. Simulasi Webhook: Otomatis 'paid' setelah 3 detik
      setTimeout(async () => {
        await supabase.from('transactions').update({ payment_status: 'paid' }).eq('id', trx.id);
        console.log("Payment Verified Automatically");
      }, 3000);

      alert("Pemesanan Berhasil! Menunggu verifikasi pembayaran...");
      setCart([]);
      setShowPayment(false);
      navigate('/my-tickets'); // Langsung ke halaman tiket saya
      
    } catch (err) {
      alert("Gagal memproses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSection = (section) => {
    const seats = [...section.seats].sort((a, b) => a.id - b.id);
    const configKey = Object.keys(STAND_CONFIG).find(k => section.name.includes(k));
    const layout = STAND_CONFIG[configKey] || { start: -45, end: 45, inner: 200, outer: 260, color: "bg-slate-600" };
    const angleStep = (layout.end - layout.start) / (section.col_count - 1);

    return (
      <div className="absolute inset-0 pointer-events-none z-20">
        {seats.map((seat, i) => {
          const row = Math.floor(i / section.col_count);
          const col = i % section.col_count;
          const angle = layout.start + col * angleStep;
          const rad = (angle * Math.PI) / 180;
          const radius = layout.inner + ((layout.outer - layout.inner) / (section.row_count > 1 ? section.row_count - 1 : 1)) * row;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isSelected = cart.find(s => s.id === seat.id);

          return (
            <div
              key={seat.id}
              onClick={(e) => { e.stopPropagation(); if (seat.status === 'available') setActiveModal({ seat, section }); }}
              className={`absolute w-6 h-6 rounded-t-sm flex items-center justify-center text-[7px] font-bold cursor-pointer transition-all border-b-2 pointer-events-auto
                ${seat.status === 'sold' || seat.status === 'checked-in' ? 'bg-slate-800 border-slate-900 opacity-20 pointer-events-none' : 
                  isSelected ? 'bg-white border-slate-300 text-blue-600 scale-125 z-50 shadow-[0_0_15px_white]' : 
                  `${layout.color} text-white/70 hover:scale-125 hover:z-50`}`}
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: `translate(-50%, -50%) rotate(${angle + 90}deg)` }}
            >
              {seat.row_label}{seat.seat_number}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden">
      <Navbar />
      
      {/* Stadium Layout Design */}
      <div className="flex-1 relative flex items-center justify-center min-h-[850px]">
        <div className="relative z-0 w-72 h-44 bg-green-900/10 border-2 border-green-500/30 rounded-xl flex items-center justify-center shadow-2xl">
            <span className="text-green-500/40 font-black tracking-[1em] text-[10px] uppercase italic">PITCH</span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {sections.map(sec => <div key={sec.id} className="w-full h-full absolute pointer-events-none">{renderSection(sec)}</div>)}
        </div>
      </div>

      {/* Booking Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl p-8 border-t border-white/5 z-[60] sticky bottom-0">
        <div className="max-w-6xl mx-auto flex justify-between items-center text-left">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-2xl transition-all active:scale-90"><ArrowLeft size={24}/></button>
             <div>
               <h1 className="font-black text-2xl tracking-tighter uppercase">{event?.title}</h1>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{event?.venue}</p>
             </div>
          </div>
          <div className="flex items-center gap-10">
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{cart.length} Kursi Terpilih</p>
              <p className="text-4xl font-black text-blue-500">Rp {cart.reduce((a, b) => a + (Number(b.price) || 0), 0).toLocaleString('id-ID')}</p>
            </div>
            <button 
              onClick={() => setShowPayment(true)} 
              disabled={cart.length === 0} 
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-12 py-5 rounded-3xl font-black text-xl transition-all shadow-xl shadow-blue-600/30 active:scale-95"
            >
              Bayar Sekarang
            </button>
          </div>
        </div>
      </div>

      {activeModal && (
        <ClassModal 
          seat={activeModal.seat} 
          section={activeModal.section} 
          isSelected={cart.find(s => s.id === activeModal.seat.id)} 
          onBook={(s, sec) => { 
            const exists = cart.find(i => i.id === s.id); 
            if (exists) setCart(cart.filter(i => i.id !== s.id)); 
            else setCart([...cart, {...s, price: sec.price}]); 
          }} 
          onClose={() => setActiveModal(null)} 
        />
      )}

      {showPayment && (
        <PaymentModal 
          total={cart.reduce((a,b)=>a+(Number(b.price)||0),0)} 
          cart={cart} 
          onClose={() => setShowPayment(false)} 
          onConfirm={confirmBooking} 
        />
      )}
    </div>
  );
}