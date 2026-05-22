import { Syringe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { fmt, NumberField, SectionCard } from './ui';

export default function HeparinSection({ inputs, update, results }) {
  return (
    <SectionCard title="เฮปาริน · Heparin" icon={Syringe}>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="heparinConc"
          label="Multiplier (units/ml)"
          suffix="u/ml"
          value={inputs.heparinConc}
          onChange={update('heparinConc')}
          step="0.1"
          min="0.5"
          max="1.0"
          hint="ช่วง 0.5–1.0 unit/ml; = Multiplier × Total Volume (ml/day)"
        />
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Heparin ที่ต้องเพิ่ม
          </Label>
          <div className="h-11 md:h-10 flex items-center px-3 rounded-xl bg-slate-50 ring-1 ring-slate-200/80 gap-1.5">
            <span className="font-mitr font-bold text-amber-700 text-base tabular-nums">
              {fmt(results?.heparinUnits, 0)}
            </span>
            <span className="text-[10px] text-amber-600 font-semibold font-sans">units</span>
            <span className="text-slate-300 mx-1">·</span>
            <span className="font-mitr font-semibold text-teal-700 text-sm tabular-nums">
              {fmt(results?.heparinMl, 2)}
            </span>
            <span className="text-[10px] text-slate-400 font-sans">ml</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-snug px-0.5">
            จากขวด Heparin 100 IU/ml
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
