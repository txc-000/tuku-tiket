import { X, ShieldCheck, Info, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function PaymentModal({ total, cart, onClose, onConfirm }) {
  const [verifying, setVerifying] = useState(false);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fade-in text-left">
      <div className="bg-slate-900/80 border border-white/10 w-full max-w-md rounded-[40px] shadow-2xl animate-slide-up overflow-hidden">
        
        {/* Header Modal */}
        <div className="p-8 pb-0 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-blue-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Secure Payment</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-8 pt-6 text-center">
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Total Tagihan</p>
          <h2 className="text-4xl font-black text-white mb-8">Rp {total.toLocaleString('id-ID')}</h2>

          {/* QR CODE AREA */}
          <div className="bg-white p-6 rounded-[32px] inline-block mb-8 shadow-2xl shadow-blue-500/20">
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TUKUTIKET-${total}`} 
              alt="QRIS"
              className="w-44 h-44"
            />
          </div>

          {/* INSTRUKSI */}
          <div className="bg-white/5 rounded-2xl p-4 mb-8 text-left border border-white/5">
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black uppercase mb-2">
              <Info size={14}/> Instruksi
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Scan QRIS di atas dengan m-banking atau e-wallet. Pastikan nominal sesuai, lalu klik konfirmasi di bawah.
            </p>
          </div>

          <button 
            onClick={() => { setVerifying(true); setTimeout(onConfirm, 2000); }}
            disabled={verifying}
            className="w-full bg-blue-600 hover:bg-blue-400 text-white py-5 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/30"
          >
            {verifying ? <Loader2 className="animate-spin"/> : 'Konfirmasi Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  );
}