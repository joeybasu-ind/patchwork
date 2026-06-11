import React, { useEffect, useRef } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { zc } from '../lib/zoning.js'

const DARK_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#0d1420' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0d1420' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#1e2a45' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#4a5568' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#253050' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0a0f1a' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#111827' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d1a0d' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1e2130' }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#5a6380' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#1e2130' }] },
]

let loaderPromise = null
function getLoader(apiKey) {
  if (!loaderPromise) {
    const loader = new Loader({ apiKey, version: 'weekly' })
    loaderPromise = loader.load()
  }
  return loaderPromise
}

function makeZoningMarkerSvg(code, selected) {
  const c = zc(code)
  const border = selected ? '#fff' : c.border
  const bg = selected ? '#fff' : '#161b2e'
  const fill = selected ? '#0f1117' : c.text
  return `<svg xmlns="http://www.w3.org/2000/svg" width="60" height="36">
    <rect x="2" y="2" width="56" height="24" rx="7" fill="${bg}" stroke="${border}" stroke-width="2"/>
    <text x="30" y="17" text-anchor="middle" font-family="Inter,sans-serif" font-size="11" font-weight="700" fill="${fill}">${code}</text>
    <line x1="30" y1="26" x2="30" y2="33" stroke="${border}" stroke-width="2"/>
    <circle cx="30" cy="34" r="3" fill="${border}"/>
  </svg>`
}

function geoJsonToGooglePaths(geometry) {
  if (!geometry) return []
  if (geometry.type === 'Polygon') {
    return geometry.coordinates.map(ring => ring.map(([lng, lat]) => ({ lat, lng })))
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.flatMap(poly => poly.map(ring => ring.map(([lng, lat]) => ({ lat, lng }))))
  }
  return []
}

export default function MapView({ center, zoom, parcels, anchor, selectedId, onSelect }) {
  const mapRef = useRef(null)
  const googleMapRef = useRef(null)
  const overlaysRef = useRef([]) // polygons or markers for parcels
  const anchorRef = useRef(null)
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY

  // Initialize map once
  useEffect(() => {
    if (!apiKey) return
    getLoader(apiKey).then(() => {
      if (googleMapRef.current) return
      googleMapRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: center.lat, lng: center.lng },
        zoom,
        styles: DARK_STYLE,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      })
    })
  }, [apiKey])

  // Re-center when center/zoom changes
  useEffect(() => {
    if (!googleMapRef.current) return
    googleMapRef.current.setCenter({ lat: center.lat, lng: center.lng })
    googleMapRef.current.setZoom(zoom)
  }, [center.lat, center.lng, zoom])

  // Render anchor label
  useEffect(() => {
    if (!googleMapRef.current) return
    if (anchorRef.current) {
      anchorRef.current.setMap(null)
      anchorRef.current = null
    }
    if (!anchor) return

    const color = anchor.color || '#f59e0b'
    const labelHtml = `<div style="background:${color}18;border:2px dashed ${color}70;border-radius:8px;padding:6px 10px;font-size:10px;font-weight:800;color:${color};white-space:nowrap;font-family:Inter,sans-serif;">${anchor.label}</div>`

    const infoWindow = new window.google.maps.InfoWindow({
      content: labelHtml,
      position: { lat: anchor.lat, lng: anchor.lng },
      disableAutoPan: true,
    })
    infoWindow.open(googleMapRef.current)
    anchorRef.current = infoWindow
  }, [anchor])

  // Render parcels as polygons or markers
  useEffect(() => {
    if (!googleMapRef.current) return

    // Clear existing overlays
    overlaysRef.current.forEach(o => o.setMap(null))
    overlaysRef.current = []

    parcels.forEach(parcel => {
      const isSelected = parcel.id === selectedId
      const c = zc(parcel.zoning)
      const paths = geoJsonToGooglePaths(parcel.geometry)

      if (paths.length > 0) {
        // Render as polygon
        const poly = new window.google.maps.Polygon({
          paths,
          strokeColor: isSelected ? '#fff' : c.border,
          strokeOpacity: 0.9,
          strokeWeight: isSelected ? 2.5 : 1.5,
          fillColor: isSelected ? c.border : c.bg.replace('22', ''),
          fillOpacity: isSelected ? 0.35 : 0.2,
          map: googleMapRef.current,
          zIndex: isSelected ? 10 : 1,
        })
        poly.addListener('click', () => onSelect(parcel))
        poly.addListener('mouseover', () => {
          if (parcel.id !== selectedId) {
            poly.setOptions({ fillOpacity: 0.3, strokeOpacity: 1 })
          }
        })
        poly.addListener('mouseout', () => {
          if (parcel.id !== selectedId) {
            poly.setOptions({ fillOpacity: 0.2, strokeOpacity: 0.9 })
          }
        })
        overlaysRef.current.push(poly)
      }

      // Always add a zoning label marker at centroid using classic Marker
      if (parcel.lat && parcel.lng) {
        const svg = makeZoningMarkerSvg(parcel.zoning, isSelected)
        const encoded = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg)
        const marker = new window.google.maps.Marker({
          map: googleMapRef.current,
          position: { lat: parcel.lat, lng: parcel.lng },
          icon: { url: encoded, scaledSize: new window.google.maps.Size(60, 36), anchor: new window.google.maps.Point(30, 36) },
          zIndex: isSelected ? 20 : 5,
        })
        marker.addListener('click', () => onSelect(parcel))
        overlaysRef.current.push(marker)
      }
    })
  }, [parcels, selectedId])

  return (
    <div
      ref={mapRef}
      style={{ flex: 1, background: '#0d1420', position: 'relative' }}
    >
      {!apiKey && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#7c8499', fontSize: 13, flexDirection: 'column', gap: 8,
        }}>
          <div>⚠️ VITE_GOOGLE_MAPS_KEY not set</div>
          <div style={{ fontSize: 11 }}>Add it to your .env file and restart</div>
        </div>
      )}
    </div>
  )
}
