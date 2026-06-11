// api/parcels.js
// Vercel serverless function — queries ArcGIS FeatureServer with a bounding box
// derived from the interpreted search params. Returns normalized parcel objects.
// Falls back to curated demo data when live GIS servers are unavailable.

import { getMockParcels } from './mock-data.js'

const ARCGIS_ENDPOINTS = {
  Hamilton: 'https://gis1.hamiltoncounty.in.gov/arcgis/rest/services/HamCoParcelsPublic/FeatureServer/0/query',
  // County-specific endpoints
  Boone: 'https://gis.boonecounty.in.gov/arcgis/rest/services/Parcels/FeatureServer/0/query',
  Tippecanoe: 'https://gis.tippecanoe.in.gov/arcgis/rest/services/Parcels/MapServer/0/query',
  Monroe: 'https://gishub-monroegis.hub.arcgis.com/datasets/MonroeGIS::parcels/FeatureServer/0/query',
  // Indiana statewide fallback (IGO hosted service)
  statewide: 'https://gisdata.in.gov/server/rest/services/Hosted/Indiana_Parcels/FeatureServer/0/query',
}

// Degrees of latitude per mile (approximate)
const LAT_DEG_PER_MILE = 1 / 69.0

function buildBbox(lat, lng, radiusMiles) {
  const latDelta = radiusMiles * LAT_DEG_PER_MILE
  const lngDelta = radiusMiles * LAT_DEG_PER_MILE / Math.cos((lat * Math.PI) / 180)
  return {
    xmin: lng - lngDelta,
    ymin: lat - latDelta,
    xmax: lng + lngDelta,
    ymax: lat + latDelta,
  }
}

function get(props, ...keys) {
  for (const k of keys) {
    if (props[k] !== undefined && props[k] !== null && props[k] !== '') return props[k]
  }
  return null
}

