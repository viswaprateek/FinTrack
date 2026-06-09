/** Mask a numeric display with stars — length scales slightly with magnitude for visual balance. */
export function maskAmountStars(amount: number): string {
  const n = Math.abs(Number(amount))
  if (!Number.isFinite(n) || n === 0) return '★★★★'
  const digits = Math.floor(Math.log10(n)) + 1
  const count = Math.min(8, Math.max(4, digits + 1))
  return '★'.repeat(count)
}

export function maskPercent(): string {
  return '★★%'
}
