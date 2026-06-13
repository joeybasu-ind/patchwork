// api/og.js — generates a PNG OG preview image using @vercel/og

import { ImageResponse } from '@vercel/og'
import { createElement as h } from 'react'

export const config = { runtime: 'edge' }

export default function handler() {
  return new ImageResponse(
    h('div', {
      style: {
        width: '1200px', height: '630px', background: '#0e0f0d',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }
    },
      // Logo mark
      h('div', {
        style: {
          width: 120, height: 120, borderRadius: 24,
          background: 'linear-gradient(135deg, #c2692a, #8b3a1a)',
          display: 'flex', flexWrap: 'wrap', padding: 14, gap: 8, marginBottom: 32,
        }
      },
        h('div', { style: { width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.95)', display: 'flex' } }),
        h('div', { style: { width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.6)', display: 'flex' } }),
        h('div', { style: { width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.6)', display: 'flex' } }),
        h('div', { style: { width: 42, height: 42, borderRadius: 6, background: 'rgba(255,255,255,0.85)', display: 'flex' } }),
      ),
      // Wordmark
      h('div', { style: { display: 'flex', fontSize: 96, fontWeight: 800, letterSpacing: '-3px', marginBottom: 16 } },
        h('span', { style: { color: '#ffffff', fontFamily: 'Georgia, serif' } }, 'Patch'),
        h('span', { style: { color: '#e8925a', fontFamily: 'Georgia, serif' } }, 'work'),
      ),
      // Tagline
      h('div', { style: { fontSize: 28, color: '#7c8499', fontWeight: 400, marginBottom: 32 } },
        'Indiana Commercial Real Estate Intelligence'
      ),
      // Domain
      h('div', { style: { fontSize: 22, color: '#c2692a', fontWeight: 600 } },
        'yourpatchwork.com'
      ),
    ),
    { width: 1200, height: 630 }
  )
}
