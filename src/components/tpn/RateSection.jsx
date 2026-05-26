import { memo } from 'react';
import { AlertTriangle, CheckCircle2, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fmt, NumberField, SectionCard } from './ui';

function RateSection({
  manualTPNRate,
  gir, girHigh, girLow,
  update,
}) {
  const hasRate = manualTPNRate !== '' && parseFloat(manualTPNRate) > 0;

  return (
    <SectionCard title="Prescribed Rates · อัตราหยดที่สั่ง" icon={Gauge}>
      <div className="grid grid-cols-2 gap-3">

        {/* TPN Rate — physician input, drives reverse GIR */}
        <div className="space-y-1.5">
          <NumberField
            id="manualTPNRate"
            label="TPN Fluid Rate (สั่งจริง)"
            suffix="ml/hr"
            value={manualTPNRate}
            onChange={update('manualTPNRate')}
            step="0.1"
            hint="แพทย์ระบุ — ใช้คำนวณ GIR จริง"
          />
          {hasRate && gir !== null && (
            <Badge className={`gap-1.5 px-2.5 py-1.5 text-sm font-semibold font-sans rounded-lg h-auto w-full justify-start border ${
              girHigh ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
              : girLow  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}>
              {girHigh || girLow
                ? <AlertTriangle size={13} className="shrink-0" />
                : <CheckCircle2 size={13} className="shrink-0" />}
              GIR = <span className="font-mitr font-bold">{fmt(gir, 2)}</span> mg/kg/min
              {girHigh && ' — สูงเกิน 12'}
              {girLow  && ' — ต่ำกว่า 4'}
            </Badge>
          )}
          {!hasRate && (
            <p className="text-xs text-slate-400 font-sans px-0.5">กรุณาระบุ TPN Rate เพื่อคำนวณ GIR จริง</p>
          )}
        </div>

      </div>
    </SectionCard>
  );
}

export default memo(RateSection);
