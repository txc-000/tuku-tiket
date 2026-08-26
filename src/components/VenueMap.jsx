import { getSectionMapPosition } from '../lib/seatLayout';

// Zone width scales gently with how many seats-per-row the section has, so
// a wide General-Admission-style section reads as wider than a small VIP
// pocket — "sedikit melebar", not every zone forced into the same box.
function zoneWidth(section) {
  const cols = section.col_count || 1;
  return Math.max(120, Math.min(220, 90 + cols * 5));
}

export default function VenueMap({ sections, activeSectionId, onSelect }) {
  return (
    <div className="relative mx-auto mb-10" style={{ width: '100%', maxWidth: 900, height: 680 }}>
      {/* Panggung / Pitch di tengah */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-40 bg-green-900/10 border-2 border-green-500/30 rounded-xl flex items-center justify-center shadow-2xl z-10">
        <span className="text-green-500/40 font-black tracking-[0.6em] text-[10px] uppercase italic">Panggung</span>
      </div>

      {sections.map(sec => {
        const { x, y, angleDeg } = getSectionMapPosition(sec);
        const total = sec.seats.length;
        const available = sec.seats.filter(s => s.status === 'available').length;
        const isActive = sec.id === activeSectionId;
        const width = zoneWidth(sec);
        const height = 92;
        // Wedge shape via clip-path — narrower on the pitch-facing edge,
        // wider on the outer edge, so it reads as an arena "section" rather
        // than a plain rectangle.
        const clip = 'polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)';

        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => onSelect(sec.id)}
            className={`absolute flex items-center justify-center transition-all ${isActive ? 'z-20' : 'z-[5]'}`}
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              width, height,
              transform: 'translate(-50%, -50%)',
            }}
          >
            {/* Bentuk wedge, di-clip — cuma dekorasi, jadi label di bawah tidak
                ikut ke-clip walau posisinya dekat sudut lancip wedge-nya. */}
            <div
              className={`absolute inset-0 transition-all hover:brightness-110 ${isActive ? 'ring-2 ring-white scale-[1.03]' : ''}`}
              style={{
                transform: `rotate(${angleDeg + 90}deg)`,
                backgroundColor: sec.color || '#475569',
                clipPath: clip,
                boxShadow: isActive ? '0 0 24px rgba(255,255,255,0.35)' : '0 4px 16px rgba(0,0,0,0.4)',
              }}
            />
            <div className="relative text-center px-2 max-w-full">
              <p className="font-black text-white text-[11px] uppercase tracking-wide leading-tight drop-shadow truncate">{sec.name}</p>
              <p className="text-white/80 text-[10px] font-bold">Rp {Number(sec.price).toLocaleString('id-ID')}</p>
              <p className="text-white/60 text-[9px] font-bold">{available}/{total} tersedia</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
