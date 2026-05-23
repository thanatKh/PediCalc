import { Zap } from 'lucide-react';
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
  critical: { border: 'border-rose-400',  ring: 'ring-rose-300/60',  badge: 'bg-rose-50 text-rose-700 border-rose-200',   icon: '🚨' },
  moderate: { border: 'border-amber-400', ring: 'ring-amber-300/60', badge: 'bg-amber-50 text-amber-700 border-amber-200', icon: '⚠️' },
};

// ── NumberField ──────────────────────────────────────────────────────────────
export function NumberField({ id, label, suffix, value, onChange, step = '0.1', required = false, hint, min, className, tier, tierMessage }) {
  const ts = TIER_STYLES[tier];
  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      <Label htmlFor={id} className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'bg-white rounded-xl pr-14 h-11 md:h-10 text-base md:text-sm font-sans text-slate-800 shadow-sm transition-[border-color,box-shadow] duration-150',
            ts ? `${ts.border} ${ts.ring} border` : 'border-slate-200',
          )}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-slate-400 max-w-[3.25rem] truncate">
            {suffix}
          </span>
        )}
      </div>
      {ts && tierMessage && (
        <p className={cn('text-[10px] font-semibold font-sans leading-snug px-1 py-0.5 rounded-md border', ts.badge)}>
          {ts.icon} {tierMessage}
        </p>
      )}
      {hint && <p className="text-[10px] text-slate-400 font-sans leading-snug px-0.5">{hint}</p>}
    </div>
  );
}

// ── StatPill ─────────────────────────────────────────────────────────────────
export function StatPill({ label, value, suffix, tone = 'slate', decimals = 1 }) {
  const t = TONES[tone] ?? TONES.slate;
  const numVal = parseFloat(value);
  const isNumeric = !isNaN(numVal) && value !== '—';
  return (
    <div className={cn('stat-pill animate-fade-up px-3 py-2.5 rounded-2xl ring-1 flex flex-col gap-0.5 shadow-sm', t.bg, t.ring)}>
      <span className={cn('text-[9px] uppercase tracking-[0.12em] font-bold', t.sub)}>{label}</span>
      <span className={cn('text-lg font-mitr font-semibold tabular-nums leading-tight', t.text)}>
        {isNumeric
          ? <NumberTicker value={numVal} decimalPlaces={decimals} className={cn('font-mitr font-semibold', t.text)} />
          : value
        }
        {suffix && <span className="text-[11px] font-sans font-normal ml-1 opacity-70">{suffix}</span>}
      </span>
    </div>
  );
}

// ── SectionCard ──────────────────────────────────────────────────────────────
export function SectionCard({ title, icon: Icon, children, className }) {
  return (
    <div className={cn('glass-card rounded-2xl overflow-hidden animate-fade-up', className)}>
      <div className="px-4 sm:px-5 py-3 border-b border-slate-100/80 flex items-center gap-2">
        {Icon && <Icon size={14} className="text-slate-400" aria-hidden="true" />}
        <h2 className="font-mitr text-sm font-semibold tracking-wide text-slate-700">{title}</h2>
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </div>
  );
}

// ── AutoBadge ────────────────────────────────────────────────────────────────
export function AutoBadge() {
  return (
    <Badge variant="outline" className="gap-0.5 px-1.5 py-0 text-[9px] font-semibold text-teal-600 bg-teal-50 border-teal-200/80 rounded-full h-auto leading-none">
      <Zap size={8} />AUTO
    </Badge>
  );
}

