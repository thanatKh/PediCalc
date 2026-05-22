import { AlertTriangle, Droplet, Zap } from 'lucide-react';
import { NumberTicker } from '@/components/ui/number-ticker';
import { fmt, StatPill } from './ui';
import {
  GIR_MAX_SAFE,
  GIR_MIN_SAFE,
  OSMOLARITY_PERIPHERAL_MAX,
  DEXTROSE_PERIPHERAL_LIMIT,
  NPC_N_TARGET_MIN,
  NPC_N_TARGET_MAX,
  FAT_RATE_MAX_G_KG_HR,
} from '@/utils/clinicalConstants';

const ALERT_STYLES = {
  rose:   { wrap: 'bg-rose-50 border-rose-500',    icon: 'text-rose-500',   title: 'text-rose-700',   body: 'text-rose-600' },
  amber:  { wrap: 'bg-amber-50 border-amber-500',   icon: 'text-amber-500',  title: 'text-amber-800',  body: 'text-amber-600' },
  yellow: { wrap: 'bg-yellow-50 border-yellow-500', icon: 'text-yellow-600', title: 'text-yellow-900', body: 'text-yellow-700' },
};

function AlertBanner({ color, title, body }) {
  const s = ALERT_STYLES[color] ?? ALERT_STYLES.amber;
  return (
    <div className={`alert-enter rounded-2xl p-4 flex gap-3 border-l-4 ${s.wrap}`}>
      <AlertTriangle className={`shrink-0 mt-0.5 ${s.icon}`} size={20} />
      <div className="text-sm font-sans">
        <p className={`font-bold ${s.title}`}>{title}</p>
        <p className={`mt-0.5 ${s.body}`}>{body}</p>
      </div>
    </div>
  );
}

