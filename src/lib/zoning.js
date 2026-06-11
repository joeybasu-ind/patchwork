export const ZONING_COLORS = {
  C1: { bg: '#7c3aed22', border: '#7c3aed', text: '#a78bfa' },
  C2: { bg: '#4f8ef722', border: '#4f8ef7', text: '#93c5fd' },
  MU: { bg: '#22c55e22', border: '#22c55e', text: '#86efac' },
  I1: { bg: '#f59e0b22', border: '#f59e0b', text: '#fcd34d' },
  I2: { bg: '#ef444422', border: '#ef4444', text: '#fca5a5' },
}

export const ZONING_TIPS = {
  C1: {
    title: 'C1 — Neighborhood Commercial',
    desc: 'Small-scale retail and services for nearby residents. Think coffee shop, nail salon, or small deli. Lower traffic, smaller buildings than C2.',
    eg: 'e.g. Corner pharmacy, dry cleaner, local pizza place',
  },
  C2: {
    title: 'C2 — General Commercial',
    desc: 'The most common commercial zoning. Allows most retail, restaurants, and offices. Higher traffic and larger buildings than C1.',
    eg: 'e.g. Strip mall, chain restaurant, medical office',
  },
  MU: {
    title: 'MU — Mixed Use',
    desc: 'Ground-floor commercial with apartments or offices above. Common in walkable downtowns. Usually higher density and value than straight commercial.',
    eg: "e.g. Retail below, condos above — like Carmel's City Center",
  },
  I1: {
    title: 'I1 — Light Industrial',
    desc: 'Warehouses, workshops, and light manufacturing. Not heavy factory use — think fulfillment center, flex office-warehouse, or R&D space.',
    eg: 'e.g. Amazon delivery hub, contractor yard, R&D lab',
  },
  I2: {
    title: 'I2 — Heavy Industrial',
    desc: 'Large-scale manufacturing and processing. Higher noise and traffic tolerance. Often near highways or rail lines.',
    eg: 'e.g. Food processing plant, auto parts mfg, logistics hub',
  },
}

export const ZONING_DESC = {
  C1: 'Neighborhood commercial. Lower-intensity retail and service uses.',
  C2: 'General commercial. Retail, restaurant, office, and personal services permitted by right. Drive-throughs require a special use permit.',
  MU: 'Mixed-use zoning allows ground-floor commercial with residential above. Higher density permitted. Ideal for walkable urban infill.',
  I1: 'Light industrial. Permits manufacturing, warehousing, distribution, and flex uses.',
  I2: 'Heavy industrial. Broader manufacturing and processing uses permitted.',
}

export const PERMITTED_USES = {
  C1: ['Neighborhood Retail', 'Personal Services', 'Small Restaurant', 'Professional Office'],
  C2: ['Retail (no drive-through)', 'Restaurant / Food Service', 'Office / Professional Services', 'Personal Services', 'Medical / Dental Office'],
  MU: ['Ground-floor Retail', 'Restaurant', 'Residential (upper floors)', 'Office', 'Entertainment / Arts'],
  I1: ['Light Manufacturing', 'Warehousing / Distribution', 'Flex Office-Warehouse', 'R&D', 'Contractor Yard'],
  I2: ['Heavy Manufacturing', 'Processing / Assembly', 'Logistics Hub', 'Data Center', 'Utility Infrastructure'],
}

export function zc(code) {
  return ZONING_COLORS[code] || ZONING_COLORS.C2
}

// Map raw ArcGIS zone strings to our canonical codes
export function normalizeZoning(raw) {
  if (!raw) return 'C2'
  const u = String(raw).toUpperCase()
  if (u.includes('MU') || u.includes('MIXED')) return 'MU'
  if (u.includes('I2') || u.includes('M2') || u.includes('HEAVY')) return 'I2'
  if (u.includes('I1') || u.includes('M1') || u.includes('LIGHT IND')) return 'I1'
  if (u.includes('C1') || u.includes('B1') || u.includes('NEIGHBORHOOD')) return 'C1'
  if (u.includes('C2') || u.includes('B2') || u.includes('B3') || u.includes('GENERAL') || u.includes('COMMERCIAL')) return 'C2'
  return 'C2'
}

export function deriveType(zoning) {
  const map = {
    C1: 'Neighborhood Commercial',
    C2: 'General Commercial',
    MU: 'Mixed-Use',
    I1: 'Light Industrial / Flex',
    I2: 'Heavy Industrial',
  }
  return map[zoning] || 'Commercial'
}
