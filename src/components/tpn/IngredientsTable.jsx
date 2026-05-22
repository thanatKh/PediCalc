import { FileText } from 'lucide-react';
import { fmt } from './ui';

const BAG_ROWS = [
  { label: (dex) => `Dextrose ${dex}% (จาก 50% Glucose)`, key: 'dextroseMl',    bag: 'TPN', accent: 'text-blue-600' },
  { label: '10% Aminoven Infant',                           key: 'aminovenMl',    bag: 'TPN' },
  { label: '3% NaCl',                                       key: 'na3PctMl',      bag: 'TPN' },
  { label: 'Na Glycerophosphate',                           key: 'naGlyceroml',   bag: 'TPN' },
  { label: '15% KCl',                                       key: 'k15PctMl',      bag: 'TPN' },
  { label: '8.71% K2HPO4',                                  key: 'k2hpo4Ml',      bag: 'TPN' },
  { label: '10% Calcium gluconate',                         key: 'caGluconateMl', bag: 'TPN' },
  { label: '50% MgSO4',                                     key: 'mgso4Ml',       bag: 'TPN' },
  { label: 'Soluvit-N',                                     key: 'soluvitMl',     bag: 'TPN' },
  { label: 'Pediatrace',                                    key: 'pediatraceMl',  bag: 'TPN' },
];

const LIPID_ROWS = [
  { label: '20% SMOFlipid',      key: 'lipidMl',    bag: 'Lipid', accent: 'text-emerald-600' },
  { label: 'Vitalipid N Infant', key: 'vitalipidMl', bag: 'Lipid' },
];

function TableHeader() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 sm:px-5 py-2.5 bg-slate-50 border-b border-slate-100/80">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Ingredients</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-right w-16">Volume (ml)</span>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 text-right w-12">Bag</span>
    </div>
  );
}

function TableRow({ label, value, bag, accent, zebra }) {
  return (
    <div className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 sm:px-5 py-2.5 items-center transition-colors hover:bg-teal-50/30 ${zebra ? 'bg-slate-50/40' : 'bg-white'}`}>
      <span className="text-sm font-sans text-slate-600 leading-snug min-w-0">{label}</span>
      <span className={`text-sm font-mitr font-semibold tabular-nums text-right w-16 ${accent || 'text-slate-700'}`}>
        {value}
      </span>
      <span className="text-[10px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">
        {bag}
      </span>
    </div>
  );
}

function SeparatorRow({ label }) {
  return (
    <div className="px-4 sm:px-5 py-1.5 bg-emerald-50/60 border-t border-emerald-100">
      <span className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide">{label}</span>
    </div>
  );
}

export default function IngredientsTable({ results, dexPct }) {
  const waterNegative = !!results?.isWaterNegative;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100/80 flex items-center gap-2">
        <FileText size={14} className="text-teal-600" />
        <span className="font-mitr text-sm font-semibold text-teal-700">รายการส่วนประกอบ · Ingredients</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[280px]">
          <TableHeader />

          {BAG_ROWS.map((row, i) => (
            <TableRow
              key={row.key}
              label={typeof row.label === 'function' ? row.label(dexPct) : row.label}
              value={fmt(results?.[row.key], 2)}
              bag={row.bag}
              accent={row.accent}
              zebra={i % 2 === 1}
            />
          ))}

          {/* Sterile water */}
          <div className={`grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 sm:px-5 py-2.5 items-center ${waterNegative ? 'bg-rose-50' : 'bg-amber-50/60'}`}>
            <span className={`text-sm font-mitr font-semibold ${waterNegative ? 'text-rose-700' : 'text-amber-800'}`}>
              Sterile Water for Injection
            </span>
            <span className={`text-sm font-mitr font-bold tabular-nums text-right w-16 ${waterNegative ? 'text-rose-600' : 'text-amber-700'}`}>
              {fmt(results?.sterileWaterMl, 2)}
            </span>
            <span className="text-[10px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">TPN</span>
          </div>

          {/* TPN Volume total */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 sm:px-5 py-2.5 items-center bg-slate-100/60 border-t border-slate-200">
            <span className="text-sm font-mitr font-bold text-slate-700">TPN Volume</span>
            <span className="text-sm font-mitr font-bold tabular-nums text-right w-16 text-teal-700">
              {fmt(results?.tpnVolume ?? results?.bag2in1Vol, 2)}
            </span>
            <span className="text-[10px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">ml</span>
          </div>

          <SeparatorRow label="แยกสาย · Lipid bag" />

          {LIPID_ROWS.map((row, i) => (
            <TableRow
              key={row.key}
              label={row.label}
              value={fmt(results?.[row.key], 2)}
              bag={row.bag}
              accent={row.accent}
              zebra={i % 2 === 0}
            />
          ))}

          {/* Heparin */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-4 sm:px-5 py-2.5 items-center bg-amber-50/40">
            <span className="text-sm font-sans text-amber-800">
              Heparin ({fmt(results?.heparinUnitPerMl, 1)} u/ml)
            </span>
            <div className="text-right w-16">
              <span className="text-sm font-mitr font-semibold tabular-nums text-amber-700">
                {fmt(results?.heparinMl, 2)}
              </span>
              <span className="block text-[10px] text-slate-400 font-sans">
                ({fmt(results?.heparinUnits, 0)} u)
              </span>
            </div>
            <span className="text-[10px] font-semibold text-right w-12 text-slate-400 uppercase tracking-wide">TPN</span>
          </div>
        </div>
      </div>
    </div>
  );
}
