import { useState } from 'react';
import { ChevronDown, MapPin } from 'lucide-react';

// Preset tribun umum — dulu ini yang hardcode di STAND_CONFIG (BookingPage.jsx)
// sebelum posisi section jadi data. Sekarang cuma jadi titik awal yang gampang
// dipilih admin, bukan satu-satunya pilihan; nilainya tetap data biasa yang
// bisa disesuaikan lagi di bagian "Atur Manual".
const PRESETS = [
  { key: 'east', label: 'VIP East', angle_start: -45, angle_end: 45, radius_inner: 220, radius_outer: 280, color: '#2563eb' },
  { key: 'west', label: 'VIP West', angle_start: 135, angle_end: 225, radius_inner: 220, radius_outer: 280, color: '#4f46e5' },
  { key: 'north', label: 'North Stand', angle_start: -135, angle_end: -45, radius_inner: 250, radius_outer: 340, color: '#ea580c' },
  { key: 'south', label: 'South Stand', angle_start: 45, angle_end: 135, radius_inner: 250, radius_outer: 340, color: '#d97706' },
];

const VIEWBOX = 380; // setengah lebar viewBox SVG (persegi -VIEWBOX..VIEWBOX)

// Preview mini yang gambar kursi sungguhan pakai rumus yang sama persis
// dengan BookingPage.jsx, biar admin lihat hasil aslinya, bukan cuma sketsa.
function LayoutPreview({ value }) {
  const { angle_start = -45, angle_end = 45, radius_inner = 200, radius_outer = 260, color = '#2563eb', row_count = 4, col_count = 8 } = value;
  const rows = Math.max(1, Math.min(Number(row_count) || 1, 14));
  const cols = Math.max(1, Math.min(Number(col_count) || 1, 24));
  const angleStep = (angle_end - angle_start) / (cols > 1 ? cols - 1 : 1);

  const dots = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const angle = angle_start + col * angleStep;
      const rad = (angle * Math.PI) / 180;
      const radius = radius_inner + ((radius_outer - radius_inner) / (rows > 1 ? rows - 1 : 1)) * row;
      const x = Math.cos(rad) * radius;
      const y = Math.sin(rad) * radius;
      dots.push({ x, y, key: `${row}-${col}` });
    }
  }

  return (
    <svg viewBox={`-${VIEWBOX} -${VIEWBOX} ${VIEWBOX * 2} ${VIEWBOX * 2}`} className="w-full aspect-square bg-black/40 rounded-2xl border border-white/10">
      <rect x={-90} y={-55} width={180} height={110} rx={10} fill="#052e1c" stroke="#22c55e33" />
      <text x={0} y={4} textAnchor="middle" fill="#22c55e55" fontSize="14" fontWeight="900" letterSpacing="4">PITCH</text>
      {dots.map((d) => (
        <circle key={d.key} cx={d.x} cy={d.y} r={7} fill={color} />
      ))}
    </svg>
  );
}

export default function SectionLayoutPicker({ value, onChange }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

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

      {/* Preview + preset dalam satu pandangan, ini yang paling sering dipakai */}
      <div className="flex gap-3 mb-3">
        <div className="w-24 shrink-0">
          <LayoutPreview value={value} />
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2 content-start">
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
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced((v) => !v)}
        className="w-full flex items-center justify-between text-[8px] font-black uppercase text-slate-500 hover:text-slate-300 transition-colors py-1"
      >
        Atur Manual (Sudut & Radius)
        <ChevronDown size={12} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
      </button>

      {showAdvanced && (
        <div className="mt-2 space-y-3 animate-fade-in">
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
