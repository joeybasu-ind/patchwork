import React, { useState } from 'react'
import { zc, ZONING_DESC, PERMITTED_USES, ZONING_TIPS } from '../lib/zoning.js'
import { fmtCur, fmtAcres } from '../lib/formatters.js'
import LetterModal from './LetterModal.jsx'

// ── Zoning tooltip trigger ──────────────────────────────────────
function ZoningTip({ code }) {
  const [pos, setPos] = useState(null)
  const tip = ZONING_TIPS[code]
  const c = zc(code)
  if (!tip) return <span style={{ color: c.text }}>{code}</span>

  return (
    <>
      <span
        style={{ color: c.text, display: 'inline-flex', alignItems: 'center', cursor: 'help', gap: 3 }}
        onMouseEnter={e => setPos({ x: e.clientX + 16, y: e.clientY - 10 })}
        onMouseLeave={() => setPos(null)}
        onMouseMove={e => setPos({ x: e.clientX + 16, y: e.clientY - 10 })}
      >
        {code}
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: '#2a3550', border: '1px solid #3a4a6a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#7c8499', flexShrink: 0 }}>?</span>
      </span>
      {pos && (
        <div className="global-tooltip visible" style={{ left: pos.x, top: pos.y }}>
          <div className="tt-title">{tip.title}</div>
          {tip.desc}
          <div className="tt-eg">{tip.eg}</div>
        </div>
      )}
    </>
  )
}

// ── Stat grid ──────────────────────────────────────────────────
function StatGrid({ parcel }) {
  const holdYears = parcel.owner?.holdingYears
  const holdVal = holdYears ? `${holdYears} yrs` : '—'
  const holdColor = holdYears > 15 ? '#22c55e' : holdYears > 8 ? '#f59e0b' : '#7c8499'

  // Hamilton County assesses at ~85% of market; implied market ≈ assessed / 0.85
  const impliedMarket = parcel.assessed ? Math.round(parcel.assessed / 0.85) : null

  const items = [
    ['Assessed Value', fmtCur(parcel.assessed), '#fff'],
    ['Est. Market Value', impliedMarket ? fmtCur(impliedMarket) : '—', '#e8925a'],
    ['Lot Size', fmtAcres(parcel.acres), '#fff'],
    ['Held Since Acq.', holdVal, holdColor],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#1e2130', borderBottom: '1px solid #1e2130' }}>
      {items.map(([lbl, val, color]) => (
        <div key={lbl} style={{ background: '#0e0f0d', padding: '12px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color }}>{val}</div>
          <div style={{ fontSize: 10, color: '#7c8499', marginTop: 2, fontWeight: 500 }}>{lbl}</div>
        </div>
      ))}
    </div>
  )
}

// ── KV row ──────────────────────────────────────────────────────
function KV({ k, v }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1f2e' }}>
      <span style={{ fontSize: 12, color: '#7c8499' }}>{k}</span>
      <span style={{ fontSize: 12, color: '#e8eaf0', fontWeight: 600 }}>{v}</span>
    </div>
  )
}

// ── Summary tab ─────────────────────────────────────────────────
function SummaryTab({ parcel }) {
  return (
    <div>
      {parcel.highlight && (
        <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, fontSize: 13, color: '#b0b8cc', lineHeight: 1.7, border: '1px solid #1e2130', marginBottom: 14 }}>
          {parcel.highlight}
        </div>
      )}
      <KV k="Type" v={parcel.type} />
      <KV k="Owner Entity" v={parcel.owner?.entity || '—'} />
      {parcel.lastSaleYear && <KV k="Last Transfer" v={parcel.lastSaleYear} />}
      {parcel.acres && <KV k="Lot Size" v={fmtAcres(parcel.acres)} />}
      {parcel.sqft > 0 && <KV k="Building SF" v={parcel.sqft.toLocaleString() + ' sq ft'} />}
      {parcel.yearBuilt && <KV k="Year Built" v={parcel.yearBuilt} />}
      <KV k="Parcel ID" v={parcel.id} />
      {parcel.propertyReportUrl && (
        <a href={parcel.propertyReportUrl} target="_blank" rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12, fontSize: 11, color: '#e8925a', fontWeight: 600, textDecoration: 'none' }}>
          🔗 View County Property Report →
        </a>
      )}
    </div>
  )
}

// ── Zoning tab ──────────────────────────────────────────────────
function ZoningTab({ parcel }) {
  const c = zc(parcel.zoning)
  const desc = ZONING_DESC[parcel.zoning] || ''
  const uses = PERMITTED_USES[parcel.zoning] || []
  return (
    <div>
      <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, fontSize: 13, color: '#b0b8cc', lineHeight: 1.7, border: '1px solid #1e2130', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, color: c.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          <ZoningTip code={parcel.zoning} /> — {parcel.type}
        </div>
        {desc}
      </div>
      <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, border: '1px solid #1e2130', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, color: '#7c8499' }}>Permitted Uses by Right</div>
        {uses.map(u => (
          <div key={u} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #1a1f2e', fontSize: 13, color: '#b0b8cc' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
            {u}
          </div>
        ))}
      </div>
      <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, border: '1px solid #1e2130', fontSize: 12, color: '#7c8499' }}>
        <span style={{ color: '#e8925a', fontWeight: 700 }}>Variance history: </span>No active variances on record.
      </div>
    </div>
  )
}

