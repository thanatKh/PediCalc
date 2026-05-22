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
  PO4_PER_MEQ_NA_GLYCERO,
  PO4_PER_MEQ_K2HPO4,
  DOSE_SOLUVIT_ML_PER_KG,
  DOSE_VITALIPID_ML_PER_KG,
  DOSE_PEDIATRACE_ML_PER_KG,
  MAX_SOLUVIT_ML,
  MAX_VITALIPID_ML,
  MAX_PEDIATRACE_ML,
  KCAL_PER_G_DEXTROSE,
  KCAL_PER_G_PROTEIN,
  KCAL_PER_ML_LIPID_20PCT,
  GIR_REVERSE_DIVISOR,
  HOURS_PER_DAY,
  OSMO_FACTOR_DEXTROSE,
  OSMO_FACTOR_AA_G_PER_L,
  OSMO_AMINOVEN_10PCT_G_PER_ML,
  OSMO_FACTOR_ELECTROLYTE,
  CA_PO4_PRECIP_THRESHOLD,
  ML_TO_L,
  PROTEIN_TO_NITROGEN,
  DEXTROSE_PERIPHERAL_LIMIT,
  OSMOLARITY_PERIPHERAL_MAX,
  FAT_RATE_MAX_G_KG_HR,
} from './clinicalConstants';

