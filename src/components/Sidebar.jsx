import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Baby, Activity, Pill, Stethoscope, PanelLeftClose, Menu, ChevronDown } from 'lucide-react';
import { HOSPITALS, APP_LOGO, APP_COLOR } from '@/utils/hospitals';

const MODULES = [
  { key: 'tpn-newborn',     icon: Baby,        label: 'TPN Calculator',      sublabel: 'Neonatal · ทารกแรกเกิด',  ready: true  },
  { key: 'pediatric-dose',  icon: Pill,        label: 'Pediatric Dosing',    sublabel: 'Drug dose · ขนาดยาเด็ก',   ready: false },
  { key: 'fluid-resus',     icon: Activity,    label: 'Fluid Resuscitation', sublabel: 'IV Fluid · สารน้ำ / BSA',  ready: false },
  { key: 'growth-chart',    icon: Stethoscope, label: 'Growth & Vitals',     sublabel: 'กราฟเจริญเติบโต',          ready: false },
];

const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 1024;
const isWide   = () => typeof window !== 'undefined' && window.innerWidth >= 1280;

/* ── Tooltip: portaled to document.body to escape the aside's transform stacking context ── */
function Tooltip({ label, children }) {
  const [pos, setPos] = useState(null);
  const ref = useRef(null);

  const show = () => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.top + r.height / 2, left: r.right });
  };
  const hide = () => setPos(null);

  return (
    <div ref={ref} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
      {children}
      {pos && createPortal(
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ top: pos.top, left: pos.left + 10, transform: 'translateY(-50%)' }}
        >
          <div className="bg-slate-900 text-white text-[11px] font-sans font-medium px-2.5 py-1.5 rounded-md shadow-lg whitespace-nowrap">
            {label}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-slate-900" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

/* ── Hospital picker expanded (sidebar open) — dropdown style ── */
function HospitalPickerExpanded({ hospital, setHospital }) {
  const [dropOpen, setDropOpen] = useState(false);

  return (
    <div className="px-2 pb-2">
      <p className="text-[9px] font-semibold font-sans uppercase tracking-[0.12em] text-slate-400 px-1 pb-1">
        Hospital
      </p>
      <button
        onClick={() => setDropOpen((s) => !s)}
        className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-100 transition-colors text-left"
      >
        <span
          className="shrink-0 w-6 h-6 rounded flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: hospital.themeColor }}
        >
          <img src={hospital.logoSidebar} alt={hospital.shortName} width={16} height={16} className="w-4 h-4 object-contain"
            onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </span>
        <span className="flex-1 min-w-0 text-[11px] font-semibold font-mitr text-slate-700 truncate">
          {hospital.shortName}
        </span>
        <ChevronDown size={12} className={`shrink-0 text-slate-400 transition-transform ${dropOpen ? 'rotate-180' : ''}`} />
      </button>

      {dropOpen && (
        <div className="mt-1 rounded-md border border-slate-100 bg-slate-50 overflow-hidden">
          {Object.values(HOSPITALS).map((h) => {
            const active = h.id === hospital.id;
            return (
              <button
                key={h.id}
                onClick={() => { setHospital(h.id); setDropOpen(false); }}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors ${
                  active ? 'bg-white' : 'hover:bg-white'
                }`}
              >
                <span
                  className="shrink-0 w-5 h-5 rounded flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: h.sidebarBg }}
                >
                  <img src={h.logoSidebar} alt={h.shortName} width={14} height={14} className="w-3.5 h-3.5 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </span>
                <span className={`flex-1 text-[11px] font-mitr font-semibold truncate ${active ? 'text-slate-800' : 'text-slate-500'}`}>
                  {h.shortName}
                </span>
                {active && <span className="shrink-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: h.themeColor }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Hospital picker collapsed — single icon button, click → fixed popup panel ── */
function HospitalPickerCollapsed({ hospital, setHospital }) {
  const [popOpen, setPopOpen] = useState(false);
  const btnRef = useRef(null);
  const popRef = useRef(null);

  /* close when clicking outside */
  useEffect(() => {
    if (!popOpen) return;
    const onDown = (e) => {
      if (!btnRef.current?.contains(e.target) && !popRef.current?.contains(e.target)) {
        setPopOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [popOpen]);

  /* compute popup position from button rect */
  const [popPos, setPopPos] = useState({ top: 0, left: 0 });
  const toggle = () => {
    if (!popOpen && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPopPos({ top: r.top, left: r.right + 8 });
    }
    setPopOpen((s) => !s);
  };

  return (
    <div className="flex flex-col items-center px-1.5 pb-2">
      {/* Active hospital icon — click to open popup */}
      <button
        ref={btnRef}
        onClick={toggle}
        className={`w-8 h-8 rounded-md flex items-center justify-center overflow-hidden border-2 transition-all ${
          popOpen ? 'border-slate-400 shadow-md' : 'border-slate-300 shadow-sm hover:border-slate-400'
        }`}
        style={{ backgroundColor: hospital.themeColor }}
        title="เปลี่ยนโรงพยาบาล"
      >
        <img src={hospital.logoSidebar} alt={hospital.shortName} width={20} height={20} className="w-5 h-5 object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      </button>

      {/* Portaled popup panel — escapes aside's transform stacking context */}
      {popOpen && createPortal(
        <div
          ref={popRef}
          className="fixed z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden"
          style={{ top: popPos.top, left: popPos.left, minWidth: 200 }}
        >
          <p className="text-[9px] font-semibold font-sans uppercase tracking-[0.12em] text-slate-400 px-3 pt-2.5 pb-1.5">
            เลือกโรงพยาบาล
          </p>
          {Object.values(HOSPITALS).map((h) => {
            const active = h.id === hospital.id;
            return (
              <button
                key={h.id}
                onClick={() => { setHospital(h.id); setPopOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                  active ? 'bg-slate-50' : 'hover:bg-slate-50'
                }`}
              >
                <span
                  className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: h.sidebarBg }}
                >
                  <img src={h.logoSidebar} alt={h.shortName} width={20} height={20} className="w-5 h-5 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-[12px] font-mitr font-semibold truncate ${active ? 'text-slate-800' : 'text-slate-600'}`}>
                    {h.shortName}
                  </span>
                  <span className="block text-[10px] font-sans text-slate-400 truncate">{h.nameTh}</span>
                </span>
                {active && <span className="shrink-0 w-2 h-2 rounded-full" style={{ backgroundColor: h.themeColor }} />}
              </button>
            );
          })}
          <div className="h-1.5" />
        </div>,
        document.body
      )}
    </div>
  );
}

