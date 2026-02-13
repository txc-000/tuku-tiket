import { useState } from 'react';
import { Upload, Image as ImageIcon, Palette, Save } from 'lucide-react';

export default function TicketEditor({ initialData, onSave }) {
  // State untuk menyimpan konfigurasi desain
  const [design, setDesign] = useState({
    title: initialData?.title || "Nama Event Contoh",
    venue: initialData?.venue || "Lokasi Event",
    themeColor: initialData?.theme_color || "#06b6d4", // Default Cyan
    bannerUrl: initialData?.banner_url || "https://via.placeholder.com/800x400",
    ticketBg: initialData?.ticket_bg_image || null, // Jika null pakai warna gelap
  });

  const handleColorChange = (e) => setDesign({ ...design, themeColor: e.target.value });
  
  // (Di sini kamu perlu tambahkan fungsi upload ke Supabase Storage untuk gambar)
  // Untuk demo, kita pakai text input URL dulu.

  return (
    <div className="flex flex-col lg:flex-row gap-8 text-white">
      
      {/* 1. PANEL KONTROL (KIRI) */}
      <div className="w-full lg:w-1/3 bg-zinc-900 p-6 rounded-2xl border border-white/10 h-fit">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Palette size={20} className="text-blue-500"/> Kustomisasi Tiket
        </h3>

        {/* Upload Banner */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">Event Banner URL</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={design.bannerUrl}
              onChange={(e) => setDesign({...design, bannerUrl: e.target.value})}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        {/* Pilih Warna Tema */}
        <div className="mb-6">
          <label className="block text-sm text-zinc-400 mb-2">Warna Aksen (Tema)</label>
          <div className="flex items-center gap-3">
            <input 
              type="color" 
              value={design.themeColor}
              onChange={handleColorChange}
              className="h-10 w-10 rounded cursor-pointer bg-transparent"
            />
            <span className="text-sm font-mono">{design.themeColor}</span>
          </div>
        </div>

        <button onClick={() => onSave(design)} className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-lg font-bold flex justify-center gap-2 mt-4">
          <Save size={18} /> Simpan Desain
        </button>
      </div>

      {/* 2. LIVE PREVIEW (KANAN) */}
      <div className="flex-1 bg-black/50 p-8 rounded-2xl border border-dashed border-zinc-700 flex flex-col items-center justify-center">
        <p className="text-zinc-500 text-sm mb-4 uppercase tracking-widest">Live Preview Tiket</p>
        
        {/* --- KOMPONEN TIKET DUMMY (Mirip MyTickets tapi pakai state design) --- */}
        <div className="relative w-full max-w-2xl flex rounded-3xl overflow-hidden shadow-2xl bg-zinc-900 border border-white/5">
          
          {/* Background Image Preview */}
          <div className="relative flex-1 p-6 flex flex-col justify-between min-h-[250px]">
            <div className="absolute inset-0 z-0">
               <img src={design.bannerUrl} className="w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/80 to-transparent"></div>
            </div>

            <div className="relative z-10">
               <span style={{ color: design.themeColor, borderColor: design.themeColor }} className="border px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-black/30 backdrop-blur">
                 VIP ACCESS
               </span>
               <h2 className="text-3xl font-black uppercase italic mt-4 mb-1 drop-shadow-md">
                 {design.title}
               </h2>
               <p className="text-zinc-300 text-sm">{design.venue}</p>
            </div>
            
            <div className="relative z-10 mt-4 pt-4 border-t border-white/10 flex justify-between items-end">
               <div>
                  <p className="text-[10px] uppercase text-zinc-500">Theme Color Preview</p>
                  {/* Warna dinamis diaplikasikan di sini */}
                  <div className="h-2 w-20 rounded-full mt-1" style={{ backgroundColor: design.themeColor }}></div>
               </div>
            </div>
          </div>

          {/* Stub Kanan (Bagian QR) */}
          <div className="w-32 bg-zinc-800 border-l border-dashed border-zinc-600 flex items-center justify-center flex-col p-2">
             <div className="bg-white p-2 rounded mb-2">
                <div className="w-16 h-16 bg-black"></div>
             </div>
             <p className="text-[8px] uppercase text-zinc-500 text-center">Scan Here</p>
          </div>
        </div>
        {/* --- END PREVIEW --- */}

      </div>
    </div>
  );
}