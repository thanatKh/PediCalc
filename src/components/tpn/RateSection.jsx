import { fmt, NumberField, SectionCard } from './ui';

export default function RateSection({ inputs, update, results }) {
  const manualTPNRate   = parseFloat(inputs.manualTPNRate);
  const manualLipidRate = parseFloat(inputs.manualLipidRate);
  const calcTPNRate     = results?.infusionRate ?? 0;
  const calcLipidRate   = results?.lipidRate    ?? 0;

  return (
    <SectionCard title="อัตราหยดที่สั่ง · Prescribed Rates (Optional)">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <NumberField
            id="manualTPNRate"
            label="TPN rate (สั่งจริง)"
            suffix="ml/hr"
            value={inputs.manualTPNRate}
            onChange={update('manualTPNRate')}
            step="0.1"
            hint={`คำนวณได้ ${fmt(results?.infusionRate, 1)} ml/hr`}
          />
          {!isNaN(manualTPNRate) && inputs.manualTPNRate !== '' && (
            <p className={`text-[10px] font-semibold px-0.5 ${
              Math.abs(manualTPNRate - calcTPNRate) > 1 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {Math.abs(manualTPNRate - calcTPNRate) > 1
                ? `⚠ ต่างจากคำนวณ ${fmt(Math.abs(manualTPNRate - calcTPNRate), 1)} ml/hr`
                : '✓ ใกล้เคียงกับที่คำนวณ'}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <NumberField
            id="manualLipidRate"
            label="Lipid rate (สั่งจริง)"
            suffix="ml/hr"
            value={inputs.manualLipidRate}
            onChange={update('manualLipidRate')}
            step="0.1"
            hint={`คำนวณได้ ${fmt(results?.lipidRate, 1)} ml/hr`}
          />
          {!isNaN(manualLipidRate) && inputs.manualLipidRate !== '' && (
            <p className={`text-[10px] font-semibold px-0.5 ${
              Math.abs(manualLipidRate - calcLipidRate) > 0.5 ? 'text-amber-600' : 'text-emerald-600'
            }`}>
              {Math.abs(manualLipidRate - calcLipidRate) > 0.5
                ? `⚠ ต่างจากคำนวณ ${fmt(Math.abs(manualLipidRate - calcLipidRate), 1)} ml/hr`
                : '✓ ใกล้เคียงกับที่คำนวณ'}
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
