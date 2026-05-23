import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { NumberField, SectionCard } from './ui';

export default function PatientInfoSection({ inputs, update }) {
  return (
    <SectionCard title="ข้อมูลผู้ป่วย · Patient Info" icon={User}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Name */}
        <div className="col-span-2">
          <Label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            ชื่อ-สกุล<span className="text-rose-500 ml-0.5">*</span>
          </Label>
          <Input
            value={inputs.name}
            onChange={update('name')}
            placeholder="เช่น ด.ช. สมชาย ใจดี"
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
          />
        </div>

        {/* HN */}
        <div>
          <Label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">
            HN<span className="text-rose-500 ml-0.5">*</span>
          </Label>
          <Input
            value={inputs.hn}
            onChange={update('hn')}
            placeholder="HN"
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
          />
        </div>

        {/* Ward */}
        <div>
          <Label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Ward</Label>
          <Input
            value={inputs.ward}
            onChange={update('ward')}
            placeholder="NICU, Ward 5"
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 font-sans text-base md:text-sm shadow-sm"
          />
        </div>

        {/* Start date */}
        <div>
          <Label className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">เริ่มให้ วันที่</Label>
          <Input
            type="date"
            value={inputs.startDate}
            onChange={update('startDate')}
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 md:h-10 w-full font-sans text-base md:text-sm shadow-sm appearance-none"
          />
        </div>

        <NumberField id="height"       label="ส่วนสูง"      suffix="cm"    value={inputs.height}      onChange={update('height')}      step="0.5" />
        <NumberField id="ageMonth"     label="อายุ (เดือน)" suffix="mo"    value={inputs.ageMonth}    onChange={update('ageMonth')}    step="1" />
        <NumberField id="ageDay"       label="อายุ (วัน)"   suffix="d"     value={inputs.ageDay}      onChange={update('ageDay')}      step="1" />
        <NumberField id="bw"           label="น้ำหนัก (BW)" suffix="kg"    value={inputs.bw}          onChange={update('bw')}          step="0.01" required />
        <NumberField id="volumeTarget" label="Fluid Volume"  suffix="ml/kg" value={inputs.volumeTarget} onChange={update('volumeTarget')} step="1" required />

        {/* Required note */}
        <div className="col-span-2 md:col-span-4">
          <p className="text-[10px] text-rose-400 font-sans"><span className="font-bold">*</span> จำเป็นต้องกรอก</p>
        </div>

        {/* Patient type + Line type toggles */}
        <div className="col-span-2 md:col-span-4 mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl ring-1 ring-slate-200/80 bg-slate-50">
          <div className="flex items-center gap-3">
            <Switch
              id="patientType"
              checked={inputs.patientType === 'newborn'}
              onCheckedChange={(c) => update('patientType')(c ? 'newborn' : 'pediatric')}
            />
            <Label htmlFor="patientType" className="text-sm font-sans text-slate-700 cursor-pointer">
              {inputs.patientType === 'newborn'
                ? <><span className="font-semibold text-teal-600">Newborn</span> · เผื่อคาสาย 25 ml</>
                : <><span className="font-semibold text-slate-600">เด็กโต</span> · &gt; 10 kg</>
              }
            </Label>
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="lineType"
              checked={inputs.lineType === 'central'}
              onCheckedChange={(c) => update('lineType')(c ? 'central' : 'peripheral')}
            />
            <Label htmlFor="lineType" className="text-sm font-sans text-slate-700 cursor-pointer">
              {inputs.lineType === 'central'
                ? <><span className="font-semibold text-teal-600">Central</span> line</>
                : <><span className="font-semibold text-amber-600">Peripheral</span> line</>
              }
            </Label>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
