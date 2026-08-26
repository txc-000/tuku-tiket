import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import Navbar from "../components/Navbar";
import ClassModal from "../components/ClassModal";
import PaymentModal from "../components/PaymentModal";
import { Loader2, ArrowLeft, X, ZoomIn, ZoomOut, RefreshCcw } from "lucide-react";

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
  const [loadError, setLoadError] = useState(null);
  const [profile, setProfile] = useState(null);
  const [zoom, setZoom] = useState(1);

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
      // Selalu pakai email dari auth session (bukan kolom profiles.email yang mungkin kosong/basi)
      setProfile({ ...data, email: user.email });
    }
  }

  async function fetchData() {
    setLoading(true);
    setLoadError(null);
    try {
      const { data: ev, error: evError } = await supabase.from("events").select("*").eq("id", eventId).single();
      if (evError) throw evError;
      const { data: sec, error: secError } = await supabase.from("sections").select("*, seats(*)").eq("event_id", eventId);
      if (secError) throw secError;
      setEvent(ev);
      setSections(sec || []);
    } catch (err) {
      console.error("Gagal memuat data event:", err.message);
      setLoadError("Gagal memuat data event. Periksa koneksi kamu dan coba lagi.");
    } finally {
      setLoading(false);
    }
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
      // PENTING: filter status='available' agar kursi yang barusan diambil orang lain
      // (race condition) tidak ikut ter-overwrite jadi 'sold'.
      const { data: updatedSeats, error: seatError } = await supabase
        .from('seats')
        .update({
          status: 'sold',
          transaction_id: trx.id
        })
        .in('id', cart.map(s => s.id))
        .eq('status', 'available')
        .select();

      if (seatError) throw seatError;

      if (!updatedSeats || updatedSeats.length !== cart.length) {
        // Sebagian kursi sudah diambil orang lain lebih dulu -> batalkan transaksi
        await supabase.from('transactions').delete().eq('id', trx.id);
        if (updatedSeats?.length) {
          await supabase.from('seats')
            .update({ status: 'available', transaction_id: null })
            .in('id', updatedSeats.map(s => s.id));
        }
        await fetchData();
        setCart([]);
        setShowPayment(false);
        alert("Yah, kehabisan! Salah satu kursi yang kamu pilih baru saja diambil orang lain. Silakan pilih kursi lain.");
        return;
      }

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
    // Hindari pembagian dengan 0 (NaN) saat section hanya punya 1 kolom kursi
    const angleStep = (layout.end - layout.start) / (section.col_count > 1 ? section.col_count - 1 : 1);

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
          const isTaken = seat.status === 'sold' || seat.status === 'checked-in';
          const isHeld = seat.status === 'booked' || seat.status === 'blocked';
          const seatLabel = `${seat.row_label}${seat.seat_number}`;
          const statusLabel = isTaken ? 'Terjual' : isHeld ? 'Tidak tersedia' : isSelected ? 'Dipilih' : 'Tersedia';

          return (
            <div
              key={seat.id}
              title={`${section.name} · Kursi ${seatLabel} · Rp ${Number(section.price || 0).toLocaleString('id-ID')} · ${statusLabel}`}
              onClick={(e) => { e.stopPropagation(); if (seat.status === 'available') setActiveModal({ seat, section }); }}
              className={`absolute w-7 h-7 rounded-t-sm flex items-center justify-center text-[7px] font-bold transition-all border-b-2 pointer-events-auto
                ${isTaken ? 'bg-slate-800 border-slate-900 opacity-25 grayscale cursor-not-allowed pointer-events-none' :
                  isHeld ? 'bg-rose-500 border-rose-700 text-rose-950 opacity-80 cursor-not-allowed pointer-events-none' :
                  isSelected ? 'bg-white border-slate-300 text-blue-600 scale-125 z-50 shadow-[0_0_15px_white] ring-2 ring-blue-400 cursor-pointer' :
                  `${layout.color} text-white/80 cursor-pointer hover:scale-125 hover:z-50 hover:brightness-125`}`}
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`, transform: `translate(-50%, -50%) rotate(${angle + 90}deg)` }}
            >
              {seatLabel}
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  if (loadError) return (
    <div className="h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-slate-300 font-bold">{loadError}</p>
      <div className="flex gap-3">
        <button onClick={fetchData} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl font-bold text-sm transition-all">Coba Lagi</button>
        <button onClick={() => navigate('/')} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-2xl font-bold text-sm transition-all">Kembali ke Beranda</button>
      </div>
    </div>
  );

  const totalSeatCount = sections.reduce((a, s) => a + (s.seats?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden">
      <Navbar />

      {/* Stadium Layout Design */}
      <div className="flex-1 relative flex items-center justify-center min-h-[850px] overflow-hidden">

        {totalSeatCount === 0 ? (
          <div className="text-center px-6">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Peta kursi belum tersedia</p>
            <p className="text-slate-600 text-xs">Admin belum mengatur layout kursi untuk event ini.</p>
          </div>
        ) : (
          <div
            className="relative"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease' }}
          >
            <div className="relative z-0 w-72 h-44 bg-green-900/10 border-2 border-green-500/30 rounded-xl flex items-center justify-center shadow-2xl">
              <span className="text-green-500/40 font-black tracking-[1em] text-[10px] uppercase italic">PITCH</span>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {sections.map(sec => <div key={sec.id} className="w-full h-full absolute pointer-events-none">{renderSection(sec)}</div>)}
            </div>
          </div>
        )}

        {/* Kontrol Zoom */}
        {totalSeatCount > 0 && (
          <div className="absolute top-6 right-6 flex flex-col gap-2 z-30">
            <button onClick={() => setZoom(z => Math.min(z + 0.2, 2.2))} className="bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-3 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90"><ZoomIn size={18} /></button>
            <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-3 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90"><ZoomOut size={18} /></button>
            <button onClick={() => setZoom(1)} className="bg-white/5 hover:bg-blue-600 border border-white/10 text-white p-3 rounded-full shadow-lg backdrop-blur-md transition-all active:scale-90"><RefreshCcw size={16} /></button>
          </div>
        )}

        {/* Legenda Status Kursi */}
        {totalSeatCount > 0 && (
          <div className="absolute top-6 left-6 z-30 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl px-5 py-4 space-y-2">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Keterangan</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-300"><span className="w-3 h-3 rounded-sm bg-slate-500" /> Tersedia</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300"><span className="w-3 h-3 rounded-sm bg-white" /> Dipilih</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300"><span className="w-3 h-3 rounded-sm bg-rose-500" /> Ditahan</div>
            <div className="flex items-center gap-2 text-[10px] text-slate-300"><span className="w-3 h-3 rounded-sm bg-slate-800 opacity-60" /> Terjual</div>
          </div>
        )}
      </div>

      {/* Booking Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl p-6 md:p-8 border-t border-white/5 z-[60] sticky bottom-0">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-6 text-left">
          <div className="flex items-center gap-4">
             <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-2xl transition-all active:scale-90"><ArrowLeft size={24}/></button>
             <div>
               <h1 className="font-black text-2xl tracking-tighter uppercase">{event?.title}</h1>
               <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{event?.venue}</p>
             </div>
          </div>

          {cart.length > 0 && (
            <div className="flex gap-2 overflow-x-auto max-w-full md:max-w-xs py-1 order-3 md:order-none w-full md:w-auto">
              {cart.map(s => (
                <div key={s.id} className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full pl-4 pr-1.5 py-1.5 shrink-0">
                  <span className="text-xs font-bold text-white">{s.row_label}{s.seat_number}</span>
                  <button
                    onClick={() => setCart(cart.filter(i => i.id !== s.id))}
                    className="p-1 hover:bg-red-500 rounded-full transition-colors"
                    title="Batalkan kursi ini"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

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