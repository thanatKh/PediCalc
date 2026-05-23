import { AlertCircle, ShieldCheck } from 'lucide-react';
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
};

export default function ClinicalAlertsPanel({ inputs, results, validation }) {
  const checks   = evaluateClinicalTiers(inputs, results) ?? {};
  const { critical, moderate } = countTiers(checks);

  const errors   = validation?.errors   ?? [];
  const warnings = validation?.warnings ?? [];

  const criticals = Object.entries(checks).filter(([, v]) => v.tier === 'critical');
  const moderates = Object.entries(checks).filter(([, v]) => v.tier === 'moderate');

  const hasErrors   = errors.length > 0;
  const hasAnything = hasErrors || warnings.length > 0 || critical > 0 || moderate > 0;

  if (!hasAnything) {
    return (
      <div className="alert-enter flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-emerald-50 ring-1 ring-emerald-200/60 text-emerald-700">
        <ShieldCheck size={15} className="shrink-0 text-emerald-500" />
        <p className="text-[11px] font-semibold font-sans">All parameters within PediNAT 2565 safe range</p>
      </div>
    );
  }

  const borderColor = hasErrors || critical > 0 ? 'border-rose-400' : 'border-amber-400';
  const headerBg    = hasErrors || critical > 0 ? 'bg-rose-50'      : 'bg-amber-50';
  const headerText  = hasErrors || critical > 0 ? 'text-rose-700'   : 'text-amber-700';
  const iconColor   = hasErrors || critical > 0 ? 'text-rose-500'   : 'text-amber-500';

  return (
    <div className={`alert-enter rounded-2xl border border-l-4 font-sans overflow-hidden ${borderColor}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 px-3 py-2 flex-wrap ${headerBg}`}>
        <AlertCircle size={14} className={`shrink-0 ${iconColor}`} />
        <span className={`text-[11px] font-bold font-sans flex-1 ${headerText}`}>
          Clinical Decision Support
        </span>
        {hasErrors && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
            ⛔ {errors.length} Error{errors.length > 1 ? 's' : ''} — Export locked
          </span>
        )}
        {critical > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
            🚨 {critical} Critical
          </span>
        )}
        {moderate > 0 && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
            ⚠️ {moderate} Caution
          </span>
        )}
        <span className="text-[9px] text-slate-400 font-sans">PediNAT 2565</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-slate-100 bg-white">
        {errors.map((msg, i) => (
          <div key={`err-${i}`} className="flex items-start gap-2 px-3 py-2">
            <span className="text-[11px] mt-px shrink-0">⛔</span>
            <span className="text-[11px] font-semibold text-rose-700">{msg}</span>
          </div>
        ))}
        {criticals.map(([key, v]) => (
          <div key={key} className="flex items-start gap-2 px-3 py-2">
            <span className="text-[11px] mt-px shrink-0">🚨</span>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-rose-700">{PARAM_LABELS[key] ?? key}: </span>
              <span className="text-[11px] text-rose-700">{v.message}</span>
              {v.risk && <p className="text-[10px] text-rose-400 mt-0.5">{v.risk}</p>}
            </div>
          </div>
        ))}
        {moderates.map(([key, v]) => (
          <div key={key} className="flex items-start gap-2 px-3 py-2">
            <span className="text-[11px] mt-px shrink-0">⚠️</span>
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-bold text-amber-700">{PARAM_LABELS[key] ?? key}: </span>
              <span className="text-[11px] text-amber-700">{v.message}</span>
              {v.risk && <p className="text-[10px] text-amber-400 mt-0.5">{v.risk}</p>}
            </div>
          </div>
        ))}
        {warnings.map((msg, i) => (
          <div key={`warn-${i}`} className="flex items-start gap-2 px-3 py-2">
            <span className="text-[11px] mt-px shrink-0">⚠️</span>
            <span className="text-[11px] text-amber-700">{msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
