import React from 'react'
import { zc } from '../lib/zoning.js'
import { fmtCur } from '../lib/formatters.js'

function holdingColor(years) {
  if (!years) return '#4a5168'
  if (years > 15) return '#22c55e'
  if (years > 8) return '#f59e0b'
  return '#4a5168'
}

function ZoningBadge({ code }) {
  const c = zc(code)
  return (
    <span style={{
      background: c.bg, border: `1px solid ${c.border}`, color: c.text,
      borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 700,
    }}>
      {code}
    </span>
  )
}

export default function ResultStrip({ parcels, selectedId, onSelect }) {
  if (!parcels.length) return null

  return (
    <div style={{
      borderTop: '1px solid #1e2130', padding: '10px 14px',
      display: 'flex', gap: 10, overflowX: 'auto', flexShrink: 0,
      background: '#0e0f0d',
    }}>
      {parcels.map(p => {
        const displayValue = p.assessed || p.lastSale
        const holdYears = p.owner?.holdingYears
        const dotColor = holdingColor(holdYears)

        return (
          <div
            key={p.id}
            onClick={() => onSelect(p)}
            style={{
              background: p.id === selectedId ? '#1e1408' : '#161b2e',
              border: `1px solid ${p.id === selectedId ? '#e8925a' : '#2a2f42'}`,
              borderRadius: 10, padding: '10px 14px', minWidth: 210,
              cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => { if (p.id !== selectedId) e.currentTarget.style.borderColor = '#e8925a' }}
            onMouseLeave={e => { if (p.id !== selectedId) e.currentTarget.style.borderColor = '#2a2f42' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center', gap: 6 }}>
              <ZoningBadge code={p.zoning} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }} title={holdYears ? `Held ${holdYears} yrs` : 'Holding period unknown'} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {displayValue ? fmtCur(displayValue) : '—'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{p.address}</div>
            <div style={{ fontSize: 11, color: '#e8925a' }}>{p.tag || p.type}</div>
          </div>
        )
      })}
    </div>
  )
}
