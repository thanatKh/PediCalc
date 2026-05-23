// Dynamic Medical Decision Support
// All thresholds reference: Thai Neonatal Nutrition Guideline (PediNAT) B.E. 2565
// English messages only. Critical tier does NOT block export — physician decides.

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

  // ── 10. Osmolarity — PediNAT p.21, p.51 (peripheral line only) ──────────
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

  // ── 11. Dextrose % — PediNAT p.21 (peripheral line only) ────────────────
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
