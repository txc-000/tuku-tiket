import { Check } from 'lucide-react';

const STEPS = ['Pilih Kursi', 'Pembayaran', 'Selesai'];

export default function BookingSteps({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4 mb-10">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isDone = step < current;
        const isActive = step === current;
        return (
          <div key={label} className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition-all ${
                isDone ? 'bg-blue-600 text-white' : isActive ? 'bg-white text-slate-950' : 'bg-white/10 text-slate-500'
              }`}>
                {isDone ? <Check size={12} /> : step}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest hidden sm:inline ${
                isActive ? 'text-white' : isDone ? 'text-blue-400' : 'text-slate-600'
              }`}>{label}</span>
            </div>
            {step < STEPS.length && <div className={`w-6 md:w-12 h-px ${isDone ? 'bg-blue-600' : 'bg-white/10'}`} />}
          </div>
        );
      })}
    </div>
  );
}
