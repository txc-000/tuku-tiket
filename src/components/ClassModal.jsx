import { X, CheckCircle, Info, Map } from 'lucide-react';

export default function ClassModal({ seat, section, onClose, onBook, isSelected }) {
  if (!seat) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl animate-slide-up text-left">
        
        {/* Banner Kelas Berdasarkan Lokasi */}
        <div className="relative h-44 bg-slate-800">
          <img 
            src={section.view_image || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?q=80&w=1000"} 
            className="w-full h-full object-cover opacity-60"
            alt="Class Banner"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
          <div className="absolute bottom-4 left-6">
            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-1">
              <Map size={12} /> Area: {section.name.split(' ')[1] || 'Center'}
            </div>
            <h3 className="text-2xl font-black text-white">{section.name}</h3>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Nomor Kursi</span>
              <span className="text-2xl font-black text-white">{seat.row_label}{seat.seat_number}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 text-sm font-bold uppercase tracking-wider">Harga Kelas</span>
              <span className="text-xl font-bold text-blue-500">Rp {section.price?.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button 
            onClick={() => { onBook(seat, section); onClose(); }}
            className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all ${
              isSelected 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white' 
              : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-600/20'
            }`}
          >
            <CheckCircle size={20} />
            {isSelected ? 'Batalkan Pilihan' : 'Pilih Kursi Ini'}
          </button>
        </div>
      </div>
    </div>
  );
}