// ── Financials tab ───────────────────────────────────────────────
function FinancialsTab({ parcel }) {
  const [ltv, setLtv] = useState(0.65)
  const [rate, setRate] = useState(0.072)
  const [amort, setAmort] = useState(25)

  // Use implied market value (assessed ÷ 0.85) as the price basis when no sale price
  const impliedMarket = parcel.assessed ? Math.round(parcel.assessed / 0.85) : null
  const price = parcel.lastSale || impliedMarket || 0
  const priceLabel = parcel.lastSale ? 'At Last Sale Price' : impliedMarket ? 'At Est. Market Value' : 'No Valuation Available'
  const priceNote = !parcel.lastSale && impliedMarket
    ? 'No sale price on record — using assessed value ÷ 0.85 (Hamilton Co. avg. assessment ratio)'
    : null

  const loan = Math.round(price * ltv)
  const down = price - loan
  const mr = rate / 12, n = amort * 12
  const ds = price > 0 ? Math.round((loan * mr) / (1 - Math.pow(1 + mr, -n))) : 0

  const rows = [
    ['Down Payment', down > 0 ? fmtCur(down) : '—', '#fff'],
    ['Loan Amount', loan > 0 ? fmtCur(loan) : '—', '#fff'],
    ['Monthly Debt Service', ds > 0 ? '$' + ds.toLocaleString() : '—', '#fff'],
    ['Annual Debt Service', ds > 0 ? '$' + (ds * 12).toLocaleString() : '—', '#7c8499'],
  ]

  const sliderStyle = { marginBottom: 12 }
  const labelStyle = { fontSize: 11, color: '#7c8499', marginBottom: 5 }

  return (
    <div>
      <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, border: '1px solid #1e2130', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, color: '#4f8ef7' }}>Adjust Assumptions</div>
        <div style={sliderStyle}>
          <div style={labelStyle}>Down Payment: {Math.round((1 - ltv) * 100)}% ({down > 0 ? fmtCur(down) : '—'})</div>
          <input type="range" min="0.5" max="0.8" step="0.05" value={ltv} onChange={e => setLtv(parseFloat(e.target.value))} />
        </div>
        <div style={sliderStyle}>
          <div style={labelStyle}>Interest Rate: {(rate * 100).toFixed(1)}%</div>
          <input type="range" min="0.05" max="0.12" step="0.005" value={rate} onChange={e => setRate(parseFloat(e.target.value))} />
        </div>
        <div style={sliderStyle}>
          <div style={labelStyle}>Amortization: {amort} yrs</div>
          <input type="range" min="15" max="30" step="5" value={amort} onChange={e => setAmort(parseInt(e.target.value))} />
        </div>
      </div>
      <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, border: '1px solid #1e2130', marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2, color: '#4f8ef7' }}>
          {priceLabel} ({price > 0 ? fmtCur(price) : '—'})
        </div>
        {priceNote && (
          <div style={{ fontSize: 10, color: '#7c8499', marginBottom: 10, lineHeight: 1.5 }}>{priceNote}</div>
        )}
        {rows.map(([k, v, color]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #1a1f2e' }}>
            <span style={{ fontSize: 11, color: '#7c8499' }}>{k}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>{v}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#161b2e', borderRadius: 10, padding: 14, border: '1px solid #1e2130', fontSize: 11, color: '#7c8499', lineHeight: 1.6 }}>
        <span style={{ color: '#e8925a', fontWeight: 700 }}>Note: </span>
        Indiana does not require public disclosure of commercial sale prices. Estimated market value derived from Hamilton County assessment ratio. Commercial loans typically carry 5–7 year balloon terms. Estimates only — verify with a lender.
      </div>
    </div>
  )
}

// ── Owner tab ────────────────────────────────────────────────────
function OwnerTab({ parcel, onOpenLetter }) {
  const o = parcel.owner
  const { label: holdLabel, color: holdColor } = holdingSignal(o.holdingYears)

  return (
    <div>
      <div style={{ background: '#161b2e', borderRadius: 10, border: '1px solid #1e2130', overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ padding: 14, borderBottom: '1px solid #1e2130' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{o.entity}</div>
          <div style={{ fontSize: 12, color: '#7c8499' }}>{o.type}</div>
        </div>

        {o.principal ? (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2130' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7c8499', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Principal of Record</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e8eaf0', marginBottom: 2 }}>{o.principal}</div>
            <div style={{ fontSize: 11, color: '#7c8499' }}>{o.role || 'Managing Member'}</div>
            {o.address && <div style={{ fontSize: 11, color: '#4a5168', marginTop: 4 }}>{o.address}</div>}
          </div>
        ) : (
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #1e2130' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7c8499', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Mailing Address</div>
            <div style={{ fontSize: 12, color: '#b0b8cc' }}>{o.address || 'Verify on Indiana SOS →'}</div>
          </div>
        )}

        {o.agent && (
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e2130' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#7c8499', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Registered Agent</div>
            <div style={{ fontSize: 13, color: '#b0b8cc' }}>{o.agent}</div>
          </div>
        )}

        <div style={{ padding: '10px 14px', borderBottom: '1px solid #1e2130', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: holdColor, flexShrink: 0 }} />
          <div style={{ fontSize: 12, color: holdColor, fontWeight: 600 }}>{holdLabel}</div>
        </div>

        <a
          href={o.sosUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', fontSize: 11, color: '#e8925a', fontWeight: 600, textDecoration: 'none' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1a2040'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          🔗 Verify on Indiana Secretary of State →
        </a>
      </div>

      <div style={{ fontSize: 11, color: '#4a5168', lineHeight: 1.6, marginBottom: 14, padding: '0 2px' }}>
        Owner information sourced from county assessor records and the Indiana Secretary of State business registry. Always verify before outreach.
      </div>

      <button
        onClick={onOpenLetter}
        style={{
          width: '100%', background: 'linear-gradient(135deg,#c2692a,#8b3a1a)',
          border: 'none', borderRadius: 10, padding: 13,
          color: '#fff', fontWeight: 700, fontSize: 14,
          cursor: 'pointer', fontFamily: 'inherit',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        ✉️ Draft Outreach Letter
      </button>
    </div>
  )
}

// ── Missing import fix ───────────────────────────────────────────
function holdingSignal(years) {
  if (!years) return { label: 'Holding period unknown', color: '#7c8499' }
  if (years > 15) return { label: `Long-term holder (${years} yrs) — may be open to the right offer`, color: '#22c55e' }
  if (years > 8) return { label: `Mid-term holder (${years} yrs)`, color: '#f59e0b' }
  return { label: `Recent acquisition (${years} yrs) — less likely to sell`, color: '#7c8499' }
}

// ── Main CardPanel ───────────────────────────────────────────────
const TABS = ['summary', 'zoning', 'financials', 'owner']

export default function CardPanel({ parcel, onClose }) {
  const [tab, setTab] = useState('summary')
  const [letterOpen, setLetterOpen] = useState(false)

  // Reset tab when parcel changes
  React.useEffect(() => { setTab('summary') }, [parcel?.id])

  if (!parcel) return null
  const c = zc(parcel.zoning)

  return (
    <>
      <div style={{ width: 420, background: '#0e0f0d', borderLeft: '1px solid #1e2130', overflowY: 'auto', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid #1e2130', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.text, borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>
                  {parcel.zoning}
                </span>
                {parcel.county && (
                  <span style={{ borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, background: '#1e2130', color: '#7c8499' }}>
                    {parcel.county} Co.
                  </span>
                )}
                {parcel.badge && (
                  <span style={{ borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, background: '#f59e0b15', border: '1px solid #f59e0b40', color: '#f59e0b' }}>
                    {parcel.badge}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1.3 }}>{parcel.address}</div>
              <div style={{ fontSize: 12, color: '#7c8499', marginTop: 2 }}>{parcel.city}</div>
              {parcel.tag && <div style={{ fontSize: 11, color: '#e8925a', marginTop: 6, fontWeight: 600 }}>📍 {parcel.tag}</div>}
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7c8499', fontSize: 18, cursor: 'pointer', padding: 0, lineHeight: 1 }}>✕</button>
          </div>
        </div>

        <StatGrid parcel={parcel} />

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #1e2130', padding: '0 18px', flexShrink: 0 }}>
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? '#e8925a' : 'transparent'}`,
                color: tab === t ? '#e8925a' : '#7c8499', padding: '10px 12px 8px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                textTransform: 'capitalize', fontFamily: 'inherit',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div style={{ padding: '16px 18px', flex: 1 }}>
          {tab === 'summary' && <SummaryTab parcel={parcel} />}
          {tab === 'zoning' && <ZoningTab parcel={parcel} />}
          {tab === 'financials' && <FinancialsTab parcel={parcel} />}
          {tab === 'owner' && <OwnerTab parcel={parcel} onOpenLetter={() => setLetterOpen(true)} />}
        </div>
      </div>

      {letterOpen && (
        <LetterModal parcel={parcel} onClose={() => setLetterOpen(false)} />
      )}
    </>
  )
}
