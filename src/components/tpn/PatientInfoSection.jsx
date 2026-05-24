import { User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { NumberField, SectionCard } from './ui';

export default function PatientInfoSection({ inputs, update, cds = {} }) {
  return (
    <SectionCard title="Patient Info · ข้อมูลผู้ป่วย" icon={User}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Name */}
        <div className="col-span-2">
          <Label htmlFor="patient-name" className="text-sm font-semibold text-slate-600 leading-none">
            ชื่อ-สกุล
          </Label>
          <Input
            id="patient-name"
            name="patient-name"
            autoComplete="off"
            value={inputs.name}
            onChange={update('name')}
            placeholder="เช่น ด.ช. เดวิด ตัวอ้วน"
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 font-sans text-base shadow-sm"
          />
        </div>

        {/* HN */}
        <div>
          <Label htmlFor="patient-hn" className="text-sm font-semibold text-slate-600 leading-none">
            HN
          </Label>
          <Input
            id="patient-hn"
            name="patient-hn"
            autoComplete="off"
            value={inputs.hn}
            onChange={update('hn')}
            placeholder="HN"
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 font-sans text-base shadow-sm"
          />
        </div>

        {/* Ward */}
        <div>
          <Label htmlFor="patient-ward" className="text-sm font-semibold text-slate-600 leading-none">Ward</Label>
          <Input
            id="patient-ward"
            name="patient-ward"
            autoComplete="off"
            value={inputs.ward}
            onChange={update('ward')}
            placeholder="NICU, Ward 5"
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 font-sans text-base shadow-sm"
          />
        </div>

        {/* Start date */}
        <div>
          <Label className="text-sm font-semibold text-slate-600 leading-none">เริ่มให้ วันที่</Label>
          <Input
            type="date"
            value={inputs.startDate}
            onChange={update('startDate')}
            className="bg-white border-slate-200 rounded-xl mt-1.5 h-11 w-full font-sans text-base shadow-sm appearance-none"
          />
        </div>

        <NumberField id="height"       label="ส่วนสูง"      suffix="cm"    value={inputs.height}      onChange={update('height')}      step="0.5" />
        <NumberField id="ageMonth"     label="อายุ (เดือน)" suffix="mo"    value={inputs.ageMonth}    onChange={update('ageMonth')}    step="1" />
        <NumberField id="ageDay"       label="อายุ (วัน)"   suffix="D"     value={inputs.ageDay}      onChange={update('ageDay')}      step="1" />
        <NumberField id="bw"           label="น้ำหนัก (BW)" suffix="kg"    value={inputs.bw}          onChange={update('bw')}          step="0.01" required />
        <NumberField id="volumeTarget" label="Fluid Volume"  suffix="ml/kg" value={inputs.volumeTarget} onChange={update('volumeTarget')} step="1" required tier={cds.fluid?.tier} tierMessage={cds.fluid?.message} />

        {/* Patient type + Line type + Urine output toggles */}
        <div className="col-span-2 md:col-span-4 mt-1 flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl ring-1 ring-slate-200/80 bg-slate-50">

          <label htmlFor="patientType" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/80 transition-colors">
            <Switch
              id="patientType"
              checked={inputs.patientType === 'newborn'}
              onCheckedChange={(c) => update('patientType')(c ? 'newborn' : 'pediatric')}
            />
            <span className="text-sm font-sans leading-tight whitespace-nowrap">
              {inputs.patientType === 'newborn'
                ? <><span className="font-semibold text-teal-600">Newborn</span><span className="text-slate-400"> · 25 ml</span></>
                : <><span className="font-semibold text-slate-600">เด็กโต</span><span className="text-slate-400"> · &gt;10 kg</span></>}
            </span>
          </label>

          <div className="w-px h-6 bg-slate-200 shrink-0" />

          <label htmlFor="lineType" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/80 transition-colors">
            <Switch
              id="lineType"
              checked={inputs.lineType === 'central'}
              onCheckedChange={(c) => update('lineType')(c ? 'central' : 'peripheral')}
            />
            <span className="text-sm font-sans leading-tight whitespace-nowrap">
              {inputs.lineType === 'central'
                ? <><span className="font-semibold text-teal-600">Central</span><span className="text-slate-400"> line</span></>
                : <><span className="font-semibold text-amber-600">Peripheral</span><span className="text-slate-400"> line</span></>}
            </span>
          </label>

          <div className="w-px h-6 bg-slate-200 shrink-0" />

          <label htmlFor="urineOutput" className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/80 transition-colors">
            <Switch
              id="urineOutput"
              checked={inputs.urineOutput === true || inputs.urineOutput === 'true'}
              onCheckedChange={(c) => update('urineOutput')(c)}
            />
            <span className="text-sm font-sans leading-tight whitespace-nowrap">
              {inputs.urineOutput === true || inputs.urineOutput === 'true'
                ? <><span className="font-semibold text-teal-600">Urine</span><span className="text-slate-400"> confirmed</span></>
                : <><span className="font-semibold text-amber-600">Urine</span><span className="text-slate-400"> not confirmed</span></>}
            </span>
          </label>

        </div>
      </div>
    </SectionCard>
  );
}
