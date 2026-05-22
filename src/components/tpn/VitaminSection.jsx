import { Pill } from 'lucide-react';
import { AutoBadge, fmt, SectionCard } from './ui';

const VITAMIN_META = [
  { label: 'Soluvit-N',          key: 'soluvitMl',    unit: 'ml', note: '1 ml/kg × DSF, max 10 ml' },
  { label: 'Vitalipid N Infant', key: 'vitalipidMl',  unit: 'ml', note: '4 ml/kg, max 10 ml' },
  { label: 'Pediatrace',         key: 'pediatraceMl', unit: 'ml', note: '1 ml/kg × DSF, max 10 ml' },
];

export default function VitaminSection({ results }) {
  return (
    <SectionCard title="วิตามินและสารอาหารรอง · Vitamins / Trace" icon={Pill}>
      <div className="grid grid-cols-3 gap-3">
        {VITAMIN_META.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase leading-tight">
                {item.label}
              </span>
              <AutoBadge />
            </div>
            <div className="h-11 md:h-10 flex items-center px-3 rounded-xl bg-slate-50 ring-1 ring-slate-200/80">
              <span className="font-mitr font-semibold text-teal-700 text-sm">
                {fmt(results?.[item.key], 2)}
              </span>
              <span className="text-[10px] text-slate-400 ml-1 font-sans">{item.unit}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-sans leading-snug px-0.5">{item.note}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
