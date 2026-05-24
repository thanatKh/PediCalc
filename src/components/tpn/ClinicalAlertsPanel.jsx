import { useEffect, useRef, useState } from 'react';
import { AlertCircle, ShieldCheck, MousePointerClick } from 'lucide-react';
import { evaluateClinicalTiers, countTiers } from '@/utils/clinicalDecisionSupport';

const PARAM_LABELS = {
  fluid:      'Fluid Volume',
  gir:        'GIR',
  protein:    'Amino Acids',
  lipid:      'Lipid',
  na:         'Sodium (Na)',
  k:          'Potassium (K)',
  ca:         'Calcium',
  po4:        'Phosphate (PO₄)',
  mg:         'Magnesium',
  osmolarity: 'Osmolarity',
  dextrose:   'Dextrose %',
  caxp:         'Ca×PO₄ Precipitation',
  capo4balance: 'Ca / PO₄ Balance',
  energy:       'Total Energy',
  npcn:         'NPC:N Ratio',
  soluvit:      'Soluvit-N',
  vitalipid:  'Vitalipid N Infant',
  pediatrace: 'Pediatrace',
};

const FIELD_MAP = {
  fluid:      ['volumeTarget'],
  gir:        ['manualTPNRate'],
  protein:    ['proteinTarget'],
  lipid:      ['lipidTarget'],
  na:         ['na3PctTarget', 'naGlyceroTarget'],
  k:          ['k15PctTarget', 'k2hpo4Target'],
  ca:         ['caTarget'],
  po4:        ['naGlyceroTarget', 'k2hpo4Target'],
  mg:         ['mgTarget'],
  osmolarity: ['dextrosePct'],
  dextrose:   ['dextrosePct'],
  caxp:         ['caTarget', 'naGlyceroTarget', 'k2hpo4Target'],
  capo4balance: ['caTarget', 'naGlyceroTarget', 'k2hpo4Target'],
  energy:       ['proteinTarget', 'lipidTarget', 'dextrosePct'],
  npcn:         ['proteinTarget', 'lipidTarget', 'dextrosePct'],
  soluvit:      ['soluvitOverride'],
  vitalipid:  ['vitalipidOverride'],
  pediatrace: ['pediatraceOverride'],
};

/* Derives a stable string key from the current alert state so we can
   remount (and replay the entry animation) whenever the state changes. */
function stateKey(hasErrors, critical, moderate, errorCount) {
  if (hasErrors)   return `err-${errorCount}`;
  if (critical > 0) return `crit-${critical}`;
  if (moderate > 0) return `mod-${moderate}`;
  return 'safe';
}

