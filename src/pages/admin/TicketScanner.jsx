import { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { 
  ArrowLeft, CheckCircle2, XCircle, Camera, 
  RefreshCcw, Info, User, Ticket 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TicketScanner() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Inisialisasi scanner
    const scanner = new Html5QrcodeScanner("reader", { 
      fps: 10, 
      qrbox: { width: 280, height: 280 },
      aspectRatio: 1.0
    });

    scanner.render(async (decodedText) => {
      // decodedText berisi ID unik kursi/tiket
      handleValidation(decodedText, scanner);
    }, (err) => { /* Abaikan error scan yang sedang berjalan */ });

    return () => {
      scanner.clear().catch(error => console.error("Failed to clear scanner", error));
    };
  }, []);

  async function handleValidation(ticketId, scanner) {
    setLoading(true);
    try {
      // 1. Cek validitas tiket di database
      const { data: seat, error } = await supabase
        .from('seats')
        .select('*, sections(name, floor_name), transactions(customer_name, events(title))')
        .eq('id', ticketId)
        .single();

      if (error || !seat) {
        throw new Error("Tiket tidak ditemukan di database.");
      }

      // 2. Cek apakah tiket sudah pernah di-scan (Check-in ganda)
      if (seat.status === 'checked-in') {
        setScanResult({ 
          success: false, 
          msg: "Tiket ini sudah digunakan untuk check-in!",
          data: seat 
        });
      } else if (seat.status === 'sold') {
        // 3. Update status menjadi 'checked-in'
        const { error: updateError } = await supabase
          .from('seats')
          .update({ status: 'checked-in' })
          .eq('id', ticketId);

        if (updateError) throw updateError;

        setScanResult({ 
          success: true, 
          msg: "Check-in Berhasil! Silakan masuk.",
          data: seat 
        });
      } else {
        throw new Error("Status tiket tidak valid (Belum lunas).");
      }

      // Hentikan scanner jika hasil sudah keluar agar tidak scan berkali-kali
      scanner.clear();

    } catch (err) {
      setScanResult({ success: false, msg: err.message, data: null });
      scanner.clear();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#05070a] text-white flex flex-col items-center">
      {/* Header Minimalis */}
      <header className="w-full max-w-md p-8 flex items-center justify-between">
        <button onClick={() => navigate('/admin')} className="p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-black uppercase tracking-tighter italic">Gate Validator</h1>
          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gate 1 — Main Entrance</p>
        </div>
        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
          <Info size={18} />
        </div>
      </header>

      <main className="w-full max-w-md px-8 flex-1 flex flex-col items-center justify-center pb-20">
        {!scanResult ? (
          <div className="w-full space-y-10 animate-fade-in">
            {/* Area Scanner */}
            <div className="relative group">
              <div id="reader" className="rounded-[40px] overflow-hidden border-2 border-white/5 shadow-2xl bg-slate-900"></div>
              <div className="absolute inset-0 border-[20px] border-[#05070a] pointer-events-none rounded-[40px]"></div>
              
              {/* Overlay Animasi Scanning */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-scan z-10"></div>
            </div>

            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 text-blue-500">
                <Camera size={20} />
                <p className="text-xs font-black uppercase tracking-[0.2em]">Ready to Scan</p>
              </div>
              <p className="text-slate-500 text-[10px] font-medium max-w-[200px] mx-auto leading-relaxed">
                Posisikan QR Code di dalam kotak untuk validasi tiket penonton.
              </p>
            </div>
          </div>
        ) : (
          /* Tampilan Hasil Scan */
          <div className="w-full bg-slate-900/40 border border-white/5 rounded-[48px] p-10 text-center animate-fade-in-up">
            {scanResult.success ? (
              <CheckCircle2 size={100} className="text-green-500 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(34,197,94,0.3)]" />
            ) : (
              <XCircle size={100} className="text-red-500 mx-auto mb-8 drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]" />
            )}

            <h2 className="text-3xl font-black uppercase italic mb-2 tracking-tight">
              {scanResult.success ? "Access Granted" : "Access Denied"}
            </h2>
            <p className={`${scanResult.success ? 'text-green-400' : 'text-red-400'} text-xs font-bold uppercase tracking-widest mb-10`}>
              {scanResult.msg}
            </p>

            {scanResult.data && (
              <div className="bg-white/5 rounded-3xl p-6 mb-10 space-y-4 text-left border border-white/5">
                <div className="flex items-center gap-4">
                  <User size={16} className="text-slate-500" />
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase">Nama Penonton</p>
                    <p className="text-sm font-bold">{scanResult.data.transactions?.customer_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Ticket size={16} className="text-slate-500" />
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase">Section & Seat</p>
                    <p className="text-sm font-bold uppercase">{scanResult.data.sections?.name} — {scanResult.data.row_label}{scanResult.data.seat_number}</p>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-white text-black py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-3"
            >
              <RefreshCcw size={16} /> Scan Next Ticket
            </button>
          </div>
        )}
      </main>
    </div>
  );
}