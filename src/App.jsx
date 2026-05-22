import { memo, useState } from 'react';
import Sidebar from './components/Sidebar';
import TPNCalculator from './components/TPNCalculator';

const MemoTPNCalculator = memo(TPNCalculator);

export default function App() {
  const [activeKey, setActiveKey] = useState('tpn-newborn');

  return (
    <div className="flex bg-dot-grid overflow-hidden" style={{ height: '100dvh' }}>
      <Sidebar activeKey={activeKey} onSelect={setActiveKey} />
      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden">
        {activeKey === 'tpn-newborn' && <MemoTPNCalculator />}
      </div>
    </div>
  );
}
