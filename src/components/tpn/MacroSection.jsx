import { memo } from 'react';
import { Beaker } from 'lucide-react';
import { NumberField, SectionCard } from './ui';

function MacroSection({
  dextrosePct, proteinTarget, lipidTarget,
  update,
  dextroseTier, dextroseMessage,
  proteinTier,  proteinMessage,
  lipidTier,    lipidMessage,
}) {
  return (
    <SectionCard title="Macronutrients · สารอาหารหลัก" icon={Beaker} aboveFold>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NumberField
          id="dextrosePct"
          label="Dextrose"
          suffix="%"
          value={dextrosePct}
          onChange={update('dextrosePct')}
          step="0.5"
          hint="เริ่ม 6–8%; เพิ่มทีละ 1–2%/d; max 12.5% (peripheral)"
          tier={dextroseTier}
          tierMessage={dextroseMessage}
        />
        <NumberField
          id="proteinTarget"
          label="Protein (10% Aminoven Infant)"
          suffix="g/kg"
          value={proteinTarget}
          onChange={update('proteinTarget')}
          hint="Newborn: เริ่ม 2–2.5 g/kg/d; เป้าหมาย 3–4 g/kg/d"
          tier={proteinTier}
          tierMessage={proteinMessage}
        />
        <NumberField
          id="lipidTarget"
          label="Lipid"
          suffix="g/kg"
          value={lipidTarget}
          onChange={update('lipidTarget')}
          hint="เริ่ม 1–2 g/kg/d; เป้าหมาย 3–4 g/kg/d; max 4 g/kg/d"
          tier={lipidTier}
          tierMessage={lipidMessage}
        />
      </div>
    </SectionCard>
  );
}

export default memo(MacroSection);
