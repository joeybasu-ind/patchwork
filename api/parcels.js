// api/parcels.js
// Queries ArcGIS with returnGeometry=false + returnCentroid=true for speed.
// Full polygon geometry is fetched on demand via /api/geometry when a parcel is selected.

import { getMockParcels } from './mock-data.js'

export const ARCGIS_ENDPOINTS = {
  // FeatureServer for fast bbox search (returnCentroid supported)
  Hamilton: 'https://gis1.hamiltoncounty.in.gov/arcgis/rest/services/HamCoParcelsPublic/FeatureServer/0/query',
  Boone: 'https://gis.boonecounty.in.gov/arcgis/rest/services/Parcels/FeatureServer/0/query',
  Tippecanoe: 'https://gis.tippecanoe.in.gov/arcgis/rest/services/Parcels/MapServer/0/query',
  Monroe: 'https://gishub-monroegis.hub.arcgis.com/datasets/MonroeGIS::parcels/FeatureServer/0/query',
  statewide: 'https://gisdata.in.gov/server/rest/services/Hosted/Indiana_Parcels/FeatureServer/0/query',
}

const LAT_DEG_PER_MILE = 1 / 69.0

function buildBbox(lat, lng, radiusMiles) {
  const latDelta = radiusMiles * LAT_DEG_PER_MILE
  const lngDelta = radiusMiles * LAT_DEG_PER_MILE / Math.cos((lat * Math.PI) / 180)
  return { xmin: lng - lngDelta, ymin: lat - latDelta, xmax: lng + lngDelta, ymax: lat + latDelta }
}

function get(props, ...keys) {
  for (const k of keys) {
    if (props[k] !== undefined && props[k] !== null && props[k] !== '') return props[k]
  }
  return null
}

