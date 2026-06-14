import React, { useState, useCallback, useRef } from 'react'
import Header from './components/Header.jsx'
import Landing from './components/Landing.jsx'
import MapView from './components/MapView.jsx'
import CardPanel from './components/CardPanel.jsx'
import ResultStrip from './components/ResultStrip.jsx'

const DEFAULT_CENTER = { lat: 39.9784, lng: -86.118 }
const DEFAULT_ZOOM = 12

export default function App() {
  const [view, setView] = useState('landing') // 'landing' | 'results'
  const [query, setQuery] = useState('')
  const [interpretation, setInterpretation] = useState('')
  const [parcels, setParcels] = useState([])
  const [anchor, setAnchor] = useState(null)
  const [center, setCenter] = useState(DEFAULT_CENTER)
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [error, setError] = useState(null)
  const [loadingParcels, setLoadingParcels] = useState(false)
  const [isDemo, setIsDemo] = useState(false)
  const [currentCounty, setCurrentCounty] = useState('Hamilton')
  const geometryCache = useRef({}) // parcelId → GeoJSON geometry

  const handleSearch = useCallback(async (q) => {
    setError(null)
    setIsDemo(false)
    setQuery(q)

    try {
      // Step 1 — interpret the natural language query
      const interpRes = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      if (!interpRes.ok) throw new Error('Failed to interpret query')
      const params = await interpRes.json()

      // Step 2 — show results view immediately with interpretation
      setInterpretation(params.interpretation || q)
      setCenter({ lat: params.lat, lng: params.lng })
      setZoom(params.zoom || 14)
      if (params.anchorLabel) {
        setAnchor({ lat: params.lat, lng: params.lng, label: params.anchorLabel, color: params.anchorColor || '#f59e0b' })
      } else {
        setAnchor(null)
      }
      setSelectedParcel(null)
      setParcels([])
      setView('results')
      setLoadingParcels(true)
      geometryCache.current = {}

      // Step 3 — query ArcGIS for real parcels
      try {
        const parcelRes = await fetch('/api/parcels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lat: params.lat,
            lng: params.lng,
            radiusMiles: params.radiusMiles || 1.5,
            zoningTypes: params.zoningTypes || [],
            county: params.county || 'Hamilton',
          }),
        })
        if (!parcelRes.ok) throw new Error('Failed to fetch parcels')
        const data = await parcelRes.json()
        setParcels(data.parcels || [])
        setIsDemo(!!data._demo)
        setCurrentCounty(params.county || 'Hamilton')
      } catch (parcelErr) {
        console.warn('Parcel fetch failed:', parcelErr.message)
      } finally {
        setLoadingParcels(false)
      }
    } catch (err) {
      setError(err.message)
      setLoadingParcels(false)
    }
  }, [])

  const handleSelectParcel = useCallback(async (parcel) => {
    setSelectedParcel(parcel)

    // Skip geometry fetch for demo/mock parcels or if already cached
    if (parcel._mock || !parcel.objectId) return
    if (geometryCache.current[parcel.id]) {
      setSelectedParcel(p => p?.id === parcel.id ? { ...p, geometry: geometryCache.current[parcel.id] } : p)
      return
    }

    try {
      const res = await fetch('/api/geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ objectId: parcel.objectId, parcelNo: parcel.id, county: currentCounty }),
      })
      const data = await res.json()
      const update = {}
      if (data.geometry) {
        geometryCache.current[parcel.id] = data.geometry
        update.geometry = data.geometry
      }
      if (data.enrichment) {
        const e = data.enrichment
        if (e.assessed) update.assessed = e.assessed
        if (e.acres) update.acres = e.acres
        if (e.sqft) update.sqft = e.sqft
        if (e.yearBuilt) update.yearBuilt = e.yearBuilt
        if (e.lastSaleYear) update.lastSaleYear = e.lastSaleYear
        if (e.propertyReportUrl) update.propertyReportUrl = e.propertyReportUrl
        if (e.owner) {
          update.owner = { ...parcel.owner, ...e.owner }
        }
      }
      if (Object.keys(update).length > 0) {
        setSelectedParcel(p => p?.id === parcel.id ? { ...p, ...update } : p)
        if (update.geometry) {
          setParcels(ps => ps.map(p => p.id === parcel.id ? { ...p, geometry: update.geometry } : p))
        }
      }
    } catch (err) {
      console.warn('[geometry] fetch failed:', err.message)
    }
  }, [currentCounty])

  const handleNewSearch = () => {
    setView('landing')
    setQuery('')
    setInterpretation('')
    setParcels([])
    setSelectedParcel(null)
    setAnchor(null)
    setError(null)
  }

  return (
    <>
      <Header showBackButton={view === 'results'} onNewSearch={handleNewSearch} />

      {view === 'landing' && (
        <Landing onSearch={handleSearch} />
      )}

      {view === 'results' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Search strip */}
          <div style={{ padding: '10px 18px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: '#161b2e', border: '1px solid #2a2f42', borderRadius: 10, padding: '7px 14px', gap: 8, minWidth: 260 }}>
              <span style={{ opacity: 0.5 }}>🔍</span>
              <span style={{ fontSize: 13, color: '#e8eaf0' }}>{query}</span>
            </div>
            <div style={{ fontSize: 11, color: '#7c8499', flex: 1, lineHeight: 1.5, borderLeft: '1px solid #1e2130', paddingLeft: 14 }}>
              <strong style={{ color: '#e8925a' }}>Patchwork: </strong>
              {interpretation || 'Searching…'}
            </div>
          </div>

          {error && (
            <div style={{ padding: '10px 18px', background: '#1a0a0a', borderBottom: '1px solid #3a1a1a', fontSize: 12, color: '#f87171' }}>
              ⚠️ {error} — results may be limited
            </div>
          )}
          {isDemo && !error && (
            <div style={{ padding: '8px 18px', background: '#1a1408', borderBottom: '1px solid #2a2010', fontSize: 11, color: '#c2692a', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⚡</span> County GIS servers unavailable — showing representative demo parcels for this market
            </div>
          )}

          {/* Map + card row */}
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <MapView
              center={center}
              zoom={zoom}
              parcels={parcels}
              anchor={anchor}
              selectedId={selectedParcel?.id}
              onSelect={handleSelectParcel}
            />
            {selectedParcel && (
              <CardPanel
                parcel={selectedParcel}
                onClose={() => setSelectedParcel(null)}
              />
            )}
          </div>

          {/* Parcels loading / empty state */}
          {loadingParcels && (
            <div style={{ borderTop: '1px solid #1e2130', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, background: '#0e0f0d', fontSize: 12, color: '#7c8499' }}>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Fetching parcel data from county ArcGIS…
            </div>
          )}
          {!loadingParcels && parcels.length === 0 && !error && view === 'results' && (
            <div style={{ borderTop: '1px solid #1e2130', padding: '14px 18px', background: '#0e0f0d', fontSize: 12, color: '#7c8499' }}>
              No parcels returned for this area — the county GIS server may be unavailable. Try a different search or check back later.
            </div>
          )}

          {parcels.length > 0 && (
            <ResultStrip
              parcels={parcels}
              selectedId={selectedParcel?.id}
              onSelect={handleSelectParcel}
            />
          )}
        </div>
      )}
    </>
  )
}
