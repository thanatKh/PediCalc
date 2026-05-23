import { AlertTriangle, CheckCircle2, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { fmt, NumberField, SectionCard } from './ui';
import { LIPID_RATE_WARN_THRESHOLD } from '@/utils/clinicalConstants';

export default function RateSection({ inputs, update, results }) {
  const manualLipidRate = parseFloat(inputs.manualLipidRate);
  const calcLipidRate   = results?.lipidRate ?? 0;
  const gir             = results?.gir ?? null;
  const girHigh         = results?.girHigh ?? false;
  const girLow          = results?.girLow  ?? false;
  const hasRate         = inputs.manualTPNRate !== '' && parseFloat(inputs.manualTPNRate) > 0;

  return (
    <SectionCard title="อัตราหยดที่สั่ง · Prescribed Rates" icon={Gauge}>
      <div className="grid grid-cols-2 gap-3">

        {/* TPN Rate — physician input, drives reverse GIR */}
        <div className="space-y-1.5">
          <NumberField
            id="manualTPNRate"
            label="TPN Fluid Rate (สั่งจริง)"
            suffix="ml/hr"
            value={inputs.manualTPNRate}
            onChange={update('manualTPNRate')}
            step="0.1"
            hint="แพทย์ระบุ — ใช้คำนวณ GIR จริง"
          />
          {/* Derived GIR display */}
          {hasRate && gir !== null && (
            <Badge className={`gap-1 px-2.5 py-1 text-[10px] font-semibold font-sans rounded-lg h-auto w-full justify-start border ${
              girHigh ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
              : girLow  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}>
              {girHigh || girLow
                ? <AlertTriangle size={10} className="shrink-0" />
                : <CheckCircle2 size={10} className="shrink-0" />}
              GIR = <span className="font-mitr font-bold">{fmt(gir, 2)}</span> mg/kg/min
              {girHigh && ' — สูงเกิน 12'}
              {girLow  && ' — ต่ำกว่า 4'}
            </Badge>
          )}
          {!hasRate && (
            <p className="text-[10px] text-slate-400 font-sans px-0.5">กรุณาระบุ TPN Rate เพื่อคำนวณ GIR จริง</p>
          )}
        </div>

        {/* Lipid Rate */}
        <div className="space-y-1.5">
          <NumberField
            id="manualLipidRate"
            label="Lipid rate (สั่งจริง)"
            suffix="ml/hr"
            value={inputs.manualLipidRate}
            onChange={update('manualLipidRate')}
            step="0.1"
            hint={`คำนวณได้ ${fmt(results?.lipidRate, 1)} ml/hr`}
          />
          {!isNaN(manualLipidRate) && inputs.manualLipidRate !== '' && (
            <Badge className={`gap-1 px-2.5 py-1 text-[10px] font-semibold font-sans rounded-lg h-auto w-full justify-start border ${
              Math.abs(manualLipidRate - calcLipidRate) > LIPID_RATE_WARN_THRESHOLD
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}>
              {Math.abs(manualLipidRate - calcLipidRate) > LIPID_RATE_WARN_THRESHOLD
                ? <><AlertTriangle size={10} className="shrink-0" />ต่างจากคำนวณ {fmt(Math.abs(manualLipidRate - calcLipidRate), 1)} ml/hr</>
                : <><CheckCircle2 size={10} className="shrink-0" />ใกล้เคียงกับที่คำนวณ</>}
            </Badge>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
