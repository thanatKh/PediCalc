export const fmt = (n, d = 2) =>
  n === undefined || n === null || Number.isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });

// Standard display format: integer → no decimal, fractional → 1dp, null/NaN → '—'.
// Use everywhere except Fat Infusion Rate (use fmt(n, 2)).
export const fmtN = (n) => {
  if (n === undefined || n === null || Number.isNaN(n)) return '—';
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : fmt(num, 1);
};

// The 11 full-precision TPN-bag components that, with sterile water, sum to tpnVolume.
const TPN_BAG_COMPONENT_KEYS = [
  'dextroseMl', 'aminovenMl', 'na3PctMl', 'naGlyceroml', 'k15PctMl',
  'k2hpo4Ml', 'caGluconateMl', 'mgso4Ml', 'soluvitMl', 'pediatraceMl', 'heparinMl',
];

// Sterile water RECONCILED for display: it absorbs the rounding residue so the printed
// ingredient column sums exactly to the printed TPN bag total at the given decimal place.
// Display-only — results.sterileWaterMl stays full precision in the engine.
//   decimals: 1 for the PDF (fmtN granularity), 2 for the on-screen ingredients table.
export const reconciledSterileWater = (results, decimals = 1) => {
  if (!results) return null;
  const p = 10 ** decimals;
  const round = (n) => Math.round((Number(n) || 0) * p) / p;
  const total    = round(results.tpnVolume ?? results.bag2in1Vol);
  const sumComps = TPN_BAG_COMPONENT_KEYS.reduce((acc, k) => acc + round(results[k]), 0);
  return round(total - sumComps);
};
