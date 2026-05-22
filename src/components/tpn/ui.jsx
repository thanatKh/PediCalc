import { Zap } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberTicker } from '@/components/ui/number-ticker';
import { cn } from '@/lib/utils';

// ── Formatting helper ────────────────────────────────────────────────────────
export const fmt = (n, d = 2) =>
  n === undefined || n === null || Number.isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });

// ── Tone map (semantic color tokens) ────────────────────────────────────────
export const TONES = {
  slate:   { bg: 'bg-white',      text: 'text-slate-700',   sub: 'text-slate-400',   ring: 'ring-slate-200/80' },
  teal:    { bg: 'bg-teal-600',   text: 'text-white',       sub: 'text-teal-100',    ring: 'ring-teal-500' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', sub: 'text-emerald-400', ring: 'ring-emerald-200' },
  amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   sub: 'text-amber-400',   ring: 'ring-amber-200' },
  rose:    { bg: 'bg-rose-50',    text: 'text-rose-700',    sub: 'text-rose-400',    ring: 'ring-rose-200' },
  blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    sub: 'text-blue-400',    ring: 'ring-blue-200' },
};

// ── NumberField ──────────────────────────────────────────────────────────────
export function NumberField({ id, label, suffix, value, onChange, step = '0.1', required = false, hint, min, className }) {
  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      <Label htmlFor={id} className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
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
          className="bg-white border-slate-200 rounded-xl pr-14 h-11 md:h-10 text-base md:text-sm font-sans text-slate-800 shadow-sm transition-all duration-150"
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-[11px] font-semibold text-teal-600/70 max-w-[3.25rem] truncate">
            {suffix}
          </span>
        )}
      </div>
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
        {Icon && <Icon size={14} style={{ color: '#0d6e6e' }} />}
        <h2 className="font-mitr text-sm font-semibold tracking-wide text-teal-700">{title}</h2>
      </div>
      <div className="px-4 sm:px-5 py-4">{children}</div>
    </div>
  );
}

// ── AutoBadge ────────────────────────────────────────────────────────────────
export function AutoBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded-full ring-1 ring-teal-200/60">
      <Zap size={8} />AUTO
    </span>
  );
}

// ── ReadOnlyField ────────────────────────────────────────────────────────────
export function ReadOnlyField({ label, value, unit, badge, note, tone = 'slate' }) {
  const bgMap = { slate: 'bg-slate-50 ring-slate-200/80', amber: 'bg-amber-50 ring-amber-200', teal: 'bg-teal-50 ring-teal-200' };
  const textMap = { slate: 'text-teal-700', amber: 'text-amber-700', teal: 'text-teal-700' };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{label}</span>
        {badge}
      </div>
      <div className={cn('h-11 md:h-10 flex items-center px-3 rounded-xl ring-1', bgMap[tone] ?? bgMap.slate)}>
        <span className={cn('font-mitr font-semibold text-sm', textMap[tone] ?? textMap.slate)}>{value}</span>
        {unit && <span className="text-[10px] text-slate-400 ml-1 font-sans">{unit}</span>}
      </div>
      {note && <p className="text-[10px] text-slate-400 font-sans leading-snug px-0.5">{note}</p>}
    </div>
  );
}
