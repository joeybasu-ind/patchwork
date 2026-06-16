import React, { useState } from 'react'

const EXAMPLES = [
  'commercial corridor along Rangeline Road Carmel',
  'mixed-use near Carmel Arts District',
  'retail near Nickel Plate Trail in Fishers',
  'commercial near Hamilton County Courthouse Noblesville',
  'commercial near Park Street and Grand Park Westfield',
]

export default function Landing({ onSearch }) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (q) => {
    const trimmed = q.trim()
    if (trimmed.length < 3 || loading) return
    setLoading(true)
    await onSearch(trimmed)
    setLoading(false)
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '60px 24px', gap: 36,
      backgroundImage: 'radial-gradient(circle at 20% 30%, #c2692a08 0%, transparent 50%), radial-gradient(circle at 80% 70%, #8b3a1a06 0%, transparent 50%)',
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '2.5px', color: '#e8925a', textTransform: 'uppercase', textAlign: 'center' }}>
        Commercial Real Estate Intelligence · Indiana
      </div>

      <h1 style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-1.5px', color: '#fff', textAlign: 'center', maxWidth: 600 }}>
        Find properties the way{' '}
        <span style={{ background: 'linear-gradient(90deg,#e8925a,#c2692a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          you actually think about them.
        </span>
      </h1>

      <p style={{ fontSize: 15, color: '#8a8880', lineHeight: 1.65, textAlign: 'center', maxWidth: 520 }}>
        Search in plain English. Get ownership, zoning, assessed value, and investment context — then draft an outreach letter directly to the owner. No CoStar subscription required.
      </p>

      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: '#161b2e', border: `1.5px solid ${query.length > 0 ? '#e8925a' : '#2a2f42'}`,
            borderRadius: 12, padding: '4px 6px 4px 16px', transition: 'border-color 0.15s',
          }}>
            <span style={{ fontSize: 16, marginRight: 10, opacity: 0.5 }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit(query)}
              placeholder="Describe what you're looking for..."
              style={{
                flex: 1, background: 'none', border: 'none', fontSize: 15,
                color: '#e8eaf0', outline: 'none', padding: '10px 0', fontFamily: 'inherit',
              }}
              autoFocus
            />
          </div>
          <button
            onClick={() => submit(query)}
            disabled={loading || query.trim().length < 3}
            style={{
              background: loading || query.trim().length < 3 ? '#2a2f42' : 'linear-gradient(135deg,#c2692a,#8b3a1a)',
              border: 'none', borderRadius: 12, padding: '0 24px',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading || query.trim().length < 3 ? 'not-allowed' : 'pointer',
              minWidth: 100, fontFamily: 'inherit', transition: 'background 0.2s',
            }}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#7c8499' }}>Try:</span>
          {EXAMPLES.map(ex => (
            <button
              key={ex}
              onClick={() => { setQuery(ex); submit(ex) }}
              style={{
                background: '#161b2e', border: '1px solid #2a2f42', borderRadius: 20,
                padding: '5px 12px', fontSize: 12, color: '#7c8499',
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.background = '#1e1408'; e.target.style.borderColor = '#e8925a'; e.target.style.color = '#e8925a' }}
              onMouseLeave={e => { e.target.style.background = '#161b2e'; e.target.style.borderColor = '#2a2f42'; e.target.style.color = '#7c8499' }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, color: '#3a3f52', marginTop: 12 }}>
        © 2026 Joey Basu
      </div>
    </div>
  )
}
