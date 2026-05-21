import { useState } from 'react';
import Sidebar from './components/Sidebar';
import TPNCalculator from './components/TPNCalculator';

export default function App() {
  const [activeKey, setActiveKey] = useState('tpn-newborn');

  return (
    <div className="flex h-screen bg-dot-grid overflow-hidden">
      <Sidebar activeKey={activeKey} onSelect={setActiveKey} />
      <div className="flex-1 overflow-y-auto">
        {activeKey === 'tpn-newborn' && <TPNCalculator />}
      </div>
    </div>
  );
}
