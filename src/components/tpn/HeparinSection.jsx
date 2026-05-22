import { Syringe } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { fmt, NumberField, SectionCard } from './ui';

export default function HeparinSection({ inputs, update, results }) {
  return (
    <SectionCard title="เฮปาริน · Heparin" icon={Syringe}>
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="heparinConc"
          label="Heparin concentration"
          suffix="u/ml"
          value={inputs.heparinConc}
          onChange={update('heparinConc')}
          step="0.1"
          min="0"
          hint="ปกติ 0.5–1 unit/ml; คิดจาก total volume bag (2-in-1)"
        />
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            Heparin ที่ต้องเพิ่ม
          </Label>
          <div className="h-11 md:h-10 flex items-center px-3 rounded-xl bg-slate-50 ring-1 ring-slate-200/80">
            <span className="font-mitr font-semibold text-teal-700 text-sm">
              {fmt(results?.heparinUnits, 0)}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-sans">units</span>
            <span className="text-[10px] text-slate-300 mx-1.5">·</span>
            <span className="font-mitr font-semibold text-teal-700 text-sm">
              {fmt(results?.heparinMl, 2)}
            </span>
            <span className="text-[10px] text-slate-400 ml-1 font-sans">ml</span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans leading-snug px-0.5">
            จากขวด Heparin 1000 IU/ml
          </p>
        </div>
      </div>
    </SectionCard>
  );
}