export default function Sidebar({ activeKey, onSelect, hospital, setHospital }) {
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

  /* Auto-collapse when sidebar is open and user focuses any input (desktop only, narrow screens) */
  useEffect(() => {
    if (isMobile() || isWide() || !open) return;
    const onFocusIn = (e) => {
      if (e.target.matches('input, select, textarea')) {
        setOpen(false);
        document.removeEventListener('focusin', onFocusIn);
      }
    };
    document.addEventListener('focusin', onFocusIn);
    return () => document.removeEventListener('focusin', onFocusIn);
  }, [open]);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden="true"
        className={`fixed inset-0 z-20 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-200 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Sidebar panel */}
      <aside
        aria-label="Main navigation"
        className={`
          fixed top-0 left-0 z-30 h-[100dvh] flex flex-col
          lg:relative lg:z-auto lg:h-full lg:flex-shrink-0
          transition-[transform,width] duration-300 ease-out
          border-r border-slate-200/80
          ${open
            ? 'translate-x-0 w-[min(88vw,280px)] lg:w-[260px]'
            : '-translate-x-full lg:translate-x-0 w-[min(88vw,280px)] lg:w-[52px]'
          }
        `}
        style={{ background: 'hsl(0 0% 99%)', boxShadow: '1px 0 0 0 hsl(210 18% 90%)' }}
      >

        {/* ── Top bar: brand name (no collapse button) ── */}
        <div
          className={`flex items-center border-b border-slate-100 ${open ? 'px-3 gap-2' : 'justify-center px-0'}`}
          style={{ paddingTop: 'calc(env(safe-area-inset-top) + 0.75rem)', paddingBottom: '0.75rem', minHeight: 'calc(env(safe-area-inset-top) + 3.5rem)' }}
        >
          {open ? (
            <>
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <img
                  src={APP_LOGO}
                  alt="PediCalc"
                  className="h-10 w-auto object-contain shrink-0"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <div className="min-w-0">
                  <p className="font-mitr text-lg font-bold text-teal-600 leading-tight">PediCalc</p>
                  <p className="text-xs text-slate-400 font-sans tracking-wide">Pediatric Drug Calculator</p>
                  <p className="text-[10px] font-sans font-semibold text-slate-500 leading-snug mt-0.5">จัดทำโดย พญ.สมิตา สมโภชน์</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                title="ปิด sidebar"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <PanelLeftClose size={16} />
              </button>
            </>
          ) : (
            <Tooltip label="เปิด Sidebar">
              <button
                onClick={() => setOpen(true)}
                title="เปิด sidebar"
                className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Menu size={16} />
              </button>
            </Tooltip>
          )}
        </div>

        {/* ── Hospital picker ── */}
        <div className="border-b border-slate-100 pt-2">
          {open
            ? <HospitalPickerExpanded hospital={hospital} setHospital={setHospital} />
            : <HospitalPickerCollapsed hospital={hospital} setHospital={setHospital} />
          }
        </div>

        {/* ── Nav ── */}
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {open && (
            <p className="text-[10px] font-semibold font-sans uppercase tracking-[0.12em] text-slate-400 px-2 pt-1 pb-2">
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
                aria-disabled={!ready}
                className={`
                  w-full flex items-center gap-2.5 rounded-md text-left text-sm
                  transition-colors duration-100 group
                  ${open ? 'px-2 py-2' : 'justify-center px-0 py-2.5'}
                  ${active
                    ? 'text-slate-800'
                    : ready
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer'
                      : 'text-slate-300 cursor-not-allowed'}
                `}
                style={active ? { backgroundColor: `${APP_COLOR}12` } : {}}
              >
                <span
                  className={`shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-colors ${
                    active
                      ? 'text-white'
                      : ready
                        ? 'text-slate-400 group-hover:text-slate-600 group-hover:bg-slate-200/60'
                        : 'text-slate-300'
                  }`}
                  style={active ? { backgroundColor: APP_COLOR } : {}}
                >
                  <Icon size={15} />
                </span>

                {open && (
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold font-mitr leading-tight truncate ${
                      active ? 'text-slate-800' : ready ? 'text-slate-700' : 'text-slate-300'
                    }`}>
                      {label}
                    </p>
                    <p className={`text-[10px] font-sans truncate mt-0.5 ${
                      active ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {sublabel}
                    </p>
                  </div>
                )}

                {open && !ready && (
                  <span className="shrink-0 text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-sans font-medium tracking-wider border border-slate-200">
                    SOON
                  </span>
                )}
              </button>
            );

            return !open
              ? <Tooltip key={key} label={label}>{btn}</Tooltip>
              : <div key={key}>{btn}</div>;
          })}
        </nav>

        {/* ── Footer: version ── */}
        <div
          className={`border-t border-slate-100 ${open ? 'px-3 pt-3' : 'px-1.5 pt-2'}`}
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)' }}
        >
          {open ? (
            <p className="text-[9px] text-slate-400 font-sans tracking-wider">v1.0.0 · PediCalc</p>
          ) : (
            <div className="flex justify-center">
              <span className="w-1 h-1 rounded-full bg-slate-300" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile floating menu button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="เปิดเมนู"
        className={`fixed left-3 z-40 lg:hidden p-2 rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-opacity duration-200 ${
          open ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
        style={{ top: 'calc(env(safe-area-inset-top) + 0.625rem)' }}
      >
        <Menu size={18} />
      </button>
    </>
  );
}
