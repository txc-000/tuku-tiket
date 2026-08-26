import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";
import echo from "../lib/echo";
import { fetchCurrentUser } from "../lib/auth";
import { guardDemo } from "../lib/demoMode";
import { getSeatGridCoords, SEAT_SIZE, SEAT_GAP } from "../lib/seatLayout";
import Navbar from "../components/Navbar";
import VenueMap from "../components/VenueMap";
import PaymentModal from "../components/PaymentModal";
import { Loader2, ArrowLeft, X } from "lucide-react";

export default function BookingPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [sections, setSections] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    fetchData();
    fetchCurrentUser().then(setProfile);

    // Real-time listener untuk update status kursi, di-scope ke event ini saja
    echo.channel(`event.${eventId}.seats`).listen('.seat.updated', (seat) => {
      setSections(curr => curr.map(sec => (
        sec.id === seat.section_id
          ? { ...sec, seats: sec.seats.map(s => (s.id === seat.id ? { ...s, ...seat } : s)) }
          : sec
      )));
    });

    return () => { echo.leave(`event.${eventId}.seats`); };
  }, [eventId]);

  async function fetchData() {
    setLoading(true);
    setLoadError(null);
    try {
      const [{ data: evRes }, { data: secRes }] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/events/${eventId}/sections`),
      ]);
      setEvent(evRes.data);
      const fetchedSections = secRes.data || [];
      setSections(fetchedSections);
      setActiveSectionId(prev => prev ?? fetchedSections[0]?.id ?? null);
    } catch (err) {
      console.error("Gagal memuat data event:", err.message);
      setLoadError("Gagal memuat data event. Periksa koneksi kamu dan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  // Race condition kursi ganda ditangani server-side lewat row locking
  // Postgres (lihat BookingController@store di backend) — tidak perlu lagi
  // filter+rollback manual di sini.
  const confirmBooking = async (guestInfo) => {
    if (guardDemo()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/transactions', {
        event_id: eventId,
        seat_ids: cart.map(s => s.id),
        customer_name: profile?.full_name || guestInfo?.name,
        customer_email: profile?.email || guestInfo?.email,
      });

      // Simulasi Webhook: Otomatis 'paid' setelah 3 detik
      const transactionId = data.data.id;
      setTimeout(() => {
        api.post(`/transactions/${transactionId}/simulate-payment`).catch(() => {});
      }, 3000);

      alert("Pemesanan Berhasil! Menunggu verifikasi pembayaran...");
      setCart([]);
      setShowPayment(false);
      navigate('/my-tickets'); // Langsung ke halaman tiket saya

    } catch (err) {
      if (err.response?.status === 409) {
        // Salah satu kursi baru saja diambil orang lain
        await fetchData();
        setCart([]);
        setShowPayment(false);
        alert(err.response.data.message || "Yah, kehabisan! Salah satu kursi yang kamu pilih baru saja diambil orang lain.");
      } else {
        alert("Gagal memproses: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSeat = (seat, section) => {
    if (seat.status !== 'available') return;
    const exists = cart.find(i => i.id === seat.id);
    if (exists) setCart(cart.filter(i => i.id !== seat.id));
    else setCart([...cart, { ...seat, price: section.price }]);
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
  const activeSection = sections.find(s => s.id === activeSectionId);

  // Kelompokkan kursi section aktif per baris, seperti pemilihan kursi bioskop —
  // baris lurus, jarak tetap, tidak akan pernah tumpuk atau tidak simetris
  // apa pun jumlah baris/kolomnya (lihat src/lib/seatLayout.js).
  const rows = [];
  if (activeSection) {
    const seatsSorted = [...activeSection.seats].sort((a, b) => a.id - b.id);
    seatsSorted.forEach((seat, i) => {
      const { row } = getSeatGridCoords(activeSection, i);
      if (!rows[row]) rows[row] = [];
      rows[row].push(seat);
    });
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col overflow-x-hidden">
      <Navbar />

      <div className="flex-1 pt-28 pb-16 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <button onClick={() => navigate('/')} className="p-3 bg-white/5 rounded-2xl transition-all active:scale-90 shrink-0"><ArrowLeft size={22}/></button>
            <div>
              <h1 className="font-black text-2xl md:text-3xl tracking-tighter uppercase italic">{event?.title}</h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{event?.venue}</p>
            </div>
          </div>

          {totalSeatCount === 0 ? (
            <div className="text-center py-32">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-1">Peta kursi belum tersedia</p>
              <p className="text-slate-600 text-xs">Admin belum mengatur layout kursi untuk event ini.</p>
            </div>
          ) : (
            <>
              {/* Denah venue — klik area yang mau diduduki */}
              <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Pilih Area Duduk</p>
              <VenueMap sections={sections} activeSectionId={activeSectionId} onSelect={setActiveSectionId} />

              {activeSection && (
                <div>
                  {/* Section aktif + Legenda */}
                  <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 mb-8">
                    <span className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: activeSection.color || '#475569' }} />
                      <span className="text-xs font-black uppercase tracking-wide">{activeSection.name}</span>
                    </span>
                    <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-600" /> Tersedia</span>
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-white" /> Dipilih</span>
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-rose-500" /> Ditahan</span>
                      <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-slate-900" /> Terjual</span>
                    </div>
                  </div>

                  {/* Deretan kursi */}
                  <div className="overflow-x-auto pb-4">
                    <div className="flex flex-col items-center gap-2 min-w-fit mx-auto">
                      {rows.map((rowSeats, rowIdx) => (
                        <div key={rowIdx} className="flex items-center gap-3">
                          <span className="w-5 text-right text-[10px] font-black text-slate-500 shrink-0">{rowSeats[0]?.row_label}</span>
                          <div className="flex" style={{ gap: SEAT_GAP }}>
                            {rowSeats.map(seat => {
                              const isSelected = !!cart.find(s => s.id === seat.id);
                              const isTaken = seat.status === 'sold' || seat.status === 'checked-in';
                              const isHeld = seat.status === 'booked' || seat.status === 'blocked';
                              const seatLabel = `${seat.row_label}${seat.seat_number}`;
                              const statusLabel = isTaken ? 'Terjual' : isHeld ? 'Tidak tersedia' : isSelected ? 'Dipilih' : 'Tersedia';

                              return (
                                <button
                                  key={seat.id}
                                  type="button"
                                  title={`Kursi ${seatLabel} · Rp ${Number(activeSection.price || 0).toLocaleString('id-ID')} · ${statusLabel}`}
                                  onClick={() => toggleSeat(seat, activeSection)}
                                  disabled={seat.status !== 'available'}
                                  className={`rounded-t-md border-b-2 flex items-center justify-center font-bold transition-all
                                    ${isTaken ? 'bg-slate-900 border-black opacity-40 grayscale cursor-not-allowed' :
                                      isHeld ? 'bg-rose-500 border-rose-700 text-rose-950 opacity-80 cursor-not-allowed' :
                                      isSelected ? 'bg-white border-slate-300 text-blue-600 scale-110 shadow-[0_0_12px_white] cursor-pointer' :
                                      'bg-slate-700 border-slate-800 text-slate-300 hover:bg-slate-600 hover:scale-110 cursor-pointer'}`}
                                  style={{ width: SEAT_SIZE, height: SEAT_SIZE, fontSize: SEAT_SIZE * 0.32 }}
                                >
                                  {seat.seat_number}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Booking Bar */}
      <div className="bg-slate-900/95 backdrop-blur-xl p-6 md:p-8 border-t border-white/5 z-[60] sticky bottom-0">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-end items-center gap-6 text-left">
          {cart.length > 0 && (
            <div className="flex gap-2 overflow-x-auto max-w-full md:max-w-xs py-1 order-3 md:order-none w-full md:w-auto md:mr-auto">
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

      {showPayment && (
        <PaymentModal
          total={cart.reduce((a,b)=>a+(Number(b.price)||0),0)}
          cart={cart}
          isGuest={!profile}
          onClose={() => setShowPayment(false)}
          onConfirm={confirmBooking}
        />
      )}
    </div>
  );
}
