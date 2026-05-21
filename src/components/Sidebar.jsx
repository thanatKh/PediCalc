import { useState } from 'react';
import { Baby, Activity, Pill, Stethoscope, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

const MODULES = [
  { key: 'tpn-newborn',     icon: Baby,        label: 'TPN Calculator',      sublabel: 'ทารกแรกเกิด',      ready: true  },
  { key: 'pediatric-dose',  icon: Pill,        label: 'Pediatric Dosing',    sublabel: 'ขนาดยาเด็ก',       ready: false },
  { key: 'fluid-resus',     icon: Activity,    label: 'Fluid Resuscitation', sublabel: 'สารน้ำ / BSA',      ready: false },
  { key: 'growth-chart',    icon: Stethoscope, label: 'Growth & Vitals',     sublabel: 'กราฟเจริญเติบโต',  ready: false },
];

export default function Sidebar({ activeKey, onSelect }) {
  // Start closed on mobile (<lg), open on desktop
  const [open, setOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-teal-900/20 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          width: open ? 232 : 64,
          minWidth: open ? 232 : 64,
          background: 'linear-gradient(180deg, #0d6e6e 0%, #095555 100%)',
          boxShadow: '4px 0 24px rgba(13,110,110,0.18)',
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
        className="fixed top-0 left-0 z-30 h-full flex flex-col lg:relative lg:z-auto overflow-hidden"
      >
        {/* Hospital header */}
        <div className={`flex items-center gap-3 px-3 py-5 border-b border-white/10 ${open ? '' : 'justify-center'}`}>
          <div className="shrink-0 w-12 h-12 rounded-2xl bg-white ring-1 ring-white/40 overflow-hidden flex items-center justify-center shadow-sm">
            <img
              src="/logo-kabinburi.PNG"
              alt="โลโก้ รพ.กบินทร์บุรี"
              className="w-full h-full object-contain p-1"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
          {open && (
            <div className="overflow-hidden">
              <p className="font-mitr text-base font-bold text-white leading-tight truncate">
                PediCalc
              </p>
              <p className="text-[11px] text-teal-200/80 truncate">รพ.กบินทร์บุรี</p>
            </div>
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
                onClick={() => { if (ready) { onSelect(key); if (window.innerWidth < 1024) setOpen(false); } }}
                title={!open ? label : undefined}
                disabled={!ready}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 text-left
                  nav-item transition-all duration-150 group relative
                  ${!open ? 'justify-center' : ''}
                  ${active
                    ? 'rounded-xl'
                    : ready
                      ? 'rounded-xl hover:bg-white/10'
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

        {/* Toggle */}
        <div className="border-t border-white/10 p-2">
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

      {/* Mobile floating toggle — sits inside the sticky header zone */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-2.5 left-3 z-40 lg:hidden p-2 rounded-xl shadow-md text-white"
          style={{ background: '#0d6e6e' }}
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}
