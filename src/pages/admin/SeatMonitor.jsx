import { useEffect, useState, useRef } from 'react';
import api from '../../lib/api';
import echo from '../../lib/echo';
import { getSeatPosition, getSectionSeatSize } from '../../lib/seatLayout';
import {
  X, Loader2, User, Mail,
  Lock, Trash2, ZoomIn, ZoomOut, RefreshCcw
} from 'lucide-react';

const formatIDR = (price) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(price || 0);

export default function SeatMonitor({ section }) {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [zoomPercent, setZoomPercent] = useState(100);

  // STATE VISUAL
  // Kita pisahkan state React (untuk UI tombol) dan ref (untuk animasi licin)
  const transform = useRef({ x: 0, y: 0, k: 1 });
  const containerRef = useRef(null);
  const contentRef = useRef(null); // Ref ke div pembungkus kursi

  const isDragging = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });
  const startTransform = useRef({ x: 0, y: 0 }); // Posisi awal saat mulai drag

  // --- FUNGSI UPDATE VISUAL LANGSUNG (TANPA RE-RENDER REACT) ---
  const updateTransform = () => {
    if (contentRef.current) {
      const { x, y, k } = transform.current;
      contentRef.current.style.transform = `translate(${x}px, ${y}px) scale(${k})`;
    }
  };

  useEffect(() => {
    if (!section?.id) return;

    // Reset posisi saat ganti section
    transform.current = { x: 0, y: 0, k: 1 };
    updateTransform(); // Update posisi visual langsung

    const fetchSeats = async () => {
      setLoading(true);
      const { data } = await api.get(`/admin/sections/${section.id}/seats`);
      setSeats(data.data || []);
      setLoading(false);
    };
    fetchSeats();

    // Sudah di-scope ke section ini lewat nama channel-nya, seperti sebelumnya
    echo.channel(`section.${section.id}.seats`).listen('.seat.updated', (seat) => {
      setSeats(prev => prev.map(s => (s.id === seat.id ? { ...s, ...seat } : s)));
    });

    return () => echo.leave(`section.${section.id}.seats`);
  }, [section]);

  // --- LOGIKA DRAG / GESER (PANNING) ---
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    startPan.current = { x: e.clientX, y: e.clientY };
    startTransform.current = { ...transform.current }; // Simpan posisi awal

    // Ubah cursor jadi grabbing
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();

    const dx = e.clientX - startPan.current.x;
    const dy = e.clientY - startPan.current.y;

    // Update ref langsung (sangat cepat)
    transform.current.x = startTransform.current.x + dx;
    transform.current.y = startTransform.current.y + dy;

    // Panggil update visual
    requestAnimationFrame(updateTransform);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const handleZoom = (delta) => {
    const newScale = Math.max(0.2, Math.min(transform.current.k + delta, 5));
    transform.current.k = newScale;
    updateTransform();
    setZoomPercent(Math.round(newScale * 100));
  };

  const handleSeatClick = (seat, e) => {
    e.stopPropagation();
    // Deteksi jika user sebenarnya sedang drag (bukan klik murni)
    if (isDragging.current) return;
    setSelectedSeat(seat);
  };

  const handleToggleBlock = async () => {
    if (!selectedSeat) return;
    const { data } = await api.patch(`/admin/seats/${selectedSeat.id}/toggle-block`);
    const newStatus = data.data.status;
    setSelectedSeat(prev => ({ ...prev, status: newStatus }));
    // Update local state biar warna berubah instan
    setSeats(prev => prev.map(s => s.id === selectedSeat.id ? { ...s, status: newStatus } : s));
  };

  const handleDeleteSeat = async () => {
    if (!selectedSeat) return;
    if (confirm(`Hapus kursi ${selectedSeat.row_label}${selectedSeat.seat_number}?`)) {
      await api.delete(`/admin/seats/${selectedSeat.id}`);
      setSeats(prev => prev.filter(s => s.id !== selectedSeat.id));
      setSelectedSeat(null);
    }
  };

  if (!section) return null;

  const sold = seats.filter(s => s.status === 'sold').length;
  const blocked = seats.filter(s => s.status === 'blocked').length;
  const currentRevenue = sold * (section.price || 0);
  // Ini fungsi yang SAMA PERSIS dipakai BookingPage.jsx (src/lib/seatLayout.js) —
  // apa yang admin lihat di sini sekarang dijamin sama dengan yang pelanggan
  // lihat, tidak ada lagi dua rumus posisi yang bisa beda hasil.
  const seatSize = getSectionSeatSize(section);

  return (
    <div className="space-y-8 pb-10 relative h-full">

      {/* POPUP DETAIL (MODAL) */}
      {selectedSeat && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" onClick={() => setSelectedSeat(null)}>
          <div className="bg-slate-900 border border-white/10 p-8 rounded-[32px] shadow-2xl max-w-sm w-full relative animate-scale-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedSeat(null)} className="absolute top-5 right-5 text-slate-500 hover:text-white"><X size={24}/></button>
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl font-black shadow-lg ${
                selectedSeat.status === 'sold' ? 'bg-red-600' : selectedSeat.status === 'blocked' ? 'bg-slate-600' : 'bg-green-500'
              }`}>
                {selectedSeat.row_label}{selectedSeat.seat_number}
              </div>
              <h3 className="text-xl font-bold uppercase text-white">
                {selectedSeat.status === 'sold' ? 'TERJUAL' : selectedSeat.status === 'blocked' ? 'DIBLOKIR' : 'TERSEDIA'}
              </h3>
            </div>

            {selectedSeat.status === 'sold' ? (
              <div className="space-y-4 bg-white/5 p-6 rounded-2xl">
                 <div className="flex gap-4 items-center"><User className="text-blue-500"/><p>{selectedSeat.guest_name || 'Tamu'}</p></div>
                 <div className="flex gap-4 items-center"><Mail className="text-purple-500"/><p className="truncate w-40">{selectedSeat.guest_email || '-'}</p></div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-center text-2xl font-black text-green-500">{formatIDR(section.price)}</p>
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleToggleBlock} className="py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold flex items-center justify-center gap-2"><Lock size={14}/> {selectedSeat.status==='blocked'?'Buka':'Block'}</button>
                  <button onClick={handleDeleteSeat} className="py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white rounded-xl font-bold flex items-center justify-center gap-2"><Trash2 size={14}/> Hapus</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STATISTIK */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-900/30 border border-blue-500/20 p-6 rounded-[32px]">
            <p className="text-[9px] uppercase font-bold text-blue-300">Revenue</p>
            <p className="text-2xl font-black italic">{formatIDR(currentRevenue)}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px]">
            <p className="text-[9px] uppercase font-bold text-slate-500">Terjual</p>
            <p className="text-2xl font-black italic text-red-500">{sold}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px]">
            <p className="text-[9px] uppercase font-bold text-slate-500">Blocked</p>
            <p className="text-2xl font-black italic text-slate-400">{blocked}</p>
        </div>
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[32px]">
            <p className="text-[9px] uppercase font-bold text-slate-500">Total Kursi</p>
            <p className="text-2xl font-black italic text-green-500">{seats.length}</p>
        </div>
      </div>

      {/* MONITOR VISUAL (CANVAS) */}
      <div
        ref={containerRef}
        className="bg-slate-950 border border-white/10 rounded-[40px] h-[650px] relative overflow-hidden cursor-grab active:cursor-grabbing select-none group"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={(e) => { e.preventDefault(); handleZoom(e.deltaY > 0 ? -0.1 : 0.1); }}
      >

        {/* PANEL ZOOM (POJOK KANAN) */}
        <div className="absolute top-6 right-6 flex flex-col gap-2 z-10" onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => handleZoom(0.2)} className="bg-slate-800 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg border border-white/10 active:scale-95 transition-all"><ZoomIn size={20}/></button>
          <button onClick={() => handleZoom(-0.2)} className="bg-slate-800 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg border border-white/10 active:scale-95 transition-all"><ZoomOut size={20}/></button>
          <button onClick={() => { transform.current={x:0,y:0,k:1}; updateTransform(); setZoomPercent(100); }} className="bg-slate-800 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg border border-white/10 active:scale-95 transition-all"><RefreshCcw size={20}/></button>
          <div className="bg-black/50 text-white text-[10px] font-bold py-1 rounded-lg text-center backdrop-blur-sm">{zoomPercent}%</div>
        </div>

        {loading ? (
           <div className="w-full h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={48}/></div>
        ) : (
          <div ref={contentRef} className="absolute inset-0" style={{ transformOrigin: '50% 50%' }}>
            {seats.map((seat, idx) => {
              const { x, y, rotation } = getSeatPosition(section, idx);

              let colorClass = 'bg-green-500 border-green-700';
              if (seat.status === 'sold') colorClass = 'bg-red-600 border-red-800';
              if (seat.status === 'blocked') colorClass = 'bg-slate-600 border-slate-800';

              return (
                <div
                  key={seat.id}
                  onClick={(e) => handleSeatClick(seat, e)}
                  title={`${seat.row_label}${seat.seat_number}`}
                  className={`absolute rounded-t-sm border-b-2 flex items-center justify-center font-black text-white cursor-pointer hover:brightness-125 transition-all ${colorClass}`}
                  style={{
                    left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)`,
                    width: seatSize, height: seatSize, fontSize: Math.max(6, seatSize * 0.26),
                    transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                  }}
                >
                  <span style={{ transform: `rotate(${-rotation}deg)` }}>{seat.row_label}{seat.seat_number}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
