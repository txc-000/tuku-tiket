import { layoutRingSegments, donutSegmentPath, polarToCartesian, RING_RADIUS } from '../lib/seatLayout';

const CENTER = 280;
const VIEWBOX = 560;
const LABEL_MIN_SPAN_DEG = 34; // segmen sesempit ini masih cukup lebar buat nampung label singkat

function RingSegment({ seg, radius, labelBias, isActive, onSelect }) {
  const { section, startDeg, endDeg, midDeg } = seg;
  const path = donutSegmentPath(CENTER, CENTER, radius.from, radius.to, startDeg, endDeg);
  // Label ditarik ke salah satu sisi pita (bukan selalu di tengah) supaya
  // label ring dalam & ring luar tidak saling nabrak saat kebetulan sama-sama
  // menghadap ke sisi yang sama (misalnya cuma ada 2 section per ring, jadi
  // keduanya sama-sama membelah kiri/kanan pada sudut yang mirip).
  const labelRadius = radius.from + (radius.to - radius.from) * labelBias;
  const labelPos = polarToCartesian(CENTER, CENTER, labelRadius, midDeg);
  const showLabel = endDeg - startDeg >= LABEL_MIN_SPAN_DEG;

  return (
    <g onClick={() => onSelect(section.id)} className="cursor-pointer group">
      <path
        d={path}
        fill={section.color || '#475569'}
        opacity={isActive ? 1 : 0.82}
        stroke={isActive ? '#fff' : 'rgba(0,0,0,0.35)'}
        strokeWidth={isActive ? 3 : 1.5}
        className="transition-all group-hover:opacity-100"
        style={isActive ? { filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.45))' } : undefined}
      />
      {showLabel && (
        <text
          x={labelPos.x}
          y={labelPos.y}
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-white font-black uppercase pointer-events-none select-none"
          style={{ fontSize: 13, letterSpacing: 0.5, paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.35)', strokeWidth: 3 }}
        >
          {section.name}
        </text>
      )}
    </g>
  );
}

export default function VenueMap({ sections, activeSectionId, onSelect }) {
  const innerSegments = layoutRingSegments(sections, 'inner');
  const outerSegments = layoutRingSegments(sections, 'outer', 25);

  return (
    <div>
      <svg viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`} className="w-full max-w-md mx-auto block">
        {outerSegments.map(seg => (
          <RingSegment key={seg.section.id} seg={seg} radius={RING_RADIUS.outer} labelBias={0.6} isActive={seg.section.id === activeSectionId} onSelect={onSelect} />
        ))}
        {innerSegments.map(seg => (
          <RingSegment key={seg.section.id} seg={seg} radius={RING_RADIUS.inner} labelBias={0.4} isActive={seg.section.id === activeSectionId} onSelect={onSelect} />
        ))}

        {/* Panggung / Pitch di tengah */}
        <rect x={CENTER - 72} y={CENTER - 40} width={144} height={80} rx={14} className="fill-green-900/25 stroke-green-500/40" strokeWidth={2} />
        <text x={CENTER} y={CENTER + 5} textAnchor="middle" className="fill-green-500/50 font-black uppercase italic" style={{ fontSize: 13, letterSpacing: 4 }}>
          Panggung
        </text>
      </svg>

      {/* Kartu section — selalu terbaca penuh + jadi cara pilih yang pasti bisa
          diklik, apa pun lebar segmen ring-nya di atas. */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-6 max-w-2xl mx-auto">
        {sections.map(sec => {
          const total = sec.seats.length;
          const available = sec.seats.filter(s => s.status === 'available').length;
          const isActive = sec.id === activeSectionId;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelect(sec.id)}
              className={`text-left px-4 py-3 rounded-2xl border transition-all ${
                isActive ? 'bg-white/10 border-white/40' : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sec.color || '#475569' }} />
                <span className="font-black text-[11px] uppercase tracking-wide truncate">{sec.name}</span>
              </div>
              <p className="text-blue-400 font-bold text-xs">Rp {Number(sec.price).toLocaleString('id-ID')}</p>
              <p className="text-slate-500 text-[9px] font-bold">{available}/{total} tersedia</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