export default function ResultsPanel({ results, inputs }) {
  const dexPct          = parseFloat(inputs.dextrosePct) || 0;
  const waterNegative   = !!results?.isWaterNegative;
  const peripheralRisk  = !!results?.peripheralRisk;
  const caxPHigh        = !!results?.caxPHigh;
  const fatRateHigh     = !!results?.fatRateHigh;
  const manualLipidRate = parseFloat(inputs.manualLipidRate);
  const sterileWater    = results?.sterileWaterMl ?? null;

  // GIR from reverse calculation — null until physician enters TPN rate
  const gir     = results?.gir ?? null;
  const girHigh = results?.girHigh ?? false;
  const girLow  = results?.girLow  ?? false;
  const girTone = gir === null ? 'slate' : girHigh || girLow ? 'amber' : 'emerald';

  return (
    <div className="space-y-4 stagger">

      {/* ── Clinical alerts ── */}
      {waterNegative && (
        <AlertBanner color="rose" title="Negative Sterile Water!"
          body="ผลรวมสารเกิน Total Volume — ลด targets ก่อนสั่งจ่าย · ปุ่ม Export ถูกล็อก" />
      )}
      {fatRateHigh && !waterNegative && (
        <AlertBanner color="rose" title="Critical Alert: Lipid Infusion Rate เกิน 0.17 g/kg/hr"
          body={`Fat Rate = ${fmt(results?.fatRateGKgHr, 3)} g/kg/hr — เสี่ยง Fat Overload Syndrome · ลด Lipid target ลง`} />
      )}
      {(girHigh || girLow) && !waterNegative && (
        <AlertBanner color="amber"
          title={girHigh ? 'GIR สูงเกินกำหนด (> 12 mg/kg/min)' : 'GIR ต่ำกว่าเป้าหมาย (< 4 mg/kg/min)'}
          body={`GIR = ${fmt(gir, 2)} mg/kg/min — ปรับ TPN Rate หรือ Dextrose%`} />
      )}
      {peripheralRisk && !waterNegative && (
        <AlertBanner color="amber" title="Peripheral Line Risk"
          body={`Dextrose ${fmt(dexPct, 1)}% · Osmolarity ${fmt(results?.estOsmolarity, 0)} mOsm/L — ควรเปลี่ยนเป็น Central line`} />
      )}
      {caxPHigh && !waterNegative && (
        <AlertBanner color="yellow" title="Risk of Ca-Phosphate Precipitation"
          body={`Ca×PO₄ = ${fmt(results?.caxP, 1)} mmol²/L² (เกิน 55) — ลด Ca หรือ PO₄ ลง หรือสั่งแยก line`} />
      )}

      {/* ── Key stat pills ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 stagger">
        <StatPill label="TPN Volume"  value={results?.tpnVolume    ?? '—'} suffix="ml"        tone="teal"    decimals={1} />
        <StatPill label="GIR"         value={gir ?? '—'}                   suffix={gir !== null ? 'mg/kg/min' : ''} tone={girTone} decimals={2} />
        <StatPill label="DSF"         value={results?.dsf          ?? '—'} suffix=""           tone="slate"   decimals={3} />
        <StatPill label="Osmolarity"  value={results?.estOsmolarity ?? '—'} suffix="mOsm/L"   tone={(results?.estOsmolarity ?? 0) > OSMOLARITY_PERIPHERAL_MAX ? 'amber' : 'slate'} decimals={0} />
        <StatPill label="Dextrose"    value={dexPct}                        suffix="%"          tone={dexPct > DEXTROSE_PERIPHERAL_LIMIT ? 'amber' : 'slate'} decimals={1} />
        <StatPill label="BW"          value={parseFloat(inputs.bw) || '—'} suffix="kg"         tone="slate"   decimals={2} />
      </div>

      {/* ── Lipid rate card (TPN rate is physician-prescribed, not auto-displayed) ── */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-up">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100/80 flex items-center gap-2">
          <Droplet size={14} className="text-teal-600" />
          <span className="font-mitr text-sm font-semibold text-teal-700">อัตราหยด · Infusion Rates</span>
        </div>
        <div className="px-4 sm:px-5 py-4 grid grid-cols-2 gap-3">
          {/* TPN Rate — physician prescribed */}
          <div className="rounded-xl bg-slate-50 ring-1 ring-slate-200/60 px-3 py-3">
            <p className="text-[9px] uppercase tracking-wider font-bold text-slate-400">TPN Rate (สั่ง)</p>
            <p className="font-mitr font-bold text-slate-700 text-2xl tabular-nums leading-tight mt-0.5">
              {inputs.manualTPNRate !== '' && parseFloat(inputs.manualTPNRate) > 0
                ? <>{fmt(parseFloat(inputs.manualTPNRate), 1)}<span className="text-[11px] font-sans font-normal text-slate-400 ml-1">ml/hr</span></>
                : <span className="text-slate-300 text-lg">— ระบุใน Rate Section</span>
              }
            </p>
            {gir !== null && (
              <p className={`text-[9px] mt-0.5 font-sans font-semibold ${girHigh || girLow ? 'text-amber-600' : 'text-teal-600'}`}>
                GIR = {fmt(gir, 2)} mg/kg/min {girHigh ? '⚠ สูง' : girLow ? '⚠ ต่ำ' : '✓'}
              </p>
            )}
          </div>
          {/* Lipid Rate */}
          <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-200/60 px-3 py-3">
            <p className="text-[9px] uppercase tracking-wider font-bold text-emerald-400">Lipid Rate</p>
            <p className={`font-mitr font-bold text-2xl tabular-nums leading-tight mt-0.5 ${fatRateHigh ? 'text-rose-600' : 'text-emerald-700'}`}>
              {fmt(results?.lipidRate, 1)}
              <span className="text-[11px] font-sans font-normal text-emerald-400 ml-1">ml/hr</span>
            </p>
            <p className={`text-[9px] mt-0.5 font-sans font-semibold ${fatRateHigh ? 'text-rose-600' : 'text-emerald-400'}`}>
              Fat {fmt(results?.fatRateGKgHr, 3)} g/kg/hr {fatRateHigh ? `⚠ >0.17` : `✓ ≤${FAT_RATE_MAX_G_KG_HR}`}
            </p>
            {!isNaN(manualLipidRate) && inputs.manualLipidRate !== '' && (
              <p className="text-[10px] text-emerald-500 mt-1 font-semibold">สั่ง: {fmt(manualLipidRate, 1)} ml/hr</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Energy distribution ── */}
      <div className="glass-card rounded-2xl overflow-hidden animate-fade-up">
        <div className="px-4 sm:px-5 py-3 border-b border-slate-100/80 flex items-center gap-2">
          <Zap size={14} className="text-teal-600" />
          <span className="font-mitr text-sm font-semibold text-teal-700">พลังงาน · Energy</span>
        </div>
        <div className="px-4 sm:px-5 py-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-sans text-slate-500">Total Energy</span>
            <span className="font-mitr font-semibold text-teal-700">
              {fmt(results?.totalEnergy, 1)}<span className="text-[10px] font-sans text-slate-400 ml-1">kcal/day</span>
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-sans text-slate-500">kcal/kg/day</span>
            <span className="font-mitr font-semibold text-teal-700">
              {fmt(results?.kcalPerKg, 1)}<span className="text-[10px] font-sans text-slate-400 ml-1">kcal/kg</span>
            </span>
          </div>
          <div className="h-px bg-slate-100 my-1" />
          {[
            { label: 'CHO (3.4 kcal/g)',   kcal: results?.cho_kcal,     pct: results?.choPct,     color: 'bg-blue-500' },
            { label: 'Protein (4 kcal/g)', kcal: results?.protein_kcal, pct: results?.proteinPct, color: 'bg-amber-500' },
            { label: 'Fat (2 kcal/ml)',    kcal: results?.fat_kcal,     pct: results?.fatPct,     color: 'bg-emerald-500' },
          ].map((row) => (
            <div key={row.label} className="space-y-0.5">
              <div className="flex justify-between text-[11px] font-sans">
                <span className="text-slate-500">{row.label}</span>
                <span className="text-slate-700 font-semibold">{fmt(row.kcal, 1)} kcal ({fmt(row.pct, 1)}%)</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${row.color}`}
                  style={{ width: `${Math.min(row.pct ?? 0, 100)}%`, transition: 'width 0.3s ease' }} />
              </div>
            </div>
          ))}
          <div className="h-px bg-slate-100 my-1" />
          <div className="flex justify-between items-center text-[11px] font-sans">
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
      <div className="animate-fade-up rounded-2xl p-4 flex items-center gap-3 sm:gap-4 min-w-0"
        style={waterNegative
          ? { background: '#fff1f2', border: '1px solid #fecdd3' }
          : { background: 'linear-gradient(135deg, #f0fafa 0%, #ccf0f0 100%)', border: '1px solid #99e0e0' }
        }
      >
        <div className="shrink-0 p-3 rounded-2xl" style={{ background: waterNegative ? '#fecdd3' : 'rgba(255,255,255,0.7)' }}>
          <Droplet size={24} style={{ color: waterNegative ? '#e11d48' : '#0d6e6e' }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em] font-bold text-slate-400 truncate">Sterile Water for Injection</p>
          <p className="font-mitr text-xl sm:text-2xl font-semibold tabular-nums leading-tight truncate"
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
