import React from 'react'
import { Icon } from './Icon'

function CompanyLogo({ company, size = 48 }) {
  if (company?.logo) {
    return <img src={company.logo} alt={company.name} width={size} height={size} style={{ borderRadius: 12, objectFit: 'cover', border: '1px solid var(--line)' }} />
  }
  const initial = (company?.name || 'C').trim().charAt(0).toUpperCase()
  return (
    <div
      title={company?.name || 'Company'}
      style={{
        width: size,
        height: size,
        borderRadius: 12,
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        color: 'var(--muted)'
      }}
    >
      <Icon name="home" size={Math.round(size * 0.38)} />
      <span style={{ fontSize: Math.round(size * 0.22), fontWeight: 800, lineHeight: 1, color: 'var(--steel)', letterSpacing: 0.5 }}>{initial}</span>
    </div>
  )
}

export default CompanyLogo