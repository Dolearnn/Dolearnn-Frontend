/** Formats an amount in Nigerian naira, e.g. 12500 -> "₦12,500". All prices are in naira. */
export function naira(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return `₦${Math.round(Number.isFinite(amount) ? amount : 0).toLocaleString('en-NG')}`;
}
