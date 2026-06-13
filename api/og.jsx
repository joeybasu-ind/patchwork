// api/og.jsx
// Generates a PNG Open Graph preview image using @vercel/og

import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default function handler() {
  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: '#0e0f0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'serif',
        position: 'relative',
      }}
    >
      {/* Logo mark */}
      <div
        style={{
          width: 120,
          height: 120,
          borderRadius: 24,
          background: 'linear-gradient(135deg, #c2692a, #8b3a1a)',
          display: 'flex',
          flexWrap: 'wrap',
          padding: 14,
          gap: 8,
          marginBottom: 32,
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.95)', display: 'flex' }} />
        <div style={{ width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.6)', display: 'flex' }} />
        <div style={{ width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.6)', display: 'flex' }} />
        <div style={{ width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.85)', display: 'flex' }} />
      </div>

      {/* Wordmark */}
      <div style={{ display: 'flex', fontSize: 96, fontWeight: 800, letterSpacing: '-3px', marginBottom: 16 }}>
        <span style={{ color: '#ffffff' }}>Patch</span>
        <span style={{ color: '#e8925a' }}>work</span>
      </div>

      {/* Tagline */}
      <div style={{ fontSize: 28, color: '#7c8499', fontFamily: 'sans-serif', fontWeight: 400, marginBottom: 40 }}>
        Indiana Commercial Real Estate Intelligence
      </div>

      {/* Domain */}
      <div style={{ fontSize: 22, color: '#c2692a', fontFamily: 'sans-serif', fontWeight: 600 }}>
        yourpatchwork.com
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
