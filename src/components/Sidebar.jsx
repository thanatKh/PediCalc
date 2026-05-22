import { useState, useEffect, useRef } from 'react';
import { Baby, Activity, Pill, Stethoscope, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

const MODULES = [
  { key: 'tpn-newborn',     icon: Baby,        label: 'TPN Calculator',      sublabel: 'Neonatal · ทารกแรกเกิด',   ready: true  },
  { key: 'pediatric-dose',  icon: Pill,        label: 'Pediatric Dosing',    sublabel: 'Drug dose · ขนาดยาเด็ก',    ready: false },
  { key: 'fluid-resus',     icon: Activity,    label: 'Fluid Resuscitation', sublabel: 'IV Fluid · สารน้ำ / BSA',   ready: false },
  { key: 'growth-chart',    icon: Stethoscope, label: 'Growth & Vitals',     sublabel: 'Chart · กราฟเจริญเติบโต',   ready: false },
];

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

function NavTooltip({ label, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="bg-slate-900 text-white text-[11px] font-sans font-medium px-2.5 py-1.5 rounded-lg shadow-xl whitespace-nowrap">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ activeKey, onSelect }) {
  const [open, setOpen] = useState(() => !isMobile());

  useEffect(() => {
    if (open && isMobile()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && isMobile()) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = (e) => setOpen(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar */}
      <aside
        aria-label="Main navigation"
        className={`
          fixed top-0 left-0 z-30 h-[100dvh] flex flex-col overflow-hidden
          lg:relative lg:z-auto lg:h-full lg:flex-shrink-0
          transition-[transform,width] duration-300 ease-out
          ${open
            ? 'translate-x-0 w-[min(82vw,260px)] lg:w-[220px]'
            : '-translate-x-full lg:translate-x-0 w-[min(82vw,260px)] lg:w-[60px]'
          }
        `}
        style={{
          background: 'linear-gradient(180deg, #0d6e6e 0%, #095555 100%)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '4px 0 24px rgba(13,110,110,0.18)',
        }}
      >
        {/* ── Header ── */}
        <div
          className={`flex items-center gap-3 px-3 ${open ? '' : 'lg:justify-center'}`}
          style={{
            paddingTop: 'calc(env(safe-area-inset-top) + 1.1rem)',
            paddingBottom: '1.1rem',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div className="shrink-0 w-10 h-10 flex items-center justify-center">
            <img
              src="/logo-kabinburi-white.PNG"
              alt="โลโก้ รพ.กบินทร์บุรี"
              className="w-full h-full object-contain"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          {open && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="font-mitr text-[15px] font-bold text-white leading-tight truncate tracking-wide">
                PediCalc
              </p>
              <p className="text-[10px] text-teal-400/80 truncate font-sans tracking-wider uppercase">
                Kabinburi Hospital
              </p>
            </div>
          )}

          {open && (
            <button
              onClick={() => setOpen(false)}
              aria-label="ปิดเมนู"
              className="lg:hidden shrink-0 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ── Nav ── */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          {open && (
            <p className="text-[9px] uppercase tracking-[0.18em] text-white/25 px-3 pb-3 font-semibold font-sans">
              Modules
            </p>
          )}

          {MODULES.map(({ key, icon: Icon, label, sublabel, ready }) => {
            const active = key === activeKey;

            const btn = (
              <button
                key={key}
                onClick={() => {
                  if (!ready) return;
                  onSelect(key);
                  if (isMobile()) setOpen(false);
                }}
                title={undefined}
                disabled={!ready}
                className={`
                  w-full flex items-center gap-3 rounded-xl text-left
                  transition-all duration-150 group relative
                  ${open ? 'px-3 py-2.5' : 'lg:justify-center lg:px-0 lg:py-2.5 px-3 py-2.5'}
                  ${active
                    ? 'cursor-default'
                    : ready
                      ? 'hover:bg-white/[0.07] active:bg-white/10 cursor-pointer'
                      : 'cursor-not-allowed opacity-40'}
                `}
                style={active ? {
                  background: 'rgba(13,142,142,0.22)',
                  boxShadow: 'inset 0 0 0 1px rgba(13,200,200,0.18)',
                } : {}}
              >
                {/* Active left accent bar */}
                {active && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                    style={{ background: '#2bbaba' }}
                  />
                )}

                {/* Icon */}
                <span
                  className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                    active
                      ? 'text-teal-300'
                      : ready
                        ? 'text-white/40 group-hover:text-white/80'
                        : 'text-white/20'
                  }`}
                  style={active ? { background: 'rgba(13,200,200,0.15)' } : {}}
                >
                  <Icon size={17} />
                </span>

                {/* Labels */}
                {open && (
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className={`font-mitr text-[13px] font-semibold leading-tight truncate tracking-wide ${
                      active ? 'text-teal-200' : ready ? 'text-white/75 group-hover:text-white' : 'text-white/30'
                    }`}>
                      {label}
                    </p>
                    <p className={`text-[10px] font-sans truncate mt-0.5 ${
                      active ? 'text-teal-400/70' : 'text-white/25'
                    }`}>
                      {sublabel}
                    </p>
                  </div>
                )}

                {/* Coming soon badge */}
                {open && !ready && (
                  <span className="shrink-0 text-[9px] bg-white/8 border border-white/10 text-white/35 px-1.5 py-0.5 rounded-md font-sans font-medium tracking-widest">
                    SOON
                  </span>
                )}
              </button>
            );

            return !open
              ? <NavTooltip key={key} label={label}>{btn}</NavTooltip>
              : <div key={key}>{btn}</div>;
          })}
        </nav>

        {/* ── Version / collapse footer ── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} className="p-2 space-y-1">
          {open && (
            <p className="text-[9px] text-white/20 font-sans px-3 py-1 tracking-wider">
              v1.0.0 · PediCalc
            </p>
          )}
          <button
            onClick={() => setOpen((s) => !s)}
            className="hidden lg:flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-white/30 hover:text-white/70 hover:bg-white/[0.07] transition-colors"
          >
            {open
              ? <><ChevronLeft size={14} /><span className="text-[11px] font-sans">Collapse</span></>
              : <ChevronRight size={14} />
            }
          </button>
        </div>
      </aside>

      {/* Mobile floating menu button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        className={`fixed left-3 z-40 lg:hidden p-2.5 rounded-xl shadow-xl text-white transition-opacity duration-200 ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{
          background: 'linear-gradient(135deg, #0d8f8f 0%, #0d6e6e 100%)',
          top: 'calc(env(safe-area-inset-top) + 0.625rem)',
          boxShadow: '0 4px 16px rgba(13,110,110,0.4)',
        }}
      >
        <Menu size={20} />
      </button>
    </>
  );
}
