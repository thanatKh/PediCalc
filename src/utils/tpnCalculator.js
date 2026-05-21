export const calculateTPN = (inputs) => {
  const bw = parseFloat(inputs.bw) || 0;
  if (bw <= 0) return null;

  const isNewborn = inputs.patientType === 'newborn';

  // 1. คำนวณ Volume และ DSF
  const volTarget = parseFloat(inputs.volumeTarget) || 0;
  const totalVolume = isNewborn ? (volTarget * bw) + 25 : (volTarget * bw);
  const dsf = isNewborn ? (totalVolume / (totalVolume - 25)) : 1;

  // 2. สารอาหารหลัก
  const dexPct = parseFloat(inputs.dextrosePct) || 0;
  const dextroseMl = (dexPct / 100) * totalVolume * 2;
  
  const proteinTarget = parseFloat(inputs.proteinTarget) || 0;
  const aminovenMl = proteinTarget * bw * 10 * dsf;
  
  const lipidTarget = parseFloat(inputs.lipidTarget) || 0;
  const lipidMl = lipidTarget * bw * 5;

  // 3. เกลือแร่ (Electrolytes)
  const na3PctTarget = parseFloat(inputs.na3PctTarget) || 0;
  const na3PctMl = (na3PctTarget * bw) / 0.5 * dsf;

  const naGlyceroTarget = parseFloat(inputs.naGlyceroTarget) || 0;
  const naGlyceroml = (naGlyceroTarget * bw) / 2 * dsf;

  const k15PctTarget = parseFloat(inputs.k15PctTarget) || 0;
  const k15PctMl = (k15PctTarget * bw) / 2 * dsf;

  const k2hpo4Target = parseFloat(inputs.k2hpo4Target) || 0;
  const k2hpo4Ml = (k2hpo4Target * bw) / 1 * dsf;

  const caTarget = parseFloat(inputs.caTarget) || 0;
  const caGluconateMl = (caTarget * bw) / 0.25 * dsf;

  const mgTarget = parseFloat(inputs.mgTarget) || 0;
  const mgso4Ml = (mgTarget * bw) / 4 * dsf;

  // 4. วิตามิน
  const soluvitTarget = parseFloat(inputs.soluvitTarget) || 0;
  const soluvitMl = soluvitTarget * bw * dsf;

  const vitalipidTarget = parseFloat(inputs.vitalipidTarget) || 0;
  const vitalipidMl = vitalipidTarget * bw;

  const pediatraceTarget = parseFloat(inputs.pediatraceTarget) || 0;
  const pediatraceMl = pediatraceTarget * bw * dsf;

  // 5. Sterile Water หักลบสาร 12 ชนิด
  const activeSum = 
    dextroseMl + aminovenMl + lipidMl + 
    na3PctMl + naGlyceroml + k15PctMl + k2hpo4Ml + 
    caGluconateMl + mgso4Ml + soluvitMl + vitalipidMl + pediatraceMl;
  
  const sterileWaterMl = totalVolume - activeSum;

  // 6. Safety Checks
  const gir = (dexPct * totalVolume * 10) / (24 * 60 * bw);
  const totalNa = na3PctTarget + naGlyceroTarget;
  const totalK = k15PctTarget + k2hpo4Target;
  const estOsmolarity = (dexPct * 50) + (proteinTarget * 10 * 100) + ((totalNa + totalK) * 2);

  // Ca × P precipitation risk (mEq²/L²) — threshold < 45
  const caTotal_mEq  = caTarget * bw * 2;   // 0.25 mmol/ml × 4 mEq/mmol → 1 mEq per mmol target
  const po4Total_mEq = (naGlyceroTarget * bw) + (k2hpo4Target * bw); // mEq/day simplified per L
  const caxP = caTotal_mEq + po4Total_mEq; // stored as combined mEq for display

  // 7. Energy distribution
  const cho_kcal     = (dexPct / 100) * totalVolume * 2 * 3.4;  // 3.4 kcal/g dextrose
  const protein_kcal = proteinTarget * bw * 4;                   // 4 kcal/g protein
  const fat_kcal     = lipidTarget * bw * 9;                     // 9 kcal/g fat (20% emulsion ~2 kcal/ml)
  const totalEnergy  = cho_kcal + protein_kcal + fat_kcal;
  const kcalPerKg    = bw > 0 ? totalEnergy / bw : 0;
  const npcKcal      = cho_kcal + fat_kcal;
  const npcN         = proteinTarget > 0 ? npcKcal / (proteinTarget * bw / 6.25) : 0;
  const choPct       = totalEnergy > 0 ? (cho_kcal / totalEnergy) * 100 : 0;
  const fatPct       = totalEnergy > 0 ? (fat_kcal / totalEnergy) * 100 : 0;
  const proteinPct   = totalEnergy > 0 ? (protein_kcal / totalEnergy) * 100 : 0;

  // 8. Infusion rate for 2-in-1 bag (exclude lipid — infused separately)
  const bag2in1Vol    = totalVolume - lipidMl;
  const infusionRate  = bag2in1Vol / 24; // ml/hr

  return {
    totalVolume,
    dsf,
    dextroseMl,
    aminovenMl,
    lipidMl,
    na3PctMl,
    naGlyceroml,
    k15PctMl,
    k2hpo4Ml,
    caGluconateMl,
    mgso4Ml,
    soluvitMl,
    vitalipidMl,
    pediatraceMl,
    sterileWaterMl,
    gir,
    estOsmolarity,
    caxP,
    cho_kcal,
    protein_kcal,
    fat_kcal,
    totalEnergy,
    kcalPerKg,
    npcKcal,
    npcN,
    choPct,
    fatPct,
    proteinPct,
    bag2in1Vol,
    infusionRate,
    isWaterNegative: sterileWaterMl < 0
  };
};