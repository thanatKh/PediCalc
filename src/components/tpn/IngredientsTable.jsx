import { FileText } from 'lucide-react';
import { fmt } from './ui';

const BAG_ROWS = [
  { label: (dex) => `Dextrose ${dex}% (จาก 50% Glucose)`, key: 'dextroseMl',    accent: 'text-blue-600' },
  { label: () => '10% Aminoven Infant',                     key: 'aminovenMl' },
  { label: () => '3% NaCl',                                 key: 'na3PctMl' },
  { label: () => 'Na Glycerophosphate',                     key: 'naGlyceroml' },
  { label: () => '15% KCl',                                 key: 'k15PctMl' },
  { label: () => '8.71% K2HPO4',                            key: 'k2hpo4Ml' },
  { label: () => '10% Calcium gluconate',                   key: 'caGluconateMl' },
  { label: () => '50% MgSO4',                               key: 'mgso4Ml' },
  { label: () => 'Soluvit-N',                               key: 'soluvitMl' },
  { label: () => 'Pediatrace',                              key: 'pediatraceMl' },
];

const LIPID_ROWS = [
  { label: () => '20% SMOFlipid',      key: 'lipidMl',    accent: 'text-emerald-600' },
  { label: () => 'Vitalipid N Infant', key: 'vitalipidMl' },
];

function TableHeader() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2 bg-slate-50 border-b border-slate-100">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">ส่วนประกอบ</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right w-16">ml</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-right w-12">Bag</span>
    </div>
  );
}

function TableRow({ label, value, accent, zebra }) {
  return (
    <div className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center transition-colors hover:bg-teal-50/30 ${zebra ? 'bg-slate-50/50' : 'bg-white'}`}>
      <span className="text-sm font-sans text-slate-600 leading-snug min-w-0">{label}</span>
      <span className={`text-sm font-mitr font-semibold tabular-nums text-right w-16 ${accent || 'text-slate-700'}`}>
        {value}
      </span>
      <span className="text-[9px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">ml</span>
    </div>
  );
}

function SeparatorRow({ label }) {
  return (
    <div className="px-4 py-1.5 bg-emerald-50/60 border-t border-emerald-100">
      <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

export default function IngredientsTable({ results, dexPct }) {
  const waterNegative = !!results?.isWaterNegative;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <FileText size={14} style={{ color: '#0d6e6e' }} />
        <span className="font-mitr text-sm font-semibold text-teal-700">รายการส่วนประกอบ · Ingredients</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          <TableHeader />

          {/* 2-in-1 bag rows */}
          {BAG_ROWS.map((row, i) => (
            <TableRow
              key={row.key}
              label={row.label(dexPct)}
              value={fmt(results?.[row.key], 2)}
              accent={row.accent}
              zebra={i % 2 === 1}
            />
          ))}

          {/* Sterile water */}
          <div className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center ${waterNegative ? 'bg-rose-50' : 'bg-amber-50/60'}`}>
            <span className={`text-sm font-mitr font-semibold leading-snug ${waterNegative ? 'text-rose-700' : 'text-amber-800'}`}>
              Sterile Water for Injection
            </span>
            <span className={`text-base font-mitr font-bold tabular-nums text-right w-16 ${waterNegative ? 'text-rose-600' : 'text-amber-700'}`}>
              {fmt(results?.sterileWaterMl, 2)}
            </span>
            <span className="text-[9px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">ml</span>
          </div>

          {/* Total 2-in-1 */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center bg-slate-100/60 border-t border-slate-200">
            <span className="text-sm font-mitr font-bold text-slate-700">รวม 2-in-1 Bag</span>
            <span className="text-sm font-mitr font-bold tabular-nums text-right w-16 text-teal-700">
              {fmt(results?.bag2in1Vol, 2)}
            </span>
            <span className="text-[9px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">ml</span>
          </div>

          {/* Lipid separator */}
          <SeparatorRow label="แยกสาย · Lipid bag" />

          {/* Lipid rows */}
          {LIPID_ROWS.map((row, i) => (
            <TableRow
              key={row.key}
              label={row.label()}
              value={fmt(results?.[row.key], 2)}
              accent={row.accent}
              zebra={i % 2 === 0}
            />
          ))}

          {/* Heparin */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 py-2.5 items-center bg-amber-50/40">
            <span className="text-sm font-sans text-amber-800 leading-snug">
              Heparin ({fmt(results?.heparinUnitPerMl, 1)} u/ml)
            </span>
            <div className="text-right w-16">
              <span className="text-sm font-mitr font-semibold tabular-nums text-amber-700">
                {fmt(results?.heparinMl, 2)}
              </span>
              <span className="block text-[9px] text-slate-400 font-sans">
                ({fmt(results?.heparinUnits, 0)} u)
              </span>
            </div>
            <span className="text-[9px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">ml</span>
          </div>
        </div>
      </div>
    </div>
  );
}
