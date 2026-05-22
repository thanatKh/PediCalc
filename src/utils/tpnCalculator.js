import {
  NEWBORN_LINE_RESERVE_ML,
  CONC_DEXTROSE_50PCT,
  CONC_AMINOVEN_10PCT,
  CONC_SMOFLIPID_20PCT,
  CONC_NA_GLYCERO,
  CONC_NACL_3PCT,
  CONC_KCL_15PCT,
  CONC_K2HPO4,
  CONC_CA_GLUCONATE_10PCT,
  CONC_MGSO4_50PCT,
  CONC_HEPARIN_STOCK,
  HEPARIN_DEFAULT_CONC,
  PO4_PER_ML_NA_GLYCERO,
  PO4_PER_ML_K2HPO4,
  DOSE_SOLUVIT_ML_PER_KG,
  DOSE_VITALIPID_ML_PER_KG,
  DOSE_PEDIATRACE_ML_PER_KG,
  MAX_SOLUVIT_ML,
  MAX_VITALIPID_ML,
  MAX_PEDIATRACE_ML,
  KCAL_PER_G_DEXTROSE,
  KCAL_PER_G_PROTEIN,
  KCAL_PER_ML_LIPID_20PCT,
  GIR_DEXTROSE_FACTOR,
  HOURS_PER_DAY,
  MINUTES_PER_HOUR,
  OSMO_FACTOR_DEXTROSE,
  OSMO_FACTOR_AA_G_PER_L,
  OSMO_AMINOVEN_10PCT_G_PER_ML,
  OSMO_FACTOR_ELECTROLYTE,
  CA_PO4_PRECIP_THRESHOLD,
  ML_TO_L,
  PROTEIN_TO_NITROGEN,
  DEXTROSE_PERIPHERAL_LIMIT,
  OSMOLARITY_PERIPHERAL_MAX,
} from './clinicalConstants';