function haversine(lat1, lng1, lat2, lng2) {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeZoning(raw) {
  if (!raw) return 'C2'
  const u = String(raw).toUpperCase()
  if (u.includes('MU') || u.includes('MIXED')) return 'MU'
  if (u.includes('I2') || u.includes('M2') || u.includes('HEAVY IND')) return 'I2'
  if (u.includes('I1') || u.includes('M1') || u.includes('LIGHT IND') || u.includes('FLEX')) return 'I1'
  if (u.includes('C1') || u.includes('B1') || u.includes('NB') || u.includes('NEIGHBORHOOD')) return 'C1'
  if (/C2|B2|B3|GB|GC|GENERAL|COMMERCIAL|RETAIL|BUSINESS/.test(u)) return 'C2'
  return 'C2'
}

function deriveType(zoning, attrs) {
  const use = get(attrs, 'LAND_USE', 'USE_DESC', 'PROP_CLASS_DESC', 'PROP_USE') || ''
  if (/INDUSTRIAL|WAREHOUSE|FLEX|MFG/i.test(use)) return zoning === 'I2' ? 'Heavy Industrial' : 'Light Industrial / Flex'
  if (/MIXED/i.test(use)) return 'Mixed-Use'
  if (/RETAIL|STORE|SHOP/i.test(use)) return 'Retail / Commercial'
  if (/OFFICE/i.test(use)) return 'Office / Professional'
  const map = { C1: 'Neighborhood Commercial', C2: 'General Commercial', MU: 'Mixed-Use', I1: 'Light Industrial / Flex', I2: 'Heavy Industrial' }
  return map[zoning] || 'Commercial'
}

// ArcGIS f=json format: feature.attributes + feature.centroid (when returnCentroid=true)
function normalizeFeature(feature, index, anchorLat, anchorLng) {
  const attrs = feature.attributes || {}

  // Centroid comes from the ArcGIS returnCentroid param — {x: lng, y: lat}
  const cx = feature.centroid
  const lat = cx ? cx.y : null
  const lng = cx ? cx.x : null

  // Hamilton County ProVal field names + generic fallbacks for other counties
  const rawAddress = get(attrs, 'LOCADDRESS', 'SITUS_ADDRESS', 'ADDRESS', 'PROP_ADDR', 'SITE_ADDRESS') || 'Address on file'
  const rawCity = get(attrs, 'LOCCITY', 'SITUS_CITY', 'CITY', 'PROP_CITY') || 'Indiana'
  const rawOwner = get(attrs, 'OWNNAME', 'DEEDEDOWNR', 'OWNER', 'OWNER_NAME', 'OWNER1', 'GRANTEE_NAME') || 'Owner of record'
  const assessed = parseFloat(get(attrs, 'AVTOTGROSS', 'AV_TOTAL', 'ASSESSED_VALUE', 'TOTAL_AV', 'NET_AV') || 0) || null
  const rawZoning = get(attrs, 'PROPUSE', 'ZONE_CODE', 'ZONING', 'ZONING_CODE', 'ZONE', 'CURRENT_ZONE') || ''
  const acres = parseFloat(get(attrs, 'DEEDACRES', 'ACRES', 'ACREAGE', 'CALC_ACRES', 'GIS_ACRES') || 0)
  const objectId = get(attrs, 'OBJECTID', 'FID', 'OID') || index
  const parcelNo = get(attrs, 'FMTPRCLNO', 'PARCEL_NO', 'PARCEL_ID', 'PARCEL_NUMBER', 'APN', 'PIN') || `parcel-${objectId}`
  const lastSalePrice = parseFloat(get(attrs, 'SALE_PRICE', 'LAST_SALE_PRICE', 'DEED_AMOUNT', 'TRANSFER_PRICE') || 0) || null
  const lastSaleDate = get(attrs, 'LSTXFRDATE', 'SALE_DATE', 'LAST_SALE_DATE', 'DEED_DATE', 'TRANSFER_DATE')
  const sqftComm = parseInt(get(attrs, 'sq_ft_comm', 'SQ_FT_COMM') || 0) || null
  const yearBuilt = get(attrs, 'year_built', 'YEAR_BUILT') || null
  const propertyReportUrl = get(attrs, 'PROPERTYREPORT') || null
  const ownerAddr = [
    get(attrs, 'OWNADDRESS', 'OWNER_ADDRESS', 'MAIL_ADDRESS'),
    get(attrs, 'OWNCITY'),
    get(attrs, 'OWNSTATE'),
    get(attrs, 'OWNZIP'),
  ].filter(Boolean).join(', ') || null

  const zoning = normalizeZoning(rawZoning)
  const lastSaleYear = lastSaleDate ? new Date(lastSaleDate).getFullYear() : null
  const holdingYears = lastSaleYear ? new Date().getFullYear() - lastSaleYear : null
  const city = rawCity.replace(/,?\s*IN\s*\d*/i, '').trim()

  let tag = null
  if (anchorLat && anchorLng && lat && lng) {
    const dist = haversine(anchorLat, anchorLng, lat, lng)
    tag = `${dist.toFixed(1)} mi from anchor`
  }

  return {
    id: String(parcelNo),
    objectId: String(objectId),
    lat, lng,
    address: rawAddress,
    city: city ? `${city}, IN` : 'Indiana',
    type: deriveType(zoning, attrs),
    zoning,
    acres: acres > 0 ? parseFloat(acres.toFixed(2)) : null,
    sqft: sqftComm || (acres > 0 ? Math.round(acres * 43560) : null),
    assessed, lastSale: lastSalePrice, lastSaleYear, capRate: null,
    yearBuilt, propertyReportUrl,
    tag, highlight: null, badge: null,
    owner: {
      entity: rawOwner,
      type: rawOwner.toUpperCase().includes('LLC') ? 'Indiana LLC'
        : rawOwner.toUpperCase().includes('TRUST') ? 'Indiana Trust'
        : rawOwner.toUpperCase().includes('INC') ? 'Indiana Corporation'
        : 'Owner of record',
      principal: null, agent: null, address: ownerAddr, holdingYears,
      sosUrl: `https://bsd.sos.in.gov/PublicBusinessSearch/BusinessSearch?searchValue=${encodeURIComponent(rawOwner)}`,
    },
    geometry: null,
  }
}

async function queryArcGIS(url, bbox, maxFeatures = 25) {
  const geometry = JSON.stringify({
    xmin: bbox.xmin, ymin: bbox.ymin, xmax: bbox.xmax, ymax: bbox.ymax,
    spatialReference: { wkid: 4326 },
  })

  const params = new URLSearchParams({
    f: 'json',            // faster than geojson
    where: '1=1',
    geometry,
    geometryType: 'esriGeometryEnvelope',
    spatialRel: 'esriSpatialRelIntersects',
    outFields: '*',
    returnGeometry: 'false',   // skip polygon data — much faster
    returnCentroid: 'true',    // just the center point for pin placement
    outSR: '4326',
    resultRecordCount: String(maxFeatures),
  })

  const fullUrl = `${url}?${params.toString()}`
  console.log('[parcels] querying (centroid-only):', url.slice(0, 60))

  const response = await fetch(fullUrl, { headers: { Accept: 'application/json' } })
  console.log('[parcels] status:', response.status)
  if (!response.ok) throw new Error(`ArcGIS returned ${response.status}`)

  const data = await response.json()
  if (data.error) throw new Error(data.error.message || 'ArcGIS error')
  console.log('[parcels] features:', data.features?.length ?? 0)
  return data.features || []
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { lat, lng, radiusMiles = 1.5, county = 'Hamilton' } = req.body
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng are required' })

  const bbox = buildBbox(lat, lng, radiusMiles)
  let features = []

  const primaryUrl = ARCGIS_ENDPOINTS[county] || ARCGIS_ENDPOINTS.statewide
  const fallbackUrl = ARCGIS_ENDPOINTS.statewide

  try {
    features = await queryArcGIS(primaryUrl, bbox)
  } catch (err) {
    console.warn(`Primary ArcGIS (${county}) failed:`, err.message)
  }

  if (features.length === 0 && primaryUrl !== fallbackUrl) {
    try {
      features = await queryArcGIS(fallbackUrl, bbox)
    } catch (err) {
      console.warn('Statewide fallback failed:', err.message)
    }
  }

  const parcels = features
    .map((f, i) => normalizeFeature(f, i, lat, lng))
    .filter(p => p.lat && p.lng)
    .slice(0, 20)

  if (parcels.length === 0) {
    console.log('[parcels] using demo fallback for county:', county)
    const mock = getMockParcels(county)
    return res.status(200).json({ parcels: mock, count: mock.length, bbox, _demo: true })
  }

  return res.status(200).json({ parcels, count: parcels.length, bbox })
}
