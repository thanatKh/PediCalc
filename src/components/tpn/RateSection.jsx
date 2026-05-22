import { AlertTriangle, CheckCircle2, Gauge } from 'lucide-react';
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
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold font-sans ${
              girHigh ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
              : girLow  ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            }`}>
              {girHigh || girLow
                ? <AlertTriangle size={10} className="shrink-0" />
                : <CheckCircle2 size={10} className="shrink-0" />}
              GIR = <span className="font-mitr font-bold ml-0.5">{fmt(gir, 2)}</span>&nbsp;mg/kg/min
              {girHigh && ' — สูงเกิน 12'}
              {girLow  && ' — ต่ำกว่า 4'}
            </div>
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
            <p className={`flex items-center gap-1 text-[10px] font-semibold px-0.5 ${
              Math.abs(manualLipidRate - calcLipidRate) > LIPID_RATE_WARN_THRESHOLD
                ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {Math.abs(manualLipidRate - calcLipidRate) > LIPID_RATE_WARN_THRESHOLD
                ? <><AlertTriangle size={10} className="shrink-0" />ต่างจากคำนวณ {fmt(Math.abs(manualLipidRate - calcLipidRate), 1)} ml/hr</>
                : <><CheckCircle2 size={10} className="shrink-0" />ใกล้เคียงกับที่คำนวณ</>}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
