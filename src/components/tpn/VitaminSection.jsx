import { Pill } from 'lucide-react';
import { AutoBadge, fmt, SectionCard } from './ui';

const VITAMIN_META = [
  { label: 'Soluvit-N',          key: 'soluvitMl',    unit: 'ml/day', note: '1 ml/kg/day, max 10 ml/day' },
  { label: 'Vitalipid N Infant', key: 'vitalipidMl',  unit: 'ml/day', note: '4 ml/kg/day, max 10 ml/day — ใส่ใน lipid bag' },
  { label: 'Pediatrace',         key: 'pediatraceMl', unit: 'ml/day', note: '1 ml/kg/day, max 10 ml/day' },
];

export default function VitaminSection({ results }) {
  return (
    <SectionCard title="วิตามินและสารอาหารรอง · Vitamins / Trace" icon={Pill}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {VITAMIN_META.map((item) => (
          <div key={item.label} className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-slate-600 leading-tight">
                {item.label}
              </span>
              <AutoBadge />
            </div>
            <div className="h-11 flex items-center px-3 rounded-xl bg-slate-50 ring-1 ring-slate-200/80">
              <span className="font-mitr font-semibold text-slate-700 text-base">
                {fmt(results?.[item.key], 2)}
              </span>
              <span className="text-sm text-slate-400 ml-1.5 font-sans">{item.unit}</span>
            </div>
            <p className="text-xs text-slate-400 font-sans leading-snug px-0.5">{item.note}</p>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
