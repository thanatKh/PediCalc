import {
  NEWBORN_LINE_RESERVE_ML,
  GIR_MAX_SAFE,
  GIR_MIN_SAFE,
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
  SMOFLIPID_20PCT_G_PER_ML,
  GIR_REVERSE_DIVISOR,
  HOURS_PER_DAY,
  OSMO_FACTOR_DEXTROSE,
  OSMO_FACTOR_AA_G_PER_L,
  OSMO_AMINOVEN_10PCT_G_PER_ML,
  OSMO_FACTOR_ELECTROLYTE,
  ML_TO_L,
  PROTEIN_TO_NITROGEN,
  DEXTROSE_PERIPHERAL_LIMIT,
  OSMOLARITY_PERIPHERAL_MAX,
  FAT_RATE_MAX_G_KG_HR,
} from './clinicalConstants';

export const calculateTPN = (inputs) => {
  const bw = parseFloat(inputs.bw) || 0;
  if (bw <= 0) return null;

  // 1. Total Volume = BW × fluid target + 25 ml (institution-wide line reserve)
  const volTarget   = parseFloat(inputs.volumeTarget) || 0;
  const totalVolume = volTarget * bw + NEWBORN_LINE_RESERVE_ML;

  // 2. Lipid & Vitalipid — computed before DSF because DSF is based on tpnVolume
  const lipidTarget  = parseFloat(inputs.lipidTarget) || 0;
  const lipidMl      = lipidTarget * bw * CONC_SMOFLIPID_20PCT;

  const vitalipidAuto = Math.min(bw * DOSE_VITALIPID_ML_PER_KG, MAX_VITALIPID_ML);
  const vitalipidMl   = inputs.vitalipidOverride !== '' && inputs.vitalipidOverride != null
    ? parseFloat(inputs.vitalipidOverride)
    : vitalipidAuto;

  // Vitalipid goes in the lipid bag (Y-site with SMOFlipid)
  const lipidBagVol = lipidMl + vitalipidMl;
  const tpnVolume   = totalVolume - lipidBagVol;   // "TPN Volume" (2-in-1 bag)

  // DSF (Dead Space Factor) — 25 ml dead space is in the 2-in-1 TPN line only;
  // lipid runs on a separate Y-site line, so DSF must be based on tpnVolume, not totalVolume.
  // Full precision — not pre-rounded; rounding only happens at display.
  const nutrientVolume = tpnVolume - NEWBORN_LINE_RESERVE_ML;
  const dsf            = nutrientVolume > 0 ? tpnVolume / nutrientVolume : 1;

  // 3. Dextrose & Protein
  // dexPct is the target concentration of the TPN bag; dextroseMl uses tpnVolume
  // so the compounded bag is exactly at the ordered concentration
  const dexPct      = parseFloat(inputs.dextrosePct) || 0;
  const dextroseMl  = (dexPct / 100) * tpnVolume * CONC_DEXTROSE_50PCT;

  const proteinTarget = parseFloat(inputs.proteinTarget) || 0;
  const aminovenMl    = proteinTarget * bw * CONC_AMINOVEN_10PCT * dsf;

  // 4. Electrolytes — direct source inputs (mEq/kg from each source), scaled by DSF
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

  // 5. Vitamins & Trace — Soluvit and Pediatrace (Vitalipid computed in step 2)
  const soluvitAuto    = Math.min(bw * DOSE_SOLUVIT_ML_PER_KG,    MAX_SOLUVIT_ML);
  const pediatraceAuto = Math.min(bw * DOSE_PEDIATRACE_ML_PER_KG, MAX_PEDIATRACE_ML);
  const soluvitMl    = inputs.soluvitOverride    !== '' && inputs.soluvitOverride    != null ? parseFloat(inputs.soluvitOverride)    : soluvitAuto;
  const pediatraceMl = inputs.pediatraceOverride !== '' && inputs.pediatraceOverride != null ? parseFloat(inputs.pediatraceOverride) : pediatraceAuto;

  // 6. Heparin (added to TPN bag only — not lipid bag)
  const heparinUnitPerMl = parseFloat(inputs.heparinConc) || HEPARIN_DEFAULT_CONC;
  const heparinUnits     = tpnVolume * heparinUnitPerMl;
  const heparinMl        = heparinUnits / CONC_HEPARIN_STOCK;

  const activeSum =
    dextroseMl + aminovenMl +
    na3PctMl + naGlyceroml + k15PctMl + k2hpo4Ml +
    caGluconateMl + mgso4Ml + soluvitMl + pediatraceMl +
    heparinMl;
  const sterileWaterMl = tpnVolume - activeSum;

  // 7. GIR — REVERSE calculation from physician-prescribed TPN rate
  // Formula: GIR (mg/kg/min) = (TPN Rate ml/hr × Dextrose%) / (6 × BW)
  const manualTPNRate = parseFloat(inputs.manualTPNRate);
  const hasManualRate = !isNaN(manualTPNRate) && inputs.manualTPNRate !== '' && manualTPNRate > 0;
  const gir = hasManualRate
    ? (manualTPNRate * dexPct) / (GIR_REVERSE_DIVISOR * bw)
    : null; // null = no rate entered yet, show placeholder

  // 8. Safety checks — Ca × PO₄ two-source model (ESPGHAN/ESPEN 2018)
  const caMmolInBag      = caGluconateMl * CONC_CA_GLUCONATE_10PCT;
  const po4OrganicMmol   = naGlyceroml * PO4_PER_ML_NA_GLYCERO;   // Na-glycerophosphate (organic)
  const po4InorganicMmol = k2hpo4Ml    * PO4_PER_ML_K2HPO4;       // K₂HPO₄ (inorganic)
  const po4MmolInBag     = po4OrganicMmol + po4InorganicMmol;
  const bagVolL          = tpnVolume / ML_TO_L;
  const caConc           = bagVolL > 0 ? caMmolInBag      / bagVolL : 0;
  const po4OrganicConc   = bagVolL > 0 ? po4OrganicMmol   / bagVolL : 0;
  const po4InorganicConc = bagVolL > 0 ? po4InorganicMmol / bagVolL : 0;
  const po4Conc          = po4OrganicConc + po4InorganicConc;
  const caxP             = caConc * po4Conc;          // total product — kept for PDF display
  const caxOrganic       = caConc * po4OrganicConc;   // [Ca]×[organic PO₄]
  const caxInorganic     = caConc * po4InorganicConc; // [Ca]×[inorganic PO₄]

  // DSF applied to Na/K mEq: actual mEq in the bag = target × bw × dsf
  const aaGPerL    = bagVolL > 0 ? (aminovenMl * OSMO_AMINOVEN_10PCT_G_PER_ML) / bagVolL : 0;
  const totalNaMeq = totalNaActual * bw * dsf;
  const totalKMeq  = totalKActual  * bw * dsf;
  const estOsmolarity = bagVolL > 0
    ? (dexPct * OSMO_FACTOR_DEXTROSE)
      + (aaGPerL * OSMO_FACTOR_AA_G_PER_L)
      + ((totalNaMeq + totalKMeq) / bagVolL * OSMO_FACTOR_ELECTROLYTE)
    : 0;

  const peripheralRisk =
    inputs.lineType === 'peripheral' &&
    (dexPct > DEXTROSE_PERIPHERAL_LIMIT || estOsmolarity > OSMOLARITY_PERIPHERAL_MAX);

  const fatRateGKgHr = bw > 0 ? (lipidMl * SMOFLIPID_20PCT_G_PER_ML) / HOURS_PER_DAY / bw : 0;
  const fatRateHigh  = fatRateGKgHr > FAT_RATE_MAX_G_KG_HR;

  // GIR alert flags only meaningful when a rate is entered
  const girHigh = gir !== null && gir > GIR_MAX_SAFE;
  const girLow  = gir !== null && gir < GIR_MIN_SAFE;

  // 9. Energy distribution
  const cho_kcal     = (dexPct / 100) * (tpnVolume - NEWBORN_LINE_RESERVE_ML) * KCAL_PER_G_DEXTROSE;
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

  // 11. Calculated TPN pump rate — excludes line reserve (25 ml stays in bag, never infused)
  const calcTPNRate = (tpnVolume - NEWBORN_LINE_RESERVE_ML) / HOURS_PER_DAY;

  return {
    totalVolume, tpnVolume, dsf,
    dextroseMl, aminovenMl, lipidMl,
    na3PctMl, naGlyceroml, totalNaActual,
    k15PctMl, k2hpo4Ml, totalKActual, totalPO4,
    caGluconateMl, mgso4Ml,
    soluvitMl, vitalipidMl, pediatraceMl,
    soluvitAuto, vitalipidAuto, pediatraceAuto,
    sterileWaterMl,
    heparinUnits, heparinMl, heparinUnitPerMl,
    gir, girHigh, girLow,
    estOsmolarity, caConc, po4Conc, caxP,
    po4OrganicConc, po4InorganicConc, caxOrganic, caxInorganic,
    peripheralRisk,
    fatRateGKgHr, fatRateHigh,
    cho_kcal, protein_kcal, fat_kcal, totalEnergy, kcalPerKg,
    npcN, choPct, fatPct, proteinPct,
    lipidBagVol, lipidRate, calcTPNRate,
    // bag2in1Vol aliased to tpnVolume for backward compat with PDF template
    bag2in1Vol: tpnVolume,
    isWaterNegative: sterileWaterMl < 0,
  };
};
