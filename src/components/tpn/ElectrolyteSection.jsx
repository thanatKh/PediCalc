import { memo } from 'react';
import { FlaskConical, AlertOctagon, AlertTriangle } from 'lucide-react';
import { fmt, NumberField, SectionCard } from './ui';
import { PO4_PER_MEQ_NA_GLYCERO, PO4_PER_MEQ_K2HPO4 } from '@/utils/clinicalConstants';

function ElectrolyteSection({
  na3PctTarget, naGlyceroTarget, k15PctTarget, k2hpo4Target, caTarget, mgTarget,
  update,
  naTier,  naMessage,
  kTier,   kMessage,
  caTier,  caMessage,
  mgTier,  mgMessage,
  po4Tier, po4Message,
}) {
  const totalNa  = (parseFloat(na3PctTarget)    || 0) + (parseFloat(naGlyceroTarget) || 0);
  const totalK   = (parseFloat(k15PctTarget)    || 0) + (parseFloat(k2hpo4Target)    || 0);
  const totalPO4 = (parseFloat(naGlyceroTarget) || 0) * PO4_PER_MEQ_NA_GLYCERO
                 + (parseFloat(k2hpo4Target)    || 0) * PO4_PER_MEQ_K2HPO4;

  return (
    <SectionCard title="Electrolytes · เกลือแร่" icon={FlaskConical}>

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
            value={na3PctTarget}
            onChange={update('na3PctTarget')}
            hint="ปกติ 2–4 mEq/kg/d (แหล่ง Na หลัก)"
            tier={naTier}
            tierMessage={naMessage}
          />
          <NumberField
            id="naGlyceroTarget"
            label="Na Glycerophosphate"
            suffix="mEq/kg"
            value={naGlyceroTarget}
            onChange={update('naGlyceroTarget')}
            hint="Na + PO₄ (0.5 mmol PO₄ ต่อ 1 mEq Na)"
            tier={naTier}
            tierMessage={naMessage}
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
            value={k15PctTarget}
            onChange={update('k15PctTarget')}
            hint="ปกติ 1–3 mEq/kg/d; max 4 mEq/kg/d"
            tier={kTier}
            tierMessage={kMessage}
          />
          <NumberField
            id="k2hpo4Target"
            label="K2HPO4 (PO₄ src)"
            suffix="mEq/kg"
            value={k2hpo4Target}
            onChange={update('k2hpo4Target')}
            hint="K + PO₄ (0.5 mmol PO₄ ต่อ 1 mEq K); ระวัง Ca×PO₄"
            tier={kTier}
            tierMessage={kMessage}
          />
        </div>
      </div>

      {/* Derived totals summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        {[
          { label: 'Total Na',  value: totalNa,  unit: 'mEq/kg/d',  tier: naTier  },
          { label: 'Total K',   value: totalK,   unit: 'mEq/kg/d',  tier: kTier   },
          { label: 'Total PO₄', value: totalPO4, unit: 'mmol/kg/d', tier: po4Tier },
        ].map(({ label, value, unit, tier }) => {
          const isCrit = tier === 'critical';
          const isMod  = tier === 'moderate';
          return (
            <div key={label} className={`stat-pill flex-1 min-w-[80px] rounded-2xl px-3 py-2.5 text-center shadow-sm ring-1 ${
              isCrit ? 'bg-rose-50 ring-rose-300/60'
              : isMod ? 'bg-amber-50 ring-amber-300/60'
              : 'bg-white ring-slate-200/80'
            }`}>
              <p className="flex items-center justify-center gap-1 text-xs font-bold text-slate-400 mb-1 tracking-wide">
                {isCrit && <AlertOctagon size={10} className="shrink-0 text-rose-500" />}
                {isMod  && <AlertTriangle size={10} className="shrink-0 text-amber-500" />}
                {label}
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
          value={caTarget}
          onChange={update('caTarget')}
          step="0.05"
          hint="ปกติ 0.5–1 mmol/kg/d; เช็ค Ca×PO₄"
          tier={caTier}
          tierMessage={caMessage}
        />
        <NumberField
          id="mgTarget"
          label="MgSO4"
          suffix="mEq/kg"
          value={mgTarget}
          onChange={update('mgTarget')}
          step="0.05"
          hint="ปกติ 0.25–0.5 mEq/kg/d"
          tier={mgTier}
          tierMessage={mgMessage}
        />
      </div>
    </SectionCard>
  );
}

export default memo(ElectrolyteSection);
