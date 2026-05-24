// Dynamic Medical Decision Support
// All thresholds reference: Thai Neonatal Nutrition Guideline (PediNAT) B.E. 2565
// English messages only. Critical tier does NOT block export — physician decides.

import { fmt } from './fmt';
import {
  GIR_MAX_SAFE, GIR_MIN_SAFE,
  DEXTROSE_PERIPHERAL_LIMIT, OSMOLARITY_PERIPHERAL_MAX,
  FAT_RATE_MAX_G_KG_HR,
  FLUID_CRITICAL_LOW, FLUID_MODERATE_LOW, FLUID_MODERATE_HIGH, FLUID_CRITICAL_HIGH,
  GIR_MODERATE_HIGH,
  AA_CRITICAL_LOW, AA_MODERATE_LOW, AA_MODERATE_HIGH, AA_CRITICAL_HIGH,
  LIPID_MODERATE_LOW, LIPID_MODERATE_HIGH, LIPID_CRITICAL_HIGH, FAT_RATE_MODERATE_HIGH,
  NA_DOL_RESTRICTION_DAYS, NA_RESTRICTION_MAX, NA_SAFE_MAX, NA_MODERATE_HIGH, NA_CRITICAL_HIGH,
  K_DOL_RESTRICTION_DAYS, K_SAFE_MAX, K_MODERATE_HIGH, K_CRITICAL_HIGH,
  CA_CDS_SAFE_MIN, CA_CDS_SAFE_MAX, CA_CDS_CRITICAL_HIGH,
  PO4_TARGET_MIN, PO4_MODERATE_LOW, PO4_SAFE_MAX, PO4_CRITICAL_HIGH,
  MG_CDS_SAFE_MIN, MG_CDS_SAFE_MAX, MG_CDS_MODERATE_HIGH, MG_CDS_CRITICAL_HIGH,
  OSMO_MODERATE_HIGH,
  CA_PO4_PRODUCT_THRESHOLD, CA_PO4_SUM_THRESHOLD,
  CA_PO4_PRODUCT_MODERATE, CA_PO4_SUM_MODERATE,
  ENERGY_CRITICAL_LOW, ENERGY_MODERATE_LOW, ENERGY_MODERATE_HIGH, ENERGY_CRITICAL_HIGH,
  NPC_N_CRITICAL_LOW, NPC_N_MODERATE_LOW, NPC_N_MODERATE_HIGH, NPC_N_CRITICAL_HIGH,
  MAX_SOLUVIT_ML, MAX_VITALIPID_ML, MAX_PEDIATRACE_ML,
  SOLUVIT_MODERATE_HIGH, VITALIPID_MODERATE_HIGH, PEDIATRACE_MODERATE_HIGH,
} from './clinicalConstants';

function mk(tier, value, message, risk) {
  return { tier, value: typeof value === 'number' ? value : null, message: message ?? null, risk: risk ?? null };
}

function n(v) { return parseFloat(v) || 0; }

