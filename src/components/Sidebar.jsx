import { useState, useEffect } from 'react';
import { Baby, Activity, Pill, Stethoscope, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

const MODULES = [
  { key: 'tpn-newborn',     icon: Baby,        label: 'TPN Calculator',      sublabel: 'ทารกแรกเกิด',      ready: true  },
  { key: 'pediatric-dose',  icon: Pill,        label: 'Pediatric Dosing',    sublabel: 'ขนาดยาเด็ก',       ready: false },
  { key: 'fluid-resus',     icon: Activity,    label: 'Fluid Resuscitation', sublabel: 'สารน้ำ / BSA',      ready: false },
  { key: 'growth-chart',    icon: Stethoscope, label: 'Growth & Vitals',     sublabel: 'กราฟเจริญเติบโต',  ready: false },
];

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;

export default function Sidebar({ activeKey, onSelect }) {
  // Closed by default on mobile (drawer hidden), open on desktop (full width)
  const [open, setOpen] = useState(() => !isMobile());

  // Lock body scroll when the mobile drawer is open
  useEffect(() => {
    if (open && isMobile()) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // Close drawer on ESC for accessibility
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape' && isMobile()) setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Reset to a sensible default only when crossing the lg breakpoint
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
        className={`fixed inset-0 z-20 bg-teal-900/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
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
            ? 'translate-x-0 w-[min(82vw,300px)] lg:w-[232px]'
            : '-translate-x-full lg:translate-x-0 w-[min(82vw,300px)] lg:w-[64px]'
          }
        `}
        style={{
          background: 'linear-gradient(180deg, #0d6e6e 0%, #095555 100%)',
          boxShadow: '4px 0 24px rgba(13,110,110,0.18)',
        }}
      >
        {/* Hospital header */}
        <div className={`flex items-center gap-3 px-3 py-5 border-b border-white/10 ${open ? '' : 'lg:justify-center'}`}>
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-white ring-1 ring-white/40 overflow-hidden flex items-center justify-center shadow-sm">
            <img
              src="/logo-kabinburi.PNG"
              alt="โลโก้ รพ.กบินทร์บุรี"
              className="w-full h-full object-contain p-1"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          {open && (
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="font-mitr text-base font-bold text-white leading-tight truncate">
                PediCalc
              </p>
              <p className="text-[11px] text-teal-200/80 truncate">รพ.กบินทร์บุรี</p>
            </div>
          )}
          {/* Mobile-only close button */}
          {open && (
            <button
              onClick={() => setOpen(false)}
              aria-label="ปิดเมนู"
              className="lg:hidden shrink-0 p-2 -mr-1 rounded-lg text-teal-100 hover:bg-white/10 active:bg-white/15 transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {open && (
            <p className="text-[9px] uppercase tracking-[0.15em] text-teal-300/60 px-3 pb-2 font-semibold">
              โมดูล
            </p>
          )}
          {MODULES.map(({ key, icon: Icon, label, sublabel, ready }) => {
            const active = key === activeKey;
            return (
              <button
                key={key}
                onClick={() => {
                  if (!ready) return;
                  onSelect(key);
                  if (isMobile()) setOpen(false);
                }}
                title={!open ? label : undefined}
                disabled={!ready}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 lg:py-2.5 text-left
                  nav-item transition-all duration-150 group relative
                  ${!open ? 'lg:justify-center' : ''}
                  ${active
                    ? 'rounded-xl'
                    : ready
                      ? 'rounded-xl hover:bg-white/10 active:bg-white/15'
                      : 'rounded-xl cursor-not-allowed opacity-40'}
                `}
                style={active ? {
                  background: 'rgba(255,255,255,0.15)',
                  boxShadow: 'inset 3px 0 0 rgba(255,255,255,0.8)',
                } : {}}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${active ? 'text-white' : ready ? 'text-teal-200 group-hover:text-white' : 'text-teal-400/50'}`}
                />
                {open && (
                  <div className="overflow-hidden flex-1 min-w-0">
                    <p className={`font-mitr text-sm font-medium leading-tight truncate ${active ? 'text-white' : 'text-teal-100'}`}>
                      {label}
                    </p>
                    <p className={`text-[10px] truncate ${active ? 'text-teal-100/70' : 'text-teal-300/50'}`}>
                      {sublabel}
                    </p>
                  </div>
                )}
                {open && !ready && (
                  <span className="shrink-0 text-[9px] bg-white/10 text-teal-200 px-1.5 py-0.5 rounded-full font-medium tracking-wide">
                    Soon
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop-only collapse toggle (mobile uses backdrop / X) */}
        <div className="hidden lg:block border-t border-white/10 p-2">
          <button
            onClick={() => setOpen((s) => !s)}
            className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-teal-200/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            {open
              ? <><ChevronLeft size={15} /><span className="text-xs font-sans">ซ่อนแถบ</span></>
              : <ChevronRight size={15} />
            }
          </button>
        </div>
      </aside>

      {/* Mobile floating menu button — visible only when drawer is closed */}
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        className={`fixed top-2.5 left-3 z-40 lg:hidden p-2.5 rounded-xl shadow-lg text-white transition-opacity duration-200 ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ background: '#0d6e6e' }}
      >
        <Menu size={20} />
      </button>
    </>
  );
}
