import { useRef } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const CE_TO_BE = 543;

function formatDisplay(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}/${m}/${parseInt(y, 10) + CE_TO_BE}`;
}

export default function DateFieldTH({ label, value, onChange, min, className }) {
  const inputRef = useRef(null);

  return (
    <div className={cn('space-y-1.5 min-w-0', className)}>
      {label && (
        <label className="text-sm font-semibold text-slate-600 leading-none block">
          {label}
        </label>
      )}
      {/* Visible display — click opens the hidden native picker */}
      <div
        className="relative cursor-pointer"
        onClick={() => inputRef.current?.showPicker?.()}
      >
        <div className={cn(
          'bg-white border border-slate-200 rounded-xl h-11 px-3 flex items-center text-base font-sans shadow-sm',
          'text-slate-800 select-none',
          value ? '' : 'text-slate-400',
        )}>
          {value ? formatDisplay(value) : 'วว/ดด/ปปปป'}
        </div>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
          พ.ศ.
        </span>
        {/* Native date input — invisible but functional */}
        <input
          ref={inputRef}
          type="date"
          value={value}
          min={min}
          onChange={onChange}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          tabIndex={-1}
        />
      </div>
    </div>
  );
}
