// Hard-stop input validation for TPN Calculator.
// Only checks that are physiologically impossible or software safety limits.
// Clinical range guidance is handled by clinicalDecisionSupport.js (non-blocking).
// Returns { errors: string[], warnings: string[] }
// errors  → block export (impossible values, software sanity)
// warnings → reserved (currently unused — all clinical guidance via CDS)

export function validateTPNInputs(inputs) {
  const errors   = [];
  const warnings = [];

  const bw          = parseFloat(inputs.bw);
  const heparinConc = parseFloat(inputs.heparinConc);

  // ── Body weight — software sanity (not a PediNAT clinical limit) ────────
  if (!isNaN(bw)) {
    if (bw < 0.3)  errors.push(`BW ${bw} kg is below 0.3 kg — please verify the entered value.`);
    if (bw > 20)   errors.push(`BW ${bw} kg exceeds 20 kg — this calculator is for neonatal/pediatric use only.`);
  }

  // ── Heparin concentration — institutional safety limit ───────────────────
  if (!isNaN(heparinConc)) {
    if (heparinConc < 0)   errors.push(`Heparin concentration cannot be negative.`);
    if (heparinConc > 1.0) errors.push(`Heparin ${heparinConc} IU/ml exceeds maximum (1.0 IU/ml).`);
  }

  return { errors, warnings };
}
