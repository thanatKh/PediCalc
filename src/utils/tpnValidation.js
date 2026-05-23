// Clinical input validation for TPN Calculator.
// Returns { errors: string[], warnings: string[] }
// errors   → block export (hard limits — physiologically impossible or dangerous)
// warnings → show alert but allow export (outside typical range but may be intentional)

export function validateTPNInputs(inputs) {
  const errors   = [];
  const warnings = [];

  const bw             = parseFloat(inputs.bw);
  const volumeTarget   = parseFloat(inputs.volumeTarget);
  const dextrosePct    = parseFloat(inputs.dextrosePct);
  const proteinTarget  = parseFloat(inputs.proteinTarget);
  const lipidTarget    = parseFloat(inputs.lipidTarget);
  const na3Pct         = parseFloat(inputs.na3PctTarget)    || 0;
  const naGlycero      = parseFloat(inputs.naGlyceroTarget) || 0;
  const k15Pct         = parseFloat(inputs.k15PctTarget)    || 0;
  const k2hpo4         = parseFloat(inputs.k2hpo4Target)    || 0;
  const ca             = parseFloat(inputs.caTarget)        || 0;
  const mg             = parseFloat(inputs.mgTarget)        || 0;
  const heparinConc    = parseFloat(inputs.heparinConc)     || 0;

  // ── Body weight ──────────────────────────────────────────────────────────────
  if (!isNaN(bw)) {
    if (bw < 0.3)  errors.push(`BW ${bw} kg ต่ำกว่า 0.3 kg — ตรวจสอบค่าที่กรอก`);
    if (bw > 20)   errors.push(`BW ${bw} kg เกิน 20 kg — ตรวจสอบค่าที่กรอก (ระบบนี้ใช้สำหรับ Neonatal/Pediatric)`);
  }

  // ── Fluid volume target ──────────────────────────────────────────────────────
  if (!isNaN(volumeTarget)) {
    if (volumeTarget < 20)  errors.push(`Fluid Volume ${volumeTarget} ml/kg ต่ำผิดปกติ (min 20 ml/kg)`);
    if (volumeTarget > 200) errors.push(`Fluid Volume ${volumeTarget} ml/kg เกิน 200 ml/kg`);
    if (volumeTarget > 150) warnings.push(`Fluid Volume ${volumeTarget} ml/kg สูงกว่าปกติ (ปกติ ≤150 ml/kg)`);
  }

  // ── Dextrose ─────────────────────────────────────────────────────────────────
  if (!isNaN(dextrosePct)) {
    if (dextrosePct < 2)   errors.push(`Dextrose ${dextrosePct}% ต่ำมาก (min 2%)`);
    if (dextrosePct > 25)  errors.push(`Dextrose ${dextrosePct}% เกิน 25% — เสี่ยง hyperglycemia และ phlebitis`);
    if (dextrosePct > 12.5 && inputs.lineType === 'peripheral')
      warnings.push(`Dextrose ${dextrosePct}% เกิน 12.5% สำหรับ Peripheral line`);
  }

  // ── Protein ──────────────────────────────────────────────────────────────────
  if (!isNaN(proteinTarget)) {
    if (proteinTarget < 0)   errors.push(`Protein target ต้องไม่ติดลบ`);
    if (proteinTarget > 5)   errors.push(`Protein ${proteinTarget} g/kg/day เกิน 5 g/kg/day`);
    if (proteinTarget > 4)   warnings.push(`Protein ${proteinTarget} g/kg/day สูงกว่า 4 g/kg/day (ปกติ max 3.5 สำหรับ newborn)`);
  }

  // ── Lipid ────────────────────────────────────────────────────────────────────
  if (!isNaN(lipidTarget)) {
    if (lipidTarget < 0)   errors.push(`Lipid target ต้องไม่ติดลบ`);
    if (lipidTarget > 4)   errors.push(`Lipid ${lipidTarget} g/kg/day เกิน 4 g/kg/day`);
    if (lipidTarget > 3)   warnings.push(`Lipid ${lipidTarget} g/kg/day สูงกว่า 3 g/kg/day — เฝ้าระวัง fat overload`);
  }

  // ── Sodium (combined from all sources) ──────────────────────────────────────
  const totalNa = na3Pct + naGlycero;
  if (totalNa > 10)  errors.push(`Na รวม ${totalNa} mEq/kg/day เกิน 10 mEq/kg/day`);
  if (totalNa > 5)   warnings.push(`Na รวม ${totalNa} mEq/kg/day สูงกว่า 5 mEq/kg/day (ปกติ 2–4)`);

  // ── Potassium (combined from all sources) ────────────────────────────────────
  const totalK = k15Pct + k2hpo4;
  if (totalK > 6)    errors.push(`K รวม ${totalK} mEq/kg/day เกิน 6 mEq/kg/day — เสี่ยง hyperkalemia`);
  if (totalK > 4)    warnings.push(`K รวม ${totalK} mEq/kg/day สูงกว่า 4 mEq/kg/day`);

  // ── Calcium ──────────────────────────────────────────────────────────────────
  if (!isNaN(ca)) {
    if (ca < 0)   errors.push(`Calcium ต้องไม่ติดลบ`);
    if (ca > 2)   errors.push(`Calcium ${ca} mmol/kg/day เกิน 2 mmol/kg/day`);
    if (ca > 1.5) warnings.push(`Calcium ${ca} mmol/kg/day สูงกว่า 1.5 mmol/kg/day`);
  }

  // ── Magnesium ────────────────────────────────────────────────────────────────
  if (!isNaN(mg)) {
    if (mg < 0)    errors.push(`Magnesium ต้องไม่ติดลบ`);
    if (mg > 1.0)  errors.push(`Magnesium ${mg} mEq/kg/day เกิน 1.0 mEq/kg/day`);
    if (mg > 0.5)  warnings.push(`Magnesium ${mg} mEq/kg/day สูงกว่า 0.5 mEq/kg/day`);
  }

  // ── Heparin concentration ────────────────────────────────────────────────────
  if (!isNaN(heparinConc)) {
    if (heparinConc < 0)    errors.push(`Heparin concentration ต้องไม่ติดลบ`);
    if (heparinConc > 1.0)  errors.push(`Heparin ${heparinConc} IU/ml เกิน 1.0 IU/ml`);
  }

  return { errors, warnings };
}
