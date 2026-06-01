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