function centroid(geom) {
  if (!geom) return { lat: null, lng: null }
  let ring
  if (geom.type === 'Point') return { lat: geom.coordinates[1], lng: geom.coordinates[0] }
  if (geom.type === 'Polygon') ring = geom.coordinates[0]
  else if (geom.type === 'MultiPolygon') ring = geom.coordinates[0][0]
  else return { lat: null, lng: null }
  if (!ring || ring.length === 0) return { lat: null, lng: null }
  const sumLng = ring.reduce((s, c) => s + c[0], 0) / ring.length
  const sumLat = ring.reduce((s, c) => s + c[1], 0) / ring.length
  return { lat: sumLat, lng: sumLng }
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeZoning(raw) {
  if (!raw) return 'C2'
  const u = String(raw).toUpperCase()
  if (u.includes('MU') || u.includes('MIXED')) return 'MU'
  if (u.includes('I2') || u.includes('M2') || u.includes('HEAVY IND')) return 'I2'
  if (u.includes('I1') || u.includes('M1') || u.includes('LIGHT IND') || u.includes('FLEX')) return 'I1'
  if (u.includes('C1') || u.includes('B1') || u.includes('NB') || u.includes('NEIGHBORHOOD')) return 'C1'
  // Broad commercial match last
  if (/C2|B2|B3|GB|GC|GENERAL|COMMERCIAL|RETAIL|BUSINESS/.test(u)) return 'C2'
  return 'C2'
}

function deriveType(zoning, props) {
  const use = get(props, 'LAND_USE', 'USE_DESC', 'PROP_CLASS_DESC', 'PROP_USE') || ''
  if (/INDUSTRIAL|WAREHOUSE|FLEX|MFG/i.test(use)) return zoning === 'I2' ? 'Heavy Industrial' : 'Light Industrial / Flex'
  if (/MIXED/i.test(use)) return 'Mixed-Use'
  if (/RETAIL|STORE|SHOP/i.test(use)) return 'Retail / Commercial'
  if (/OFFICE/i.test(use)) return 'Office / Professional'
  const map = { C1: 'Neighborhood Commercial', C2: 'General Commercial', MU: 'Mixed-Use', I1: 'Light Industrial / Flex', I2: 'Heavy Industrial' }
  return map[zoning] || 'Commercial'
}

function normalizeParcel(feature, index, anchorLat, anchorLng) {
  const props = feature.properties || {}
  const geom = feature.geometry
  const { lat, lng } = centroid(geom)

  const rawAddress = get(props, 'SITUS_ADDRESS', 'ADDRESS', 'PROP_ADDR', 'SITE_ADDRESS', 'SITUS_ADDR', 'LOCATION_ADDRESS') || 'Address on file'
  const rawCity = get(props, 'SITUS_CITY', 'CITY', 'PROP_CITY', 'SITUS_CITY_STATE') || 'Indiana'
  const rawOwner = get(props, 'OWNER', 'OWNER_NAME', 'OWNER1', 'GRANTEE_NAME', 'TAX_NAME', 'OWNER_FULL') || 'Owner of record'
  const assessed = parseFloat(get(props, 'AV_TOTAL', 'ASSESSED_VALUE', 'TOTAL_AV', 'AV', 'NET_AV', 'ASSD_TOTAL') || 0) || null
  const rawZoning = get(props, 'ZONE_CODE', 'ZONING', 'ZONING_CODE', 'ZONE', 'CURRENT_ZONE', 'ZONING_CLASS') || ''
  const acres = parseFloat(get(props, 'ACRES', 'ACREAGE', 'CALC_ACRES', 'GIS_ACRES', 'SHAPE_AREA') || 0)
  const parcelNo = get(props, 'PARCEL_NO', 'PARCEL_ID', 'PARCEL_NUMBER', 'APN', 'PIN', 'OBJECTID') || `parcel-${index}`
  const lastSalePrice = parseFloat(get(props, 'SALE_PRICE', 'LAST_SALE_PRICE', 'DEED_AMOUNT', 'TRANSFER_PRICE', 'SELL_PRICE') || 0) || null
  const lastSaleDate = get(props, 'SALE_DATE', 'LAST_SALE_DATE', 'DEED_DATE', 'TRANSFER_DATE', 'SELL_DATE')
  const ownerAddr = get(props, 'OWNER_ADDRESS', 'OWNER_ADDR', 'MAIL_ADDRESS', 'MAIL_ADDR') || null

  const zoning = normalizeZoning(rawZoning)
  const lastSaleYear = lastSaleDate ? new Date(lastSaleDate).getFullYear() : null
  const holdingYears = lastSaleYear ? new Date().getFullYear() - lastSaleYear : null

  // Build distance tag
  let tag = null
  if (anchorLat && anchorLng && lat && lng) {
    const dist = haversine(anchorLat, anchorLng, lat, lng)
    tag = `${dist.toFixed(1)} mi from anchor`
  }

  // Normalize city string — strip state if already included
  const city = rawCity.replace(/,?\s*IN\s*\d*/i, '').trim()

  return {
    id: String(parcelNo),
    lat,
    lng,
    address: rawAddress,
    city: city ? `${city}, IN` : 'Indiana',
    type: deriveType(zoning, props),
    zoning,
    acres: acres > 0 ? parseFloat(acres.toFixed(2)) : null,
    sqft: acres > 0 ? Math.round(acres * 43560) : null,
    assessed,
    lastSale: lastSalePrice,
    lastSaleYear,
    capRate: null,
    tag,
    highlight: null, // filled by /api/synthesize if needed, or left null
    badge: null,
    owner: {
      entity: rawOwner,
      type: rawOwner.toUpperCase().includes('LLC') ? 'Indiana LLC'
        : rawOwner.toUpperCase().includes('TRUST') ? 'Indiana Trust'
        : rawOwner.toUpperCase().includes('INC') ? 'Indiana Corporation'
        : 'Owner of record',
      principal: null,
      agent: null,
      address: ownerAddr,
      holdingYears,
      sosUrl: `https://bsd.sos.in.gov/PublicBusinessSearch/BusinessSearch?searchValue=${encodeURIComponent(rawOwner)}`,
    },
    geometry: geom,
    rawProps: props, // pass through for debugging
  }
}

async function queryArcGIS(url, bbox, zoningTypes, maxFeatures = 20) {
  const geometry = JSON.stringify({
    xmin: bbox.xmin, ymin: bbox.ymin,
    xmax: bbox.xmax, ymax: bbox.ymax,
    spatialReference: { wkid: 4326 },
  })

  const params = new URLSearchParams({
    f: 'geojson',
    where: '1=1',
    geometry,
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: String(maxFeatures),
  })

  const fullUrl = `${url}?${params.toString()}`
  console.log('[parcels] querying:', fullUrl.slice(0, 120))

  const response = await fetch(fullUrl, {
    headers: { 'Accept': 'application/json' },
  })

  console.log('[parcels] status:', response.status, url.slice(0, 60))
  if (!response.ok) throw new Error(`ArcGIS returned ${response.status}`)

  const data = await response.json()
  console.log('[parcels] features:', data.features?.length ?? 0, '| error:', data.error?.message ?? 'none')
  if (data.error) throw new Error(data.error.message || 'ArcGIS error')
  return data.features || []
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { lat, lng, radiusMiles = 1.5, zoningTypes = [], county = 'Hamilton' } = req.body
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' })

  const bbox = buildBbox(lat, lng, radiusMiles)
  let features = []

  // Try county-specific endpoint first (Hamilton has best data)
  const primaryUrl = ARCGIS_ENDPOINTS[county] || ARCGIS_ENDPOINTS.statewide
  const fallbackUrl = ARCGIS_ENDPOINTS.statewide

  try {
    features = await queryArcGIS(primaryUrl, bbox, zoningTypes)
  } catch (err) {
    console.warn(`Primary ArcGIS (${county}) failed:`, err.message)
  }

  // Fall back to statewide if we got nothing and weren't already using it
  if (features.length === 0 && primaryUrl !== fallbackUrl) {
    try {
      features = await queryArcGIS(fallbackUrl, bbox, zoningTypes)
    } catch (err) {
      console.warn('Statewide ArcGIS fallback failed:', err.message)
    }
  }

  // Filter to only parcels with a usable centroid
  const parcels = features
    .map((f, i) => normalizeParcel(f, i, lat, lng))
    .filter(p => p.lat && p.lng)
    .slice(0, 20)

  // Fall back to curated demo data if live GIS returned nothing
  if (parcels.length === 0) {
    console.log('[parcels] using demo fallback for county:', county)
    const mock = getMockParcels(county)
    return res.status(200).json({ parcels: mock, count: mock.length, bbox, _demo: true })
  }

  return res.status(200).json({ parcels, count: parcels.length, bbox })
}
