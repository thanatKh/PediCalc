export const calculateTPN = (inputs) => {
  const bw = parseFloat(inputs.bw) || 0;
  if (bw <= 0) return null;

  const isNewborn = inputs.patientType === 'newborn';

  // 1. Volume & DSF
  const volTarget   = parseFloat(inputs.volumeTarget) || 0;
  const totalVolume = isNewborn ? volTarget * bw + 25 : volTarget * bw;
  const dsf         = isNewborn ? totalVolume / (totalVolume - 25) : 1;

  // 2. Macronutrients
  const dexPct       = parseFloat(inputs.dextrosePct) || 0;
  const dextroseMl   = (dexPct / 100) * totalVolume * 2;

  const proteinTarget = parseFloat(inputs.proteinTarget) || 0;
  const aminovenMl    = proteinTarget * bw * 10 * dsf;

  const lipidTarget = parseFloat(inputs.lipidTarget) || 0;
  const lipidMl     = lipidTarget * bw * 5;

  // 3. Electrolytes — split-source logic
  // ── Sodium: NaGlycero supplies Na + PO4. Remaining Na goes to 3% NaCl.
  const totalNaTarget    = parseFloat(inputs.totalNaTarget) || 0;   // mEq/kg/day (new unified input)
  const naGlyceroTarget  = parseFloat(inputs.naGlyceroTarget) || 0; // mEq/kg/day from NaGlycero (user-set PO4 source)
  const naFromGlycero    = Math.min(naGlyceroTarget, totalNaTarget); // Na already covered by NaGlycero
  const naFrom3Pct       = Math.max(0, totalNaTarget - naFromGlycero); // remainder → 3% NaCl

  const naGlyceroml = (naGlyceroTarget * bw) / 2 * dsf; // 2 mEq/ml
  const na3PctMl    = (naFrom3Pct * bw) / 0.5 * dsf;   // 0.5 mEq/ml

  // ── Potassium: K2HPO4 supplies K + PO4. Remaining K goes to 15% KCl.
  const totalKTarget  = parseFloat(inputs.totalKTarget) || 0;    // mEq/kg/day (new unified input)
  const k2hpo4Target  = parseFloat(inputs.k2hpo4Target) || 0;   // mEq/kg/day from K2HPO4 (user-set PO4 source)
  const kFromK2hpo4   = Math.min(k2hpo4Target, totalKTarget);
  const kFrom15Pct    = Math.max(0, totalKTarget - kFromK2hpo4);

  const k2hpo4Ml  = (k2hpo4Target * bw) / 1 * dsf;   // 1 mEq/ml
  const k15PctMl  = (kFrom15Pct * bw) / 2 * dsf;     // 2 mEq/ml

  // ── Other electrolytes
  const caTarget       = parseFloat(inputs.caTarget) || 0;
  const caGluconateMl  = (caTarget * bw) / 0.25 * dsf; // 0.25 mmol/ml

  const mgTarget  = parseFloat(inputs.mgTarget) || 0;
  const mgso4Ml   = (mgTarget * bw) / 4 * dsf; // 4 mEq/ml

  // 4. Vitamins & Trace — with max-dose caps
  // Soluvit-N: 1 ml/kg/day × DSF, auto-calculated (no manual entry)
  const soluvitMl = Math.min(bw * 1 * dsf, 10);

  // Vitalipid N Infant: 4 ml/kg, cap 10 ml/day (NO DSF — given with lipid)
  const vitalipidMl = Math.min(4 * bw, 10);

  // Pediatrace: 1 ml/kg × DSF, cap 10 ml/day
  const pediatraceMl = Math.min(1 * bw * dsf, 10);

  // 5. Heparin
  const heparinUnitPerMl = parseFloat(inputs.heparinConc) || 0.5; // units/ml default 0.5
  const heparinUnits     = totalVolume * heparinUnitPerMl;
  const heparinMl        = heparinUnits / 1000; // stock: 1000 units/ml (std heparin 1000 IU/ml vial)

  // 6. Sterile Water (balance of 2-in-1 bag; lipid is separate)
  const activeSum =
    dextroseMl + aminovenMl +
    na3PctMl + naGlyceroml + k15PctMl + k2hpo4Ml +
    caGluconateMl + mgso4Ml + soluvitMl + pediatraceMl;

  // 2-in-1 bag volume = totalVolume minus lipid (lipid runs separately)
  const bag2in1Vol     = totalVolume - lipidMl;
  const sterileWaterMl = bag2in1Vol - activeSum;

  // 7. Safety
  const gir          = (dexPct * totalVolume * 10) / (24 * 60 * bw);
  const totalNaActual = naFrom3Pct + naGlyceroTarget;     // combined actual Na dose
  const totalKActual  = kFrom15Pct + k2hpo4Target;        // combined actual K dose
  const estOsmolarity = (dexPct * 50) + (proteinTarget * 10 * 100) + ((totalNaActual + totalKActual) * 2);

  // Ca × PO4 precipitation check (concentration in bag2in1Vol ml)
  // Ca mmol in bag = caGluconateMl × 0.25 mmol/ml
  // PO4 mmol in bag = naGlyceroml × (1 mmol PO4 / 2 mEq Na → 0.5 mmol/ml) + k2hpo4Ml × (0.67 mmol/ml)
  const caMmolInBag   = caGluconateMl * 0.25;
  const po4MmolInBag  = naGlyceroml * 0.5 + k2hpo4Ml * 0.67;
  const bagVolL       = bag2in1Vol / 1000;
  const caConc        = bagVolL > 0 ? caMmolInBag  / bagVolL : 0; // mmol/L
  const po4Conc       = bagVolL > 0 ? po4MmolInBag / bagVolL : 0; // mmol/L
  const caxP          = caConc * po4Conc;    // mmol²/L²  — risk > 55 (Freund's rule)
  const caxPHigh      = caxP > 55;

  // Peripheral risk flag
  const peripheralRisk =
    inputs.lineType === 'peripheral' && (dexPct > 12.5 || estOsmolarity > 900);

  // 8. Energy distribution
  const cho_kcal     = (dexPct / 100) * totalVolume * 2 * 3.4; // 3.4 kcal/g dextrose
  const protein_kcal = proteinTarget * bw * 4;                  // 4 kcal/g
  const fat_kcal     = lipidMl * 2;                             // 20% SMOFlipid ≈ 2 kcal/ml
  const totalEnergy  = cho_kcal + protein_kcal + fat_kcal;
  const kcalPerKg    = bw > 0 ? totalEnergy / bw : 0;
  const npcKcal      = cho_kcal + fat_kcal;
  const npcN         = proteinTarget > 0 ? npcKcal / (proteinTarget * bw / 6.25) : 0;
  const choPct       = totalEnergy > 0 ? (cho_kcal / totalEnergy) * 100 : 0;
  const fatPct       = totalEnergy > 0 ? (fat_kcal / totalEnergy) * 100 : 0;
  const proteinPct   = totalEnergy > 0 ? (protein_kcal / totalEnergy) * 100 : 0;

  // 9. Infusion rates
  const infusionRate = bag2in1Vol / 24; // ml/hr for 2-in-1 bag
  const lipidRate    = lipidMl / 24;    // ml/hr for lipid bag

  return {
    totalVolume,
    dsf,
    dextroseMl,
    aminovenMl,
    lipidMl,
    // Na split
    na3PctMl,
    naGlyceroml,
    naFrom3Pct,
    naFromGlycero,
    totalNaActual,
    // K split
    k15PctMl,
    k2hpo4Ml,
    kFrom15Pct,
    kFromK2hpo4,
    totalKActual,
    // Other
    caGluconateMl,
    mgso4Ml,
    soluvitMl,
    vitalipidMl,
    pediatraceMl,
    sterileWaterMl,
    // Heparin
    heparinUnits,
    heparinMl,
    heparinUnitPerMl,
    // Safety
    gir,
    estOsmolarity,
    caConc,
    po4Conc,
    caxP,
    caxPHigh,
    peripheralRisk,
    // Energy
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
    // Rates
    bag2in1Vol,
    infusionRate,
    lipidRate,
    isWaterNegative: sterileWaterMl < 0,
  };
};
