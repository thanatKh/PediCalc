export const fmt = (n, d = 2) =>
  n === undefined || n === null || Number.isNaN(n)
    ? '—'
    : Number(n).toLocaleString('en-US', {
        minimumFractionDigits: d,
        maximumFractionDigits: d,
      });
