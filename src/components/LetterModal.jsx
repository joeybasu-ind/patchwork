import React, { useState, useEffect, useRef } from 'react'

const TONES = [
  { id: 'professional', label: 'Professional' },
  { id: 'conversational', label: 'Conversational' },
  { id: 'direct', label: 'Direct & Brief' },
]

export default function LetterModal({ parcel, onClose }) {
  const [tone, setTone] = useState('professional')
  const [letter, setLetter] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const generatedFor = useRef(null) // track parcel+tone combo to avoid re-generating

  const generate = async (t = tone) => {
    const key = `${parcel.id}-${t}`
    if (generatedFor.current === key) return
    generatedFor.current = key
    setLoading(true)
    setLetter(null)
    try {
      const res = await fetch('/api/letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parcel, tone: t }),
      })
      const data = await res.json()
      setLetter(data.letter || 'Unable to generate letter. Please try again.')
    } catch {
      setLetter('Unable to generate letter. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (parcel) generate(tone)
  }, [parcel])

  const handleTone = (t) => {
    setTone(t)
    generatedFor.current = null
    generate(t)
  }

  const copyLetter = () => {
    if (!letter) return
    navigator.clipboard.writeText(letter).then(() => {
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2000)
    })
  }

  if (!parcel) return null

  const ownerName = parcel.owner?.principal || parcel.owner?.entity || 'Property Owner'

  return (
    <>
      <div
        style={{
          position: 'fixed', inset: 0, background: '#00000090',
          zIndex: 3000, display: 'flex', alignItems: 'center',
          justifyContent: 'center', padding: 24,
        }}
        onClick={e => { if (e.target === e.currentTarget) onClose() }}
      >
        <div style={{
          background: '#161b2e', border: '1px solid #2a2f42', borderRadius: 16,
          width: '100%', maxWidth: 620, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid #1e2130', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>Draft Outreach Letter</div>
              <div style={{ fontSize: 11, color: '#7c8499', marginTop: 3 }}>To: {ownerName}</div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#7c8499', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          </div>

          {/* Body */}
          <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
            <div style={{ fontSize: 11, color: '#7c8499', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Tone</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {TONES.map(t => (
                <button
                  key={t.id}
                  onClick={() => handleTone(t.id)}
                  style={{
                    flex: 1, background: tone === t.id ? '#1a2040' : '#0e0f0d',
                    border: `1px solid ${tone === t.id ? '#4f8ef7' : '#2a2f42'}`,
                    borderRadius: 8, padding: 8, fontSize: 11, fontWeight: 600,
                    color: tone === t.id ? '#4f8ef7' : '#7c8499',
                    cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div style={{ fontSize: 11, color: '#7c8499', marginBottom: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>Letter</div>

            {loading ? (
              <div style={{ background: '#0e0f0d', border: '1px solid #2a2f42', borderRadius: 10, padding: 18, minHeight: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: '#4a5168', fontSize: 13 }}>
                <div className="spinner" />
                <div>Drafting your letter…</div>
              </div>
            ) : (
              <div style={{ background: '#0e0f0d', border: '1px solid #2a2f42', borderRadius: 10, padding: 18, fontSize: 13, color: '#b0b8cc', lineHeight: 1.8, whiteSpace: 'pre-wrap', minHeight: 280, fontFamily: 'inherit' }}>
                {letter}
              </div>
            )}

            <div style={{ fontSize: 11, color: '#4a5168', marginTop: 10, lineHeight: 1.6 }}>
              Owner information sourced from county assessor records and the Indiana Secretary of State business registry. Review before sending — Patchwork does not send on your behalf.
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: '14px 22px', borderTop: '1px solid #1e2130', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            <button
              onClick={() => { generatedFor.current = null; generate(tone) }}
              style={{ background: 'none', border: '1px solid #2a2f42', borderRadius: 8, padding: '9px 20px', color: '#7c8499', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
              onMouseEnter={e => { e.target.style.borderColor = '#4f8ef7'; e.target.style.color = '#4f8ef7' }}
              onMouseLeave={e => { e.target.style.borderColor = '#2a2f42'; e.target.style.color = '#7c8499' }}
            >
              ↺ Regenerate
            </button>
            <button
              onClick={copyLetter}
              disabled={!letter || loading}
              style={{ background: 'linear-gradient(135deg,#c2692a,#8b3a1a)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              Copy Letter
            </button>
          </div>
        </div>
      </div>

      <div className={`copied-toast${showToast ? ' show' : ''}`}>Letter copied to clipboard</div>
    </>
  )
}
