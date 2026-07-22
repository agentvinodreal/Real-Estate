/** Format a plain rupee number into a readable label, e.g. 13500000 → "₹1.35 Cr". */
export function formatInr(value: number): string {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`
  if (value >= 100000) return `₹${(value / 100000).toFixed(2).replace(/\.00$/, '')} L`
  return `₹${value.toLocaleString('en-IN')}`
}

/** Price per sq ft, formatted with Indian digit grouping. */
export function pricePerSqft(priceInr: number, areaSqft: number): string {
  if (!areaSqft) return '—'
  return `₹${Math.round(priceInr / areaSqft).toLocaleString('en-IN')}/sq ft`
}

export function statusLabel(status: string): string {
  if (status === 'under_construction') return 'Under construction'
  if (status === 'available') return 'Available (Plot/Land)'
  return 'Ready to move'
}
