// Lets an admin place a new section on the venue overview map by clicking a
// spot on a mini clock face, instead of typing angle/radius numbers (that's
// what made the old version hard to use). One click sets clock_position
// (1-12), a two-way toggle sets near/far ring.
export default function ClockPositionPicker({ clockPosition, ring, onChange }) {
  const positions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24 shrink-0 rounded-full border border-white/10 bg-black/40">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-5 rounded-sm bg-green-900/40 border border-green-500/30" />
        {positions.map((pos) => {
          const angleDeg = pos * 30 - 90;
          const rad = (angleDeg * Math.PI) / 180;
          const r = 40;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          const isActive = pos === clockPosition;
          return (
            <button
              key={pos}
              type="button"
              title={`Posisi jam ${pos}`}
              onClick={() => onChange({ clock_position: pos })}
              className={`absolute w-3.5 h-3.5 rounded-full -translate-x-1/2 -translate-y-1/2 transition-all ${
                isActive ? 'bg-blue-500 scale-125 ring-2 ring-blue-300' : 'bg-white/20 hover:bg-white/40'
              }`}
              style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            />
          );
        })}
      </div>
      <div className="flex-1 space-y-2">
        <p className="text-[8px] font-black uppercase text-slate-500">Posisi (klik jam di sebelah kiri)</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ring: 'inner' })}
            className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-all ${ring === 'inner' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
          >
            Dekat Panggung
          </button>
          <button
            type="button"
            onClick={() => onChange({ ring: 'outer' })}
            className={`py-2 rounded-lg text-[9px] font-bold uppercase border transition-all ${ring === 'outer' ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-black/40 border-white/10 text-slate-500 hover:text-white'}`}
          >
            Jauh dari Panggung
          </button>
        </div>
      </div>
    </div>
  );
}
