// api/geometry.js
// On parcel click: fetches polygon geometry AND ProVal assessment data in parallel.

const GEOMETRY_ENDPOINTS = {
  Hamilton: 'https://gis1.hamiltoncounty.in.gov/arcgis/rest/services/HamCoParcelsPublic/FeatureServer/0/query',
}

const PROVAL_ENDPOINT = 'https://gis1.hamiltoncounty.in.gov/arcgis/rest/services/ProVal/ProValMap/MapServer/0/query'

const PROVAL_FIELDS = [
  'FMTPRCLNO','OWNNAME','OWNADDRESS','OWNCITY','OWNSTATE','OWNZIP',
  'AVTOTGROSS','DEEDACRES','PROPUSE','LSTXFRDATE','sq_ft_comm','year_built',
  'PROPERTYREPORT','OBJECTID',
].join(',')

async function fetchGeometry(objectId, county) {
  const url = GEOMETRY_ENDPOINTS[county] || GEOMETRY_ENDPOINTS.Hamilton
  const params = new URLSearchParams({
    f: 'geojson',
    where: `OBJECTID = ${objectId}`,
    outFields: 'OBJECTID',
    returnGeometry: 'true',
    outSR: '4326',
  })
  const res = await fetch(`${url}?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  return data.features?.[0]?.geometry || null
}

async function fetchProVal(parcelNo) {
  // Only available for Hamilton County
  const params = new URLSearchParams({
    f: 'json',
    where: `FMTPRCLNO = '${parcelNo.replace(/'/g, "''")}'`,
    outFields: PROVAL_FIELDS,
    returnGeometry: 'false',
  })
  const res = await fetch(`${PROVAL_ENDPOINT}?${params}`, { headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const data = await res.json()
  const attrs = data.features?.[0]?.attributes
  if (!attrs) return null

  const assessed = parseFloat(attrs.AVTOTGROSS || 0) || null
  const acres = parseFloat(attrs.DEEDACRES || 0) || null
  const lastSaleDate = attrs.LSTXFRDATE
  const lastSaleYear = lastSaleDate ? new Date(lastSaleDate).getFullYear() : null
  const holdingYears = lastSaleYear ? new Date().getFullYear() - lastSaleYear : null

  const ownerAddr = [attrs.OWNADDRESS, attrs.OWNCITY, attrs.OWNSTATE, attrs.OWNZIP]
    .filter(Boolean).join(', ') || null

  return {
    assessed,
    acres: acres ? parseFloat(acres.toFixed(2)) : null,
    sqft: parseInt(attrs.sq_ft_comm || 0) || null,
    yearBuilt: attrs.year_built || null,
    lastSaleYear,
    propertyReportUrl: attrs.PROPERTYREPORT || null,
    owner: {
      entity: attrs.OWNNAME || null,
      address: ownerAddr,
      holdingYears,
    },
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { objectId, parcelNo, county = 'Hamilton' } = req.body
  if (!objectId) return res.status(400).json({ error: 'objectId is required' })

  // Fetch geometry and ProVal data in parallel
  const [geometry, proval] = await Promise.allSettled([
    fetchGeometry(objectId, county),
    county === 'Hamilton' && parcelNo ? fetchProVal(parcelNo) : Promise.resolve(null),
  ])

  return res.status(200).json({
    geometry: geometry.status === 'fulfilled' ? geometry.value : null,
    enrichment: proval.status === 'fulfilled' ? proval.value : null,
  })
}
