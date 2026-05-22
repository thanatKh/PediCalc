import { FlaskConical } from 'lucide-react';
import { fmt, NumberField, SectionCard } from './ui';

export default function ElectrolyteSection({ inputs, update, results }) {
  return (
    <SectionCard title="เกลือแร่ · Electrolytes" icon={FlaskConical}>
      {/* Sodium */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold mb-2.5">Sodium (Na)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="totalNaTarget"
            label="Total Na target"
            suffix="mEq/kg"
            value={inputs.totalNaTarget}
            onChange={update('totalNaTarget')}
            hint="ปกติ 2–4 mEq/kg/d; Newborn: 2–3"
          />
          <NumberField
            id="naGlyceroTarget"
            label="Na Glycerophosphate"
            suffix="mEq/kg"
            value={inputs.naGlyceroTarget}
            onChange={update('naGlyceroTarget')}
            hint="ส่วนที่ให้ทาง Na-Glycero (Na+PO₄); เหลือเป็น 3%NaCl"
          />
        </div>
        {results && (
          <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-sans">
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              3% NaCl ← <strong>{fmt(results.naFrom3Pct, 2)} mEq/kg</strong>
            </span>
            <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg">
              NaGlycero ← <strong>{fmt(results.naFromGlycero, 2)} mEq/kg</strong>
            </span>
          </div>
        )}
      </div>

      {/* Potassium */}
      <div className="mb-5">
        <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold mb-2.5">Potassium (K)</p>
        <div className="grid grid-cols-2 gap-3">
          <NumberField
            id="totalKTarget"
            label="Total K target"
            suffix="mEq/kg"
            value={inputs.totalKTarget}
            onChange={update('totalKTarget')}
            hint="ปกติ 1–3 mEq/kg/d; max 4 mEq/kg/d"
          />
          <NumberField
            id="k2hpo4Target"
            label="K2HPO4 (PO₄ src)"
            suffix="mEq/kg"
            value={inputs.k2hpo4Target}
            onChange={update('k2hpo4Target')}
            hint="ส่วนที่ให้ทาง K2HPO4 (K+PO₄); ระวัง Ca×PO₄; เหลือเป็น 15%KCl"
          />
        </div>
        {results && (
          <div className="mt-2.5 flex flex-wrap gap-2 text-[10px] font-sans">
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
              15% KCl ← <strong>{fmt(results.kFrom15Pct, 2)} mEq/kg</strong>
            </span>
            <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-lg">
              K2HPO4 ← <strong>{fmt(results.kFromK2hpo4, 2)} mEq/kg</strong>
            </span>
          </div>
        )}
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
