import { useState } from 'react';
import { ChevronDown, MapPin, LayoutGrid, CircleDashed } from 'lucide-react';
import { getSeatPosition, getSectionSeatSize } from '../lib/seatLayout';

// Preset tribun umum (mode Bowl) — dulu ini yang hardcode di STAND_CONFIG
// (BookingPage.jsx) sebelum posisi section jadi data. Sekarang cuma jadi
// titik awal yang gampang dipilih admin, bukan satu-satunya pilihan;
// nilainya tetap data biasa yang bisa disesuaikan lagi di "Atur Manual".
const PRESETS = [
  { key: 'east', label: 'VIP East', angle_start: -45, angle_end: 45, radius_inner: 220, radius_outer: 280, color: '#2563eb' },
  { key: 'west', label: 'VIP West', angle_start: 135, angle_end: 225, radius_inner: 220, radius_outer: 280, color: '#4f46e5' },
  { key: 'north', label: 'North Stand', angle_start: -135, angle_end: -45, radius_inner: 250, radius_outer: 340, color: '#ea580c' },
  { key: 'south', label: 'South Stand', angle_start: 45, angle_end: 135, radius_inner: 250, radius_outer: 340, color: '#d97706' },
];

const VIEWBOX = 380; // setengah lebar viewBox SVG (persegi -VIEWBOX..VIEWBOX)
const PREVIEW_MAX_ROWS = 20;
const PREVIEW_MAX_COLS = 30;

// Preview mini yang gambar kursi pakai fungsi yang SAMA PERSIS dengan
// BookingPage.jsx (src/lib/seatLayout.js) — bukan cuma sketsa, tapi hasil
// aslinya, termasuk ukuran kursi yang otomatis mengecil kalau section terlalu
// padat (baris kebanyakan untuk radius yang sempit).
function LayoutPreview({ value }) {
  const rows = Math.max(1, Math.min(Number(value.row_count) || 1, PREVIEW_MAX_ROWS));
  const cols = Math.max(1, Math.min(Number(value.col_count) || 1, PREVIEW_MAX_COLS));
  const section = { ...value, row_count: rows, col_count: cols };
  // Ukuran sungguhan, bukan diperbesar buat "kelihatan" — kalau dibesarkan
  // tanpa ikut membesarkan jaraknya, kotak kursi malah saling nabrak di
  // preview padahal versi aslinya renggang (ini yang sempat kejadian).
  const seatSize = getSectionSeatSize(section);
  const color = value.color || '#2563eb';

  const dots = [];
  for (let i = 0; i < rows * cols; i++) {
    const { x, y } = getSeatPosition(section, i);
    dots.push({ x, y, key: i });
  }

  return (
    <svg viewBox={`-${VIEWBOX} -${VIEWBOX} ${VIEWBOX * 2} ${VIEWBOX * 2}`} className="w-full aspect-square bg-black/40 rounded-2xl border border-white/10">
      <rect x={-90} y={-55} width={180} height={110} rx={10} fill="#052e1c" stroke="#22c55e33" />
      <text x={0} y={4} textAnchor="middle" fill="#22c55e55" fontSize="14" fontWeight="900" letterSpacing="4">PITCH</text>
      {dots.map((d) => (
        <rect key={d.key} x={d.x - seatSize / 2} y={d.y - seatSize / 2} width={seatSize} height={seatSize} rx={2} fill={color} />
      ))}
    </svg>
  );
}

export default function SectionLayoutPicker({ value, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isGrid = value.layout_type === 'grid';

  const applyPreset = (preset) => {
    onChange({
      angle_start: preset.angle_start,
      angle_end: preset.angle_end,
      radius_inner: preset.radius_inner,
      radius_outer: preset.radius_outer,
      color: preset.color,
    });
  };

  return (
    <div className="pt-2 border-t border-white/5">
      <p className="text-[8px] font-black uppercase mb-3 mt-3 text-slate-500 flex items-center gap-2"><MapPin size={10} /> Posisi di Peta</p>

      {/* Bentuk section: bowl (melengkung, cocok stadion) vs grid (lurus, cocok
          aula/teater — baris & kolom lurus tidak akan pernah tumpuk/renggang). */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          type="button"
          onClick={() => onChange({ layout_type: 'bowl' })}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${!isGrid ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
        >
          <CircleDashed size={12} /> Bowl
        </button>
        <button
          type="button"
          onClick={() => onChange({ layout_type: 'grid' })}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all border ${isGrid ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
        >
          <LayoutGrid size={12} /> Grid
        </button>
      </div>

      {/* Preview selalu tampil; preset tribun cuma relevan buat mode Bowl */}
      <div className="flex gap-3 mb-3">
        <div className="w-24 shrink-0">
          <LayoutPreview value={value} />
        </div>
        <div className="flex-1">
          {isGrid ? (
            <p className="text-[9px] text-slate-500 leading-relaxed">
              Baris & kolom lurus otomatis rapi — tinggal atur posisinya di bawah.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="flex items-center gap-2 bg-black/40 border border-white/10 hover:border-white/30 rounded-lg py-2 px-2 text-left transition-all"
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                  <span className="text-[9px] font-bold text-slate-300 leading-tight">{preset.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="w-full flex items-center justify-between text-[8px] font-black uppercase text-slate-500 hover:text-slate-300 transition-colors py-1"
      >
        Atur Manual {isGrid ? '(Posisi)' : '(Sudut & Radius)'}
        <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="mt-2 space-y-3 animate-fade-in">
          {isGrid && (
            <p className="text-[8px] text-slate-500 leading-relaxed -mt-1">
              Sudut & radius di sini cuma menentukan titik tengah blok kursinya, bukan bentuknya.
            </p>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[8px] font-black uppercase mb-1 text-slate-500">Sudut Mulai (°)</p>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center" value={value.angle_start} onChange={e => onChange({ angle_start: parseInt(e.target.value) })} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase mb-1 text-slate-500">Sudut Akhir (°)</p>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center" value={value.angle_end} onChange={e => onChange({ angle_end: parseInt(e.target.value) })} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase mb-1 text-slate-500">Radius Dalam</p>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center" value={value.radius_inner} onChange={e => onChange({ radius_inner: parseInt(e.target.value) })} />
            </div>
            <div>
              <p className="text-[8px] font-black uppercase mb-1 text-slate-500">Radius Luar</p>
              <input type="number" className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-xs text-white text-center" value={value.radius_outer} onChange={e => onChange({ radius_outer: parseInt(e.target.value) })} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="color" className="h-10 w-14 rounded-lg cursor-pointer bg-transparent border border-white/10" value={value.color} onChange={e => onChange({ color: e.target.value })} />
            <p className="text-[8px] font-black uppercase text-slate-500">Warna Section</p>
          </div>
        </div>
      )}
    </div>
  );
}
