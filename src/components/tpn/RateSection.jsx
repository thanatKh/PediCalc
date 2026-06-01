import { memo } from 'react';
import { AlertTriangle, CheckCircle2, Gauge, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fmt, SectionCard } from './ui';

function RateSection({
  manualTPNRate,
  calcTPNRate,
  gir, girHigh, girLow,
  update,
}) {
  const isManual  = manualTPNRate !== '' && manualTPNRate != null;
  const hasRate   = isManual && parseFloat(manualTPNRate) > 0;
  const autoVal   = calcTPNRate ?? null;

  return (
    <SectionCard title="Prescribed Rates · อัตราหยดที่สั่ง" icon={Gauge}>
      <div className="grid grid-cols-2 gap-3">

        {/* TPN Rate — auto-populated from calc, overridable */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Label htmlFor="manualTPNRate" className="text-sm font-semibold text-slate-600 leading-tight">
              TPN Fluid Rate (สั่งจริง)
            </Label>
            {isManual ? (
              <Badge
                variant="outline"
                className="gap-1 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 bg-amber-50 border-amber-200/80 rounded-full h-auto leading-none cursor-pointer hover:bg-amber-100 transition-colors"
                onClick={() => update('manualTPNRate')('')}
                title="Reset to auto"
              >
                Manual <X size={8} />
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-0.5 px-1.5 py-0.5 text-[10px] font-bold text-teal-600 bg-teal-50 border-teal-200/80 rounded-full h-auto leading-none">
                AUTO
              </Badge>
            )}
          </div>

          <div className="relative">
            <Input
              id="manualTPNRate"
              type="number"
              inputMode="decimal"
              step="0.1"
              min="0"
              value={manualTPNRate}
              placeholder={autoVal !== null ? fmt(autoVal, 1) : '—'}
              onChange={(e) => update('manualTPNRate')(e.target.value)}
              onWheel={(e) => e.currentTarget.blur()}
              onKeyDown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault(); }}
              className="bg-white rounded-xl pr-14 h-11 text-base font-sans text-slate-800 shadow-sm border-slate-200 transition-[border-color,box-shadow] duration-150"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-semibold text-slate-400">
              ml/hr
            </span>
          </div>

          {hasRate && gir !== null && (
            <Badge className={`gap-1.5 px-2.5 py-1.5 text-sm font-semibold font-sans rounded-lg h-auto w-full justify-start border ${
              girHigh ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50'
              : girLow  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50'
            }`}>
              {girHigh || girLow
                ? <AlertTriangle size={13} className="shrink-0" />
                : <CheckCircle2 size={13} className="shrink-0" />}
              GIR = <span className="font-mitr font-bold">{fmt(gir, 2)}</span> mg/kg/min
              {girHigh && ' — สูงเกิน 12'}
              {girLow  && ' — ต่ำกว่า 4'}
            </Badge>
          )}
          {!hasRate && (
            <p className="text-xs text-slate-400 font-sans px-0.5">
              {autoVal !== null
                ? 'ค่า AUTO คือ Calc Rate — ระบุเพื่อคำนวณ GIR จริง'
                : 'กรุณาระบุ TPN Rate เพื่อคำนวณ GIR จริง'}
            </p>
          )}
        </div>

      </div>
    </SectionCard>
  );
}

export default memo(RateSection);
