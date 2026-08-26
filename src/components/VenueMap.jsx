import { getSectionMapPosition } from '../lib/seatLayout';

// Zone width scales gently with how many seats-per-row the section has, so
// a wide General-Admission-style section reads as wider than a small VIP
// pocket — "sedikit melebar", not every zone forced into the same box.
// Expressed as a % of the map's own width, same reasoning as the position
// ratios below: it has to shrink together with the container on a small
// screen, not stay a fixed px size that no longer fits.
function zoneWidthPercent(section) {
  const cols = section.col_count || 1;
  return Math.max(20, Math.min(34, 16 + cols * 0.9));
}

export default function VenueMap({ sections, activeSectionId, onSelect }) {
  return (
    <div className="relative mx-auto mb-4" style={{ width: '100%', maxWidth: 640, aspectRatio: '1 / 1' }}>
      {/* Panggung / Pitch di tengah */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-900/10 border-2 border-green-500/30 rounded-xl flex items-center justify-center shadow-2xl z-10"
        style={{ width: '28%', height: '18%' }}
      >
        <span className="text-green-500/40 font-black tracking-[0.4em] text-[9px] sm:text-[10px] uppercase italic">Panggung</span>
      </div>

      {sections.map(sec => {
        const { xRatio, yRatio, angleDeg } = getSectionMapPosition(sec);
        const total = sec.seats.length;
        const available = sec.seats.filter(s => s.status === 'available').length;
        const isActive = sec.id === activeSectionId;
        const widthPct = zoneWidthPercent(sec);
        const heightPct = 15;
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
              left: `calc(50% + ${xRatio * 50}%)`,
              top: `calc(50% + ${yRatio * 50}%)`,
              width: `${widthPct}%`,
              height: `${heightPct}%`,
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
            <div className="relative text-center px-1 sm:px-2 max-w-full">
              <p className="font-black text-white text-[9px] sm:text-[11px] uppercase tracking-wide leading-tight drop-shadow truncate">{sec.name}</p>
              <p className="text-white/80 text-[8px] sm:text-[10px] font-bold">Rp {Number(sec.price).toLocaleString('id-ID')}</p>
              <p className="text-white/60 text-[7px] sm:text-[9px] font-bold">{available}/{total} tersedia</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
