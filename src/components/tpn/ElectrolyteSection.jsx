import { FlaskConical } from 'lucide-react';
import { fmt, NumberField, SectionCard } from './ui';
import { PO4_PER_MEQ_NA_GLYCERO, PO4_PER_MEQ_K2HPO4 } from '@/utils/clinicalConstants';

export default function ElectrolyteSection({ inputs, update, cds = {} }) {
  const na3Pct    = parseFloat(inputs.na3PctTarget)    || 0;
  const naGlycero = parseFloat(inputs.naGlyceroTarget) || 0;
  const k15Pct    = parseFloat(inputs.k15PctTarget)    || 0;
  const k2hpo4    = parseFloat(inputs.k2hpo4Target)    || 0;

  const totalNa  = na3Pct + naGlycero;
  const totalK   = k15Pct + k2hpo4;
  const totalPO4 = naGlycero * PO4_PER_MEQ_NA_GLYCERO + k2hpo4 * PO4_PER_MEQ_K2HPO4;

  return (
    <SectionCard title="เกลือแร่ · Electrolytes" icon={FlaskConical}>

      {/* Sodium sources */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-500 mb-2.5">
          Sodium (Na) — ระบุปริมาณจากแต่ละแหล่ง
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="na3PctTarget"
            label="3% NaCl"
            suffix="mEq/kg"
            value={inputs.na3PctTarget}
            onChange={update('na3PctTarget')}
            hint="ปกติ 2–4 mEq/kg/d (แหล่ง Na หลัก)"
            tier={cds.na?.tier}
            tierMessage={cds.na?.message}
          />
          <NumberField
            id="naGlyceroTarget"
            label="Na Glycerophosphate"
            suffix="mEq/kg"
            value={inputs.naGlyceroTarget}
            onChange={update('naGlyceroTarget')}
            hint="Na + PO₄ (0.5 mmol PO₄ ต่อ 1 mEq Na)"
            tier={cds.na?.tier}
            tierMessage={cds.na?.message}
          />
        </div>
      </div>

      {/* Potassium sources */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-500 mb-2.5">
          Potassium (K) — ระบุปริมาณจากแต่ละแหล่ง
        </p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="k15PctTarget"
            label="15% KCl"
            suffix="mEq/kg"
            value={inputs.k15PctTarget}
            onChange={update('k15PctTarget')}
            hint="ปกติ 1–3 mEq/kg/d; max 4 mEq/kg/d"
            tier={cds.k?.tier}
            tierMessage={cds.k?.message}
          />
          <NumberField
            id="k2hpo4Target"
            label="K2HPO4 (PO₄ src)"
            suffix="mEq/kg"
            value={inputs.k2hpo4Target}
            onChange={update('k2hpo4Target')}
            hint="K + PO₄ (0.67 mmol PO₄ ต่อ 1 mEq K); ระวัง Ca×PO₄"
            tier={cds.k?.tier}
            tierMessage={cds.k?.message}
          />
        </div>
      </div>

      {/* Derived totals summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: 'Total Na', value: totalNa, unit: 'mEq/kg/d', check: cds.na },
          { label: 'Total K',  value: totalK,  unit: 'mEq/kg/d', check: cds.k  },
          { label: 'Total PO₄', value: totalPO4, unit: 'mmol/kg/d', check: cds.po4 },
        ].map(({ label, value, unit, check }) => {
          const isCrit = check?.tier === 'critical';
          const isMod  = check?.tier === 'moderate';
          return (
            <div key={label} className={`stat-pill flex-1 min-w-[80px] rounded-2xl px-3 py-2.5 text-center shadow-sm ring-1 ${
              isCrit ? 'bg-rose-50 ring-rose-300/60'
              : isMod ? 'bg-amber-50 ring-amber-300/60'
              : 'bg-white ring-slate-200/80'
            }`}>
              <p className="text-xs font-bold text-slate-400 mb-1 tracking-wide">
                {isCrit ? '🚨 ' : isMod ? '⚠️ ' : ''}{label}
              </p>
              <p className={`font-mitr font-semibold text-base tabular-nums leading-tight ${isCrit ? 'text-rose-700' : isMod ? 'text-amber-700' : 'text-slate-700'}`}>
                {fmt(value, 2)}
                <span className="text-xs font-sans font-normal ml-1 opacity-70">{unit}</span>
              </p>
            </div>
          );
        })}
      </div>

      {/* Calcium & Magnesium */}
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          id="caTarget"
          label="Calcium gluconate"
          suffix="mmol/kg"
          value={inputs.caTarget}
          onChange={update('caTarget')}
          step="0.05"
          hint="ปกติ 0.5–1 mmol/kg/d; เช็ค Ca×PO₄"
          tier={cds.ca?.tier}
          tierMessage={cds.ca?.message}
        />
        <NumberField
          id="mgTarget"
          label="MgSO4"
          suffix="mEq/kg"
          value={inputs.mgTarget}
          onChange={update('mgTarget')}
          step="0.05"
          hint="ปกติ 0.25–0.5 mEq/kg/d"
          tier={cds.mg?.tier}
          tierMessage={cds.mg?.message}
        />
      </div>
    </SectionCard>
  );
}
