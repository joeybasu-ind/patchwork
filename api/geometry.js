// api/geometry.js
// Fetches the full polygon geometry for a single parcel by its OBJECTID.
// Called only when a user clicks a parcel — keeps the initial search fast.

import { ARCGIS_ENDPOINTS } from './parcels.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { objectId, county = 'Hamilton' } = req.body
  if (!objectId) return res.status(400).json({ error: 'objectId is required' })

  const url = ARCGIS_ENDPOINTS[county] || ARCGIS_ENDPOINTS.Hamilton

  const params = new URLSearchParams({
    f: 'geojson',
    where: `OBJECTID = ${objectId}`,
    outFields: 'OBJECTID',
    returnGeometry: 'true',
    outSR: '4326',
  })

  try {
    const response = await fetch(`${url}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) throw new Error(`ArcGIS returned ${response.status}`)
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)

    const feature = data.features?.[0]
    if (!feature) return res.status(200).json({ geometry: null })

    return res.status(200).json({ geometry: feature.geometry })
  } catch (err) {
    console.warn('[geometry] fetch failed:', err.message)
    return res.status(200).json({ geometry: null })
  }
}
