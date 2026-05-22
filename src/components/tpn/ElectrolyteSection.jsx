import { FlaskConical } from 'lucide-react';
import { fmt, NumberField, SectionCard } from './ui';
import { PO4_PER_MEQ_NA_GLYCERO, PO4_PER_MEQ_K2HPO4 } from '@/utils/clinicalConstants';

export default function ElectrolyteSection({ inputs, update, results }) {
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
        <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold mb-2.5">
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
          />
          <NumberField
            id="naGlyceroTarget"
            label="Na Glycerophosphate"
            suffix="mEq/kg"
            value={inputs.naGlyceroTarget}
            onChange={update('naGlyceroTarget')}
            hint="Na + PO₄ (0.5 mmol PO₄ ต่อ 1 mEq Na)"
          />
        </div>
      </div>

      {/* Potassium sources */}
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold mb-2.5">
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
          />
          <NumberField
            id="k2hpo4Target"
            label="K2HPO4 (PO₄ src)"
            suffix="mEq/kg"
            value={inputs.k2hpo4Target}
            onChange={update('k2hpo4Target')}
            hint="K + PO₄ (0.67 mmol PO₄ ต่อ 1 mEq K); ระวัง Ca×PO₄"
          />
        </div>
      </div>

      {/* Derived totals summary */}
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="stat-pill flex-1 min-w-[80px] rounded-2xl bg-white ring-1 ring-teal-200/80 px-3 py-2.5 text-center shadow-sm">
          <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-teal-400 mb-0.5">Total Na</p>
          <p className="font-mitr font-semibold text-teal-700 text-base tabular-nums leading-tight">
            {fmt(totalNa, 2)}
            <span className="text-[10px] font-sans font-normal ml-1 opacity-70">mEq/kg/d</span>
          </p>
        </div>
        <div className="stat-pill flex-1 min-w-[80px] rounded-2xl bg-white ring-1 ring-blue-200/80 px-3 py-2.5 text-center shadow-sm">
          <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-blue-400 mb-0.5">Total K</p>
          <p className="font-mitr font-semibold text-blue-700 text-base tabular-nums leading-tight">
            {fmt(totalK, 2)}
            <span className="text-[10px] font-sans font-normal ml-1 opacity-70">mEq/kg/d</span>
          </p>
        </div>
        <div className="stat-pill flex-1 min-w-[80px] rounded-2xl bg-white ring-1 ring-purple-200/80 px-3 py-2.5 text-center shadow-sm">
          <p className="text-[9px] uppercase tracking-[0.12em] font-bold text-purple-400 mb-0.5">Total PO₄</p>
          <p className="font-mitr font-semibold text-purple-700 text-base tabular-nums leading-tight">
            {fmt(totalPO4, 2)}
            <span className="text-[10px] font-sans font-normal ml-1 opacity-70">mmol/kg/d</span>
          </p>
        </div>
      </div>

      {/* Ca×PO4 warning from results */}
      {results?.caxPHigh && (
        <p className="text-[10px] font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-200 rounded-lg px-3 py-1.5 mb-4">
          ⚠ Ca×PO₄ = {fmt(results.caxP, 1)} mmol²/L² — เกินขีดจำกัด 55 ลด Ca หรือ PO₄ ลง
        </p>
      )}

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
        />
        <NumberField
          id="mgTarget"
          label="MgSO4"
          suffix="mEq/kg"
          value={inputs.mgTarget}
          onChange={update('mgTarget')}
          step="0.05"
          hint="ปกติ 0.25–0.5 mEq/kg/d"
        />
      </div>
    </SectionCard>
  );
}
