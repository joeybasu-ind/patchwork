import React from 'react'

const styles = {
  header: {
    padding: '13px 22px',
    borderBottom: '1px solid #1e2130',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    background: '#0e0f0d',
    zIndex: 1000,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 30, height: 30, borderRadius: 8,
    background: 'linear-gradient(135deg,#c2692a,#8b3a1a)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 17, fontWeight: 800, letterSpacing: '-0.3px',
    color: '#fff', fontFamily: 'Georgia, serif',
  },
  badge: {
    fontSize: 10, background: '#1e2130', color: '#7c8499',
    padding: '2px 7px', borderRadius: 20, fontWeight: 600,
    letterSpacing: '0.5px', textTransform: 'uppercase',
  },
  newSearchBtn: {
    background: 'none', border: '1px solid #2a2f42', borderRadius: 8,
    padding: '6px 14px', fontSize: 12, color: '#7c8499', cursor: 'pointer',
    fontFamily: 'inherit',
  },
}

export default function Header({ showBackButton, onNewSearch }) {
  return (
    <div style={styles.header}>
      <div style={styles.logo}>
        <div style={styles.logoMark}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <rect x="1" y="1" width="7" height="7" rx="1.5" fill="#fff" opacity="0.95"/>
            <rect x="10" y="1" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
            <rect x="1" y="10" width="7" height="7" rx="1.5" fill="#fff" opacity="0.6"/>
            <rect x="10" y="10" width="7" height="7" rx="1.5" fill="#fff" opacity="0.85"/>
          </svg>
        </div>
        <div style={styles.logoText}>
          Patch<span style={{ color: '#e8925a' }}>work</span>
        </div>
        <div style={styles.badge}>Indiana Beta</div>
      </div>
      {showBackButton && (
        <button
          style={styles.newSearchBtn}
          onClick={onNewSearch}
          onMouseEnter={e => { e.target.style.borderColor = '#e8925a'; e.target.style.color = '#e8925a' }}
          onMouseLeave={e => { e.target.style.borderColor = '#2a2f42'; e.target.style.color = '#7c8499' }}
        >
          ← New Search
        </button>
      )}
    </div>
  )
}