export default function ClinicalAlertsPanel({ inputs, results, validation, onNavigate }) {
  const checks   = evaluateClinicalTiers(inputs, results) ?? {};
  const { critical, moderate } = countTiers(checks);

  const errors   = validation?.errors   ?? [];
  const warnings = validation?.warnings ?? [];

  const criticals = Object.entries(checks).filter(([, v]) => v.tier === 'critical');
  const moderates = Object.entries(checks).filter(([, v]) => v.tier === 'moderate');

  const hasErrors   = errors.length > 0;
  const hasAnything = hasErrors || warnings.length > 0 || critical > 0 || moderate > 0;

  /* Track previous state to detect safe↔alert transitions */
  const prevSafe = useRef(!hasAnything);
  const [transitionKey, setTransitionKey] = useState(
    () => stateKey(hasErrors, critical, moderate, errors.length)
  );

  useEffect(() => {
    const newKey = stateKey(hasErrors, critical, moderate, errors.length);
    if (newKey !== transitionKey) {
      setTransitionKey(newKey);
    }
    prevSafe.current = !hasAnything;
  });

  /* ── Safe state ──────────────────────────────────────────────── */
  if (!hasAnything) {
    return (
      <div
        key={transitionKey}
        className="cds-safe-enter cds-safe-pulse cds-safe-shimmer
                   flex items-center gap-3 px-4 py-3.5 rounded-2xl
                   ring-1 ring-emerald-200/80 text-emerald-700
                   shadow-sm shadow-emerald-100"
      >
        <span className="shrink-0 flex items-center justify-center size-7 rounded-full bg-emerald-100 ring-1 ring-emerald-200/60">
          <ShieldCheck size={15} className="text-emerald-600" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold font-sans leading-tight">All parameters within safe range</p>
          <p className="text-xs font-sans text-emerald-500/80 mt-0.5 leading-none">PediNAT 2565 ✓</p>
        </div>
        <span className="shrink-0 text-[10px] font-sans font-semibold text-emerald-400/60 tracking-wide uppercase">
          CDS
        </span>
      </div>
    );
  }

  /* ── Alert state ─────────────────────────────────────────────── */
  const isCritical  = hasErrors || critical > 0;
  const borderColor = isCritical ? 'border-rose-400'  : 'border-amber-400';
  const headerBg    = isCritical ? 'bg-rose-50'        : 'bg-amber-50';
  const headerText  = isCritical ? 'text-rose-700'     : 'text-amber-700';
  const iconColor   = isCritical ? 'text-rose-500'     : 'text-amber-500';
  const shadowColor = isCritical
    ? 'shadow-rose-100/80'
    : 'shadow-amber-100/60';

  return (
    <div
      key={transitionKey}
      className={`cds-alert-enter rounded-2xl border font-sans
                  overflow-hidden shadow-sm ${borderColor} ${shadowColor}`}
    >
      {/* ── Header bar ── */}
      <div className={`flex items-center gap-2.5 px-3.5 py-2.5 flex-wrap ${headerBg}`}>
        <AlertCircle size={15} className={`shrink-0 ${iconColor}`} />
        <span className={`text-sm font-bold font-sans flex-1 ${headerText}`}>
          Clinical Decision Support
        </span>

        <div className="flex items-center gap-1.5 flex-wrap">
          {hasErrors && (
            <span className="cds-badge-pop inline-flex items-center gap-1 px-2 py-0.5
                             rounded-full bg-rose-100 text-rose-700 text-xs font-bold
                             ring-1 ring-rose-200/60">
              ⛔ {errors.length} Error{errors.length > 1 ? 's' : ''} — Export locked
            </span>
          )}
          {critical > 0 && (
            <span className="cds-badge-pop inline-flex items-center gap-1 px-2 py-0.5
                             rounded-full bg-rose-100 text-rose-700 text-xs font-bold
                             ring-1 ring-rose-200/60">
              🚨 {critical} Critical
            </span>
          )}
          {moderate > 0 && (
            <span className="cds-badge-pop inline-flex items-center gap-1 px-2 py-0.5
                             rounded-full bg-amber-100 text-amber-700 text-xs font-bold
                             ring-1 ring-amber-200/60"
              style={{ animationDelay: '60ms' }}
            >
              ⚠️ {moderate} Caution
            </span>
          )}
        </div>

        <span className="text-xs text-slate-500 font-sans font-semibold">PediNAT 2565</span>
      </div>

      {/* ── Alert rows ── */}
      <div className="cds-rows divide-y divide-slate-100/80 bg-white">
        {errors.map((msg, i) => (
          <div key={`err-${i}`} className="cds-row-enter flex items-start gap-2.5 px-3.5 py-2.5">
            <span className="text-sm mt-px shrink-0">⛔</span>
            <span className="text-sm font-semibold text-rose-700">{msg}</span>
          </div>
        ))}

        {criticals.map(([key, v]) => {
          const fields = FIELD_MAP[key];
          const clickable = onNavigate && fields;
          return (
            <div
              key={key}
              onClick={clickable ? () => onNavigate(fields, '#f43f5e') : undefined}
              className={`cds-row-enter flex items-start gap-2.5 px-3.5 py-2.5 transition-colors
                ${clickable ? 'cursor-pointer hover:bg-rose-50 active:bg-rose-100 group' : ''}`}
            >
              <span className="text-sm mt-px shrink-0">🚨</span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-rose-700">{PARAM_LABELS[key] ?? key}: </span>
                <span className="text-sm text-rose-700">{v.message}</span>
                {v.risk && <p className="text-xs text-rose-400/80 mt-0.5 leading-tight">{v.risk}</p>}
              </div>
              {clickable && (
                <MousePointerClick size={14} className="shrink-0 mt-0.5 text-rose-300 group-hover:text-rose-500 transition-colors" />
              )}
            </div>
          );
        })}

        {moderates.map(([key, v]) => {
          const fields = FIELD_MAP[key];
          const clickable = onNavigate && fields;
          return (
            <div
              key={key}
              onClick={clickable ? () => onNavigate(fields, '#f59e0b') : undefined}
              className={`cds-row-enter flex items-start gap-2.5 px-3.5 py-2.5 transition-colors
                ${clickable ? 'cursor-pointer hover:bg-amber-50 active:bg-amber-100 group' : ''}`}
            >
              <span className="text-sm mt-px shrink-0">⚠️</span>
              <div className="min-w-0 flex-1">
                <span className="text-sm font-bold text-amber-700">{PARAM_LABELS[key] ?? key}: </span>
                <span className="text-sm text-amber-700">{v.message}</span>
                {v.risk && <p className="text-xs text-amber-400/80 mt-0.5 leading-tight">{v.risk}</p>}
              </div>
              {clickable && (
                <MousePointerClick size={14} className="shrink-0 mt-0.5 text-amber-300 group-hover:text-amber-500 transition-colors" />
              )}
            </div>
          );
        })}

        {warnings.map((msg, i) => (
          <div key={`warn-${i}`} className="cds-row-enter flex items-start gap-2.5 px-3.5 py-2.5">
            <span className="text-sm mt-px shrink-0">⚠️</span>
            <span className="text-sm text-amber-700">{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
