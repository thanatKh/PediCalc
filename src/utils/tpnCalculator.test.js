import { describe, it, expect } from 'vitest';
import { calculateTPN } from './tpnCalculator';

// Shared baseline — typical 1 kg newborn on central TPN
const BASE = {
  bw: '1',
  patientType: 'newborn',
  lineType: 'central',
  volumeTarget: '120',
  dextrosePct: '10',
  proteinTarget: '2.5',
  lipidTarget: '2',
  na3PctTarget: '3',
  naGlyceroTarget: '0',
  k15PctTarget: '2',
  k2hpo4Target: '0',
  caTarget: '0.5',
  mgTarget: '0.25',
  heparinConc: '0.5',
  manualTPNRate: '',
  manualLipidRate: '',
};

describe('calculateTPN', () => {

  it('returns null when BW is 0', () => {
    expect(calculateTPN({ ...BASE, bw: '0' })).toBeNull();
  });

  it('returns null when BW is empty', () => {
    expect(calculateTPN({ ...BASE, bw: '' })).toBeNull();
  });

  describe('normal newborn — 1 kg, 120 ml/kg', () => {
    const r = calculateTPN(BASE);

    it('produces a result', () => {
      expect(r).not.toBeNull();
    });

    it('totalVolume = BW × volumeTarget + 25 ml line reserve', () => {
      // 1 kg × 120 ml/kg + 25 = 145 ml
      expect(r.totalVolume).toBeCloseTo(145, 1);
    });

    it('tpnVolume = totalVolume − lipidBagVol', () => {
      expect(r.tpnVolume).toBeCloseTo(r.totalVolume - r.lipidBagVol, 3);
    });

    it('DSF > 1 (line reserve effect)', () => {
      expect(r.dsf).toBeGreaterThan(1);
    });

    it('sterile water is positive (not water-negative)', () => {
      expect(r.sterileWaterMl).toBeGreaterThan(0);
      expect(r.isWaterNegative).toBe(false);
    });

    it('lipid rate = lipidBagVol / 24', () => {
      expect(r.lipidRate).toBeCloseTo(r.lipidBagVol / 24, 4);
    });

    it('total energy is positive', () => {
      expect(r.totalEnergy).toBeGreaterThan(0);
    });

    it('gir is null when no manual TPN rate is entered', () => {
      expect(r.gir).toBeNull();
      expect(r.girHigh).toBe(false);
      expect(r.girLow).toBe(false);
    });

    it('heparin units = totalVolume × heparinConc', () => {
      // 145 ml × 0.5 IU/ml = 72.5 IU
      expect(r.heparinUnits).toBeCloseTo(145 * 0.5, 2);
    });

    it('bag2in1Vol aliased correctly', () => {
      expect(r.bag2in1Vol).toBe(r.tpnVolume);
    });
  });

  describe('GIR reverse calculation', () => {
    it('GIR low when TPN rate is very slow', () => {
      // GIR = (rate × dex%) / (6 × BW) = (2 × 10) / (6 × 1) = 3.33 → < 4
      const r = calculateTPN({ ...BASE, manualTPNRate: '2' });
      expect(r.gir).toBeCloseTo(3.33, 1);
      expect(r.girLow).toBe(true);
      expect(r.girHigh).toBe(false);
    });

    it('GIR in safe range', () => {
      // GIR = (5 × 10) / (6 × 1) = 8.33 → safe
      const r = calculateTPN({ ...BASE, manualTPNRate: '5' });
      expect(r.gir).toBeCloseTo(8.33, 1);
      expect(r.girLow).toBe(false);
      expect(r.girHigh).toBe(false);
    });

    it('GIR high when TPN rate is too fast', () => {
      // GIR = (8 × 10) / (6 × 1) = 13.33 → > 12
      const r = calculateTPN({ ...BASE, manualTPNRate: '8' });
      expect(r.gir).toBeCloseTo(13.33, 1);
      expect(r.girHigh).toBe(true);
      expect(r.girLow).toBe(false);
    });
  });

  describe('water-negative case', () => {
    it('isWaterNegative when electrolytes exceed volume', () => {
      // Extreme electrolyte targets that overflow the bag
      const r = calculateTPN({
        ...BASE,
        na3PctTarget: '20',
        k15PctTarget: '15',
        caTarget: '5',
        mgTarget: '3',
      });
      expect(r.isWaterNegative).toBe(true);
      expect(r.sterileWaterMl).toBeLessThan(0);
    });
  });

  describe('peripheral line risk', () => {
    it('peripheralRisk when dextrose >12.5% on peripheral line', () => {
      const r = calculateTPN({ ...BASE, lineType: 'peripheral', dextrosePct: '15' });
      expect(r.peripheralRisk).toBe(true);
    });

    it('no peripheralRisk on central line with same dextrose', () => {
      const r = calculateTPN({ ...BASE, lineType: 'central', dextrosePct: '15' });
      expect(r.peripheralRisk).toBe(false);
    });
  });

  describe('fat rate safety', () => {
    it('fatRateHigh when lipid target is extreme', () => {
      // 4 g/kg/day of 20% lipid = 4×5=20ml lipidMl, 20ml/24hr ≈ 0.833 ml/hr
      // fatRateGKgHr = (20×0.20)/24/1 = 0.167 g/kg/hr, just at limit
      // Use 4.5 to exceed 0.17
      const r = calculateTPN({ ...BASE, lipidTarget: '4.5' });
      expect(r.fatRateHigh).toBe(true);
    });

    it('fatRateHigh is false at normal lipid target', () => {
      const r = calculateTPN(BASE);
      expect(r.fatRateHigh).toBe(false);
    });
  });

  describe('Ca×PO4 precipitation check — two-source model', () => {
    it('caxInorganic exceeds critical threshold with K₂HPO₄ + elevated Ca', () => {
      // K₂HPO₄ (inorganic): critical threshold = 30 mmol²/L²
      const r = calculateTPN({ ...BASE, caTarget: '2', k2hpo4Target: '3' });
      expect(r.caxInorganic).toBeGreaterThan(30);
    });

    it('caxOrganic exceeds critical threshold at high Na-glycerophosphate + Ca', () => {
      // Na-glycerophosphate (organic): critical threshold = 300 mmol²/L²
      const r = calculateTPN({ ...BASE, caTarget: '2', naGlyceroTarget: '4' });
      expect(r.caxOrganic).toBeGreaterThan(300);
    });

    it('caxOrganic and caxInorganic are zero when no phosphate sources prescribed', () => {
      const r = calculateTPN(BASE); // BASE has k2hpo4Target='0', naGlyceroTarget='0'
      expect(r.caxOrganic).toBe(0);
      expect(r.caxInorganic).toBe(0);
    });
  });

  describe('energy distribution', () => {
    it('choPct + fatPct + proteinPct ≈ 100%', () => {
      const r = calculateTPN(BASE);
      expect(r.choPct + r.fatPct + r.proteinPct).toBeCloseTo(100, 1);
    });

    it('kcalPerKg = totalEnergy / BW', () => {
      const r = calculateTPN(BASE);
      expect(r.kcalPerKg).toBeCloseTo(r.totalEnergy / parseFloat(BASE.bw), 3);
    });
  });

  describe('electrolyte totals', () => {
    it('totalNaActual sums both Na sources', () => {
      const r = calculateTPN({ ...BASE, na3PctTarget: '2', naGlyceroTarget: '1' });
      expect(r.totalNaActual).toBeCloseTo(3, 5);
    });

    it('totalKActual sums both K sources', () => {
      const r = calculateTPN({ ...BASE, k15PctTarget: '1.5', k2hpo4Target: '0.5' });
      expect(r.totalKActual).toBeCloseTo(2, 5);
    });
  });

  describe('larger patient — 3 kg newborn', () => {
    it('totalVolume scales linearly with BW', () => {
      const r1 = calculateTPN(BASE);                             // 1 kg
      const r3 = calculateTPN({ ...BASE, bw: '3' });            // 3 kg
      // 3×120+25=385 vs 1×120+25=145
      expect(r3.totalVolume).toBeCloseTo(385, 1);
      expect(r1.totalVolume).toBeCloseTo(145, 1);
    });
  });

});