export const calculateTPN = (inputs) => {
  const bw = parseFloat(inputs.bw) || 0;
  if (bw <= 0) return null;

  const isNewborn = inputs.patientType === 'newborn';

  // 1. Volume & DSF
  const volTarget   = parseFloat(inputs.volumeTarget) || 0;
  const totalVolume = isNewborn
    ? volTarget * bw + NEWBORN_LINE_RESERVE_ML
    : volTarget * bw;
  const dsf = isNewborn
    ? totalVolume / (totalVolume - NEWBORN_LINE_RESERVE_ML)
    : 1;

  // 2. Macronutrients
  const dexPct     = parseFloat(inputs.dextrosePct) || 0;
  const dextroseMl = (dexPct / 100) * totalVolume * CONC_DEXTROSE_50PCT;

  const proteinTarget = parseFloat(inputs.proteinTarget) || 0;
  const aminovenMl    = proteinTarget * bw * CONC_AMINOVEN_10PCT * dsf;

  const lipidTarget = parseFloat(inputs.lipidTarget) || 0;
  const lipidMl     = lipidTarget * bw * CONC_SMOFLIPID_20PCT;

  // 3. Electrolytes — split-source logic
  // ── Sodium: NaGlycero supplies Na + PO4. Remaining Na goes to 3% NaCl.
  const totalNaTarget   = parseFloat(inputs.totalNaTarget) || 0;
  const naGlyceroTarget = parseFloat(inputs.naGlyceroTarget) || 0;
  const naFromGlycero   = Math.min(naGlyceroTarget, totalNaTarget);
  const naFrom3Pct      = Math.max(0, totalNaTarget - naFromGlycero);

  const naGlyceroml = (naGlyceroTarget * bw) / CONC_NA_GLYCERO * dsf;
  const na3PctMl    = (naFrom3Pct * bw)      / CONC_NACL_3PCT  * dsf;

  // ── Potassium: K2HPO4 supplies K + PO4. Remaining K goes to 15% KCl.
  const totalKTarget = parseFloat(inputs.totalKTarget) || 0;
  const k2hpo4Target = parseFloat(inputs.k2hpo4Target) || 0;
  const kFromK2hpo4  = Math.min(k2hpo4Target, totalKTarget);
  const kFrom15Pct   = Math.max(0, totalKTarget - kFromK2hpo4);

  const k2hpo4Ml = (k2hpo4Target * bw) / CONC_K2HPO4   * dsf;
  const k15PctMl = (kFrom15Pct * bw)   / CONC_KCL_15PCT * dsf;

  // ── Other electrolytes
  const caTarget      = parseFloat(inputs.caTarget) || 0;
  const caGluconateMl = (caTarget * bw) / CONC_CA_GLUCONATE_10PCT * dsf;

  const mgTarget = parseFloat(inputs.mgTarget) || 0;
  const mgso4Ml  = (mgTarget * bw) / CONC_MGSO4_50PCT * dsf;

  // 4. Vitamins & Trace — with max-dose caps
  const soluvitMl    = Math.min(bw * DOSE_SOLUVIT_ML_PER_KG    * dsf, MAX_SOLUVIT_ML);
  const vitalipidMl  = Math.min(bw * DOSE_VITALIPID_ML_PER_KG,        MAX_VITALIPID_ML);
  const pediatraceMl = Math.min(bw * DOSE_PEDIATRACE_ML_PER_KG * dsf, MAX_PEDIATRACE_ML);

  // 5. Heparin
  const heparinUnitPerMl = parseFloat(inputs.heparinConc) || HEPARIN_DEFAULT_CONC;
  const heparinUnits     = totalVolume * heparinUnitPerMl;
  const heparinMl        = heparinUnits / CONC_HEPARIN_STOCK;

  // 6. Sterile Water (balance of 2-in-1 bag; lipid is separate)
  const activeSum =
    dextroseMl + aminovenMl +
    na3PctMl + naGlyceroml + k15PctMl + k2hpo4Ml +
    caGluconateMl + mgso4Ml + soluvitMl + pediatraceMl;

  const bag2in1Vol     = totalVolume - lipidMl;
  const sterileWaterMl = bag2in1Vol - activeSum;

  // 7. Safety
  const gir           = (dexPct * totalVolume * GIR_DEXTROSE_FACTOR) / (HOURS_PER_DAY * MINUTES_PER_HOUR * bw);
  const totalNaActual = naFrom3Pct + naGlyceroTarget;
  const totalKActual  = kFrom15Pct + k2hpo4Target;

  // Ca × PO4 precipitation check (concentration in bag2in1Vol ml)
  const caMmolInBag  = caGluconateMl * CONC_CA_GLUCONATE_10PCT;
  const po4MmolInBag = naGlyceroml * PO4_PER_ML_NA_GLYCERO + k2hpo4Ml * PO4_PER_ML_K2HPO4;
  const bagVolL      = bag2in1Vol / ML_TO_L;
  const caConc       = bagVolL > 0 ? caMmolInBag  / bagVolL : 0;
  const po4Conc      = bagVolL > 0 ? po4MmolInBag / bagVolL : 0;
  const caxP         = caConc * po4Conc;
  const caxPHigh     = caxP > CA_PO4_PRECIP_THRESHOLD;

  // Osmolarity: sum of each component's contribution per litre of bag
  // Osm = (dex% × 50) + (AA g/L × 10) + ((Na+K) mEq/L × 1)
  const aaGPerL      = bagVolL > 0 ? (aminovenMl * OSMO_AMINOVEN_10PCT_G_PER_ML) / bagVolL : 0;
  const totalNaMeq   = totalNaActual * bw;
  const totalKMeq    = totalKActual  * bw;
  const estOsmolarity = bagVolL > 0
    ? (dexPct * OSMO_FACTOR_DEXTROSE)
      + (aaGPerL * OSMO_FACTOR_AA_G_PER_L)
      + ((totalNaMeq + totalKMeq) / bagVolL * OSMO_FACTOR_ELECTROLYTE)
    : 0;

  const peripheralRisk =
    inputs.lineType === 'peripheral' &&
    (dexPct > DEXTROSE_PERIPHERAL_LIMIT || estOsmolarity > OSMOLARITY_PERIPHERAL_MAX);

  // 8. Energy distribution
  const cho_kcal     = (dexPct / 100) * totalVolume * CONC_DEXTROSE_50PCT * KCAL_PER_G_DEXTROSE;
  const protein_kcal = proteinTarget * bw * KCAL_PER_G_PROTEIN;
  const fat_kcal     = lipidMl * KCAL_PER_ML_LIPID_20PCT;
  const totalEnergy  = cho_kcal + protein_kcal + fat_kcal;
  const kcalPerKg    = bw > 0 ? totalEnergy / bw : 0;
  const npcKcal      = cho_kcal + fat_kcal;
  const npcN         = proteinTarget > 0 ? npcKcal / (proteinTarget * bw / PROTEIN_TO_NITROGEN) : 0;
  const choPct       = totalEnergy > 0 ? (cho_kcal     / totalEnergy) * 100 : 0;
  const fatPct       = totalEnergy > 0 ? (fat_kcal     / totalEnergy) * 100 : 0;
  const proteinPct   = totalEnergy > 0 ? (protein_kcal / totalEnergy) * 100 : 0;

  // 9. Infusion rates
  const infusionRate = bag2in1Vol / HOURS_PER_DAY;
  const lipidRate    = lipidMl    / HOURS_PER_DAY;

  return {
    totalVolume, dsf,
    dextroseMl, aminovenMl, lipidMl,
    na3PctMl, naGlyceroml, naFrom3Pct, naFromGlycero, totalNaActual,
    k15PctMl, k2hpo4Ml, kFrom15Pct, kFromK2hpo4, totalKActual,
    caGluconateMl, mgso4Ml,
    soluvitMl, vitalipidMl, pediatraceMl,
    sterileWaterMl,
    heparinUnits, heparinMl, heparinUnitPerMl,
    gir, estOsmolarity, caConc, po4Conc, caxP, caxPHigh, peripheralRisk,
    cho_kcal, protein_kcal, fat_kcal, totalEnergy, kcalPerKg,
    npcKcal, npcN, choPct, fatPct, proteinPct,
    bag2in1Vol, infusionRate, lipidRate,
    isWaterNegative: sterileWaterMl < 0,
  };
};