export function evaluateClinicalTiers(inputs, results) {
  if (!results) return null;

  const dol          = parseInt(inputs.ageDay) || 0;
  const urineOK      = inputs.urineOutput === true || inputs.urineOutput === 'true';
  const isPeripheral = inputs.lineType === 'peripheral';
  const checks       = {};

  // ── 1. Fluid Volume (ml/kg/day) — PediNAT p.21 ──────────────────────────
  const fluid = n(inputs.volumeTarget);
  if (fluid > 0) {
    if (fluid < FLUID_CRITICAL_LOW)
      checks.fluid = mk('critical', fluid,
        `Fluid ${fluid} ml/kg/day is critically low (< ${FLUID_CRITICAL_LOW})`,
        'Severe dehydration and metabolic instability risk. Verify target immediately.');
    else if (fluid < FLUID_MODERATE_LOW)
      checks.fluid = mk('moderate', fluid,
        `Fluid ${fluid} ml/kg/day below typical range (${FLUID_MODERATE_LOW}–${FLUID_MODERATE_HIGH})`,
        'Likely intentional restriction — confirm clinical intent.');
    else if (fluid > FLUID_CRITICAL_HIGH)
      checks.fluid = mk('critical', fluid,
        `Fluid ${fluid} ml/kg/day exceeds ${FLUID_CRITICAL_HIGH} ml/kg/day`,
        'Fluid overload risk: symptomatic PDA, pulmonary edema, IVH.');
    else if (fluid > FLUID_MODERATE_HIGH)
      checks.fluid = mk('moderate', fluid,
        `Fluid ${fluid} ml/kg/day above typical range (${FLUID_MODERATE_LOW}–${FLUID_MODERATE_HIGH})`,
        'Monitor for signs of fluid overload.');
    else
      checks.fluid = mk('safe', fluid);
  }

  // ── 2. GIR (mg/kg/min) — PediNAT metabolic section ─────────────────────
  const gir = results.gir;
  if (gir !== null) {
    if (gir > GIR_MAX_SAFE)
      checks.gir = mk('critical', gir,
        `GIR ${gir.toFixed(2)} mg/kg/min exceeds maximum (${GIR_MAX_SAFE})`,
        'Severe hyperglycemia risk. Reduce TPN rate or dextrose concentration.');
    else if (gir > GIR_MODERATE_HIGH)
      checks.gir = mk('moderate', gir,
        `GIR ${gir.toFixed(2)} mg/kg/min approaching maximum (${GIR_MODERATE_HIGH}–${GIR_MAX_SAFE})`,
        'Monitor blood glucose closely. Consider reducing dextrose %.');
    else if (gir < GIR_MIN_SAFE)
      checks.gir = mk('critical', gir,
        `GIR ${gir.toFixed(2)} mg/kg/min below minimum (${GIR_MIN_SAFE})`,
        'Hypoglycemia risk. Increase TPN rate or dextrose concentration.');
    else
      checks.gir = mk('safe', gir);
  }

  // ── 3. Amino Acids / Protein (g/kg/day) — PediNAT p.94 ──────────────────
  const aa = n(inputs.proteinTarget);
  if (aa > 0) {
    if (aa > AA_CRITICAL_HIGH)
      checks.protein = mk('critical', aa,
        `Amino acids ${aa} g/kg/day exceeds PediNAT maximum (${AA_CRITICAL_HIGH})`,
        'Azotemia and metabolic acidosis risk. Reduce amino acid dose.');
    else if (aa > AA_MODERATE_HIGH)
      checks.protein = mk('moderate', aa,
        `Amino acids ${aa} g/kg/day approaching maximum (${AA_MODERATE_HIGH}–${AA_CRITICAL_HIGH})`,
        'Monitor BUN and liver function.');
    else if (aa < AA_CRITICAL_LOW)
      checks.protein = mk('critical', aa,
        `Amino acids ${aa} g/kg/day critically low (< ${AA_CRITICAL_LOW})`,
        'Severe protein catabolism risk. Increase amino acid dose.');
    else if (aa < AA_MODERATE_LOW)
      checks.protein = mk('moderate', aa,
        `Amino acids ${aa} g/kg/day below recommended start dose (${AA_MODERATE_LOW}–2.0)`,
        'Risk of catabolism. Consider increasing to prevent negative nitrogen balance.');
    else
      checks.protein = mk('safe', aa);
  }

  // ── 4. Lipid (g/kg/day) + Fat Infusion Rate — PediNAT p.94 ─────────────
  const lipid       = n(inputs.lipidTarget);
  const fatGKgHr    = results.fatRateGKgHr ?? 0;
  const fatRateHigh = results.fatRateHigh ?? false;
  if (lipid > 0) {
    if (lipid > LIPID_CRITICAL_HIGH || fatRateHigh)
      checks.lipid = mk('critical', lipid,
        `Lipid ${lipid} g/kg/day exceeds PediNAT maximum (${LIPID_CRITICAL_HIGH}) · Fat rate: ${fatGKgHr.toFixed(3)} g/kg/hr`,
        'Fat Overload Syndrome risk. Reduce lipid dose immediately.');
    else if (fatGKgHr > FAT_RATE_MODERATE_HIGH)
      checks.lipid = mk('moderate', lipid,
        `Fat infusion rate ${fatGKgHr.toFixed(3)} g/kg/hr approaching limit (${FAT_RATE_MAX_G_KG_HR})`,
        'Monitor triglycerides. Consider extending infusion duration.');
    else if (lipid > LIPID_MODERATE_HIGH)
      checks.lipid = mk('moderate', lipid,
        `Lipid ${lipid} g/kg/day approaching maximum (${LIPID_MODERATE_HIGH}–${LIPID_CRITICAL_HIGH})`,
        'Monitor triglycerides and liver function.');
    else if (lipid < LIPID_MODERATE_LOW)
      checks.lipid = mk('moderate', lipid,
        `Lipid ${lipid} g/kg/day below recommended starting dose (${LIPID_MODERATE_LOW})`,
        'Ensure essential fatty acid requirements are met.');
    else
      checks.lipid = mk('safe', lipid);
  }

  // ── 5. Sodium (mEq/kg/day) — PediNAT p.21, DOL-aware ───────────────────
  const totalNa = results.totalNaActual ?? (n(inputs.na3PctTarget) + n(inputs.naGlyceroTarget));
  // Only evaluate if any Na is being given or there is a Na input
  if (n(inputs.na3PctTarget) > 0 || n(inputs.naGlyceroTarget) > 0 || totalNa > 0) {
    if (totalNa > NA_CRITICAL_HIGH)
      checks.na = mk('critical', totalNa,
        `Total Na ${totalNa.toFixed(1)} mEq/kg/day exceeds ${NA_CRITICAL_HIGH}`,
        'Severe hypernatremia risk. Reduce sodium immediately.');
    else if (totalNa > NA_MODERATE_HIGH)
      checks.na = mk('moderate', totalNa,
        `Total Na ${totalNa.toFixed(1)} mEq/kg/day above safe range (2–${NA_SAFE_MAX})`,
        'Monitor serum sodium. Hypernatremia risk.');
    else if (dol > 0 && dol <= NA_DOL_RESTRICTION_DAYS && totalNa > NA_RESTRICTION_MAX)
      checks.na = mk('moderate', totalNa,
        `Na ${totalNa.toFixed(1)} mEq/kg/day on DOL ${dol} — restriction phase expected (target 0–${NA_RESTRICTION_MAX})`,
        'Neonates DOL ≤ 2: Na restriction recommended. Avoid sodium loading during physiologic weight loss phase.');
    else
      checks.na = mk('safe', totalNa);
  }

  // ── 6. Potassium (mEq/kg/day) — PediNAT p.21, DOL + urine output aware ──
  const totalK = results.totalKActual ?? (n(inputs.k15PctTarget) + n(inputs.k2hpo4Target));
  if (n(inputs.k15PctTarget) > 0 || n(inputs.k2hpo4Target) > 0 || totalK > 0) {
    if (totalK > K_CRITICAL_HIGH)
      checks.k = mk('critical', totalK,
        `Total K ${totalK.toFixed(1)} mEq/kg/day exceeds safe limit (${K_CRITICAL_HIGH})`,
        'Life-threatening arrhythmia risk. Reduce potassium immediately and check serum K.');
    else if (dol > 0 && dol < K_DOL_RESTRICTION_DAYS && totalK > 0 && !urineOK)
      checks.k = mk('critical', totalK,
        `K ${totalK.toFixed(1)} mEq/kg/day on DOL ${dol} without confirmed urine output`,
        'Hyperkalemia in oliguric neonate — life-threatening. Confirm urine output before K supplementation.');
    else if (dol > 0 && dol < K_DOL_RESTRICTION_DAYS && totalK > 0 && urineOK)
      checks.k = mk('moderate', totalK,
        `K ${totalK.toFixed(1)} mEq/kg/day on DOL ${dol} — early neonatal phase`,
        'K supplementation before DOL 3: confirm adequate renal function. Monitor serum K closely.');
    else if (totalK > K_MODERATE_HIGH)
      checks.k = mk('moderate', totalK,
        `Total K ${totalK.toFixed(1)} mEq/kg/day above typical range (1–${K_SAFE_MAX})`,
        'Monitor serum potassium. Arrhythmia risk if levels rise.');
    else
      checks.k = mk('safe', totalK);
  }

  // ── 7. Calcium (mmol/kg/day) — PediNAT p.94 ────────────────────────────
  const ca = n(inputs.caTarget);
  if (ca > 0) {
    if (ca > CA_CDS_CRITICAL_HIGH)
      checks.ca = mk('critical', ca,
        `Calcium ${ca} mmol/kg/day exceeds ${CA_CDS_CRITICAL_HIGH}`,
        'Hypercalcemia risk. Reduce calcium dose and monitor serum calcium.');
    else if (ca > CA_CDS_SAFE_MAX)
      checks.ca = mk('moderate', ca,
        `Calcium ${ca} mmol/kg/day above safe range (${CA_CDS_SAFE_MIN}–${CA_CDS_SAFE_MAX})`,
        'Monitor serum calcium and ionized calcium.');
    else if (ca < CA_CDS_SAFE_MIN)
      checks.ca = mk('moderate', ca,
        `Calcium ${ca} mmol/kg/day below typical starting dose (${CA_CDS_SAFE_MIN}–1.0)`,
        'Risk of hypocalcemia and metabolic bone disease in preterm.');
    else
      checks.ca = mk('safe', ca);
  }

  // ── 8. Phosphate (mmol/kg/day) — PediNAT p.94, p.29 ────────────────────
  const po4 = results.totalPO4 ?? 0;
  const hasPO4Input = n(inputs.naGlyceroTarget) > 0 || n(inputs.k2hpo4Target) > 0;
  if (hasPO4Input || po4 > 0) {
    if (po4 > PO4_CRITICAL_HIGH)
      checks.po4 = mk('critical', po4,
        `Total PO₄ ${po4.toFixed(2)} mmol/kg/day exceeds ${PO4_SAFE_MAX}`,
        'Hyperphosphatemia reduces ionized calcium — tetany and seizure risk. Reduce phosphate.');
    else if (po4 > 0 && po4 < PO4_MODERATE_LOW)
      checks.po4 = mk('moderate', po4,
        `Total PO₄ ${po4.toFixed(2)} mmol/kg/day critically below target (${PO4_TARGET_MIN}–1.5 for preterm)`,
        'Hypophosphatemia risk — metabolic bone disease, poor growth, respiratory failure.');
    else if (po4 > 0 && po4 < PO4_TARGET_MIN)
      checks.po4 = mk('moderate', po4,
        `Total PO₄ ${po4.toFixed(2)} mmol/kg/day below recommended minimum (${PO4_TARGET_MIN}) for preterm`,
        'Consider increasing phosphate supplementation to prevent metabolic bone disease.');
    else if (po4 > 0)
      checks.po4 = mk('safe', po4);
  }

  // ── 9. Magnesium (mEq/kg/day) — PediNAT p.94 ───────────────────────────
  const mg = n(inputs.mgTarget);
  if (mg > 0) {
    if (mg > MG_CDS_CRITICAL_HIGH)
      checks.mg = mk('critical', mg,
        `Magnesium ${mg} mEq/kg/day exceeds ${MG_CDS_CRITICAL_HIGH}`,
        'Hypermagnesemia — neuromuscular depression, respiratory failure risk.');
    else if (mg > MG_CDS_MODERATE_HIGH)
      checks.mg = mk('moderate', mg,
        `Magnesium ${mg} mEq/kg/day above recommended range (${MG_CDS_SAFE_MIN}–${MG_CDS_SAFE_MAX})`,
        'Monitor serum magnesium and neuromuscular status.');
    else if (mg < MG_CDS_SAFE_MIN)
      checks.mg = mk('moderate', mg,
        `Magnesium ${mg} mEq/kg/day below recommended minimum (${MG_CDS_SAFE_MIN})`,
        'Hypomagnesemia risk — refractory hypocalcemia, cardiac arrhythmia.');
    else
      checks.mg = mk('safe', mg);
  }

  // ── 10. Ca×PO₄ Precipitation Risk ──────────────────────────────────────
  const caxP    = results.caxP    ?? 0;
  const caConc  = results.caConc  ?? 0;
  const po4Conc = results.po4Conc ?? 0;
  const caxpSum = caConc + po4Conc;
  const hasCaOrPO4 = n(inputs.caTarget) > 0 || n(inputs.naGlyceroTarget) > 0 || n(inputs.k2hpo4Target) > 0;
  if (hasCaOrPO4 && (caConc > 0 || po4Conc > 0)) {
    if (results.caxPHigh)
      checks.caxp = mk('critical', caxP,
        `Ca×PO₄ product = ${fmt(caxP, 1)} mmol²/L² (> ${CA_PO4_PRODUCT_THRESHOLD}) or Ca+PO₄ = ${fmt(caxpSum, 1)} mmol/L (> ${CA_PO4_SUM_THRESHOLD})`,
        'Precipitation risk — crystals can occlude IV lines. Reduce Ca or PO₄, or administer via separate line.');
    else if (caxP > CA_PO4_PRODUCT_MODERATE || caxpSum > CA_PO4_SUM_MODERATE)
      checks.caxp = mk('moderate', caxP,
        `Ca×PO₄ product = ${fmt(caxP, 1)} mmol²/L² or Ca+PO₄ = ${fmt(caxpSum, 1)} mmol/L — approaching precipitation threshold`,
        'Monitor Ca and PO₄ levels. Consider reducing doses or spacing administration.');
    else
      checks.caxp = mk('safe', caxP);
  }

  // ── 10b. Ca without PO₄ / PO₄ without Ca ────────────────────────────────
  const hasCa  = n(inputs.caTarget) > 0;
  const hasPO4 = n(inputs.naGlyceroTarget) > 0 || n(inputs.k2hpo4Target) > 0;
  if (hasCa && !hasPO4)
    checks.capo4balance = mk('moderate', null,
      'Calcium prescribed without Phosphate',
      'Ca and PO₄ should be given together for bone mineralization. Risk of metabolic bone disease in preterm neonates.');
  else if (hasPO4 && !hasCa)
    checks.capo4balance = mk('moderate', null,
      'Phosphate prescribed without Calcium',
      'Ca and PO₄ should be given together for bone mineralization. Risk of hypocalcemia and metabolic bone disease.');

  // ── 11. Total Energy (kcal/kg/day) — ASPEN/ESPGHAN neonatal ────────────
  const kcalPerKg = results.kcalPerKg ?? 0;
  const bwForEnergy = n(inputs.bw);
  if (kcalPerKg > 0 && bwForEnergy > 0) {
    if (kcalPerKg < ENERGY_CRITICAL_LOW)
      checks.energy = mk('critical', kcalPerKg,
        `Total energy ${fmt(kcalPerKg, 1)} kcal/kg/day critically low (< ${ENERGY_CRITICAL_LOW})`,
        'Severe underfeeding — catabolism, poor wound healing, growth failure risk. Increase macronutrients.');
    else if (kcalPerKg < ENERGY_MODERATE_LOW)
      checks.energy = mk('moderate', kcalPerKg,
        `Total energy ${fmt(kcalPerKg, 1)} kcal/kg/day below minimum for growth (${ENERGY_MODERATE_LOW}–${ENERGY_MODERATE_HIGH})`,
        'Insufficient for anabolism. Consider increasing dextrose, protein, or lipid.');
    else if (kcalPerKg > ENERGY_CRITICAL_HIGH)
      checks.energy = mk('critical', kcalPerKg,
        `Total energy ${fmt(kcalPerKg, 1)} kcal/kg/day exceeds safe limit (> ${ENERGY_CRITICAL_HIGH})`,
        'Overfeeding risk — hepatic steatosis, excess CO₂ production, hyperglycemia. Reduce macronutrients.');
    else if (kcalPerKg > ENERGY_MODERATE_HIGH)
      checks.energy = mk('moderate', kcalPerKg,
        `Total energy ${fmt(kcalPerKg, 1)} kcal/kg/day above typical target (${ENERGY_MODERATE_LOW}–${ENERGY_MODERATE_HIGH})`,
        'Monitor for overfeeding. Verify macronutrient targets are appropriate for clinical status.');
    else
      checks.energy = mk('safe', kcalPerKg);
  }

  // ── 12. NPC:N Ratio (kcal non-protein : g nitrogen) — ASPEN/ESPGHAN ────
  const npcN = results.npcN ?? 0;
  const hasProtein = n(inputs.proteinTarget) > 0;
  if (hasProtein && npcN > 0) {
    if (npcN < NPC_N_CRITICAL_LOW)
      checks.npcn = mk('critical', npcN,
        `NPC:N ratio ${Math.round(npcN)} kcal/g N critically low (< ${NPC_N_CRITICAL_LOW})`,
        'Protein being oxidised as energy instead of for anabolism. Increase dextrose/lipid or reduce protein.');
    else if (npcN < NPC_N_MODERATE_LOW)
      checks.npcn = mk('moderate', npcN,
        `NPC:N ratio ${Math.round(npcN)} kcal/g N below target range (${NPC_N_MODERATE_LOW}–${NPC_N_MODERATE_HIGH})`,
        'Suboptimal protein utilisation. Consider increasing non-protein calories.');
    else if (npcN > NPC_N_CRITICAL_HIGH)
      checks.npcn = mk('critical', npcN,
        `NPC:N ratio ${Math.round(npcN)} kcal/g N critically high (> ${NPC_N_CRITICAL_HIGH})`,
        'Severe caloric excess relative to protein — overfeeding risk. Reduce dextrose or lipid.');
    else if (npcN > NPC_N_MODERATE_HIGH)
      checks.npcn = mk('moderate', npcN,
        `NPC:N ratio ${Math.round(npcN)} kcal/g N above target range (${NPC_N_MODERATE_LOW}–${NPC_N_MODERATE_HIGH})`,
        'Excess non-protein calories relative to protein. Consider reducing dextrose or lipid.');
    else
      checks.npcn = mk('safe', npcN);
  }

  // ── 13. Osmolarity — PediNAT p.21, p.51 (peripheral line only) ──────────
  const osmo = results.estOsmolarity ?? 0;
  if (osmo > 0 && isPeripheral) {
    if (osmo > OSMOLARITY_PERIPHERAL_MAX)
      checks.osmolarity = mk('critical', osmo,
        `Osmolarity ${Math.round(osmo)} mOsm/L exceeds peripheral limit (${OSMOLARITY_PERIPHERAL_MAX})`,
        'Severe phlebitis and extravasation risk. Switch to central line or reduce dextrose/amino acids.');
    else if (osmo > OSMO_MODERATE_HIGH)
      checks.osmolarity = mk('moderate', osmo,
        `Osmolarity ${Math.round(osmo)} mOsm/L approaching peripheral limit (${OSMOLARITY_PERIPHERAL_MAX})`,
        'Monitor infusion site closely. Consider switching to central line.');
    else
      checks.osmolarity = mk('safe', osmo);
  }

  // ── 14. Vitamins & Trace — only evaluated when manually overridden ──────────
  const soluvitVal    = results.soluvitMl    ?? 0;
  const vitalipidVal  = results.vitalipidMl  ?? 0;
  const pediatraceVal = results.pediatraceMl ?? 0;
  const soluvitManual    = inputs.soluvitOverride    !== '' && inputs.soluvitOverride    != null;
  const vitalipidManual  = inputs.vitalipidOverride  !== '' && inputs.vitalipidOverride  != null;
  const pediatraceManual = inputs.pediatraceOverride !== '' && inputs.pediatraceOverride != null;

  if (soluvitManual) {
    if (soluvitVal > MAX_SOLUVIT_ML)
      checks.soluvit = mk('critical', soluvitVal,
        `Soluvit-N ${fmt(soluvitVal, 2)} ml/day exceeds maximum (${MAX_SOLUVIT_ML} ml/day)`,
        'Water-soluble vitamin toxicity risk. Reduce to ≤ 10 ml/day.');
    else if (soluvitVal > SOLUVIT_MODERATE_HIGH)
      checks.soluvit = mk('moderate', soluvitVal,
        `Soluvit-N ${fmt(soluvitVal, 2)} ml/day approaching maximum (${MAX_SOLUVIT_ML} ml/day)`,
        'Verify manual dose — auto-calc is 1 ml/kg/day, max 10 ml/day.');
    else
      checks.soluvit = mk('safe', soluvitVal);
  }

  if (vitalipidManual) {
    if (vitalipidVal > MAX_VITALIPID_ML)
      checks.vitalipid = mk('critical', vitalipidVal,
        `Vitalipid N Infant ${fmt(vitalipidVal, 2)} ml/day exceeds maximum (${MAX_VITALIPID_ML} ml/day)`,
        'Fat-soluble vitamin toxicity risk (vitamins A, D, E, K). Reduce to ≤ 10 ml/day.');
    else if (vitalipidVal > VITALIPID_MODERATE_HIGH)
      checks.vitalipid = mk('moderate', vitalipidVal,
        `Vitalipid N Infant ${fmt(vitalipidVal, 2)} ml/day approaching maximum (${MAX_VITALIPID_ML} ml/day)`,
        'Verify manual dose — auto-calc is 4 ml/kg/day, max 10 ml/day.');
    else
      checks.vitalipid = mk('safe', vitalipidVal);
  }

  if (pediatraceManual) {
    if (pediatraceVal > MAX_PEDIATRACE_ML)
      checks.pediatrace = mk('critical', pediatraceVal,
        `Pediatrace ${fmt(pediatraceVal, 2)} ml/day exceeds maximum (${MAX_PEDIATRACE_ML} ml/day)`,
        'Trace element toxicity risk (Zn, Cu, Mn, Se, F). Reduce to ≤ 10 ml/day.');
    else if (pediatraceVal > PEDIATRACE_MODERATE_HIGH)
      checks.pediatrace = mk('moderate', pediatraceVal,
        `Pediatrace ${fmt(pediatraceVal, 2)} ml/day approaching maximum (${MAX_PEDIATRACE_ML} ml/day)`,
        'Verify manual dose — auto-calc is 1 ml/kg/day, max 10 ml/day.');
    else
      checks.pediatrace = mk('safe', pediatraceVal);
  }

  // ── 15. Dextrose % — PediNAT p.21 (peripheral line only) ────────────────
  const dexPct = n(inputs.dextrosePct);
  if (dexPct > 0 && isPeripheral) {
    if (dexPct > DEXTROSE_PERIPHERAL_LIMIT)
      checks.dextrose = mk('critical', dexPct,
        `Dextrose ${dexPct}% exceeds peripheral limit (${DEXTROSE_PERIPHERAL_LIMIT}%)`,
        'Severe phlebitis risk. Switch to central line or reduce dextrose concentration.');
    else
      checks.dextrose = mk('safe', dexPct);
  }

  return checks;
}

export function countTiers(checks) {
  if (!checks) return { critical: 0, moderate: 0, safe: 0 };
  const vals = Object.values(checks);
  return {
    critical: vals.filter(v => v.tier === 'critical').length,
    moderate: vals.filter(v => v.tier === 'moderate').length,
    safe:     vals.filter(v => v.tier === 'safe').length,
  };
}
