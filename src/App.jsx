import { memo, useState } from 'react';
import Sidebar from './components/Sidebar';
import TPNCalculator from './components/TPNCalculator';
import { useHospital } from './hooks/useHospital';
import { TooltipProvider } from '@/components/ui/tooltip';

const MemoTPNCalculator = memo(TPNCalculator);

export default function App() {
  const [activeKey, setActiveKey] = useState('tpn-newborn');
  const { hospital, setHospital } = useHospital();

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex bg-dot-grid overflow-hidden" style={{ height: '100dvh' }}>
        <Sidebar activeKey={activeKey} onSelect={setActiveKey} hospital={hospital} setHospital={setHospital} />
        <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
          {activeKey === 'tpn-newborn' && <MemoTPNCalculator hospital={hospital} />}
        </div>
      </div>
    </TooltipProvider>
  );
}
