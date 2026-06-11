export function fmtCur(n) {
  if (!n || n === 0) return '—'
  if (n >= 1_000_000) return '$' + (n / 1_000_000).toFixed(2) + 'M'
  if (n >= 1_000) return '$' + n.toLocaleString()
  return '$' + n
}

export function fmtAcres(n) {
  if (!n || n === 0) return '—'
  return parseFloat(n).toFixed(2) + ' ac'
}

export function fmtSqft(n) {
  if (!n || n === 0) return '—'
  return Number(n).toLocaleString() + ' sq ft'
}

// Haversine distance in miles between two lat/lng points
export function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function holdingSignal(years) {
  if (!years) return { label: 'Holding period unknown', color: '#7c8499' }
  if (years > 15) return { label: `Long-term holder (${years} yrs) — may be open to the right offer`, color: '#22c55e' }
  if (years > 8) return { label: `Mid-term holder (${years} yrs)`, color: '#f59e0b' }
  return { label: `Recent acquisition (${years} yrs) — less likely to sell`, color: '#7c8499' }
}
