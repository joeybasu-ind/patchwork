import React from 'react'
import { zc } from '../lib/zoning.js'
import { fmtCur } from '../lib/formatters.js'

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
      {parcels.map(p => (
        <div
          key={p.id}
          onClick={() => onSelect(p)}
          style={{
            background: p.id === selectedId ? '#1e1408' : '#161b2e',
            border: `1px solid ${p.id === selectedId ? '#e8925a' : '#2a2f42'}`,
            borderRadius: 10, padding: '10px 14px', minWidth: 200,
            cursor: 'pointer', flexShrink: 0, transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => { if (p.id !== selectedId) e.currentTarget.style.borderColor = '#e8925a' }}
          onMouseLeave={e => { if (p.id !== selectedId) e.currentTarget.style.borderColor = '#2a2f42' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
            <ZoningBadge code={p.zoning} />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{fmtCur(p.lastSale)}</span>
          </div>
          <div style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 600, marginBottom: 2 }}>{p.address}</div>
          <div style={{ fontSize: 11, color: '#e8925a' }}>{p.tag || p.type}</div>
        </div>
      ))}
    </div>
  )
}