export const calculateTPN = (inputs) => {
  const bw = parseFloat(inputs.bw) || 0;
  if (bw <= 0) return null;

  const isNewborn = inputs.patientType === 'newborn';

  // 1. TPN Volume = BW × fluid target + 25 ml (line reserve, always applied for newborn)
  const volTarget   = parseFloat(inputs.volumeTarget) || 0;
  const totalVolume = isNewborn
    ? volTarget * bw + NEWBORN_LINE_RESERVE_ML
    : volTarget * bw;

  // DSF (Dead Space Factor) — ratio that scales electrolytes/protein to account
  // for the 25 ml dead-space volume that does not deliver nutrients
  const dsf = isNewborn && (totalVolume - NEWBORN_LINE_RESERVE_ML) > 0
    ? totalVolume / (totalVolume - NEWBORN_LINE_RESERVE_ML)
    : 1;

  // 2. Macronutrients
  const dexPct     = parseFloat(inputs.dextrosePct) || 0;
  const dextroseMl = (dexPct / 100) * totalVolume * CONC_DEXTROSE_50PCT;

  const proteinTarget = parseFloat(inputs.proteinTarget) || 0;
  const aminovenMl    = proteinTarget * bw * CONC_AMINOVEN_10PCT * dsf;

  const lipidTarget = parseFloat(inputs.lipidTarget) || 0;
  const lipidMl     = lipidTarget * bw * CONC_SMOFLIPID_20PCT;

  // 3. Electrolytes — direct source inputs (mEq/kg from each source), scaled by DSF
  const na3PctTarget    = parseFloat(inputs.na3PctTarget)    || 0;
  const naGlyceroTarget = parseFloat(inputs.naGlyceroTarget) || 0;
  const k15PctTarget    = parseFloat(inputs.k15PctTarget)    || 0;
  const k2hpo4Target    = parseFloat(inputs.k2hpo4Target)    || 0;

  const na3PctMl    = (na3PctTarget    * bw) / CONC_NACL_3PCT  * dsf;
  const naGlyceroml = (naGlyceroTarget * bw) / CONC_NA_GLYCERO * dsf;
  const k15PctMl    = (k15PctTarget    * bw) / CONC_KCL_15PCT  * dsf;
  const k2hpo4Ml    = (k2hpo4Target    * bw) / CONC_K2HPO4     * dsf;

  const totalNaActual = na3PctTarget + naGlyceroTarget;
  const totalKActual  = k15PctTarget + k2hpo4Target;
  const totalPO4      = naGlyceroTarget * PO4_PER_MEQ_NA_GLYCERO
                      + k2hpo4Target    * PO4_PER_MEQ_K2HPO4;

  const caTarget      = parseFloat(inputs.caTarget) || 0;
  const caGluconateMl = (caTarget * bw) / CONC_CA_GLUCONATE_10PCT * dsf;

  const mgTarget = parseFloat(inputs.mgTarget) || 0;
  const mgso4Ml  = (mgTarget * bw) / CONC_MGSO4_50PCT * dsf;

  // 4. Vitamins & Trace — strictly BW-based, NO DSF, capped at max dose
  const soluvitMl    = Math.min(bw * DOSE_SOLUVIT_ML_PER_KG,    MAX_SOLUVIT_ML);
  const vitalipidMl  = Math.min(bw * DOSE_VITALIPID_ML_PER_KG,  MAX_VITALIPID_ML);
  const pediatraceMl = Math.min(bw * DOSE_PEDIATRACE_ML_PER_KG, MAX_PEDIATRACE_ML);

  // 5. Heparin (added to TPN bag)
  const heparinUnitPerMl = parseFloat(inputs.heparinConc) || HEPARIN_DEFAULT_CONC;
  const heparinUnits     = totalVolume * heparinUnitPerMl;
  const heparinMl        = heparinUnits / CONC_HEPARIN_STOCK;

  // 6. Volumes — Vitalipid goes in the lipid bag (Y-site with SMOFlipid)
  const lipidBagVol = lipidMl + vitalipidMl;
  const tpnVolume   = totalVolume - lipidBagVol;   // "TPN Volume" (2-in-1 bag)

  const activeSum =
    dextroseMl + aminovenMl +
    na3PctMl + naGlyceroml + k15PctMl + k2hpo4Ml +
    caGluconateMl + mgso4Ml + soluvitMl + pediatraceMl;
  const sterileWaterMl = tpnVolume - activeSum;

  // 7. GIR — REVERSE calculation from physician-prescribed TPN rate
  // Formula: GIR (mg/kg/min) = (TPN Rate ml/hr × Dextrose%) / (6 × BW)
  const manualTPNRate = parseFloat(inputs.manualTPNRate);
  const hasManualRate = !isNaN(manualTPNRate) && inputs.manualTPNRate !== '' && manualTPNRate > 0;
  const gir = hasManualRate
    ? (manualTPNRate * dexPct) / (GIR_REVERSE_DIVISOR * bw)
    : null; // null = no rate entered yet, show placeholder

  // 8. Safety checks
  const caMmolInBag  = caGluconateMl * CONC_CA_GLUCONATE_10PCT;
  const po4MmolInBag = naGlyceroml * PO4_PER_ML_NA_GLYCERO + k2hpo4Ml * PO4_PER_ML_K2HPO4;
  const bagVolL      = tpnVolume / ML_TO_L;
  const caConc       = bagVolL > 0 ? caMmolInBag  / bagVolL : 0;
  const po4Conc      = bagVolL > 0 ? po4MmolInBag / bagVolL : 0;
  const caxP         = caConc * po4Conc;
  const caxPHigh     = caxP > CA_PO4_PRECIP_THRESHOLD;

  const aaGPerL = bagVolL > 0 ? (aminovenMl * OSMO_AMINOVEN_10PCT_G_PER_ML) / bagVolL : 0;
  const totalNaMeq = totalNaActual * bw;
  const totalKMeq  = totalKActual  * bw;
  const estOsmolarity = bagVolL > 0
    ? (dexPct * OSMO_FACTOR_DEXTROSE)
      + (aaGPerL * OSMO_FACTOR_AA_G_PER_L)
      + ((totalNaMeq + totalKMeq) / bagVolL * OSMO_FACTOR_ELECTROLYTE)
    : 0;

  const peripheralRisk =
    inputs.lineType === 'peripheral' &&
    (dexPct > DEXTROSE_PERIPHERAL_LIMIT || estOsmolarity > OSMOLARITY_PERIPHERAL_MAX);

  const fatRateGKgHr = bw > 0 ? (lipidMl * 0.20) / HOURS_PER_DAY / bw : 0;
  const fatRateHigh  = fatRateGKgHr > FAT_RATE_MAX_G_KG_HR;

  // GIR alert flags only meaningful when a rate is entered
  const girHigh = gir !== null && gir > 12;
  const girLow  = gir !== null && gir < 4;

  // 9. Energy distribution
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

  // 10. Lipid rate (calculated from lipid bag volume)
  const lipidRate = lipidBagVol / HOURS_PER_DAY;

  return {
    totalVolume, tpnVolume, dsf,
    dextroseMl, aminovenMl, lipidMl,
    na3PctMl, naGlyceroml, totalNaActual,
    k15PctMl, k2hpo4Ml, totalKActual, totalPO4,
    caGluconateMl, mgso4Ml,
    soluvitMl, vitalipidMl, pediatraceMl,
    sterileWaterMl,
    heparinUnits, heparinMl, heparinUnitPerMl,
    gir, girHigh, girLow,
    estOsmolarity, caConc, po4Conc, caxP, caxPHigh, peripheralRisk,
    fatRateGKgHr, fatRateHigh,
    cho_kcal, protein_kcal, fat_kcal, totalEnergy, kcalPerKg,
    npcKcal, npcN, choPct, fatPct, proteinPct,
    lipidBagVol, lipidRate,
    // bag2in1Vol aliased to tpnVolume for backward compat with PDF template
    bag2in1Vol: tpnVolume,
    isWaterNegative: sterileWaterMl < 0,
  };
};
