import { Zap, AlertOctagon, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
export { fmt } from '@/utils/fmt';

// ── Tone map (semantic color tokens) ────────────────────────────────────────
export const TONES = {
  slate:   { bg: 'bg-white',      text: 'text-slate-700',   sub: 'text-slate-400',   ring: 'ring-slate-200/80' },
  teal:    { bg: 'bg-teal-600',   text: 'text-white',       sub: 'text-teal-100',    ring: 'ring-teal-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', sub: 'text-emerald-400', ring: 'ring-emerald-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   sub: 'text-amber-400',   ring: 'ring-amber-200' },
};

// ── tier → style mapping for NumberField ────────────────────────────────────
const TIER_STYLES = {
  critical: { border: 'border-rose-400',  ring: 'ring-rose-300/60',  badge: 'bg-rose-50 text-rose-700 border-rose-200',   Icon: AlertOctagon },
  moderate: { border: 'border-amber-400', ring: 'ring-amber-300/60', badge: 'bg-amber-50 text-amber-700 border-amber-200', Icon: AlertTriangle },
};

// ── NumberField ──────────────────────────────────────────────────────────────
export function NumberField({ id, label, suffix, value, onChange, step = '0.1', required = false, hint, min, className, tier, tierMessage }) {
  const ts = TIER_STYLES[tier];
  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      <Label htmlFor={id} className="text-sm font-semibold text-slate-600 leading-none">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          enterKeyHint="next"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onWheel={(e) => e.currentTarget.blur()}
          onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
          className={cn(
            'bg-white rounded-xl pr-16 h-11 text-base font-sans text-slate-800 shadow-sm transition-[border-color,box-shadow] duration-150',
            ts ? `${ts.border} ${ts.ring} border` : 'border-slate-200',
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400 max-w-[3.75rem] truncate">
            {suffix}
          </span>
        )}
      </div>
      {ts && tierMessage && (
        <p className={cn('flex items-start gap-1.5 text-xs font-semibold font-sans leading-snug px-1.5 py-1 rounded-lg border', ts.badge)}>
          <ts.Icon size={12} className="shrink-0 mt-px" />
          {tierMessage}
        </p>
      )}
      {hint && <p className="text-xs text-slate-400 font-sans leading-snug px-0.5 mt-0.5">{hint}</p>}
    </div>
  );
}

// ── StatPill ─────────────────────────────────────────────────────────────────
export function StatPill({ label, value, suffix, tone = 'slate', decimals = 1 }) {
  const t = TONES[tone] ?? TONES.slate;
  const numVal = parseFloat(value);
  const isNumeric = !isNaN(numVal) && value !== '—';
  return (
    <div className={cn('stat-pill animate-fade-up px-3 py-3 rounded-2xl ring-1 flex flex-col gap-1 shadow-sm', t.bg, t.ring)}>
      <span className={cn('text-xs uppercase tracking-[0.1em] font-bold leading-none', t.sub)}>{label}</span>
      <span className={cn('text-lg font-mitr font-semibold tabular-nums leading-tight', t.text)}>
        {isNumeric
          ? <NumberTicker value={numVal} decimalPlaces={decimals} className={cn('font-mitr font-semibold', t.text)} />
          : value
        }
        {suffix && <span className="text-xs font-sans font-normal ml-1 opacity-70">{suffix}</span>}
      </span>
    </div>
  );
}

// ── SectionCard ──────────────────────────────────────────────────────────────
export function SectionCard({ title, icon: Icon, children, className, aboveFold = false }) {
  return (
    <div
      className={cn('glass-card rounded-2xl overflow-hidden animate-fade-up', className)}
      style={aboveFold ? undefined : { contentVisibility: 'auto', containIntrinsicSize: 'auto 200px' }}
    >
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-100/80 flex items-center gap-2.5">
        {Icon && <Icon size={16} className="text-teal-500" aria-hidden="true" />}
        <h2 className="font-mitr text-base font-semibold text-teal-600">{title}</h2>
      </div>
      <div className="px-4 sm:px-5 py-5">{children}</div>
    </div>
  );
}

// ── AutoBadge ────────────────────────────────────────────────────────────────
export function AutoBadge() {
  return (
    <Badge variant="outline" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-teal-600 bg-teal-50 border-teal-200/80 rounded-full h-auto leading-none">
      <Zap size={9} />AUTO
    </Badge>
  );
}

