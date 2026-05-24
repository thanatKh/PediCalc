import { AlertOctagon, AlertTriangle, CheckCircle2, Droplet, Zap } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { fmt, StatPill } from './ui';
import ClinicalAlertsPanel from './ClinicalAlertsPanel';
import {
  OSMOLARITY_PERIPHERAL_MAX,
  DEXTROSE_PERIPHERAL_LIMIT,
  NPC_N_TARGET_MIN,
  NPC_N_TARGET_MAX,
  FAT_RATE_MAX_G_KG_HR,
} from '@/utils/clinicalConstants';

export default function ResultsPanel({ results, inputs, validation, onNavigate }) {
  const dexPct        = parseFloat(inputs.dextrosePct) || 0;
  const waterNegative = !!results?.isWaterNegative;
  const sterileWater  = results?.sterileWaterMl ?? null;

  const gir     = results?.gir ?? null;
  const girHigh = results?.girHigh ?? false;
  const girLow  = results?.girLow  ?? false;
  const girTone = gir === null ? 'slate' : girHigh || girLow ? 'amber' : 'emerald';

  const manualLipidRate = parseFloat(inputs.manualLipidRate);
  const fatRateHigh     = !!results?.fatRateHigh;

  return (
    <div className="space-y-4 stagger">

      {/* ── System-level alert: negative sterile water blocks export ── */}
      {waterNegative && (
        <div className="glass-card animate-fade-up rounded-2xl border border-rose-400 overflow-hidden">
          <div className="flex items-start gap-2.5 px-3.5 py-3 bg-rose-50">
            <AlertOctagon size={15} className="text-rose-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-sm font-bold font-sans text-rose-700">Negative Sterile Water — Export locked</p>
              <p className="text-xs font-sans text-rose-500 mt-0.5 leading-snug">
                Component volumes exceed Total Volume — reduce targets before ordering.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Clinical Decision Support — PediNAT 2565 tiered alerts ── */}
      <div id="cds-alerts">
        <ClinicalAlertsPanel inputs={inputs} results={results} validation={validation} onNavigate={onNavigate} />
      </div>

      {/* ── Key stat pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 stagger">
        <StatPill label="TPN Volume"  value={results?.tpnVolume    ?? '—'} suffix="ml"        tone="teal"    decimals={1} />
        <StatPill label="GIR"         value={gir ?? '—'}                   suffix={gir !== null ? 'mg/kg/min' : ''} tone={girTone} decimals={2} />
        <StatPill label="DSF"         value={results?.dsf          ?? '—'} suffix=""           tone="slate"   decimals={3} />
        <StatPill label="Osmolarity"  value={results?.estOsmolarity ?? '—'} suffix="mOsm/L"   tone={(results?.estOsmolarity ?? 0) > OSMOLARITY_PERIPHERAL_MAX ? 'amber' : 'slate'} decimals={0} />
        <StatPill label="Dextrose"    value={dexPct}                        suffix="%"          tone={dexPct > DEXTROSE_PERIPHERAL_LIMIT ? 'amber' : 'slate'} decimals={1} />
        <StatPill label="BW"          value={parseFloat(inputs.bw) || '—'} suffix="kg"         tone="slate"   decimals={2} />
      </div>

      {/* ── Infusion rates card ── */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-up">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100/80 flex items-center gap-2.5">
          <Droplet size={16} className="text-teal-500" />
          <span className="font-mitr text-base font-semibold text-teal-600">Infusion Rates · อัตราหยด</span>
        </div>
        <div className="px-4 sm:px-5 py-4 grid grid-cols-2 gap-3">
          {/* TPN Rate — physician prescribed */}
          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200/60 px-3 py-3.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">TPN Rate (สั่ง)</p>
            <p className="font-mitr font-bold text-slate-700 text-2xl tabular-nums leading-tight mt-1">
              {inputs.manualTPNRate !== '' && parseFloat(inputs.manualTPNRate) > 0
                ? <>{fmt(parseFloat(inputs.manualTPNRate), 1)}<span className="text-sm font-sans font-normal text-slate-400 ml-1">ml/hr</span></>
                : <span className="text-slate-300 text-lg">—</span>
              }
            </p>
            {gir !== null && (
              <p className={`flex items-center gap-1 text-xs mt-1 font-sans font-semibold ${girHigh || girLow ? 'text-amber-600' : 'text-teal-600'}`}>
                GIR = {fmt(gir, 2)} mg/kg/min
                {girHigh || girLow
                  ? <><AlertTriangle size={11} className="shrink-0" />{girHigh ? 'High' : 'Low'}</>
                  : <CheckCircle2 size={11} className="shrink-0" />
                }
              </p>
            )}
          </div>
          {/* Lipid Rate */}
          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200/60 px-3 py-3.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Lipid Rate</p>
            <p className={`font-mitr font-bold text-2xl tabular-nums leading-tight mt-1 ${fatRateHigh ? 'text-rose-600' : 'text-slate-700'}`}>
              {fmt(results?.lipidRate, 1)}
              <span className="text-sm font-sans font-normal text-slate-400 ml-1">ml/hr</span>
            </p>
            <p className={`flex items-center gap-1 text-xs mt-1 font-sans font-semibold ${fatRateHigh ? 'text-rose-600' : 'text-slate-400'}`}>
              Fat {fmt(results?.fatRateGKgHr, 3)} g/kg/hr
              {fatRateHigh
                ? <><AlertOctagon size={11} className="shrink-0" />&gt;0.17</>
                : <><CheckCircle2 size={11} className="shrink-0" />≤{FAT_RATE_MAX_G_KG_HR}</>
              }
            </p>
            {!isNaN(manualLipidRate) && inputs.manualLipidRate !== '' && (
              <p className="text-xs text-slate-500 mt-1 font-semibold">สั่ง: {fmt(manualLipidRate, 1)} ml/hr</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Energy distribution ── */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-up">
        <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100/80 flex items-center gap-2.5">
          <Zap size={16} className="text-teal-500" />
          <span className="font-mitr text-base font-semibold text-teal-600">Energy · พลังงาน</span>
        </div>
        <div className="px-4 sm:px-5 py-4 space-y-2.5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-sans text-slate-500">Total Energy</span>
            <span className="font-mitr font-semibold text-slate-700">
              {fmt(results?.totalEnergy, 1)}<span className="text-xs font-sans text-slate-400 ml-1">kcal/day</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-sans text-slate-500">kcal/kg/day</span>
            <span className="font-mitr font-semibold text-slate-700">
              {fmt(results?.kcalPerKg, 1)}<span className="text-xs font-sans text-slate-400 ml-1">kcal/kg</span>
            </span>
          </div>
          <Separator className="my-1" />
          {[
            { label: 'CHO (3.4 kcal/g)',   kcal: results?.cho_kcal,     pct: results?.choPct,     color: '[&>div]:bg-teal-600' },
            { label: 'Protein (4 kcal/g)', kcal: results?.protein_kcal, pct: results?.proteinPct, color: '[&>div]:bg-slate-500' },
            { label: 'Fat (2 kcal/ml)',    kcal: results?.fat_kcal,     pct: results?.fatPct,     color: '[&>div]:bg-slate-400' },
          ].map((row) => (
            <div key={row.label} className="space-y-1">
              <div className="flex justify-between text-sm font-sans">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-700 font-semibold">{fmt(row.kcal, 1)} kcal ({fmt(row.pct, 1)}%)</span>
              </div>
              <Progress
                value={Math.min(row.pct ?? 0, 100)}
                className={`h-1.5 bg-slate-100 ${row.color}`}
              />
            </div>
          ))}
          <Separator className="my-1" />
          <div className="flex justify-between items-center text-sm font-sans">
            <span className="text-slate-400">NPC:N ratio</span>
            <span className={`font-semibold ${
              (results?.npcN ?? 0) < NPC_N_TARGET_MIN || (results?.npcN ?? 0) > NPC_N_TARGET_MAX
                ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {fmt(results?.npcN, 0)}<span className="font-normal text-slate-400 ml-1">(target 150–200)</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── Sterile water hero ── */}
      <div className="animate-fade-up rounded-2xl p-4 flex items-center gap-3 min-w-0"
        style={waterNegative
          ? { background: '#fff1f2', border: '1px solid #fecdd3' }
          : { background: 'linear-gradient(135deg, #f0fafa 0%, #ccf0f0 100%)', border: '1px solid #99e0e0' }
        }
      >
        <div className="shrink-0 p-3 rounded-2xl" style={{ background: waterNegative ? '#fecdd3' : 'rgba(255,255,255,0.7)' }}>
          <Droplet size={24} style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.12em] font-bold text-slate-400 truncate">Sterile Water for Injection</p>
          <p className="font-mitr text-xl font-semibold tabular-nums leading-tight truncate"
            style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }}>
            {sterileWater !== null
              ? <NumberTicker value={sterileWater} decimalPlaces={2} className="font-mitr font-semibold" style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }} />
              : <span>—</span>
            }
            <span className="text-sm font-sans font-normal ml-1.5 text-slate-400">ml</span>
          </p>
        </div>
      </div>
    </div>
  );
}
