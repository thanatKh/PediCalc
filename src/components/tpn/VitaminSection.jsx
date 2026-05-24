import { Pill, X } from 'lucide-react';
import { fmt, SectionCard } from './ui';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const VITAMIN_META = [
  { label: 'Soluvit-N',          autoKey: 'soluvitAuto',    overrideKey: 'soluvitOverride',    unit: 'ml/day', note: '1 ml/kg/day, max 10 ml/day' },
  { label: 'Vitalipid N Infant', autoKey: 'vitalipidAuto',  overrideKey: 'vitalipidOverride',  unit: 'ml/day', note: '4 ml/kg/day, max 10 ml/day — ใส่ใน lipid bag' },
  { label: 'Pediatrace',         autoKey: 'pediatraceAuto', overrideKey: 'pediatraceOverride', unit: 'ml/day', note: '1 ml/kg/day, max 10 ml/day' },
];

export default function VitaminSection({ results, inputs, update }) {
  return (
    <SectionCard title="Vitamins / Trace · วิตามินและสารอาหารรอง" icon={Pill}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {VITAMIN_META.map((item) => {
          const autoVal    = results?.[item.autoKey] ?? null;
          const overrideRaw = inputs?.[item.overrideKey] ?? '';
          const isManual   = overrideRaw !== '';

          return (
            <div key={item.label} className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Label htmlFor={item.overrideKey} className="text-sm font-semibold text-slate-600 leading-tight">
                  {item.label}
                </Label>
                {isManual ? (
                  <Badge
                    variant="outline"
                    className="gap-1 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border-amber-200/80 rounded-full h-auto leading-none cursor-pointer hover:bg-amber-100 transition-colors"
                    onClick={() => update(item.overrideKey)('')}
                    title="Reset to auto"
                  >
                    Manual <X size={8} />
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-teal-600 bg-teal-50 border-teal-200/80 rounded-full h-auto leading-none">
                    AUTO
                  </Badge>
                )}
              </div>

              <div className="relative">
                <Input
                  id={item.overrideKey}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  value={overrideRaw}
                  placeholder={autoVal !== null ? fmt(autoVal, 2) : '—'}
                  onChange={(e) => update(item.overrideKey)(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
                  className="bg-white rounded-xl pr-16 h-11 text-base font-sans text-slate-800 shadow-sm border-slate-200 transition-[border-color,box-shadow] duration-150"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
                  {item.unit}
                </span>
              </div>

              <p className="text-xs text-slate-400 font-sans leading-snug px-0.5">{item.note}</p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
