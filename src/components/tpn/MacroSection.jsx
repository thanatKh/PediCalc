import { Beaker } from 'lucide-react';
import { NumberField, SectionCard } from './ui';

export default function MacroSection({ inputs, update, cds = {} }) {
  return (
    <SectionCard title="สารอาหารหลัก · Macronutrients" icon={Beaker}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <NumberField
          id="dextrosePct"
          label="Dextrose"
          suffix="%"
          value={inputs.dextrosePct}
          onChange={update('dextrosePct')}
          step="0.5"
          hint="เริ่ม 6–8%; เพิ่มทีละ 1–2%/d; max 12.5% (peripheral)"
          tier={cds.dextrose?.tier}
          tierMessage={cds.dextrose?.message}
        />
        <NumberField
          id="proteinTarget"
          label="Protein target"
          suffix="g/kg"
          value={inputs.proteinTarget}
          onChange={update('proteinTarget')}
          hint="Newborn: เริ่ม 2–2.5 g/kg/d; เป้าหมาย 3–4 g/kg/d"
          tier={cds.protein?.tier}
          tierMessage={cds.protein?.message}
        />
        <NumberField
          id="lipidTarget"
          label="Lipid target"
          suffix="g/kg"
          value={inputs.lipidTarget}
          onChange={update('lipidTarget')}
          hint="เริ่ม 1–2 g/kg/d; เป้าหมาย 3–4 g/kg/d; max 4 g/kg/d"
          tier={cds.lipid?.tier}
          tierMessage={cds.lipid?.message}
        />
      </div>
    </SectionCard>
  );
}
